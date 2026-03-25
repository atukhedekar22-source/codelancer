import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useReviews } from '@/hooks/useReviews';
import { useToast } from '@/components/ui/use-toast';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    targetUserId: string;
    targetUserName: string;
}

const ReviewModal = ({ isOpen, onClose, projectId, targetUserId, targetUserName }: ReviewModalProps) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { submitReview } = useReviews();
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({ title: "Select a rating", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            await submitReview({
                projectId,
                targetUserId,
                rating,
                comment
            });
            toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
            onClose();
        } catch (error) {
            toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rate your experience with {targetUserName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`transition-all ${star <= rating ? 'scale-110' : 'opacity-50 hover:opacity-100'}`}
                                onClick={() => setRating(star)}
                            >
                                <Star className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label>Comment</Label>
                        <Textarea
                            placeholder="Share your experience working on this project..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewModal;
