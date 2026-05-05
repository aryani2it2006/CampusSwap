import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { ThemeProvider } from './context/ThemeContext';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Matches from './pages/Matches';
import ChatList from './pages/ChatList';
import Chat from './pages/Chat';
import Schedule from './pages/Schedule';
import Leaderboard from './pages/Leaderboard';
import Sessions from './pages/Sessions';

// Components
import TopNav from './components/TopNav';
import BottomNav from './components/BottomNav';

function AppLayout({ children }) {
  const { currentUser, toastMessage } = useAuth();
  const location = useLocation();
  
  const isAuthPage = location.pathname === '/login';
  const isChatPage = location.pathname.startsWith('/chat/');
  
  if (!currentUser && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser && isAuthPage) {
    return <Navigate to="/" replace />;
  }

  if (isAuthPage) return children;

  return (
    <div className="app-container">
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}
      {!isChatPage && <TopNav />}
      <div className="page-content" style={{ paddingBottom: isChatPage ? '0' : '90px', paddingTop: isChatPage ? '0' : '80px' }}>
        {children}
      </div>
      {!isChatPage && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<PublicProfile />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/chat" element={<ChatList />} />
                <Route path="/chat/:userId" element={<Chat />} />
                <Route path="/schedule/:userId" element={<Schedule />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
