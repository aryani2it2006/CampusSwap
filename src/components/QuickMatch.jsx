import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { X, Check, XCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const getMatchPercentage = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return 0;
  const myWants = currentUser.wants || [];
  const myTeaches = currentUser.teaches || [];
  const theirWants = targetUser.wants || [];
  const theirTeaches = targetUser.teaches || [];
  
  let totalScorePossible = Math.max(1, myWants.length + myTeaches.length);
  const learningMatch = myWants.filter(skill => theirTeaches.includes(skill)).length;
  const teachingMatch = myTeaches.filter(skill => theirWants.includes(skill)).length;
  
  const matchScore = learningMatch + teachingMatch;
  if (matchScore === 0) return 0;
  
  let percentage = Math.round((matchScore / totalScorePossible) * 100);
  return percentage > 100 ? 100 : percentage;
};

export default function QuickMatch({ onClose }) {
  const { users, sessions, sendNotification } = useData();
  const { currentUser } = useAuth();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnimation, setShowAnimation] = useState('');

  // Filter users
  const candidates = users.filter(user => {
    if (user.id === currentUser?.uid) return false;
    
    // Must have complementary skills (matchScore > 0)
    const matchScore = getMatchPercentage(currentUser, user);
    if (matchScore === 0) return false;
    
    // Haven't been connected with yet (no session where both users are involved)
    const hasSession = sessions.some(s => 
      (s.studentId === currentUser?.uid && s.teacherId === user.uid) ||
      (s.teacherId === currentUser?.uid && s.studentId === user.uid)
    );
    if (hasSession) return false;
    
    return true;
  }).map(u => ({ ...u, matchScore: getMatchPercentage(currentUser, u) }))
  .sort((a, b) => b.matchScore - a.matchScore);

  const currentUserData = candidates[currentIndex];

  const handleSkip = useCallback(() => {
    if (currentIndex >= candidates.length) return;
    setShowAnimation('swipe-left');
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setShowAnimation('');
    }, 300);
  }, [currentIndex, candidates.length]);

  const handleConnect = useCallback(async () => {
    if (currentIndex >= candidates.length || !currentUserData) return;
    
    setShowAnimation('request-sent');
    
    try {
      const iLearn = currentUser?.wants.find(skill => currentUserData.teaches.includes(skill)) || currentUserData.teaches[0] || 'a skill';
      
      const sessionData = {
        studentId: currentUser.uid,
        teacherId: currentUserData.uid || currentUserData.id,
        skill: iLearn,
        requestedBy: currentUser.uid,
        status: 'pending',
        date: 'TBD',
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'sessions'), sessionData);

      // Send real notification to the target user
      await sendNotification(currentUserData.uid || currentUserData.id, {
        type: 'connection_request',
        text: `${currentUser.name.split(' ')[0]} wants to swap skills with you!`,
        link: '/matches'
      });
      
    } catch (e) {
      console.error('Error sending request', e);
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setShowAnimation('');
    }, 800);
  }, [currentIndex, candidates.length, currentUserData, currentUser]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (showAnimation) return; // ignore if animating
      if (e.key === 'ArrowLeft') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleConnect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip, handleConnect, showAnimation]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', width: '44px', height: '44px', borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10001, boxShadow: '0 4px 15px rgba(0,0,0,0.4)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
        <X size={28} color="#13131f" strokeWidth={3} />
      </button>

      <h2 style={{ color: 'white', marginBottom: '24px', fontSize: '2rem', fontFamily: 'Outfit, sans-serif' }}>Quick Match ⚡</h2>

      <div style={{ position: 'relative', width: '350px', height: '500px' }}>
        {currentIndex >= candidates.length ? (
          <div className="card" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#13131f' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>No more matches right now!</h3>
            <p style={{ color: 'var(--text-muted)' }}>Check back later 🔍</p>
          </div>
        ) : (
          <div className="card" style={{ 
            width: '100%', 
            height: '100%', 
            background: '#13131f', 
            borderRadius: '24px', 
            overflow: 'hidden', 
            padding: 0, 
            display: 'flex', 
            flexDirection: 'column',
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            transform: showAnimation === 'swipe-left' ? 'translateX(-100%) rotate(-10deg)' : 'translateX(0) rotate(0deg)',
            opacity: showAnimation === 'swipe-left' ? 0 : 1,
            boxShadow: '0 10px 40px rgba(124,58,237,0.3)',
            border: '2px solid rgba(124,58,237,0.4)'
          }}>
            
            {showAnimation === 'request-sent' && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(124, 58, 237, 0.95)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Request Sent!</h2>
              </div>
            )}

            <img src={currentUserData.photoURL || '/default-avatar.png'} style={{ width: '100%', height: '50%', objectFit: 'cover' }} />
            
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>{currentUserData.name.split(' ')[0]}</h3>
                <div style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {currentUserData.matchScore}%
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Can Teach</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {currentUserData.teaches.slice(0, 3).map(skill => (
                      <span key={skill} className="tag tag-teach" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>{skill}</span>
                    ))}
                    {currentUserData.teaches.length > 3 && <span className="tag" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>+{currentUserData.teaches.length - 3}</span>}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Wants to Learn</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {currentUserData.wants.slice(0, 3).map(skill => (
                      <span key={skill} className="tag tag-learn" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', paddingTop: '16px' }}>
                <button onClick={handleSkip} style={{ flex: 1, height: '48px', borderRadius: '24px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <X size={18} /> Skip
                </button>
                <button onClick={handleConnect} style={{ flex: 1, height: '48px', borderRadius: '24px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(124,58,237,0.4)' }}>
                  <Check size={18} /> Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentIndex < candidates.length && (
        <div style={{ color: 'var(--text-muted)', marginTop: '24px', fontSize: '0.9rem', display: 'flex', gap: '24px', fontWeight: '600' }}>
          <span>← Skip</span>
          <span>Connect →</span>
        </div>
      )}
    </div>
  );
}
