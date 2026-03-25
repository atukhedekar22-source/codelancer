import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface EscrowTransaction {
    id: string;
    projectId?: string;
    freelancerId?: string;
    clientId: string;
    amount: number;
    status: 'held' | 'released' | 'refunded' | 'pending';
    description: string;
    createdAt: any;
    type: 'Deposit' | 'Release' | 'Refund';
}

export const useEscrow = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(0);

    useEffect(() => {
        if (!user) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        // Query for transactions where user is client OR freelancer
        // For simplicity in this demo, strict security rules should serve this
        const q = query(
            collection(db, 'escrow_transactions'),
            where('clientId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as EscrowTransaction[];

            setTransactions(txs);

            // Calculate simple wallet balance for demo
            // In real app, this should be a separate collection or aggregated field
            const balance = txs.reduce((acc, tx) => {
                if (tx.status === 'released' && tx.type === 'Deposit') return acc - tx.amount; // Spent
                if (tx.status === 'held') return acc + tx.amount; // In Escrow (technically user's money but locked)
                // Simplification: Assume 'wallet' is just summation of deposits not yet spent? 
                // Or actually just show 'Pending in Escrow' vs 'Available'
                return acc;
            }, 0);

            // Let's just mock specific balance logic for now or store it on user profile
            setWalletBalance(0); // placeholder
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Calculate Freelancer Earnings
    const [totalEarnings, setTotalEarnings] = useState(0);

    useEffect(() => {
        if (!user) {
            setTotalEarnings(0);
            return;
        }

        const qEarnings = query(
            collection(db, 'escrow_transactions'),
            where('freelancerId', '==', user.uid)
        );

        const unsubscribeEarnings = onSnapshot(qEarnings, (snapshot) => {
            const earnings = snapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                if (data.status === 'released') {
                    return acc + (data.amount || 0);
                }
                return acc;
            }, 0);
            setTotalEarnings(earnings);
        }, (error) => {
            console.error("Error fetching earnings:", error);
        });

        return () => unsubscribeEarnings();
    }, [user]);

    const createEscrowTransaction = async (amount: number, description: string, projectId?: string, freelancerId?: string) => {
        if (!user) return;

        try {
            const docRef = await addDoc(collection(db, 'escrow_transactions'), {
                clientId: user.uid,
                amount,
                description,
                projectId: projectId || null,
                freelancerId: freelancerId || null,
                status: 'held',
                type: 'Deposit',
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating escrow:", error);
            throw error;
        }
    };

    const releaseFunds = async (transactionId: string) => {
        try {
            await updateDoc(doc(db, 'escrow_transactions', transactionId), {
                status: 'released',
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error releasing funds:", error);
            throw error;
        }
    };

    return {
        transactions,
        loading,
        createEscrowTransaction,
        releaseFunds,
        walletBalance,
        totalEarnings
    };
};
