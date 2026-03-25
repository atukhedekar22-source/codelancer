import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    IndianRupee,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

interface Bid {
    id: string;
    projectId: string;
    amount: number;
    proposal: string;
    status: 'pending' | 'accepted' | 'rejected' | 'pending_action';
    createdAt: any;
    project?: {
        title: string;
        description: string;
        budget: string;
        status: string;
        assignedTo?: string;
    };
    topBid?: number;
    secondBid?: number;
    topBidderName?: string;
    topBidderId?: string;
}

const MyBids = () => {
    const { user } = useAuth();
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBids = async () => {
            if (!user) return;

            try {
                setLoading(true);

                // 1. Fetch Placed Bids
                const bidsQuery = query(
                    collection(db, 'bids'),
                    where('freelancerId', '==', user.uid)
                );

                const bidsSnapshot = await getDocs(bidsQuery);
                const placedBids = bidsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Bid[];

                // 2. Fetch "Invited" Projects (where user can bid but hasn't yet)
                // Note: Firestore array-contains query
                const invitedProjectsQuery = query(
                    collection(db, 'projects'),
                    where('status', '==', 'bidding'),
                    where('biddingOpenFor', 'array-contains', user.uid)
                );

                const invitedSnapshot = await getDocs(invitedProjectsQuery);
                const invitedProjects = invitedSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as any[];

                // 3. Process Placed Bids (Fetch project details for them)
                const processedPlacedBids = await Promise.all(placedBids.map(async (bid) => {
                    try {
                        if (bid.projectId) {
                            const projectDocRef = doc(db, 'projects', bid.projectId);
                            const projectDocSnap = await getDoc(projectDocRef);

                            if (projectDocSnap.exists()) {
                                bid.project = projectDocSnap.data() as any;
                            }

                            // Fetch top 2 bids
                            const topBidsQuery = query(
                                collection(db, 'bids'),
                                where('projectId', '==', bid.projectId)
                            );
                            const topBidsSnap = await getDocs(topBidsQuery);
                            const projectBids = topBidsSnap.docs.map(d => d.data());
                            projectBids.sort((a: any, b: any) => b.amount - a.amount);

                            bid.topBid = projectBids[0]?.amount || 0;
                            bid.topBidderName = projectBids[0]?.freelancerName || 'Unknown';
                            bid.topBidderId = projectBids[0]?.freelancerId;
                            bid.secondBid = projectBids[1]?.amount || 0;
                        }
                    } catch (error) {
                        console.error(`Error fetching details for bid ${bid.id}:`, error);
                    }
                    return bid;
                }));

                // 4. Transform Invited Projects into "Fake" Bid objects for display
                const invitedBids: Bid[] = invitedProjects
                    .filter(project => !placedBids.some(b => b.projectId === project.id)) // Only if not already bid
                    .map(project => ({
                        id: `invite_${project.id}`,
                        projectId: project.id,
                        amount: 0, // Placeholder
                        proposal: '',
                        status: 'pending_action' as any, // Special status we'll handle
                        createdAt: project.createdAt, // Use project creation time or similar
                        project: project,
                        topBid: 0,
                        secondBid: 0
                    }));

                // 5. Merge and Sort
                const allItems = [...invitedBids, ...processedPlacedBids];

                // Sort by date (newest first)
                allItems.sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    if (a.status === 'pending_action' && b.status !== 'pending_action') return -1;
                    if (a.status !== 'pending_action' && b.status === 'pending_action') return 1;
                    return dateB - dateA;
                });

                // Filter out:
                // 1. Projects that are deleted (project is undefined/null)
                // 2. Projects assigned to the current user (should be in My Projects)
                const activeBids = allItems.filter(bid => {
                    if (!bid.project) return false; // Project deleted
                    if (bid.project.assignedTo === user.uid) return false; // Assigned to me
                    return true;
                });

                setBids(activeBids);
            } catch (error) {
                console.error("Error fetching bids:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBids();
    }, [user]);

    const getStatusBadge = (status: string, bid: Bid) => {
        const isWinning = bid.amount === bid.topBid;

        switch (status) {
            case 'accepted':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Accepted
                    </span>
                );
            case 'rejected':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                        <XCircle className="h-3 w-3" />
                        Rejected
                    </span>
                );
            case 'pending_action' as any:
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold animate-pulse">
                        <Zap className="h-3 w-3" />
                        Action Required: Place Bid
                    </span>
                );
            default:
                if (isWinning) {
                    return (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            <CheckCircle className="h-3 w-3" />
                            Highest Bidder (You)
                        </span>
                    );
                }
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                        <AlertCircle className="h-3 w-3" />
                        Outbid by {bid.topBidderName}
                    </span>
                );
        }
    };

    return (
        <DashboardLayout role="freelancer">
            <div className="space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">My Bids</h1>
                    <p className="text-muted-foreground">Track the status of your proposals.</p>
                </motion.div>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading your bids...</p>
                        </div>
                    ) : bids.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-2xl border border-dashed">
                            <p className="text-muted-foreground mb-4">You haven't placed any bids yet.</p>
                            <Button asChild variant="gradient">
                                <Link to="/freelancer/projects">Browse Projects</Link>
                            </Button>
                        </div>
                    ) : (
                        bids.map((bid, index) => (
                            <motion.div
                                key={bid.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-primary/50">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row gap-6 justify-between">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold font-display mb-1">
                                                            {bid.project?.title || 'Unknown Project'}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {bid.project?.description}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(bid.status, bid)}
                                                </div>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-muted/20 p-4 rounded-xl">
                                                    {bid.status === 'pending_action' as any ? (
                                                        <div className="col-span-full flex items-center justify-between text-purple-700">
                                                            <span className="font-semibold">You have been selected to bid on this project!</span>
                                                            <span className="text-xs">Tie-breaker phase active</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="space-y-1">
                                                                <span className="text-muted-foreground text-xs uppercase tracking-wider">Your Bid</span>
                                                                <div className="flex items-center gap-1 font-semibold text-primary">
                                                                    <IndianRupee className="h-4 w-4" />
                                                                    {bid.amount}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-muted-foreground text-xs uppercase tracking-wider">Highest Bid</span>
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1 font-medium text-foreground">
                                                                        <IndianRupee className="h-4 w-4" />
                                                                        {bid.topBid || '-'}
                                                                    </div>
                                                                    {bid.topBidderName && (
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            by {bid.topBidderId === user?.uid ? 'You' : bid.topBidderName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-muted-foreground text-xs uppercase tracking-wider">2nd Highest</span>
                                                                <div className="flex items-center gap-1 font-medium text-foreground">
                                                                    <IndianRupee className="h-4 w-4" />
                                                                    {bid.secondBid || '-'}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-muted-foreground text-xs uppercase tracking-wider">Submitted</span>
                                                                <div className="flex items-center gap-1 font-medium">
                                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                                    {bid.createdAt?.seconds ? formatDistanceToNow(new Date(bid.createdAt.seconds * 1000), { addSuffix: true }) : 'Recently'}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="bg-muted/30 p-3 rounded-lg text-sm italic text-muted-foreground">
                                                    "{bid.proposal}"
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col justify-end gap-2 md:border-l pl-0 md:pl-6 md:w-48">
                                                <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                                                    <Link to={`/projects/${bid.projectId}`}>
                                                        <ExternalLink className="h-4 w-4" />
                                                        {bid.status === 'pending_action' as any ? 'Place Bid' : 'View Project'}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MyBids;
