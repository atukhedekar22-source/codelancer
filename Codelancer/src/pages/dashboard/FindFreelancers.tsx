import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
    Search,
    Filter,
    Users,
    Star,
    MapPin,
    Briefcase,
    MessageSquare,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useNavigate } from 'react-router-dom';

const FindFreelancers = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchFreelancers = async () => {
            try {
                setLoading(true);
                // Query users with role 'freelancer'
                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'freelancer')
                    // orderBy('createdAt', 'desc') // Requires index, skip for now to avoid errors
                );

                const querySnapshot = await getDocs(q);
                const fetchedFreelancers = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setFreelancers(fetchedFreelancers);
            } catch (error) {
                console.error("Error fetching freelancers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFreelancers();
    }, []);

    const filteredFreelancers = freelancers.filter(freelancer => {
        const query = searchQuery.toLowerCase();
        const name = (freelancer.fullName || '').toLowerCase();
        const skills = (freelancer.skills || []).map((s: string) => s.toLowerCase());

        return name.includes(query) || skills.some((s: string) => s.includes(query));
    });

    const { createConversation } = useChat();

    const handleMessage = async (freelancerId: string) => {
        if (!user) return;

        try {
            setProcessingId(freelancerId);
            const conversationId = await createConversation(freelancerId);
            if (conversationId) {
                navigate('/developer/messages', { state: { conversationId } });
            }
        } catch (error) {
            console.error("Error initiating chat:", error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <DashboardLayout role="developer">
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">
                            Find <span className="gradient-text">Freelancers</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Discover top talent for your next project.
                        </p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12"
                            />
                        </div>
                        {/* Filter buttons could go here */}
                    </div>
                </div>

                {/* Freelancers List */}
                <div className="grid gap-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading freelancers...</p>
                        </div>
                    ) : filteredFreelancers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No freelancers found.</p>
                        </div>
                    ) : (
                        filteredFreelancers.map((freelancer, index) => (
                            <motion.div
                                key={freelancer.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all"
                            >
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Avatar / Profile Image */}
                                    <div className="flex-shrink-0">
                                        <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold text-2xl">
                                            {freelancer.photoURL ? (
                                                <img src={freelancer.photoURL} alt={freelancer.fullName} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                freelancer.fullName?.charAt(0) || 'U'
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                            <div>
                                                <h2
                                                    className="font-display text-xl font-bold text-foreground flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                                                    onClick={() => navigate(`/profile/${freelancer.id}`)}
                                                >
                                                    {freelancer.fullName}
                                                    {freelancer.verified && (
                                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </h2>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                    {freelancer.rating > 0 && (
                                                        <span className="flex items-center gap-1 text-yellow-500">
                                                            <Star className="h-4 w-4 fill-current" />
                                                            {freelancer.rating.toFixed(1)} ({freelancer.reviewsCount || 0})
                                                        </span>
                                                    )}
                                                    {freelancer.address && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-4 w-4" />
                                                            {freelancer.address}
                                                        </span>
                                                    )}
                                                    {freelancer.experience && (
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase className="h-4 w-4" />
                                                            {freelancer.experience} years exp
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => handleMessage(freelancer.id)}
                                                    disabled={processingId === freelancer.id}
                                                >
                                                    {processingId === freelancer.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MessageSquare className="h-4 w-4" />
                                                    )}
                                                    Message
                                                </Button>

                                            </div>
                                        </div>

                                        {freelancer.bio && (
                                            <p className="text-muted-foreground mt-3 line-clamp-2">
                                                {freelancer.bio}
                                            </p>
                                        )}

                                        {freelancer.skills && freelancer.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {freelancer.skills.map((skill: string) => (
                                                    <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Portfolio links removed as requested */}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FindFreelancers;
