import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Coins, LogOut, Home, Users, MessageCircle, Trophy, User, Bell, Calendar, UserPlus, CheckCircle, Star, Flame } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import QuickMatch from './QuickMatch';

export default function TopNav() {
  const { currentUser, logout } = useAuth();
  const { notifications, markAllNotificationsRead } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showQuickMatch, setShowQuickMatch] = useState(false);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'connection_request': return <UserPlus size={18} color="#3B82F6" />;
      case 'connection_accepted': return <CheckCircle size={18} color="#10B981" />;
      case 'session_request': return <Calendar size={18} color="#F59E0B" />;
      case 'session_confirmed': return <CheckCircle size={18} color="#10B981" />;
      case 'feedback': return <Star size={18} fill="#F59E0B" color="#F59E0B" />;
      case 'credits': return <Coins size={18} color="#8B5CF6" />;
      case 'streak': return <Flame size={18} color="#EF4444" />;
      default: return <Bell size={18} color="var(--primary)" />;
    }
  };

  return (
    <div className="top-nav">
      <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
        <Logo size={32} showText={true} />
      </Link>
      
      <div className="desktop-nav-links">
        <Link to="/" className={path === '/' ? 'active' : ''}><Home size={18} /> Feed</Link>
        <Link to="/matches" className={path === '/matches' ? 'active' : ''}><Users size={18} /> Matches</Link>
        <Link to="/sessions" className={path === '/sessions' ? 'active' : ''}><Calendar size={18} /> Sessions</Link>
        <Link to="/chat" className={path.startsWith('/chat') ? 'active' : ''}><MessageCircle size={18} /> Chat</Link>
        <Link to="/leaderboard" className={path === '/leaderboard' ? 'active' : ''}><Trophy size={18} /> Rank</Link>
        <Link to="/profile" className={path === '/profile' ? 'active' : ''}><User size={18} /> Profile</Link>
      </div>
      
      <div className="nav-actions">
        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', width: 'auto' }} onClick={() => setShowQuickMatch(true)}>
          Quick Match ⚡
        </button>
        <div style={{ position: 'relative' }}>
          <button 
            className="btn-outline" 
            style={{ padding: '6px', borderRadius: '50%', border: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: showNotifications ? 'rgba(124,58,237,0.1)' : 'transparent' }}
            onClick={() => {
              setShowNotifications(!showNotifications);
            }}
          >
            <Bell size={20} color={showNotifications ? 'var(--primary)' : 'currentColor'} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '2px', right: '2px', width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', border: '2px solid var(--card-bg)' }}></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown" style={{ width: '350px', maxHeight: '400px', overflowY: 'auto' }}>
              <div className="notification-header flex-between" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 2 }}>
                <span style={{ fontWeight: 'bold' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllNotificationsRead} style={{ background: 'transparent', color: 'var(--primary)', border: 'none', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div>
                {notifications?.length > 0 ? notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className="notification-item" 
                    style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', background: notif.read ? 'transparent' : 'rgba(124,58,237,0.05)', cursor: notif.link ? 'pointer' : 'default', transition: 'background 0.2s' }}
                    onClick={() => {
                      if (notif.link) navigate(notif.link);
                      setShowNotifications(false);
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>{getIconForType(notif.type)}</div>
                    <div style={{ flex: 1 }}>
                      <div className="notification-text" style={{ fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-main)', lineHeight: '1.4' }}>{notif.text}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getTimeAgo(notif.timestamp)}</div>
                    </div>
                    {!notif.read && <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', alignSelf: 'center' }}></div>}
                  </div>
                )) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Bell size={32} style={{ opacity: 0.2, margin: '0 auto 12px auto' }} />
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="credit-badge" style={{ fontSize: '0.95rem', background: 'rgba(124,58,237,0.15)', color: '#7C3AED', border: '1px solid #7C3AED', padding: '4px 12px' }}>
          🪙 {currentUser?.credits || 0}
        </div>
        <button onClick={() => setShowLogoutModal(true)} className="btn-outline" style={{ padding: '6px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogOut size={20} />
        </button>
      </div>

      {showLogoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(124, 58, 237, 0.4)', borderRadius: 'var(--radius-lg)', padding: '32px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 0 30px rgba(124, 58, 237, 0.2)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white', fontFamily: 'Outfit, sans-serif' }}>Leaving so soon? 👋</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.05rem', lineHeight: '1.5' }}>Are you sure you want to log out of CampusSwap?</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setShowLogoutModal(false)} className="btn btn-outline" style={{ flex: 1, padding: '12px' }}>
                Cancel
              </button>
              <button onClick={logout} className="btn" style={{ flex: 1, padding: '12px', background: '#e11d48', color: 'white', border: 'none' }}>
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showQuickMatch && <QuickMatch onClose={() => setShowQuickMatch(false)} />}
    </div>
  );
}
