import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Message, UserProfile } from '@/types';

interface ChatWindowProps {
    conversationId: string | null;
    messages: Message[];
    onSendMessage: (text: string) => void;
    otherUser?: {
        uid: string;
        fullName: string;
        photoURL?: string;
        email: string;
    };
}

const ChatWindow = ({ conversationId, messages, onSendMessage, otherUser }: ChatWindowProps) => {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        onSendMessage(newMessage);
        setNewMessage('');
    };

    if (!conversationId) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-muted/10 text-muted-foreground p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Your Messages</h3>
                <p>Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={otherUser?.photoURL} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {otherUser?.fullName?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-foreground">{otherUser?.fullName || 'User'}</h3>
                        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Online
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Video className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl p-4 ${isMe
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted text-foreground rounded-tl-none'
                                    }`}
                            >
                                <p className="text-sm">{msg.text}</p>
                                <span className={`text-[10px] mt-1 block opacity-70 ${isMe ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                    {msg.createdAt?.seconds ? formatDistanceToNow(new Date(msg.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-card border-t border-border">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <Button type="button" variant="ghost" size="icon" className="shrink-0">
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" variant="gradient" size="icon" className="shrink-0" disabled={!newMessage.trim()}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
