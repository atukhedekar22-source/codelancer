import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// DEBUG LOGGING
const log = (msg: string, ...args: any[]) => console.log(`[AuthContext] ${msg}`, ...args);

export type UserRole = 'developer' | 'freelancer' | 'admin';

interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  photoURL?: string;
  skills?: string[];
  experience?: string;
  portfolioLinks?: string[];
  phone?: string;
  address?: string;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  governmentId?: {
    type?: string;
    documentUrl?: string;
    fileName?: string;
    verified: boolean;
    status: 'pending' | 'verified' | 'rejected' | 'none';
    uploadedAt?: any;
    rejectionReason?: string;
    extractedData?: any;
    confidenceScore?: number;
  };
  profileCompletion: number;
  rating?: number;
  reviewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, role: UserRole, fullName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      log('onAuthStateChanged triggered. User:', currentUser?.uid);
      setUser(currentUser);

      // Clean up previous profile listener if exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        setLoading(true);
        // Set up real-time listener for user profile
        const docRef = doc(db, 'users', currentUser.uid);

        // Use onSnapshot for real-time updates
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('[AuthContext] User profile fetched:', data.uid, 'Role:', data.role);
            setUserProfile(data as UserProfile);
          } else {
            log('User profile NOT found in Firestore.');
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('[AuthContext] Error listening to user profile:', error);
          setLoading(false);
        });

      } else {
        log('No user, setting profile to null');
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const signup = async (email: string, password: string, role: UserRole, fullName: string) => {
    log('Signup started for:', email, role);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      log('Firebase Auth user created:', user.uid);

      const userProfile: UserProfile = {
        uid: user.uid,
        email: email,
        role: role,
        fullName: fullName,

        profileCompletion: 20,
        governmentId: { verified: false, status: 'none' },
        rating: 0,
        reviewsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('[AuthContext] Saving user profile to Firestore...');
      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('[AuthContext] User profile saved successfully.');

      log('Manually setting user profile state from signup');
      setUserProfile(userProfile);
    } catch (error) {
      console.error('[AuthContext] Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    userProfile,
    loading,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
