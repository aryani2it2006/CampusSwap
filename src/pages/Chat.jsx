import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, Calendar, Check, X, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { users, updateSession } = useData();
  const { currentUser } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatPartner, setChatPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchPartner = async () => {
      let partner = users.find(u => u.uid === userId || u.id === userId);
      
      if (!partner) {
        try {
          const docRef = doc(db, 'users', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            partner = { id: docSnap.id, ...docSnap.data() };
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      if (!partner) {
        if (users.length > 0) {
          navigate('/matches');
        }
        return;
      }
      
      const myWants = currentUser.wants || [];
      const myTeaches = currentUser.teaches || [];
      const theirWants = partner.wants || [];
      const theirTeaches = partner.teaches || [];
      const matchScore = myWants.filter(s => theirTeaches.includes(s)).length + myTeaches.filter(s => theirWants.includes(s)).length;
      
      if (matchScore === 0) {
        navigate('/matches');
        return;
      }
      
      setChatPartner(partner);
      setLoading(false);
    };
    
    fetchPartner();
  }, [userId, users, currentUser, navigate]);

  useEffect(() => {
    if (!currentUser || !chatPartner) return;

    const partnerId = chatPartner.uid || chatPartner.id;
    const chatId = [currentUser.uid, partnerId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
      }));
      setMessages(msgs);
    });

    // Reset unread count when opening chat
    const chatRef = doc(db, 'chats', chatId);
    updateDoc(chatRef, {
      [`unread_${currentUser.uid}`]: 0
    }).catch(e => console.log('Chat doc might not exist yet', e));

    return () => unsubscribe();
  }, [currentUser, chatPartner]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser || !chatPartner) return;
    
    const partnerId = chatPartner.uid || chatPartner.id;
    const chatId = [currentUser.uid, partnerId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    const msgText = input;
    setInput('');

    try {
      await addDoc(messagesRef, {
        text: msgText,
        senderId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      await setDoc(chatRef, {
        participants: [currentUser.uid, partnerId],
        lastMessage: msgText,
        updatedAt: serverTimestamp(),
        [`unread_${partnerId}`]: increment(1)
      }, { merge: true });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSessionAction = async (msg, action) => {
    try {
      const partnerId = chatPartner.uid || chatPartner.id;
      const chatId = [currentUser.uid, partnerId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const messageRef = doc(db, 'chats', chatId, 'messages', msg.id);
      const messagesRef = collection(db, 'chats', chatId, 'messages');

      let systemMsgText = '';

      if (action === 'accept') {
        await updateSession(msg.sessionId, { status: 'confirmed' });
        await updateDoc(messageRef, { status: 'accepted' });
        systemMsgText = `✅ ${currentUser.name} accepted the session request for ${msg.topic} on ${msg.date} at ${msg.time}.`;
        await addDoc(messagesRef, {
          text: systemMsgText,
          senderId: 'system',
          createdAt: serverTimestamp()
        });
      } else if (action === 'reject') {
        await updateSession(msg.sessionId, { status: 'rejected' });
        await updateDoc(messageRef, { status: 'rejected' });
        systemMsgText = `❌ ${currentUser.name} declined the session request for ${msg.topic}.`;
        await addDoc(messagesRef, {
          text: systemMsgText,
          senderId: 'system',
          createdAt: serverTimestamp()
        });
      } else if (action === 'propose') {
        await updateSession(msg.sessionId, { status: 'rejected' });
        await updateDoc(messageRef, { status: 'proposed_new_time' });
        navigate(`/schedule/${partnerId}`);
        return;
      }

      if (systemMsgText) {
        await setDoc(chatRef, {
          participants: [currentUser.uid, partnerId],
          lastMessage: systemMsgText,
          updatedAt: serverTimestamp(),
          [`unread_${partnerId}`]: increment(1)
        }, { merge: true });
      }

    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !chatPartner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0d0d14' }}>
        <div style={{ padding: '16px 20px', background: '#13131f', borderBottom: '1px solid rgba(124, 58, 237, 0.3)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '24px', height: '24px', background: '#1a1a2e', borderRadius: '50%' }}></div>
          <div style={{ width: '40px', height: '40px', background: '#1a1a2e', borderRadius: '50%' }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ width: '120px', height: '16px', background: '#1a1a2e', borderRadius: '4px', marginBottom: '8px' }}></div>
            <div style={{ width: '160px', height: '12px', background: '#1a1a2e', borderRadius: '4px' }}></div>
          </div>
        </div>
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '60%', height: '60px', background: '#1a1a2e', borderRadius: '16px', alignSelf: 'flex-start' }}></div>
          <div style={{ width: '50%', height: '50px', background: '#1a1a2e', borderRadius: '16px', alignSelf: 'flex-end' }}></div>
          <div style={{ width: '70%', height: '80px', background: '#1a1a2e', borderRadius: '16px', alignSelf: 'flex-start' }}></div>
        </div>
      </div>
    );
  }

  const iLearn = currentUser?.wants?.find(skill => chatPartner.teaches?.includes(skill));
  const iTeach = currentUser?.teaches?.find(skill => chatPartner.wants?.includes(skill));
  let matchContext = '';
  if (iTeach && iLearn) {
    matchContext = `You teach ${iTeach} • You learn ${iLearn}`;
  } else if (iTeach) {
    matchContext = `You teach ${iTeach}`;
  } else if (iLearn) {
    matchContext = `You learn ${iLearn}`;
  } else {
    matchContext = `${chatPartner.branch || ''} • ${chatPartner.year || ''}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0d0d14' }}>
      <div style={{ padding: '16px 20px', background: '#13131f', borderBottom: '1px solid #7C3AED', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ position: 'relative' }}>
          <img src={chatPartner.photoURL} alt={chatPartner.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#10B981', border: '2px solid #13131f', borderRadius: '50%' }}></div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '1.1rem', color: 'white' }}>{chatPartner.name}</div>
          <div style={{ fontSize: '0.8rem', color: '#a78bfa' }}>{matchContext}</div>
        </div>
        <button className="btn-outline" style={{ padding: '8px', borderRadius: '50%', border: 'none', color: '#7C3AED', cursor: 'pointer', background: 'rgba(124, 58, 237, 0.1)' }} onClick={() => navigate(`/schedule/${userId}`)}>
          <Calendar size={20} />
        </button>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#0d0d14' }}>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <span style={{ background: '#1a1a2e', color: '#94a3b8', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>Today</span>
        </div>
        
        {messages.map(msg => {
          const isSystem = msg.senderId === 'system';
          const isMe = msg.senderId === currentUser?.uid;
          
          if (isSystem) {
            return (
              <div key={msg.id} style={{ textAlign: 'center', margin: '8px 0' }}>
                <span style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', padding: '6px 16px', borderRadius: '16px', fontSize: '0.85rem', display: 'inline-block', maxWidth: '80%', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                  {msg.text}
                </span>
              </div>
            );
          }

          if (msg.type === 'session_request') {
            return (
              <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  background: '#13131f', 
                  border: '1px solid #7C3AED',
                  color: 'white',
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
                  width: '100%',
                  maxWidth: '320px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                    <Calendar size={20} color="#a78bfa" />
                    <span style={{ fontWeight: '600', color: '#a78bfa' }}>Session Request</span>
                  </div>
                  
                  <div style={{ fontSize: '0.95rem', marginBottom: '16px', lineHeight: '1.5' }}>
                    <strong>{msg.senderName}</strong> wants to schedule a session!
                  </div>
                  
                  <div style={{ background: '#0d0d14', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                      <span style={{ color: '#94a3b8', width: '60px', fontSize: '0.85rem' }}>Topic</span>
                      <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{msg.topic}</span>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                      <span style={{ color: '#94a3b8', width: '60px', fontSize: '0.85rem' }}>Date</span>
                      <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{msg.date}</span>
                    </div>
                    <div style={{ display: 'flex' }}>
                      <span style={{ color: '#94a3b8', width: '60px', fontSize: '0.85rem' }}>Time</span>
                      <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{msg.time}</span>
                    </div>
                  </div>

                  {!isMe && !msg.status && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleSessionAction(msg, 'accept')}
                          style={{ flex: 1, padding: '10px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Check size={16} /> Accept
                        </button>
                        <button 
                          onClick={() => handleSessionAction(msg, 'reject')}
                          style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <X size={16} /> Reject
                        </button>
                      </div>
                      <button 
                        onClick={() => handleSessionAction(msg, 'propose')}
                        style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: 'white', border: '1px solid #334155', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Clock size={16} /> Propose New Time
                      </button>
                    </div>
                  )}

                  {isMe && !msg.status && (
                    <div style={{ textAlign: 'center', color: '#a78bfa', fontSize: '0.85rem', padding: '8px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '8px' }}>
                      Waiting for response...
                    </div>
                  )}

                  {msg.status === 'accepted' && (
                    <div style={{ textAlign: 'center', color: '#10B981', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Check size={16} /> Accepted
                    </div>
                  )}

                  {msg.status === 'rejected' && (
                    <div style={{ textAlign: 'center', color: '#EF4444', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <X size={16} /> Declined
                    </div>
                  )}

                  {msg.status === 'proposed_new_time' && (
                    <div style={{ textAlign: 'center', color: '#F59E0B', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Clock size={16} /> Proposed New Time
                    </div>
                  )}

                </div>
                <div style={{ fontSize: '0.7rem', color: '#4a5568', marginTop: '4px', textAlign: isMe ? 'right' : 'left', width: '100%', maxWidth: '320px' }}>
                  {msg.time}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              <div style={{ 
                background: isMe ? '#7C3AED' : '#1a1a2e', 
                color: 'white',
                padding: '12px 16px',
                borderRadius: '16px',
                borderBottomRightRadius: isMe ? '4px' : '16px',
                borderBottomLeftRadius: !isMe ? '4px' : '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#4a5568', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                {msg.time}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '16px 20px', borderTop: '1px solid #1a1a2e', display: 'flex', gap: '12px', background: '#13131f' }}>
        <input 
          style={{ flex: 1, padding: '12px 16px', borderRadius: '9999px', border: '1px solid #1a1a2e', background: '#1a1a2e', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif' }}
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={e => e.target.style.borderColor = '#7C3AED'}
          onBlur={e => e.target.style.borderColor = '#1a1a2e'}
        />
        <button type="submit" style={{ width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 'none', cursor: 'pointer', background: input.trim() ? '#7C3AED' : '#1a1a2e', color: input.trim() ? 'white' : '#4a5568', transition: 'all 0.2s' }} disabled={!input.trim()}>
          <Send size={20} style={{ marginLeft: '2px' }} />
        </button>
      </form>
    </div>
  );
}

