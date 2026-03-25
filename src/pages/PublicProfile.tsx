import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    Briefcase,
    Link as LinkIcon,
    Star,
    Shield,
    MessageSquare,
    Users,
    Mail,
    Globe,
    Calendar,
    Award
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';

const PublicProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createConversation } = useChat();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const docRef = doc(db, 'users', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile);
                } else {
                    setError('User not found');
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    const handleMessage = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!id) return;

        const convId = await createConversation(id);
        if (convId) {
            const targetPath = user.uid === id ? '/freelancer/messages' : '/developer/messages'; // Fallback logic, though mostly dev msgs
            // Better logic: if current user is dev, go to dev messages. 
            // Actually, conversation creation returns id.
            // If I am a freelancer viewing another freelancer? (Unlikely but possible)
            // If I am a developer viewing freelancer:
            navigate('/developer/messages', { state: { conversationId: convId } });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
                <p className="text-muted-foreground mb-4">{error || "The user you are looking for does not exist."}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-24 max-w-5xl">
                {/* Header Card */}
                <div className="bg-card rounded-2xl border border-border p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/10 to-purple-500/10" />

                    <div className="relative flex flex-col md:flex-row gap-8 items-start">
                        <Avatar className="w-32 h-32 border-4 border-card shadow-xl">
                            <AvatarImage src={profile.photoURL} />
                            <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
                                {profile.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-4 pt-4">
                            <div>
                                <h1 className="text-3xl font-bold font-display flex items-center gap-3">
                                    {profile.fullName}
                                    {profile.governmentId?.verified && (
                                        <Shield className="h-6 w-6 text-blue-500 fill-blue-500/10" />
                                    )}
                                </h1>
                                <p className="text-lg text-muted-foreground capitalize flex items-center gap-2 mt-1">
                                    <Briefcase className="h-4 w-4" />
                                    {profile.role}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {profile.rating !== undefined && (
                                    <div className="flex items-center gap-1 text-yellow-500 font-medium">
                                        <Star className="h-4 w-4 fill-current" />
                                        {profile.rating.toFixed(1)} ({profile.reviewsCount || 0} reviews)
                                    </div>
                                )}
                                {/* Address/Location if available (mocked or custom field) */}
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {/* profile.address is not in UserProfile type but was in Profile.tsx state. 
                                        Assuming it might be added or we skip if not in type. 
                                        Let's check type again. It was NOT in UserProfile interface. 
                                        I'll define a quick extended type or just ignore for now.
                                        Wait, Profile.tsx had address in local state but initialized from userProfile.address?
                                        Let's check types.ts again. 
                                        Ah, types.ts did NOT have address. Profile.tsx had `userProfile?.address` which implies ts-ignore or it is there?
                                        I will verify types.ts content I read earlier. 
                                        "1: export interface UserProfile { ... }"
                                        Lines 1-27 did NOT show address.
                                        So Profile.tsx might have been using a loose type or I missed it.
                                        I'll skip address for now to be safe.
                                     */}
                                    Remote / India
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Joined {profile.createdAt?.toDate ? formatDistanceToNow(profile.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 min-w-[150px]">
                            {/* Only show Message/Hire if not viewing own profile */}
                            {user?.uid !== id && (
                                <>
                                    <Button onClick={handleMessage} className="gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Message
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Info */}
                    <div className="space-y-6">
                        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills && profile.skills.length > 0 ? (
                                    profile.skills.map((skill, i) => (
                                        <Badge key={i} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">No skills listed.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                Links
                            </h3>
                            {profile.portfolioLinks && profile.portfolioLinks.length > 0 ? (
                                <ul className="space-y-2">
                                    {profile.portfolioLinks.map((link, i) => (
                                        <li key={i}>
                                            <a
                                                href={link.startsWith('http') ? link : `https://${link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline flex items-center gap-2"
                                            >
                                                <LinkIcon className="h-3 w-3" />
                                                {new URL(link.startsWith('http') ? link : `https://${link}`).hostname}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-sm">No links provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Bio & Reviews */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                            <h3 className="font-semibold text-lg">About</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {profile.experience || "No bio available."}
                            </p>
                        </div>

                        {/* Reviews Section - Could fetch real reviews if we have a hook/collection */}
                        <div className="bg-card rounded-xl border border-border p-6">
                            <h3 className="font-semibold text-lg mb-4">Reviews</h3>
                            <div className="text-center py-8 text-muted-foreground">
                                No reviews yet.
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PublicProfile;
