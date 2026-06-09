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

/** Shared loading fallback for lazily-loaded page chunks. */
const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }} role="status">Loading section...</div>
  </div>
);

/**
 * Root application component.
 * Manages authentication gating, gamification state propagation,
 * and page-level routing with code-split lazy loading.
 */
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
      {/* Keyboard Accessibility Skip-Link — uses CSS class instead of inline styles */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar userPoints={points} userStreak={streak} />
      <main id="main-content" className="app-main">
        {/* Live region for route change announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="route-announcer" />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard onStatsUpdate={handleStatsUpdate} />} />
            <Route path="/dashboard" element={<Dashboard onStatsUpdate={handleStatsUpdate} />} />
            <Route path="/calculator" element={<Calculator onStatsUpdate={handleStatsUpdate} />} />
            <Route path="/gamification" element={<Gamification onStatsUpdate={handleStatsUpdate} />} />
            <Route path="/offset" element={<OffsetMarketplace onStatsUpdate={handleStatsUpdate} />} />
            <Route path="*" element={<Dashboard onStatsUpdate={handleStatsUpdate} />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// Safe root element access with null check
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in the DOM.');
}

ReactDOM.createRoot(rootElement).render(
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
