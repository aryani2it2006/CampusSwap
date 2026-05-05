import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Search, ArrowRight, Star, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getColor = (name) => {
  if (!name) return colors[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const formatText = (text) => {
  if (!text) return '';
  if (text.toLowerCase() === 'it') return 'IT';
  return text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const getMatchPercentage = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return 0;
  
  const myWants = currentUser.wants || [];
  const myTeaches = currentUser.teaches || [];
  const theirWants = targetUser.wants || [];
  const theirTeaches = targetUser.teaches || [];
  
  let matchScore = 0;
  let totalScorePossible = Math.max(1, myWants.length + myTeaches.length);
  
  const learningMatch = myWants.filter(skill => theirTeaches.includes(skill)).length;
  const teachingMatch = myTeaches.filter(skill => theirWants.includes(skill)).length;
  
  matchScore = learningMatch + teachingMatch;
  if (matchScore === 0) return 0;
  
  let percentage = Math.round((matchScore / totalScorePossible) * 100);
  return percentage > 100 ? 100 : percentage;
};

export default function Home() {
  const { users } = useData();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Filter out current user and apply search
  const filteredUsers = users.filter(user => {
    if (user.id === currentUser?.uid) return false;
    if (!search) return true;
    
    const searchTerm = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchTerm) ||
      user.teaches.some(skill => skill.toLowerCase().includes(searchTerm)) ||
      user.wants.some(skill => skill.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <div>
      <div style={{ position: 'sticky', top: '0', backgroundColor: 'var(--bg-color)', zIndex: 10, paddingBottom: '16px', paddingTop: '8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
          <input 
            className="input-field" 
            style={{ paddingLeft: '40px', borderRadius: 'var(--radius-full)' }}
            placeholder="Search by skill or name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--card-bg)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
            Hello, {currentUser?.name && currentUser.name !== 'New Student' ? currentUser.name.split(' ')[0] : 'Student'} 👋
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ready to swap skills today?</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(124, 58, 237, 0.15)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #7C3AED' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa' }}>
            🪙 {currentUser?.credits || 0}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Credits</div>
        </div>
      </div>

      <div className="feed-grid" style={{ paddingBottom: '20px' }}>
        {filteredUsers.map(user => {
          const matchScore = getMatchPercentage(currentUser, user);
          const bgColor = getColor(user.name);
          
          return (
            <div key={user.id} className="card" style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(124, 58, 237, 0.15)',
                color: '#a78bfa',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontWeight: '700',
                fontSize: '0.8rem',
                border: '1px solid rgba(124, 58, 237, 0.3)'
              }}>
                Match {matchScore}%
              </div>
              
              <div className="card-header" style={{ alignItems: 'flex-start' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: bgColor,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  {getInitials(user.name)}
                </div>
                
                <div className="user-info" style={{ marginTop: '2px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '2px', display: 'flex', alignItems: 'center' }}>
                    {user.name}
                    {user.rating >= 4.5 && user.reviews >= 10 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', padding: '2px 6px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: '700', marginLeft: '8px', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                        <Award size={12} /> Top Mentor
                      </div>
                    )}
                  </h3>
                  <div className="user-meta" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {formatText(user.college)} {user.branch && `• ${formatText(user.branch)}`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600' }}>
                    <Star size={14} fill="#F59E0B" color="#F59E0B" />
                    <span>{user.rating?.toFixed(1) || '0.0'}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '2px' }}>({user.reviews || 0} reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="tags-section" style={{ marginTop: '20px' }}>
                <div className="tags-title" style={{ fontSize: '0.75rem' }}>Can Teach</div>
                <div className="tags-container">
                  {user.teaches.map(skill => (
                    <span key={skill} className="tag tag-teach" style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}>{skill}</span>
                  ))}
                </div>
              </div>
              
              <div className="tags-section">
                <div className="tags-title" style={{ fontSize: '0.75rem' }}>Wants to Learn</div>
                <div className="tags-container">
                  {user.wants.map(skill => (
                    <span key={skill} className="tag tag-learn" style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}>{skill}</span>
                  ))}
                </div>
              </div>
              
              <div style={{ marginTop: '24px' }}>
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '1rem' }}
                  onClick={() => navigate(`/chat/${user.id}`)}
                >
                  Connect <ArrowRight size={18} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center" style={{ padding: '40px 20px', color: 'var(--text-muted)' }}>
            <p>{search ? 'No students found matching your search.' : 'No students found yet. Invite your friends to join CampusSwap!'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
