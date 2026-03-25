import { motion } from 'framer-motion';
import { User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { Conversation } from '@/types';

interface ConversationListProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    loading: boolean;
}

const ConversationList = ({ conversations, activeId, onSelect, loading }: ConversationListProps) => {
    return (
        <div className="h-full flex flex-col bg-card border-r border-border">
            <div className="p-4 border-b border-border">
                <h2 className="font-display font-bold text-xl mb-4">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        className="pl-9 bg-muted/50 border-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-muted-foreground">Loading...</div>
                ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <p>No conversations yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${activeId === conv.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'
                                    }`}
                            >
                                <div className="relative">
                                    <Avatar>
                                        <AvatarImage src={conv.otherUser?.photoURL} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {conv.otherUser?.fullName?.charAt(0) || <User className="h-4 w-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Online status indicator could go here */}
                                    {conv.unreadCount && conv.unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-foreground truncate">
                                            {conv.otherUser?.fullName || 'User'}
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            {conv.updatedAt?.seconds ? formatDistanceToNow(new Date(conv.updatedAt.seconds * 1000), { addSuffix: true }) : ''}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate ${conv.unreadCount && conv.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                        {conv.lastMessage?.senderId === 'me' ? 'You: ' : ''}
                                        {conv.lastMessage?.text || 'Start a conversation'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationList;
