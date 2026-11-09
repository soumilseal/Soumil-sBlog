import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { fetchOrCreateUserProfile, getUserProfile, logoutUser } from '../services/authService';
import { BRANDING } from '../config/branding';

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const prof = await fetchOrCreateUserProfile(currentUser);
          setProfile(prof);
        } catch (error) {
          console.warn('Error synchronizing user profile:', error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const updated = await getUserProfile(user.uid);
      if (updated) setProfile(updated);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = Boolean(
    (user?.email && user.email.toLowerCase() === BRANDING.adminEmail.toLowerCase()) ||
    profile?.role === 'admin'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        refreshProfile,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
