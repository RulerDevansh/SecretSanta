import { useEffect, useState } from 'react';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import { authApi } from './api/client';
import loginBg from './assets/login-bg.jpg';
import dashboardBg from './assets/dashboard-bg.jpg';
import mobileBg from './assets/mobile.jpg';

const TOKEN_KEY = 'secret-santa-token';
const USER_KEY = 'secret-santa-user';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const { user: profile } = await authApi.me(token);
        setUser((prev) => {
          const mergedUser = { ...(prev || {}), ...profile };
          localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
          return mergedUser;
        });
      } catch (err) {
        console.error('Session check failed', err);
        setError('Session expired. Please sign in again.');
        handleLogout();
      } finally {
        setChecking(false);
      }
    };

    verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleAuthSuccess = ({ token: apiToken, user: apiUser }) => {
    localStorage.setItem(TOKEN_KEY, apiToken);
    localStorage.setItem(USER_KEY, JSON.stringify(apiUser));
    setToken(apiToken);
    setUser(apiUser);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setError('');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-holly-50 text-holly-700">
        <p>Loading your workshop...</p>
      </div>
    );
  }

  const isAuthenticated = Boolean(token && user);

  return (
    <div className="min-h-screen relative">
      {/* Full-viewport background layer so it always shows behind content */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${isMobile ? mobileBg : isAuthenticated ? dashboardBg : loginBg})` }}
      />
      {error && <p className="bg-red-100 text-red-700 px-4 py-2 text-center">{error}</p>}
      {isAuthenticated ? (
        <div className="min-h-screen">
          <DashboardView token={token} user={user} onLogout={handleLogout} />
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center md:justify-start bg-holly-900/20">
          <AuthView onAuthSuccess={handleAuthSuccess} />
        </div>
      )}
    </div>
  );
}

export default App;
