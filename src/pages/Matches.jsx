import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Calendar, Star, Award, Zap, Clock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const formatText = (text) => {
  if (!text) return '';
  if (text.toLowerCase() === 'it') return 'IT';
  return text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function Matches() {
  const { users, sessions } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('matches');

  // Filter and sort matches by percentage
  const matches = users
    .filter(user => user.id !== currentUser?.uid)
    .map(user => ({
      ...user,
      matchScore: getMatchPercentage(currentUser, user)
    }))
    .filter(user => user.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  // Sent requests from sessions
  const sentRequests = sessions.filter(s => s.requestedBy === currentUser?.uid);

  return (
    <div>
      <style>{`
        .premium-match-card {
          display: flex;
          background: #13131f;
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        .premium-match-card:hover {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 15px rgba(124, 58, 237, 0.3);
          transform: translateY(-2px);
        }
        .match-divider {
          border-right: 1px solid rgba(255,255,255,0.05);
          padding-right: 24px;
        }
        @media (max-width: 768px) {
          .premium-match-card {
            flex-direction: column;
            gap: 20px;
          }
          .match-divider {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-right: 0;
            padding-bottom: 20px;
          }
        }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <h2 className="page-title" style={{ marginBottom: '4px' }}>Your Matches ✨</h2>
        <p style={{ color: 'var(--text-muted)' }}>{matches.length} people are ready to swap skills with you</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '12px' }}>
        <button 
          onClick={() => setActiveTab('matches')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'matches' ? 'var(--primary)' : 'transparent', color: activeTab === 'matches' ? 'white' : 'var(--text-muted)', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          Skill Matches
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'requests' ? 'var(--primary)' : 'transparent', color: activeTab === 'requests' ? 'white' : 'var(--text-muted)', fontWeight: '600', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          Sent Requests
        </button>
      </div>

      {activeTab === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {matches.length === 0 ? (
            <div className="card text-center" style={{ padding: '60px 20px', border: '1px dashed rgba(124,58,237,0.3)' }}>
              <Zap size={48} style={{ color: 'var(--border-color)', margin: '0 auto 16px auto' }} />
              <h3 style={{ marginBottom: '12px', fontSize: '1.3rem' }}>No matches yet!</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                Complete your profile and add more skills to get matched 🎯
              </p>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => navigate('/profile')}>
                Update Skills <ArrowRight size={16} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          ) : (
            matches.map(match => {
              // Priority finding the overlapping skills for display
              const iLearn = currentUser?.wants.find(skill => match.teaches.includes(skill)) || match.teaches[0] || 'a skill';
              const iTeach = currentUser?.teaches.find(skill => match.wants.includes(skill)) || currentUser?.teaches[0] || 'a skill';
              
              return (
                <div key={match.id} className="premium-match-card">
                  {/* LEFT SIDE: User Info */}
                  <div className="match-divider" style={{ flex: '1', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={match.photoURL || '/default-avatar.png'} style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', background: '#10B981', border: '2px solid #13131f', borderRadius: '50%' }}></div>
                    </div>
                    <div>
                      <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {match.name} 
                        {match.reviews >= 5 && match.rating >= 4.5 && (
                           <span style={{ background: '#FEF08A', color: '#B45309', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #F59E0B' }}>
                             <Award size={10} /> Top Mentor
                           </span>
                        )}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                        {formatText(match.college)} • {formatText(match.branch)} • {match.year}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.85rem' }}>
                        <Star size={14} fill="#F59E0B" color="#F59E0B" />
                        <span style={{ color: 'white', fontWeight: '600' }}>{match.rating?.toFixed(1) || '0.0'}</span>
                        <span style={{ color: 'var(--text-muted)' }}>({match.reviews || 0} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {/* MIDDLE: Match Info */}
                  <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 16px' }}>
                     <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 0 10px rgba(124,58,237,0.2)' }}>
                        {match.matchScore}% Match 🎯
                     </div>
                     
                     <div style={{ marginTop: '16px', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span>You teach <span style={{ color: '#a78bfa' }}>{iTeach}</span></span>
                       <Zap size={16} color="#a78bfa" />
                       <span>They teach <span style={{ color: '#a78bfa' }}>{iLearn}</span></span>
                     </div>
                     
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '80%' }}>
                       You know {iTeach} they want • They know {iLearn} you want
                     </div>
                  </div>

                  {/* RIGHT SIDE: Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', minWidth: '160px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '24px' }}>
                     <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => navigate(`/chat/${match.id}`)}>
                       <MessageCircle size={16} /> Chat
                     </button>
                     <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => navigate(`/schedule/${match.id}`)}>
                       <Calendar size={16} /> Schedule
                     </button>
                     <button style={{ background: 'transparent', color: 'var(--text-muted)', padding: '8px', fontSize: '0.85rem', border: 'none', cursor: 'pointer', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onMouseOver={e => e.currentTarget.style.color='white'} onMouseOut={e => e.currentTarget.style.color='var(--text-muted)'} onClick={() => navigate(`/profile/${match.id}`)}>
                       <User size={14} /> View Profile
                     </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sentRequests.length === 0 ? (
            <div className="card text-center" style={{ padding: '40px 20px' }}>
              <Clock size={48} style={{ color: 'var(--border-color)', margin: '0 auto 16px auto' }} />
              <h3 style={{ marginBottom: '8px' }}>No sent requests</h3>
              <p style={{ color: 'var(--text-muted)' }}>You haven't requested to connect with anyone yet.</p>
            </div>
          ) : (
            sentRequests.map(req => {
              // the partner is the person they requested (since requestedBy === currentUser.uid)
              // We need to figure out who the other person is based on studentId/teacherId
              const partnerId = req.studentId === currentUser.uid ? req.teacherId : req.studentId;
              const partner = users.find(u => u.uid === partnerId);
              
              if (!partner) return null;

              let statusBadge = null;
              if (req.status === 'pending') statusBadge = <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pending ⏳</span>;
              else if (req.status === 'confirmed') statusBadge = <span style={{ background: '#D1FAE5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Accepted ✅</span>;
              else if (req.status === 'declined') statusBadge = <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>Declined ❌</span>;
              else statusBadge = <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{req.status}</span>;

              return (
                <div key={req.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={partner.photoURL || '/default-avatar.png'} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ fontSize: '1.05rem', marginBottom: '2px' }}>{partner.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Requested swap for {req.skill}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {statusBadge}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.date || 'Recent'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
