export interface UserProfile {
    uid: string;
    email: string;
    role: 'developer' | 'freelancer' | 'admin';
    fullName: string;
    photoURL?: string;
    skills?: string[];
    experience?: string;
    portfolioLinks?: string[];
    profileCompletion: number;
    rating?: number;
    reviewsCount?: number;
    createdAt: any; // Firestore Timestamp or Date
    updatedAt: any;
    bankDetails?: {
        bankName: string;
        accountNumber: string;
        ifscCode: string;
    };
    governmentId?: {
        verified: boolean;
        status: 'pending' | 'verified' | 'rejected' | 'none';
        documentUrl?: string;
        fileName?: string;
        type?: string;
        uploadedAt?: any;
    };
    profileViews?: number;
}

export interface Registrant {
    freelancerId: string;
    freelancerName: string;
    appliedAt: string;
    rating: number;
    skills: string[];
    score?: number;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    budget: number;
    deadline: string;
    skills: string[];
    postedBy: string;
    postedByName: string;
    createdAt: any; // Firestore Timestamp
    registrationEndsAt?: any; // Firestore Timestamp or Date
    registrants?: Registrant[];
    status: 'open' | 'assigned' | 'completed' | 'bidding' | 'expired' | 'submitted';
    bids: number;
    assignedTo?: string;
    biddingOpenFor?: string[]; // Array of freelancer IDs
    finalAmount?: number;
    submission?: {
        link: string;
        remarks: string;
        submittedAt: any;
    };
}

export interface Bid {
    id: string;
    projectId: string;
    projectTitle: string;
    freelancerId: string;
    freelancerName: string;
    freelancerPhoto: string;
    amount: number;
    proposal: string;
    deliveryTime: number;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    createdAt: any;
    matchScore?: number;
    rating?: number;
}

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: any;
    read: boolean;
}

export interface Conversation {
    id: string;
    participants: string[];
    lastMessage?: Omit<Message, 'id'>;
    updatedAt: any;
    unreadCount?: number;
    otherUser?: {
        uid: string;
        fullName: string;
        photoURL?: string;
        email: string;
    } | null;
}
