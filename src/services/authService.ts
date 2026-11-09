import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { BRANDING } from '../config/branding';
import { uploadImageToStorage } from './storageService';

const USERS_COLLECTION = 'users';

export async function registerUser(
  email: string,
  pass: string,
  fullName: string,
  username: string,
  photoFileOrUrl?: File | string | null
): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  let finalPhotoURL: string;
  if (photoFileOrUrl instanceof File) {
    finalPhotoURL = await uploadImageToStorage(photoFileOrUrl, 'profiles');
  } else if (typeof photoFileOrUrl === 'string' && photoFileOrUrl.trim()) {
    finalPhotoURL = photoFileOrUrl.trim();
  } else {
    finalPhotoURL = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`;
  }

  await updateProfile(user, {
    displayName: fullName,
    photoURL: finalPhotoURL,
  });

  const isAdmin = email.toLowerCase() === BRANDING.adminEmail.toLowerCase();

  const profile: UserProfile = {
    id: user.uid,
    fullName,
    username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    email: user.email || email,
    bio: 'Storyteller & thinker exploring ideas on Soumil’s Blog.',
    photoURL: finalPhotoURL,
    coverURL: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    role: isAdmin ? 'admin' : 'member',
    isSuspended: false,
    followersCount: 0,
    followingCount: 0,
    blogsCount: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, user.uid), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${user.uid}`);
  }

  return profile;
}

export async function loginWithEmail(
  email: string,
  pass: string,
  rememberMe: boolean = true
): Promise<UserProfile | null> {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return fetchOrCreateUserProfile(userCredential.user);
}

export async function loginWithGoogle(): Promise<UserProfile | null> {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return fetchOrCreateUserProfile(userCredential.user);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function fetchOrCreateUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userDocRef = doc(db, USERS_COLLECTION, user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    const isAdmin = (user.email || '').toLowerCase() === BRANDING.adminEmail.toLowerCase();

    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      // Auto-grant admin role if email matches designated admin
      if (isAdmin && data.role !== 'admin') {
        await updateDoc(userDocRef, { role: 'admin' });
        data.role = 'admin';
      }
      return data;
    }

    // First time login via provider
    const username = (user.displayName || user.email?.split('@')[0] || 'writer')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);

    const newProfile: UserProfile = {
      id: user.uid,
      fullName: user.displayName || 'Anonymous Storyteller',
      username: username || `author_${user.uid.slice(0, 6)}`,
      email: user.email || '',
      bio: 'Storyteller & thinker on Soumil’s Blog.',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
      coverURL: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      role: isAdmin ? 'admin' : 'member',
      isSuspended: false,
      followersCount: 0,
      followingCount: 0,
      blogsCount: 0,
      createdAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, newProfile);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${user.uid}`);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${userId}`);
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'fullName' | 'username' | 'bio' | 'photoURL' | 'coverURL'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
  }
}
