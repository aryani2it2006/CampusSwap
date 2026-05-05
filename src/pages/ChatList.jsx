import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { MessageCircle } from 'lucide-react';

export default function ChatList() {
  const { currentUser } = useAuth();
  const { users } = useData();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const partnerId = data.participants.find(id => id !== currentUser.uid);
        const partner = users.find(u => u.uid === partnerId || u.id === partnerId) || {};
        
        return {
          id: doc.id,
          ...data,
          partner,
          unread: data[`unread_${currentUser.uid}`] || 0,
          updatedAtMs: data.updatedAt?.toMillis() || 0
        };
      });

      chatsData.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, users]);

  const formatTime = (ms) => {
    if (!ms) return '';
    const date = new Date(ms);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Messages</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 20px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--card-bg)', padding: '16px', borderRadius: '16px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-secondary)' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ width: '120px', height: '16px', background: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div style={{ width: '200px', height: '12px', background: 'var(--bg-secondary)', borderRadius: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Messages</h2>
      
      {chats.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 20px' }}>
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => navigate(`/chat/${chat.partner.id || chat.partner.uid}`)}
              style={{ 
                display: 'flex', 
                gap: '16px', 
                alignItems: 'center', 
                background: 'var(--card-bg)', 
                padding: '16px', 
                borderRadius: '16px',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position: 'relative' }}>
                <img src={chat.partner.photoURL || 'https://via.placeholder.com/150'} alt={chat.partner.name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                {chat.unread > 0 && (
                  <div style={{ position: 'absolute', top: -2, right: -2, background: '#7C3AED', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card-bg)' }}>
                    {chat.unread}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '600', fontSize: '1.05rem', color: chat.unread > 0 ? 'white' : 'var(--text-main)' }}>
                    {chat.partner.name || 'Unknown User'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: chat.unread > 0 ? '#7C3AED' : 'var(--text-muted)', fontWeight: chat.unread > 0 ? '600' : 'normal', whiteSpace: 'nowrap' }}>
                    {formatTime(chat.updatedAtMs)}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {chat.partner.college || 'College'} • {chat.partner.branch || 'Branch'}
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: chat.unread > 0 ? 'var(--text-main)' : 'var(--text-muted)',
                  fontWeight: chat.unread > 0 ? '500' : 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {chat.lastMessage?.length > 40 ? chat.lastMessage.substring(0, 40) + '...' : chat.lastMessage || 'Sent a message'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <MessageCircle size={32} color="#7C3AED" />
          </div>
          <h3 style={{ color: 'white', marginBottom: '8px' }}>No chats yet 💬</h3>
          <p style={{ maxWidth: '250px', lineHeight: '1.5' }}>Match with someone and start swapping skills!</p>
          <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/matches')}>
            Find Matches
          </button>
        </div>
      )}
    </div>
  );
}
