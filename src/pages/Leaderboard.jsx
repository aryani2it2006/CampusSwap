import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Award, Star } from 'lucide-react';

export default function Leaderboard() {
  const { users } = useData();
  const { currentUser } = useAuth();
  
  // Process users list to highlight the current user
  let allUsers = [...users];
  if (currentUser) {
    const existingIndex = allUsers.findIndex(u => u.id === currentUser.uid);
    if (existingIndex !== -1) {
      allUsers[existingIndex] = { 
        ...allUsers[existingIndex], 
        isMe: true, 
        name: allUsers[existingIndex].name + " (You)" 
      };
    } else {
      allUsers.push({
        id: currentUser.uid,
        name: currentUser.name + " (You)",
        branch: currentUser.branch,
        credits: currentUser.credits || 0,
        photoURL: currentUser.photoURL,
        isMe: true
      });
    }
  }

  // Sort by credits descending and take top 10
  const sortedUsers = allUsers.sort((a, b) => b.credits - a.credits).slice(0, 10);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px 0' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '80px', 
          height: '80px', 
          background: 'var(--accent-blue-bg)', 
          borderRadius: '50%',
          marginBottom: '16px'
        }}>
          <Trophy size={40} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Campus Top Mentors</h2>
        <p style={{ color: 'var(--text-muted)' }}>Earn credits by teaching to climb the ranks!</p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {sortedUsers.map((user, index) => {
          let RankIcon = null;
          if (index === 0) RankIcon = <Trophy size={20} style={{ color: '#F59E0B' }} />;
          else if (index === 1) RankIcon = <Medal size={20} style={{ color: '#94A3B8' }} />;
          else if (index === 2) RankIcon = <Award size={20} style={{ color: '#B45309' }} />;
          else RankIcon = <span style={{ fontWeight: '600', color: 'var(--text-muted)', width: '20px', textAlign: 'center' }}>{index + 1}</span>;

          return (
            <div 
              key={user.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '16px 20px',
                borderBottom: index < sortedUsers.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: user.isMe ? 'var(--accent-blue-bg)' : 'transparent'
              }}
            >
              <div style={{ width: '30px', display: 'flex', justifyContent: 'center', marginRight: '12px' }}>
                {RankIcon}
              </div>
              
              <img src={user.photoURL} alt={user.name} className="avatar" style={{ width: '45px', height: '45px', marginRight: '16px' }} />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontWeight: user.isMe ? '700' : '600', fontSize: '1.05rem', color: user.isMe ? 'var(--primary-dark)' : 'var(--text-main)' }}>
                    {user.name}
                  </div>
                  {user.rating >= 4.5 && user.reviews >= 5 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      <Star size={10} fill="#F59E0B" color="#F59E0B" /> Top Mentor
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.branch}</div>
              </div>
              
              <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.1rem' }}>
                {user.credits}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
