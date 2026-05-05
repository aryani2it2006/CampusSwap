import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const SKILL_LIST = [
  "Python", "Guitar", "Spoken English", "Sketching", "DSA", "Fitness", 
  "Photography", "Hindi", "Design", "Math", "Java", "Figma", "Canva", "Physics", "React", "JavaScript", "Drawing"
];

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setUsers(usersData);
    });

    const unsubscribeSessions = onSnapshot(collection(db, 'sessions'), (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setSessions(sessionsData);
    });

    let unsubscribeNotifications;
    if (currentUser?.uid) {
      unsubscribeNotifications = onSnapshot(collection(db, 'users', currentUser.uid, 'notifications'), (snapshot) => {
        const notifsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notifsData);
      });
    }

    return () => {
      unsubscribeUsers();
      unsubscribeSessions();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [currentUser?.uid]);

  const addSession = async (session) => {
    try {
      const docRef = await addDoc(collection(db, 'sessions'), { 
        ...session, 
        status: 'pending', 
        createdAt: Date.now() 
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding session:", error);
      return null;
    }
  };

  const updateSession = async (sessionId, updates) => {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, updates);
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };

  const completeSession = async (sessionId) => {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, { status: 'completed' });
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  const sendNotification = async (userId, data) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'users', userId, 'notifications'), {
        ...data,
        read: false,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error("Error sending notification", e);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser?.uid) return;
    const unread = notifications.filter(n => !n.read);
    for (const notif of unread) {
      const ref = doc(db, 'users', currentUser.uid, 'notifications', notif.id);
      updateDoc(ref, { read: true }).catch(console.error);
    }
  };

  const value = {
    users,
    sessions,
    notifications,
    addSession,
    updateSession,
    completeSession,
    sendNotification,
    markAllNotificationsRead
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
