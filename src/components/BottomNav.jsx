import { Link, useLocation } from 'react-router-dom';
import { Home, Users, User, Trophy, MessageCircle, Calendar } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="bottom-nav">
      <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
        <Home size={24} />
        <span>Feed</span>
      </Link>
      <Link to="/matches" className={`nav-item ${path === '/matches' ? 'active' : ''}`}>
        <Users size={24} />
        <span>Matches</span>
      </Link>
      <Link to="/sessions" className={`nav-item ${path === '/sessions' ? 'active' : ''}`}>
        <Calendar size={24} />
        <span>Sessions</span>
      </Link>
      <Link to="/chat" className={`nav-item ${path.startsWith('/chat') ? 'active' : ''}`}>
        <MessageCircle size={24} />
        <span>Chat</span>
      </Link>
      <Link to="/leaderboard" className={`nav-item ${path === '/leaderboard' ? 'active' : ''}`}>
        <Trophy size={24} />
        <span>Rank</span>
      </Link>
      <Link to="/profile" className={`nav-item ${path === '/profile' ? 'active' : ''}`}>
        <User size={24} />
        <span>Profile</span>
      </Link>
    </div>
  );
}
