import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUser(userSnap.data());
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { isNewUser: true, user };
      } else {
        setCurrentUser(userSnap.data());
        return { isNewUser: false, user: userSnap.data() };
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      return { error };
    }
  };

  const completeSetup = async (user, initialData) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newUserProfile = {
        uid: user.uid,
        name: user.displayName || 'New Student',
        email: user.email,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=New+Student&background=378ADD&color=fff`,
        branch: '',
        year: '',
        teaches: [],
        wants: [],
        credits: 50,
        rating: 5.0,
        reviews: 0,
        ...initialData
      };
      await setDoc(userRef, newUserProfile);
      setCurrentUser(newUserProfile);
      setToastMessage("Welcome to CampusSwap! 🎉 You've received 50 starter credits.");
      setTimeout(() => setToastMessage(null), 6000);
    } catch (error) {
      console.error("Error completing profile setup:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateProfile = async (data) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, data);
      setCurrentUser(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const addCredits = async (amount) => {
    if (!currentUser) return;
    try {
      const newCredits = currentUser.credits + amount;
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { credits: newCredits });
      setCurrentUser(prev => ({ ...prev, credits: newCredits }));
    } catch (error) {
      console.error("Error adding credits:", error);
    }
  };

  const value = {
    currentUser,
    loginWithGoogle,
    logout,
    updateProfile,
    addCredits,
    completeSetup,
    toastMessage
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
