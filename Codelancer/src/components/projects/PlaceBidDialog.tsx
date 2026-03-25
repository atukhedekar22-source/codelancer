import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceBidDialogProps {
    project: {
        id: string;
        title: string;
        budget: string;
    };
    trigger?: React.ReactNode;
    onBidSuccess?: () => void;
    existingBid?: {
        id: string;
        amount: number;
        proposal: string;
        deliveryTime: string;
    };
}

const PlaceBidDialog = ({ project, trigger, onBidSuccess, existingBid }: PlaceBidDialogProps) => {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [bidAmount, setBidAmount] = useState(existingBid ? String(existingBid.amount) : '');
    const [deliveryTime, setDeliveryTime] = useState(existingBid ? existingBid.deliveryTime : '');
    const [proposal, setProposal] = useState(existingBid ? existingBid.proposal : '');
    const [submitting, setSubmitting] = useState(false);

    const handlePlaceBid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) {
            toast.error("Please login to place a bid");
            navigate('/login');
            return;
        }

        if (userProfile.profileCompletion < 100) {
            toast.error("Please complete your profile details to place a bid", {
                action: {
                    label: "Go to Profile",
                    onClick: () => navigate('/profile')
                }
            });
            return;
        }

        if (!bidAmount || !proposal || !deliveryTime) {
            toast.error("Please fill in all fields");
            return;
        }

        if (existingBid && Number(bidAmount) <= existingBid.amount) {
            toast.error(`Your new bid (₹${bidAmount}) must be strictly higher than your current bid (₹${existingBid.amount}).`);
            return;
        }

        setSubmitting(true);
        try {
            if (existingBid) {
                // Update existing bid
                const bidRef = doc(db, 'bids', existingBid.id);
                await updateDoc(bidRef, {
                    amount: Number(bidAmount),
                    proposal,
                    deliveryTime,
                    updatedAt: serverTimestamp()
                });
                toast.success("Bid updated successfully!");
            } else {
                // Place new bid
                await addDoc(collection(db, 'bids'), {
                    projectId: project.id,
                    projectTitle: project.title,
                    freelancerId: user.uid,
                    freelancerName: userProfile.fullName,
                    freelancerPhoto: userProfile.photoURL || '',
                    amount: Number(bidAmount),
                    proposal,
                    deliveryTime,
                    status: 'pending',
                    createdAt: serverTimestamp()
                });

                // Increment bid count on project
                const projectRef = doc(db, 'projects', project.id);
                await updateDoc(projectRef, {
                    bids: increment(1)
                });
                toast.success("Bid placed successfully!");
            }

            setBidAmount('');
            setProposal('');
            setDeliveryTime('');
            setOpen(false);
            onBidSuccess?.();
        } catch (error) {
            console.error("Error placing/updating bid:", error);
            toast.error("Failed to submit bid");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="gradient" className="gap-2">
                        <Zap className="h-4 w-4" />
                        Place Bid
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{existingBid ? 'Update Your Bid' : `Place a Bid on ${project.title}`}</DialogTitle>
                    <DialogDescription>
                        {existingBid
                            ? "You can increase your bid amount to improve your chances."
                            : "Submit your proposal and budget for this project."}
                    </DialogDescription>
                </DialogHeader>

                {userProfile && userProfile.profileCompletion < 100 ? (
                    <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg flex items-start gap-4">
                        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-warning">Complete Profile Required</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                You must complete your profile (Currently {userProfile.profileCompletion}%) to bid.
                            </p>
                            <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-warning underline mt-2"
                                onClick={() => navigate('/profile')}
                            >
                                Complete Profile
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handlePlaceBid} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bidAmount">Bid Amount (₹)</Label>
                                <Input
                                    id="bidAmount"
                                    type="number"
                                    placeholder="e.g. 15000"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    disabled={submitting}
                                    min={existingBid ? existingBid.amount + 1 : 0}
                                    required
                                />
                                {existingBid && (
                                    <p className="text-xs text-muted-foreground">Current bid: ₹{existingBid.amount}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deliveryTime">Delivery Days</Label>
                                <Input
                                    id="deliveryTime"
                                    type="number"
                                    placeholder="e.g. 7"
                                    value={deliveryTime}
                                    onChange={(e) => setDeliveryTime(e.target.value)}
                                    disabled={submitting}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bidProposal">Cover Letter</Label>
                            <Textarea
                                id="bidProposal"
                                placeholder="Why are you the best fit for this project?"
                                value={proposal}
                                onChange={(e) => setProposal(e.target.value)}
                                className="min-h-[100px]"
                                disabled={submitting}
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="gradient" disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (existingBid ? 'Update Bid' : 'Submit Bid')}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PlaceBidDialog;
