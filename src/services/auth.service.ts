import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User } from '@/types';

const googleProvider = new GoogleAuthProvider();

class AuthService {
  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string, displayName: string): Promise<FirebaseUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await this.createUserDocument(user);

    return user;
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<FirebaseUser> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    // Create user document if it doesn't exist
    await this.createUserDocument(user);

    return user;
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Create user document in Firestore
   */
  private async createUserDocument(firebaseUser: FirebaseUser): Promise<void> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  /**
   * Get current user data from Firestore
   */
  async getCurrentUserData(): Promise<User | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as User;
    }

    return null;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();