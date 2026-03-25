import { useState, useEffect, useRef } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Message, Conversation } from '@/types';

export const useChat = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Subscribe to conversations
    useEffect(() => {
        if (!user) {
            setConversations([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const convs = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data() as Omit<Conversation, 'id'>;
                const otherUserId = data.participants.find(p => p !== user.uid);

                let otherUser = null;
                if (otherUserId) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', otherUserId));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            otherUser = {
                                uid: otherUserId,
                                fullName: userData.fullName || 'User',
                                photoURL: userData.photoURL,
                                email: userData.email
                            };
                        }
                    } catch (error) {
                        console.error("Error fetching other user details:", error);
                    }
                }

                return {
                    id: docSnapshot.id,
                    ...data,
                    otherUser
                };
            }));
            setConversations(convs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Subscribe to messages for active conversation
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, `conversations/${activeConversationId}/messages`),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);

            // Mark unread messages as read
            const unreadMessages = msgs.filter(m => !m.read && m.senderId !== user?.uid);
            if (unreadMessages.length > 0) {
                markAsRead(activeConversationId, unreadMessages);
            }
        });

        return () => unsubscribe();
    }, [activeConversationId, user]);

    const sendMessage = async (text: string) => {
        if (!user || !activeConversationId || !text.trim()) return;

        try {
            const messageData = {
                text,
                senderId: user.uid,
                createdAt: serverTimestamp(),
                read: false
            };

            // Add message
            await addDoc(collection(db, `conversations/${activeConversationId}/messages`), messageData);

            // Update conversation last message
            await updateDoc(doc(db, 'conversations', activeConversationId), {
                lastMessage: messageData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const markAsRead = async (conversationId: string, unreadMessages: Message[]) => {
        if (!user) return;

        const batch = writeBatch(db);
        unreadMessages.forEach(msg => {
            const msgRef = doc(db, `conversations/${conversationId}/messages`, msg.id);
            batch.update(msgRef, { read: true });
        });

        try {
            await batch.commit();

            // Optionally update lastMessage status in conversation doc if it's the last one
            // This requires more logic, skipping for now as it's an optimization
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    const createConversation = async (otherUserId: string) => {
        if (!user) return;

        // Check if conversation already exists
        const existing = conversations.find(c => c.participants.includes(otherUserId));
        if (existing) {
            setActiveConversationId(existing.id);
            return existing.id;
        }

        try {
            const docRef = await addDoc(collection(db, 'conversations'), {
                participants: [user.uid, otherUserId],
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });
            setActiveConversationId(docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    return {
        conversations,
        messages,
        activeConversationId,
        setActiveConversationId,
        sendMessage,
        createConversation,
        loading
    };
};
