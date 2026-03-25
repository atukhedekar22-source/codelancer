import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

const Messages = () => {
    const {
        conversations,
        messages,
        activeConversationId,
        setActiveConversationId,
        sendMessage,
        createConversation
    } = useChat();

    const [loading, setLoading] = useState(false); // Managed by hook, but simplified here

    // In a real implementation, we would toggle visibility based on screen size
    const [showList, setShowList] = useState(true);

    // Helper to get active conversation data
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Handle navigation from other pages
    const location = useLocation();
    useEffect(() => {
        if (location.state?.conversationId) {
            setActiveConversationId(location.state.conversationId);
            // Clear state to avoid resetting on refresh/re-render if needed, 
            // but for now it's fine.
            window.history.replaceState({}, document.title);
        }
    }, [location.state, setActiveConversationId]);

    const { userProfile } = useAuth();
    const role = (userProfile?.role as 'developer' | 'freelancer') || 'developer';

    return (
        <DashboardLayout role={role} disablePadding>
            <div className="h-screen flex bg-background">
                {/* Sidebar - Conversation List */}
                <div className={`${showList ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-96 flex-col border-r border-border bg-card z-10`}>
                    <ConversationList
                        conversations={conversations}
                        activeId={activeConversationId}
                        onSelect={(id) => {
                            setActiveConversationId(id);
                            setShowList(false); // On mobile, hide list when selected
                        }}
                        loading={loading}
                    />
                </div>

                {/* Main Chat Area */}
                <div className={`${!showList ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-background relative`}>
                    {/* Mobile Back Button */}
                    {!showList && (
                        <button
                            onClick={() => setShowList(true)}
                            className="md:hidden absolute top-4 left-4 z-50 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-sm border border-border"
                        >
                            ← Back
                        </button>
                    )}

                    {activeConversationId ? (
                        <ChatWindow
                            conversationId={activeConversationId}
                            messages={messages}
                            onSendMessage={sendMessage}
                            otherUser={activeConversation?.otherUser}
                        />
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5">
                            <p>Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Messages;
