import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp,
    getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
    id: string;
    projectId: string;
    reviewerId: string;
    targetUserId: string;
    rating: number;
    comment: string;
    createdAt: any;
    reviewerName?: string;
}

export const useReviews = (targetUserId?: string) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!targetUserId) {
            setReviews([]);
            setLoading(false);
            return;
        }

        const fetchReviews = async () => {
            try {
                const q = query(
                    collection(db, 'reviews'),
                    where('targetUserId', '==', targetUserId),
                    orderBy('createdAt', 'desc')
                );

                const snapshot = await getDocs(q);
                const reviewsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Review[];

                setReviews(reviewsData);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [targetUserId]);

    const submitReview = async (review: Omit<Review, 'id' | 'createdAt' | 'reviewerId'>) => {
        if (!user) return;

        try {
            await addDoc(collection(db, 'reviews'), {
                ...review,
                reviewerId: user.uid,
                reviewerName: user.displayName || 'Anonymous', // Simplified
                createdAt: serverTimestamp()
            });

            // Ideally, trigger a cloud function to update average rating on User profile
            return true;
        } catch (error) {
            console.error("Error submitting review:", error);
            throw error;
        }
    };

    return {
        reviews,
        loading,
        submitReview
    };
};
