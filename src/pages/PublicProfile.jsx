import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Star, Award, MessageCircle, Calendar } from 'lucide-react';

export default function PublicProfile() {
  const { userId } = useParams();
  const { users, sessions } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const user = users.find(u => u.uid === userId || u.id === userId);

  if (!user) {
    return (
      <div className="card text-center" style={{ padding: '40px 20px' }}>
        <h3>User not found</h3>
        <button className="btn btn-primary" onClick={() => navigate(-1)} style={{ marginTop: '16px', width: 'auto' }}>Go Back</button>
      </div>
    );
  }

  const isMe = currentUser?.uid === user.id || currentUser?.uid === user.uid;

  // calculate completed sessions count
  const completedSessions = sessions.filter(s => 
    (s.teacherId === user.uid || s.studentId === user.uid) && s.status === 'completed'
  ).length;

  const formatText = (text) => {
    if (!text) return '';
    if (text.toLowerCase() === 'it') return 'IT';
    return text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div>
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '24px', padding: '6px 12px' }} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 20px', position: 'relative' }}>
        <img src={user.photoURL || '/default-avatar.png'} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '4px solid var(--card-bg)', boxShadow: '0 0 0 2px var(--primary)' }} />
        
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {user.name}
          {user.reviews >= 5 && user.rating >= 4.5 && (
            <span style={{ background: '#FEF08A', color: '#B45309', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #F59E0B' }}>
              <Award size={12} /> Top Mentor
            </span>
          )}
        </h2>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '24px' }}>
          {formatText(user.college)} {user.branch && `• ${formatText(user.branch)}`} {user.year && `• ${user.year}`}
        </p>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', background: 'var(--bg-color)', padding: '16px 32px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <Star size={18} fill="#F59E0B" color="#F59E0B" /> {user.rating?.toFixed(1) || '0.0'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rating</span>
          </div>
          <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{user.reviews || 0}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reviews</span>
          </div>
          <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{completedSessions}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sessions</span>
          </div>
        </div>

        {user.bio && (
          <div style={{ marginBottom: '32px', maxWidth: '600px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            "{user.bio}"
          </div>
        )}

        <div style={{ width: '100%', maxWidth: '600px', textAlign: 'left', background: 'var(--bg-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div className="tags-section">
            <div className="tags-title">Can Teach</div>
            <div className="tags-container">
              {user.teaches?.map(skill => (
                <span key={skill} className="tag tag-teach">{skill}</span>
              ))}
              {(!user.teaches || user.teaches.length === 0) && <span className="text-muted">No skills listed</span>}
            </div>
          </div>
          
          <div className="tags-section" style={{ marginTop: '24px', marginBottom: '0' }}>
            <div className="tags-title">Wants to Learn</div>
            <div className="tags-container">
              {user.wants?.map(skill => (
                <span key={skill} className="tag tag-learn">{skill}</span>
              ))}
              {(!user.wants || user.wants.length === 0) && <span className="text-muted">No skills listed</span>}
            </div>
          </div>
        </div>

        {!isMe && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '40px', width: '100%', maxWidth: '400px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(`/chat/${user.id}`)}>
              <MessageCircle size={18} /> Chat
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/schedule/${user.id}`)}>
              <Calendar size={18} /> Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
