import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Calendar,
    IndianRupee,
    Clock,
    Tags,
    User,
    ArrowLeft,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Zap,
    Briefcase,
    Timer,
    Link as LinkIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import RegisterProjectDialog from '@/components/projects/RegisterProjectDialog';
import { useChat } from '@/hooks/useChat';
import { useEscrow } from '@/hooks/useEscrow';

import { Project, Bid } from '@/types';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const { createConversation } = useChat();
    const { createEscrowTransaction, releaseFunds } = useEscrow();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [bids, setBids] = useState<Bid[]>([]);
    const [userBid, setUserBid] = useState<Bid | null>(null);
    const [bidAmount, setBidAmount] = useState('');
    const [proposal, setProposal] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isRegistered, setIsRegistered] = useState(false);

    // Fetch Project Details
    useEffect(() => {
        const fetchProject = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'projects', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Project;
                    setProject(data);

                    // Check if current user is already registered
                    if (user && data.registrants) {
                        const registered = data.registrants.some((r) => r.freelancerId === user.uid);
                        setIsRegistered(registered);
                    }
                } else {
                    toast.error("Project not found");
                    navigate('/projects');
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();

        // Subscription for real-time updates on project status/registrants
        const unsubscribeProject = onSnapshot(doc(db, 'projects', id!), (doc) => {
            if (doc.exists()) {
                const data = { id: doc.id, ...doc.data() } as Project;
                setProject(data);
                if (user && data.registrants) {
                    const registered = data.registrants.some((r) => r.freelancerId === user.uid);
                    setIsRegistered(registered);
                }
            }
        });

        return () => unsubscribeProject();
    }, [id, navigate, user]);

    // Registration Timer
    useEffect(() => {
        if (!project) return;

        // Stop timer if 2 or more registrants
        if (project.registrants && project.registrants.length >= 2) {
            setTimeLeft('Waiting for Owner Action');
            return;
        }

        if (!project.registrationEndsAt) {
            setTimeLeft('Waiting for first registrant...');
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            // Handle both Firestore Timestamp and Date object
            const endTime = project.registrationEndsAt.seconds
                ? project.registrationEndsAt.seconds * 1000
                : new Date(project.registrationEndsAt).getTime();

            const distance = endTime - now;

            if (distance < 0) {
                setTimeLeft('Registration Closed');
                clearInterval(interval);
                // Trigger auto-assignment evaluation
                handleRegistrationEnd();
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [project]);

    // Evaluation Logic (Mock - triggered by client side for now)
    const handleRegistrationEnd = async () => {
        // This should ideally be a Cloud Function to be secure
        if (!project || project.status !== 'open') return;

        // Only run this logic once (e.g., if I am the owner or arbitrarily purely for simulation)
        // For this demo, let's assume if the timer ends and status is still open, we evaluate.
        // We need to fetch the latest version of project to be safe
        const docRef = doc(db, 'projects', project.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;

        const currentProject = docSnap.data() as Project;
        if (currentProject.status !== 'open') return;

        const registrants = currentProject.registrants || [];

        if (registrants.length === 0) {
            // specific logic for 0 registrants? Close project or keep open?
            // Let's keep it open for now or mark as 'expired'?
            return;
        }

        if (registrants.length === 1) {
            // Auto assign
            await updateDoc(docRef, {
                status: 'assigned',
                assignedTo: registrants[0].freelancerId,
                finalAmount: currentProject.budget * 0.9 // 10% commission deduction
            });
            toast.info("Project auto-assigned to the single registrant!");
        } else {
            // Skill matching logic
            // 1. Calculate scores
            const scoredRegistrants = registrants.map((r) => {
                let score = 0;
                const projectSkills = currentProject.skills || [];
                const userSkills = r.skills || []; // Assuming we store skills in registrant or fetch profile

                // detailed matching
                const matchCount = projectSkills.filter((ps: string) =>
                    userSkills.some((us: string) => us.toLowerCase() === ps.toLowerCase())
                ).length;

                score = (matchCount / (projectSkills.length || 1)) * 100;
                return { ...r, score };
            });

            // 2. Find max score
            const maxScore = Math.max(...scoredRegistrants.map((r) => r.score || 0));
            const topCandidates = scoredRegistrants.filter((r) => r.score === maxScore);

            if (topCandidates.length === 1) {
                // Single top candidate
                await updateDoc(docRef, {
                    status: 'assigned',
                    assignedTo: topCandidates[0].freelancerId,
                    finalAmount: currentProject.budget * 0.9
                });
                toast.info(`Project assigned to best match: ${topCandidates[0].freelancerName}`);
            } else {
                // Tie - Enable Bidding
                await updateDoc(docRef, {
                    status: 'bidding',
                    biddingOpenFor: topCandidates.map((c) => c.freelancerId)
                });
                toast.info("Multiple top candidates found. Bidding phase enabled.");
            }
        }
    };




    // Real-time Bids Listener
    useEffect(() => {
        if (!id) return;
        const q = query(
            collection(db, 'bids'),
            where('projectId', '==', id),
            where('projectId', '==', id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedBids = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Bid[];

            // Sort client-side to avoid needing a composite index
            fetchedBids.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA; // Descending
            });

            setBids(fetchedBids);

            if (user) {
                const myBid = fetchedBids.find((bid) => bid.freelancerId === user.uid);
                setUserBid(myBid || null);
            }
        });

        return () => unsubscribe();
    }, [id, user]);

    const [isEditing, setIsEditing] = useState(false);

    // Calculate lowest bid for competitive validation
    const lowestBid = bids.length > 0 ? Math.min(...bids.map(b => b.amount)) : 0;

    const handlePlaceBid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) return;

        // Validate Bid Amount
        const commission = project.budget * 0.10;
        const basePayout = project.budget - commission;
        const minBid = basePayout * 0.90; // Max 10% discount
        const maxBid = basePayout;

        const bid = Number(bidAmount);

        // Basic range validation
        if (bid < minBid || bid > maxBid) {
            toast.error(`Bid must be between ₹${minBid.toFixed(0)} and ₹${maxBid.toFixed(0)}`);
            return;
        }

        // Competitive Validation for Re-bidding
        if (userBid && lowestBid > 0 && bid > lowestBid) {
            // Allow matching the lowest bid, but not exceeding it? 
            // User said "not more than the recent bid price".
            // If I am the lowest bidder, lowestBid is MY bid. So I can match myself (no change) or go lower.
            // If someone else is lower (e.g. 90), and I am 100. lowestBid is 90. bid must be <= 90.
            toast.error(`To stay competitive, your new bid must be ₹${lowestBid} or less.`);
            return;
        }

        setSubmitting(true);
        try {
            if (userBid) {
                // Update existing bid
                const bidRef = doc(db, 'bids', userBid.id);
                await updateDoc(bidRef, {
                    amount: bid,
                    proposal,
                    deliveryTime: Number(deliveryTime),
                    updatedAt: serverTimestamp(),
                    // Update sorting fields if logic changes, but matchScore/rating stay same usually
                });
                toast.success("Bid updated successfully!");
                setIsEditing(false);
            } else {
                // Check for tie-breaking condition logic (e.g., skill match, rating, delivery time, fcfs)
                // This logic usually runs when evaluating bids, but here we just place it.
                // Evaluation will happen when an owner accepts or automatically? 
                // "controlled bidding system is initiated... Based on the accepted bid..."
                // The prompt says: "If multiple freelancers submit identical bids, the system resolves..."

                // For now, we just save the bid.
                await addDoc(collection(db, 'bids'), {
                    projectId: id,
                    projectTitle: project.title,
                    freelancerId: user.uid,
                    freelancerName: userProfile.fullName,
                    freelancerPhoto: userProfile.photoURL || '',
                    amount: bid,
                    proposal,
                    deliveryTime: Number(deliveryTime),
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    // Add sorting fields
                    matchScore: project.registrants?.find((r: any) => r.freelancerId === user.uid)?.score || 0,
                    rating: userProfile.rating || 0
                });

                // Increment bid count
                await updateDoc(doc(db, 'projects', id!), { bids: increment(1) });

                toast.success("Bid placed successfully!");
            }

            setBidAmount('');
            setProposal('');
            setDeliveryTime('');
        } catch (error) {
            console.error("Error placing bid:", error);
            toast.error("Failed to place bid");
        } finally {
            setSubmitting(false);
        }
    };

    // Auto-resolve Bidding Tie-Breaker
    // This effect monitors bids and auto-assigns if needed or handles manual selection
    // Prompt says: "Based on the accepted bid, the freelancer's final earning is calculated..."
    // But also: "system resolves the tie ... to ensure a fair and deterministic selection."
    // Let's implement a 'Resolve Bids' button for the owner, or auto-resolve if no more bids expected?
    // For simplicity, let's allow Owner to click "Finalize Bidding" which triggers the sort logic.

    const finalizeBidding = async () => {
        if (!bids.length) return;

        // Sort logic: Higher Skill > Rating > Delivery Time (Lower is better?) > FCFS (Oldest is better)
        // Assuming 'higher' delivery time is worse.
        const sorted = [...bids].sort((a, b) => {
            if (a.amount !== b.amount) return a.amount - b.amount; // Lowest price wins? Or Highest? Prompt says "identical bids".
            // Assuming identical bids means identical AMOUNT.

            // 1. Skill Match
            if (b.matchScore !== a.matchScore) return (b.matchScore || 0) - (a.matchScore || 0); // Higher better
            // 2. Rating
            if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0); // Higher better
            // 3. Delivery Time
            if (a.deliveryTime !== b.deliveryTime) return a.deliveryTime - b.deliveryTime; // Lower better
            // 4. FCFS
            return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0); // Older (smaller timestamp) better
        });

        const winner = sorted[0];
        try {
            const projectRef = doc(db, 'projects', id!);
            await updateDoc(projectRef, {
                status: 'assigned',
                assignedTo: winner.freelancerId,
                finalAmount: winner.amount
            });
            toast.success(`Project assigned to ${winner.freelancerName}`);
        } catch (e) {
            console.error("Error finalizing:", e);
            toast.error("Error finalizing project");
        }
    };

    // --- Progress Tracking Logic ---
    const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
    const [progressText, setProgressText] = useState('');
    const [progressLink, setProgressLink] = useState('');

    // Fetch Progress Updates
    useEffect(() => {
        if (!id) return;

        const q = query(
            collection(db, `projects/${id}/progress_updates`),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const updates = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProgressUpdates(updates);
        });

        return () => unsubscribe();
    }, [id]);

    const handleSubmitProgress = async () => {
        if (!progressText.trim()) {
            toast.error("Please describe your progress");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, `projects/${id}/progress_updates`), {
                text: progressText,
                link: progressLink,
                freelancerId: user?.uid,
                freelancerName: userProfile?.fullName,
                createdAt: serverTimestamp()
            });

            toast.success("Progress update submitted!");
            setProgressText('');
            setProgressLink('');
        } catch (error) {
            console.error("Error submitting progress:", error);
            toast.error("Failed to submit progress");
        } finally {
            setSubmitting(false);
        }
    };

    // --- Final Project Submission ---
    const [finalLink, setFinalLink] = useState('');
    const [finalRemarks, setFinalRemarks] = useState('');

    const handleSubmitProject = async () => {
        if (!finalLink.trim()) {
            toast.error("Please provide a link to your final work");
            return;
        }

        if (!window.confirm("Are you sure you want to submit the project? This implies you have completed all requirements.")) {
            return;
        }

        setSubmitting(true);
        try {
            await updateDoc(doc(db, 'projects', id!), {
                status: 'submitted',
                submission: {
                    link: finalLink,
                    remarks: finalRemarks,
                    submittedAt: serverTimestamp()
                }
            });

            toast.success("Project submitted successfully!");
            // Optional: Navigate or refresh state is handled by onSnapshot
        } catch (error) {
            console.error("Error submitting project:", error);
            toast.error("Failed to submit project");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAcceptWork = async () => {
        if (!window.confirm("Accept this work? This will mark the project as completed and release payment.")) return;
        setSubmitting(true);
        try {
            // Process Payment
            const amount = project.finalAmount || project.budget;
            const transactionId = await createEscrowTransaction(
                amount,
                `Payment for project: ${project.title}`,
                project.id,
                project.assignedTo
            );

            if (transactionId) {
                await releaseFunds(transactionId);
                toast.success("Payment processed and released.");
            }

            await updateDoc(doc(db, 'projects', id!), {
                status: 'completed',
                completedAt: serverTimestamp(),
                paymentStatus: 'paid'
            });
            toast.success("Project completed successfully!");
        } catch (error) {
            console.error("Error accepting work:", error);
            toast.error("Failed to accept work and process payment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectWork = async () => {
        const reason = window.prompt("Reason for requesting changes (optional):");
        if (reason === null) return; // Cancelled

        setSubmitting(true);
        try {
            await updateDoc(doc(db, 'projects', id!), {
                status: 'assigned',
                // Keep submission for history if needed, but for now status change is enough
            });
            toast.info("Requested changes. Status reverted to 'Assigned'.");
        } catch (error) {
            console.error("Error rejecting work:", error);
            toast.error("Failed to request changes");
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!project) return null;

    const isOwner = user?.uid === project.postedBy;
    const isRegistrationOpen = timeLeft !== 'Registration Closed' && project.status === 'open';
    const isBiddingOpen = project.status === 'bidding';

    // Check if current user is allowed to bid (only if in biddingOpenFor list)
    const canBid = isBiddingOpen && project.biddingOpenFor?.includes(user?.uid);

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container mx-auto px-4 pt-8">
                <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Project Details - Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card rounded-2xl border border-border p-8"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-3xl font-display font-bold text-foreground mb-2">{project.title}</h1>
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            Posted {project.createdAt ? formatDistanceToNow(new Date(project.createdAt.seconds * 1000), { addSuffix: true }) : 'Recently'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Tags className="h-4 w-4" />
                                            {project.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                {isOwner && (
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="border-primary text-primary">Owner View</Badge>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-6"
                                            onClick={async () => {
                                                if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
                                                    try {
                                                        setLoading(true); // Re-use loading state or add a new one
                                                        await deleteDoc(doc(db, 'projects', id!));
                                                        toast.success("Project deleted successfully");
                                                        navigate('/developer'); // Redirect to developer dashboard
                                                    } catch (error) {
                                                        console.error("Error deleting project:", error);
                                                        toast.error("Failed to delete project");
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                        >
                                            Delete Project
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="prose dark:prose-invert max-w-none mb-8">
                                <h3 className="text-lg font-semibold mb-2">Description</h3>
                                <p className="whitespace-pre-wrap text-muted-foreground">{project.description}</p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.skills?.map((skill: string) => (
                                        <Badge key={skill} variant="secondary" className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Registration Status Section */}
                        {project.status === 'open' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card rounded-2xl border border-border p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Timer className="h-5 w-5 text-primary" />
                                        Registration Window
                                    </h3>
                                    <Badge variant={timeLeft === 'Registration Closed' ? "destructive" : timeLeft.includes("Waiting") ? "secondary" : "default"} className="text-lg px-4 py-1">
                                        {timeLeft}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground mb-4">
                                    This project is currently in the registration phase. Freelancers must register within the 5-minute window to be eligible.
                                    Selection is based on First-Come-First-Serve if unique, otherwise Skill Matching applies.
                                </p>

                                <div className="flex items-center gap-2 text-sm mb-6">
                                    <div className="flex -space-x-2">
                                        {project.registrants?.slice(0, 5).map((r: any, i: number) => (
                                            <div key={i} className="h-8 w-8 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-bold text-primary">
                                                {r.freelancerName?.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-muted-foreground">
                                        {project.registrants?.length || 0} registered freelancers
                                    </span>
                                </div>

                                {/* Detailed Registrant List for Owner */}
                                {isOwner && project.registrants && project.registrants.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-lg">Registered Candidates</h4>

                                            {/* AI Analysis Trigger */}
                                            {project.status === 'open' && (
                                                <Button
                                                    onClick={handleRegistrationEnd}
                                                    disabled={loading}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                                                >
                                                    <Zap className="h-4 w-4" />
                                                    {loading ? 'Analyzing...' : 'Analyze & Assign with AI'}
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {project.registrants
                                                .sort((a, b) => (b.score || 0) - (a.score || 0)) // Sort by score
                                                .map((registrant: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="bg-muted/30 p-4 rounded-xl border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-primary/50 transition-colors"
                                                        onClick={() => registrant.freelancerId && navigate(`/profile/${registrant.freelancerId}`)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 border border-border">
                                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                                    {registrant.freelancerName?.charAt(0) || 'U'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-semibold">{registrant.freelancerName}</p>
                                                                    {registrant.rating > 0 && (
                                                                        <Badge variant="outline" className="text-xs gap-1 h-5">
                                                                            ⭐ {registrant.rating.toFixed(1)}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Applied {registrant.appliedAt ? formatDistanceToNow(new Date(registrant.appliedAt), { addSuffix: true }) : 'recently'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-2">
                                                            <div className="flex items-center gap-2">
                                                                {/* Message Button for Registrants */}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 gap-1 text-muted-foreground hover:text-primary"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        if (registrant.freelancerId) {
                                                                            const convId = await createConversation(registrant.freelancerId);
                                                                            if (convId) {
                                                                                navigate('/developer/messages', { state: { conversationId: convId } });
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    <User className="h-3 w-3" />
                                                                    Message
                                                                </Button>

                                                                {/* Match Score Visualization */}
                                                                {registrant.score !== undefined && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-semibold text-muted-foreground">AI Match</span>
                                                                        <Badge
                                                                            variant={registrant.score >= 80 ? 'default' : registrant.score >= 50 ? 'secondary' : 'outline'}
                                                                            className={registrant.score >= 80 ? 'bg-green-500 hover:bg-green-600' : ''}
                                                                        >
                                                                            {registrant.score.toFixed(0)}%
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {registrant.skills && registrant.skills.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                                                                    {registrant.skills.map((skill: string, idx: number) => (
                                                                        <Badge
                                                                            key={idx}
                                                                            variant="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            {skill}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Bids List (Visible to everyone for transparency based on request) */}
                        {isBiddingOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h2 className="text-2xl font-display font-bold mb-6 flex items-center justify-between">
                                    <span>Current Bids ({bids.length})</span>
                                    {isOwner && (
                                        <Button size="sm" onClick={finalizeBidding} variant="default">
                                            Finalize Assignment
                                        </Button>
                                    )}
                                </h2>

                                <div className="space-y-4">
                                    {bids.length === 0 ? (
                                        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                                            <p className="text-muted-foreground">No bids yet. Waiting for eligible freelancers.</p>
                                        </div>
                                    ) : (
                                        bids.map((bid, index) => (
                                            <div
                                                key={bid.id}
                                                className={`bg-card p-6 rounded-xl border transition-all border-border cursor-pointer hover:border-primary/50`}
                                                onClick={() => navigate(`/profile/${bid.freelancerId}`)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={bid.freelancerPhoto} />
                                                            <AvatarFallback>{bid.freelancerName?.charAt(0) || 'U'}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold">{bid.freelancerName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDistanceToNow(new Date(bid.createdAt.seconds * 1000), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-foreground">₹{bid.amount}</p>
                                                        <p className="text-xs text-muted-foreground">in {bid.deliveryTime} days</p>
                                                    </div>
                                                </div>

                                                {(isOwner || user?.uid === bid.freelancerId) && (
                                                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-start gap-4">
                                                        <p className="text-sm text-muted-foreground flex-1">{bid.proposal}</p>
                                                        {isOwner && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-2"
                                                                onClick={async () => {
                                                                    if (bid.freelancerId) {
                                                                        const convId = await createConversation(bid.freelancerId);
                                                                        if (convId) {
                                                                            navigate('/developer/messages', { state: { conversationId: convId } });
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <User className="h-3 w-3" />
                                                                Message
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar - Action Area */}
                    <div className="space-y-6">
                        <div className="sticky top-24 space-y-6">
                            {/* Budget Card */}
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <h3 className="text-sm font-medium text-muted-foreground mb-1">Project Budget</h3>
                                <p className="text-3xl font-display font-bold text-foreground flex items-center gap-1">
                                    <IndianRupee className="h-6 w-6" />
                                    {project.budget}
                                </p>
                                <div className="mt-4 pt-4 border-t border-border/50 text-sm space-y-2">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Platform Fee (10%)</span>
                                        <span>- ₹{Math.round(project.budget * 0.10)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Base Payout</span>
                                        <span>₹{Math.round(project.budget * 0.90)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Owner Review Section */}
                            {isOwner && project.status === 'submitted' && (
                                <div className="bg-card rounded-2xl border border-orange-500/20 p-6 shadow-sm">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground mb-4">
                                        <Zap className="h-5 w-5 text-orange-500" />
                                        Review Submission
                                    </h3>

                                    <div className="p-4 bg-muted/50 rounded-xl space-y-3 mb-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Submitted By</p>
                                                <p className="font-medium text-foreground">{project.registrants?.find(r => r.freelancerId === project.assignedTo)?.freelancerName || 'Freelancer'}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {project.submission?.submittedAt ? formatDistanceToNow((project.submission.submittedAt as any).seconds ? new Date((project.submission.submittedAt as any).seconds * 1000) : new Date(project.submission.submittedAt), { addSuffix: true }) : ''}
                                            </span>
                                        </div>

                                        {project.submission?.link && (
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Link</p>
                                                <a href={project.submission.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline break-all">
                                                    {project.submission.link}
                                                </a>
                                            </div>
                                        )}

                                        {project.submission?.remarks && (
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Remarks</p>
                                                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{project.submission.remarks}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" onClick={handleRejectWork} disabled={submitting} className="border-destructive/50 text-destructive hover:bg-destructive/10">
                                            Request Changes
                                        </Button>
                                        <Button onClick={handleAcceptWork} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
                                            Accept & Pay
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Registration / Bidding Forms */}
                            {!isOwner && project.status !== 'assigned' && (
                                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                                    {isRegistrationOpen ? (
                                        <div className="text-center space-y-4">
                                            <h3 className="font-semibold text-lg">Open for Registration</h3>
                                            {isRegistered ? (
                                                <div className="p-4 bg-success/10 text-success rounded-lg border border-success/20">
                                                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                                                    <p className="font-medium">You are registered!</p>
                                                    <p className="text-xs mt-1 opacity-90">Waiting for skill evaluation...</p>
                                                </div>
                                            ) : (
                                                <RegisterProjectDialog
                                                    project={project}
                                                    onRegisterSuccess={() => setIsRegistered(true)}
                                                    trigger={
                                                        <Button
                                                            className="w-full"
                                                            size="lg"
                                                            disabled={submitting}
                                                        >
                                                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Now'}
                                                        </Button>
                                                    }
                                                />
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Registering places you in the candidate pool. Use the time to review requirements.
                                            </p>
                                        </div>
                                    ) : isBiddingOpen ? (
                                        canBid ? (
                                            userBid && !isEditing ? (
                                                <div className="text-center space-y-4">
                                                    <div className="h-12 w-12 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
                                                        <CheckCircle2 className="h-6 w-6" />
                                                    </div>
                                                    <h3 className="font-semibold text-lg">Bid Placed!</h3>
                                                    <p className="text-muted-foreground text-sm">
                                                        You have bid <span className="font-bold text-foreground">₹{userBid.amount}</span>.
                                                    </p>
                                                    {lowestBid > 0 && lowestBid < userBid.amount && (
                                                        <div className="bg-warning/10 text-warning text-xs p-2 rounded-lg border border-warning/20">
                                                            Current Lowest Bid: ₹{lowestBid}<br />
                                                            Update your bid to stay competitive!
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => {
                                                            setBidAmount(String(userBid.amount));
                                                            setDeliveryTime(String(userBid.deliveryTime));
                                                            setProposal(userBid.proposal);
                                                            setIsEditing(true);
                                                        }}
                                                    >
                                                        Update Bid
                                                    </Button>
                                                </div>
                                            ) : (
                                                <form onSubmit={handlePlaceBid} className="space-y-4">
                                                    <h3 className="font-semibold text-lg flex items-center gap-2 justify-between">
                                                        <span>{isEditing ? 'Update Your Bid' : 'Submit Tie-Breaker Bid'}</span>
                                                        {isEditing && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setIsEditing(false)}
                                                                type="button"
                                                                className="h-auto p-0 text-muted-foreground"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </h3>

                                                    {lowestBid > 0 && (
                                                        <div className="flex justify-between items-center text-xs px-2 py-1 bg-primary/5 rounded border border-primary/10 mb-2">
                                                            <span className="text-muted-foreground">Current Lowest Bid:</span>
                                                            <span className="font-bold text-primary">₹{lowestBid}</span>
                                                        </div>
                                                    )}

                                                    <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground mb-4">
                                                        Max discount allowed: 10%<br />
                                                        Min Bid: ₹{Math.round(project.budget * 0.9 * 0.9)}<br />
                                                        Max Bid: ₹{Math.round(project.budget * 0.9)}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="amount">Bid Amount (₹)</Label>
                                                        <Input
                                                            id="amount"
                                                            type="number"
                                                            placeholder="Amount"
                                                            value={bidAmount}
                                                            onChange={(e) => setBidAmount(e.target.value)}
                                                            disabled={submitting}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="days">Delivery Days</Label>
                                                        <Input
                                                            id="days"
                                                            type="number"
                                                            value={deliveryTime}
                                                            onChange={(e) => setDeliveryTime(e.target.value)}
                                                            disabled={submitting}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="proposal">Cover Letter</Label>
                                                        <Textarea
                                                            id="proposal"
                                                            value={proposal}
                                                            onChange={(e) => setProposal(e.target.value)}
                                                            className="min-h-[100px]"
                                                            disabled={submitting}
                                                            required
                                                        />
                                                    </div>

                                                    <Button type="submit" variant="gradient" className="w-full" disabled={submitting}>
                                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditing ? 'Update Bid' : 'Submit Bid')}
                                                    </Button>
                                                </form>
                                            )
                                        ) : (
                                            <div className="text-center p-6 text-muted-foreground">
                                                You are not eligible for this bidding phase.
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center p-6 text-muted-foreground">
                                            Registration Closed. Evaluation in progress.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Freelancer Workspace (Visible only to assigned freelancer) */}
                            {user?.uid === project.assignedTo && (project.status === 'assigned' || project.status === 'submitted') && (
                                <div className="bg-card rounded-2xl border border-primary/20 p-6 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg text-foreground">Project Workspace</h3>
                                                <p className="text-xs text-muted-foreground">Manage your assigned project</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Final Payout</p>
                                                <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                                                    <IndianRupee className="h-5 w-5" />
                                                    {project.finalAmount || project.budget}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Status</span>
                                                    <Badge className={project.status === 'submitted' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-primary/10 text-primary hover:bg-primary/20 border-0"}>
                                                        {project.status === 'submitted' ? 'Waiting for Review' : 'In Progress'}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Deadline</span>
                                                    <span className="font-medium">
                                                        {project.deadline
                                                            ? formatDistanceToNow((project.deadline as any).seconds ? new Date((project.deadline as any).seconds * 1000) : new Date(project.deadline), { addSuffix: true })
                                                            : (project.createdAt ? formatDistanceToNow(new Date(project.createdAt.seconds * 1000 + (7 * 24 * 60 * 60 * 1000)), { addSuffix: true }) : '7 days')
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            {project.status === 'assigned' ? (
                                                <>
                                                    {/* Progress Submission Form */}
                                                    <div className="pt-4 border-t border-border/50 space-y-3">
                                                        <h4 className="font-semibold text-sm">Submit Daily Progress</h4>
                                                        <div className="space-y-2">
                                                            <Input
                                                                placeholder="Link (e.g. GitHub Repository)"
                                                                value={progressLink}
                                                                onChange={(e) => setProgressLink(e.target.value)}
                                                                className="h-8 text-sm"
                                                            />
                                                            <Textarea
                                                                placeholder="What did you work on today?"
                                                                value={progressText}
                                                                onChange={(e) => setProgressText(e.target.value)}
                                                                className="min-h-[60px] text-sm"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                className="w-full gap-2"
                                                                variant="gradient"
                                                                onClick={handleSubmitProgress}
                                                                disabled={submitting}
                                                            >
                                                                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                Submit Update
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Final Submission Form */}
                                                    <div className="pt-4 border-t border-border/50 space-y-3">
                                                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                                                            <Zap className="h-4 w-4 text-yellow-500" />
                                                            Submit Final Project
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            Ready to deliver? submitting will notify the client for review.
                                                        </p>
                                                        <div className="space-y-2">
                                                            <Input
                                                                placeholder="Final Project Link (Live URL / Repo)"
                                                                value={finalLink}
                                                                onChange={(e) => setFinalLink(e.target.value)}
                                                                className="h-9 text-sm"
                                                            />
                                                            <Textarea
                                                                placeholder="Final remarks or instructions..."
                                                                value={finalRemarks}
                                                                onChange={(e) => setFinalRemarks(e.target.value)}
                                                                className="min-h-[80px] text-sm"
                                                            />
                                                            <Button
                                                                size="default"
                                                                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={handleSubmitProject}
                                                                disabled={submitting}
                                                            >
                                                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                Submit Final Project
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="pt-4 border-t border-border/50">
                                                    <div className="p-4 bg-muted/50 rounded-lg text-center space-y-2">
                                                        <div className="h-10 w-10 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                                            <CheckCircle2 className="h-6 w-6" />
                                                        </div>
                                                        <h4 className="font-semibold text-foreground">Project Submitted</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            You submitted this project {project.submission?.submittedAt ? formatDistanceToNow(project.submission.submittedAt.seconds ? new Date(project.submission.submittedAt.seconds * 1000) : new Date(project.submission.submittedAt), { addSuffix: true }) : ''}.
                                                            Waiting for client approval.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Project Progress Timeline (Visible to Owner and Assigned Freelancer) */}
                            {(isOwner || (user?.uid === project.assignedTo)) && progressUpdates.length > 0 && (
                                <div className="bg-card rounded-2xl border border-border p-6 mt-6">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        Project Progress
                                    </h3>
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                                        {progressUpdates.map((update, index) => (
                                            <div key={update.id} className="relative flex items-start group">
                                                <div className="absolute left-0 top-1 h-10 w-10 flex items-center justify-center rounded-full bg-card border border-border shadow-sm z-10">
                                                    <div className="h-3 w-3 rounded-full bg-primary animate-pulse"></div>
                                                </div>
                                                <div className="pl-12 w-full">
                                                    <div className="p-4 bg-muted/20 rounded-xl border border-border/50">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-sm">{update.freelancerName}</span>
                                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Update</span>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {update.createdAt?.seconds ? formatDistanceToNow(new Date(update.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-3">{update.text}</p>
                                                        {update.link && (
                                                            <a
                                                                href={update.link.startsWith('http') ? update.link : `https://${update.link}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-xs text-blue-500 hover:underline bg-blue-500/5 p-2 rounded-lg border border-blue-500/10 transition-colors hover:bg-blue-500/10 w-fit"
                                                            >
                                                                <LinkIcon className="h-3 w-3" />
                                                                {update.link}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Client Info */}
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4">About Client</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {project.postedByName?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{project.postedByName || 'Client'}</p>
                                        <p className="text-xs text-muted-foreground">Member since 2024</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={async () => {
                                        if (!user) {
                                            navigate('/login');
                                            return;
                                        }

                                        if (user.uid === project.postedBy) {
                                            toast.error("You cannot message yourself");
                                            return;
                                        }

                                        try {
                                            const conversationId = await createConversation(project.postedBy);
                                            if (conversationId) {
                                                const targetPath = userProfile?.role === 'freelancer' ? '/freelancer/messages' : '/developer/messages';
                                                navigate(targetPath, { state: { conversationId } });
                                            } else {
                                                toast.error("Failed to start conversation");
                                            }
                                        } catch (error) {
                                            console.error("Error contact client:", error);
                                            toast.error("Error connecting with client");
                                        }
                                    }}
                                >
                                    <User className="h-4 w-4" />
                                    Contact Client
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProjectDetails;
