import React, { useState, lazy, Suspense, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import Navbar from './components/Navbar.tsx';
import './index.css';

// Lazy loading page chunks for performance bundle optimization
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Calculator = lazy(() => import('./pages/Calculator.tsx'));
const Gamification = lazy(() => import('./pages/Gamification.tsx'));
const OffsetMarketplace = lazy(() => import('./pages/OffsetMarketplace.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.tsx'));

const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>Loading section...</div>
  </div>
);

function App() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  const handleStatsUpdate = useCallback((pts: number, strk: number) => {
    setPoints(pts);
    setStreak(strk);
  }, []);

  if (!user) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Login />
      </Suspense>
    );
  }

  if (!user.emailVerified) {
    return (
      <Suspense fallback={<PageFallback />}>
        <VerifyEmail />
      </Suspense>
    );
  }

  return (
    <div className="app-container">
      {/* Keyboard Accessibility Skip-Link to bypass sidebar navigation loop */}
      <a 
        href="#main-content" 
        style={{
          position: 'absolute',
          top: '-100px',
          left: '20px',
          background: 'var(--primary)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 99999,
          fontWeight: 700,
          textDecoration: 'none',
          transition: 'top 0.2s ease',
          boxShadow: 'var(--shadow-md)'
        }}
        onFocus={(e) => e.currentTarget.style.top = '20px'}
        onBlur={(e) => e.currentTarget.style.top = '-100px'}
      >
        Skip to main content
      </a>

      <Navbar userPoints={points} userStreak={streak} />
      <main id="main-content" className="app-main">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard onStatsUpdate={handleStatsUpdate} />} />
            <Route path="/calculator" element={<Calculator onStatsUpdate={handleStatsUpdate} />} />
            <Route path="/gamification" element={<Gamification onStatsUpdate={handleStatsUpdate} />} />
            <Route path="/offset" element={<OffsetMarketplace onStatsUpdate={handleStatsUpdate} />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <App />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
