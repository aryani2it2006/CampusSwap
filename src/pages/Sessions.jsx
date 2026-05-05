import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { Calendar, Clock, CheckCircle, XCircle, Star, MessageCircle, MapPin, Video, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Sessions() {
  const { currentUser } = useAuth();
  const { sessions, users, updateSession } = useData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [feedbackSession, setFeedbackSession] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [proposeTimeSession, setProposeTimeSession] = useState(null);
  const [newDateTime, setNewDateTime] = useState('');

  const userSessions = sessions.filter(s => s.teacherId === currentUser?.uid || s.studentId === currentUser?.uid);
  
  const isSessionExpired = (session) => {
    if (session.status === 'expired') return true;
    if (session.status !== 'pending') return false;
    if (session.timestamp) return session.timestamp < Date.now();
    if (session.date) {
      const dateStr = session.date.split(' at ')[0];
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime()) && parsed.getTime() + 86400000 < Date.now()) {
        return true;
      }
    }
    return false;
  };

  const pendingSessions = userSessions.filter(s => s.status === 'pending' && !isSessionExpired(s));
  const expiredSessions = userSessions.filter(s => s.status === 'expired' || (s.status === 'pending' && isSessionExpired(s)));
  const upcomingSessions = userSessions.filter(s => s.status === 'confirmed').sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const completedSessions = userSessions.filter(s => s.status === 'completed').sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));


  // Auto clean up old pending sessions
  useEffect(() => {
    const rawPendingSessions = userSessions.filter(s => s.status === 'pending');
    rawPendingSessions.forEach(async (session) => {
      if (isSessionExpired(session)) {
        await updateSession(session.id, { status: 'expired' });
      }
    });
  }, [pendingSessions, updateSession]);

  // Auto complete upcoming sessions that have passed
  useEffect(() => {
    upcomingSessions.forEach(async (session) => {
      if (session.timestamp && session.timestamp < Date.now()) {
        await updateSession(session.id, { status: 'completed' });
        
        try {
          // Credits logic
          const studentRef = doc(db, 'users', session.studentId);
          const teacherRef = doc(db, 'users', session.teacherId);
          
          const sDoc = await getDoc(studentRef);
          const tDoc = await getDoc(teacherRef);
          
          if(sDoc.exists() && typeof sDoc.data().credits === 'number') {
            await updateDoc(studentRef, { credits: Math.max(0, sDoc.data().credits - 10) });
          }
          if(tDoc.exists() && typeof tDoc.data().credits === 'number') {
            await updateDoc(teacherRef, { credits: tDoc.data().credits + 10 });
          }

          // Trigger feedback if currentUser is the student
          if (currentUser.uid === session.studentId) {
            setFeedbackSession(session);
          }
        } catch (e) {
          console.error("Error updating credits", e);
        }
      }
    });
  }, [upcomingSessions, currentUser, updateSession]);

  const handleAccept = async (session) => {
    await updateSession(session.id, { status: 'confirmed' });
    
    // Notify requester via chat
    const chatId = [currentUser.uid, session.requestedBy].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      type: 'text',
      text: `Your session for ${session.skill} was accepted! 🎉`,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      createdAt: serverTimestamp()
    });
  };

  const handleDecline = async (session) => {
    await updateSession(session.id, { status: 'declined' });
    
    // Notify requester via chat
    const chatId = [currentUser.uid, session.requestedBy].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      type: 'text',
      text: `Your session request for ${session.skill} was declined.`,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      createdAt: serverTimestamp()
    });
  };

  const submitFeedback = async () => {
    if (!rating) return;
    
    await updateSession(feedbackSession.id, { rating, feedback: feedbackText });
    
    try {
      const teacherRef = doc(db, 'users', feedbackSession.teacherId);
      const tDoc = await getDoc(teacherRef);
      if (tDoc.exists()) {
        const data = tDoc.data();
        const currentReviews = data.reviews || 0;
        const currentRating = data.rating || 5.0;
        
        const newReviews = currentReviews + 1;
        const newRating = ((currentRating * currentReviews) + rating) / newReviews;
        
        await updateDoc(teacherRef, { rating: newRating, reviews: newReviews });
      }
    } catch (e) {
      console.error("Error updating rating", e);
    }

    setFeedbackSession(null);
    setRating(0);
    setFeedbackText('');
  };

  const handleProposeTime = async () => {
    if (!newDateTime || !proposeTimeSession) return;
    
    const sessionDate = new Date(newDateTime);
    const formattedDate = sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric'});
    const formattedTime = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fullDateStr = `${formattedDate} at ${formattedTime}`;

    await updateSession(proposeTimeSession.id, { 
      date: fullDateStr, 
      timestamp: sessionDate.getTime()
    });
    
    // Notify requester
    const chatId = [currentUser.uid, proposeTimeSession.requestedBy].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      type: 'text',
      text: `I proposed a new time for our ${proposeTimeSession.skill} session: ${fullDateStr}.`,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      createdAt: serverTimestamp()
    });

    setProposeTimeSession(null);
    setNewDateTime('');
  };

  const getPartner = (session) => {
    const partnerId = session.teacherId === currentUser.uid ? session.studentId : session.teacherId;
    return users.find(u => u.id === partnerId || u.uid === partnerId);
  };

  const getTimeRemaining = (timestamp) => {
    if (!timestamp) return '';
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Now';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    
    if (days > 1) return `In ${days} days`;
    if (days === 1) return `Tomorrow at ${new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    if (hours > 0) return `In ${hours} hours`;
    return 'In less than an hour';
  };

  return (
    <div>
      <h2 className="page-title">Session Management</h2>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '12px' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'pending' ? 'var(--primary)' : 'transparent', color: activeTab === 'pending' ? 'white' : 'var(--text-muted)', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          Pending
        </button>
        <button 
          onClick={() => setActiveTab('upcoming')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'upcoming' ? 'var(--primary)' : 'transparent', color: activeTab === 'upcoming' ? 'white' : 'var(--text-muted)', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'completed' ? 'var(--primary)' : 'transparent', color: activeTab === 'completed' ? 'white' : 'var(--text-muted)', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          Completed
        </button>
        <button 
          onClick={() => setActiveTab('expired')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'expired' ? 'var(--primary)' : 'transparent', color: activeTab === 'expired' ? 'white' : 'var(--text-muted)', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          Expired
        </button>
      </div>

      {/* PENDING TAB */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingSessions.length > 0 ? pendingSessions.map(session => {
            const partner = getPartner(session);
            const isRequester = session.requestedBy === currentUser.uid;
            return (
              <div key={session.id} className="card">
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <img src={partner?.photoURL || '/default-avatar.png'} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{partner?.name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{partner?.college} • {partner?.branch}</div>
                  </div>
                </div>
                
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--primary)' }}>Skill:</span> {session.skill}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Clock size={16} /> {session.date}
                  </div>
                </div>

                {!isRequester ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn" style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid #10B981' }} onClick={() => handleAccept(session)}>
                      <CheckCircle size={16} /> Accept
                    </button>
                    <button className="btn" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid #EF4444' }} onClick={() => handleDecline(session)}>
                      <XCircle size={16} /> Decline
                    </button>
                    <button className="btn btn-outline" style={{ flex: '1 1 100%' }} onClick={() => setProposeTimeSession(session)}>
                      <RefreshCw size={16} /> Propose New Time
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#D97706', background: '#FEF3C7', padding: '8px', borderRadius: '8px', fontWeight: '500' }}>
                    Waiting for response...
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="card text-center text-muted" style={{ padding: '40px 20px' }}>
              No pending session requests.
            </div>
          )}
        </div>
      )}

      {/* UPCOMING TAB */}
      {activeTab === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {upcomingSessions.length > 0 ? upcomingSessions.map(session => {
            const partner = getPartner(session);
            return (
              <div key={session.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <img src={partner?.photoURL || '/default-avatar.png'} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: '600' }}>{session.skill}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>with {partner?.name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                    {getTimeRemaining(session.timestamp)}
                  </div>
                </div>
                
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Calendar size={16} color="var(--primary)" /> {session.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {session.mode === 'Online' ? <Video size={16} color="var(--accent-blue)" /> : <MapPin size={16} color="var(--accent-red)" />}
                    {session.meetingLink || session.mode}
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/chat/' + partner.id)}>
                  <MessageCircle size={18} /> Open Chat
                </button>
              </div>
            );
          }) : (
            <div className="card text-center text-muted" style={{ padding: '40px 20px' }}>
              No upcoming sessions.
            </div>
          )}
        </div>
      )}

      {/* COMPLETED TAB */}
      {activeTab === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {completedSessions.length > 0 ? completedSessions.map(session => {
            const partner = getPartner(session);
            const isLearner = currentUser.uid === session.studentId;
            const creditsDelta = isLearner ? '-10' : '+10';
            const creditsColor = isLearner ? '#EF4444' : '#10B981';

            return (
              <div key={session.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img src={partner?.photoURL || '/default-avatar.png'} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: '600' }}>{session.skill}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>with {partner?.name}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: creditsColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {creditsDelta} <Star size={14} fill={creditsColor} color={creditsColor} />
                  </div>
                </div>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {session.date}
                </div>

                {isLearner && !session.rating ? (
                  <button className="btn btn-primary" style={{ width: '100%', padding: '8px' }} onClick={() => setFeedbackSession(session)}>
                    Give Feedback
                  </button>
                ) : session.rating ? (
                  <div style={{ display: 'flex', gap: '2px', color: '#F59E0B' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={16} fill={star <= session.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }) : (
            <div className="card text-center text-muted" style={{ padding: '40px 20px' }}>
              No completed sessions yet.
            </div>
          )}
        </div>
      )}

      {/* EXPIRED TAB */}
      {activeTab === 'expired' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {expiredSessions.length > 0 ? expiredSessions.map(session => {
            const partner = getPartner(session);
            const isRequester = session.requestedBy === currentUser.uid;
            return (
              <div key={session.id} className="card" style={{ opacity: 0.7 }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <img src={partner?.photoURL || '/default-avatar.png'} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', textDecoration: 'line-through' }}>{partner?.name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{partner?.college}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', alignSelf: 'flex-start', background: '#EF444420', color: '#EF4444', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Expired
                  </div>
                </div>
                
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Missed Skill:</span> {session.skill}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Clock size={16} /> {session.date}
                  </div>
                </div>

                {!isRequester && (
                  <div style={{ marginTop: '16px' }}>
                    <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setProposeTimeSession(session)}>
                      <RefreshCw size={16} /> Propose Reschedule
                    </button>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="card text-center text-muted" style={{ padding: '40px 20px' }}>
              No expired sessions.
            </div>
          )}
        </div>
      )}

      {/* Propose Time Modal */}
      {proposeTimeSession && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Propose New Time</h3>
            <div className="input-group">
              <label className="input-label">Select Date & Time</label>
              <input 
                type="datetime-local" 
                className="input-field" 
                value={newDateTime}
                onChange={e => setNewDateTime(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setProposeTimeSession(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleProposeTime} disabled={!newDateTime}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackSession && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '8px' }}>Session Completed! 🎉</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>How was your session with {getPartner(feedbackSession)?.name}?</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={36} 
                  onClick={() => setRating(star)}
                  style={{ cursor: 'pointer', color: '#F59E0B', transition: 'all 0.2s' }}
                  fill={star <= rating ? "currentColor" : "none"}
                />
              ))}
            </div>

            <textarea 
              className="input-field" 
              placeholder="Share your experience (optional)..." 
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              rows={3}
              style={{ marginBottom: '24px' }}
            />

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitFeedback} disabled={!rating}>
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
