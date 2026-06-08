import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { 
  LayoutDashboard, 
  Calculator, 
  Trophy, 
  ShoppingBag, 
  Sun, 
  Moon, 
  LogOut, 
  Grid,
  Flame
} from 'lucide-react';

interface NavbarProps {
  userPoints?: number;
  userStreak?: number;
}

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/calculator', label: 'Calculator', icon: Calculator },
  { path: '/gamification', label: 'Grid Challenges', icon: Trophy },
  { path: '/offset', label: 'Offsets', icon: ShoppingBag },
];

export default function Navbar({ userPoints = 0, userStreak = 0 }: NavbarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="nav-top-section">
        {/* Header Branding */}
        <div className="nav-logo">
          <div style={{
            background: 'var(--primary-glow)',
            color: 'var(--primary)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Grid size={22} />
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Zero<span style={{ color: 'var(--primary)' }}>Grid</span>
          </span>
        </div>

        {/* Navigation list */}
        <ul className="nav-links">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: isActive ? '#fff' : 'var(--text-main)',
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    boxShadow: isActive ? '0 4px 12px var(--primary-glow)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--border-color)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon size={18} />
                  <span className="nav-link-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="nav-controls">
        {/* Stats Widget */}
        {user && (
          <div className="navbar-stats" style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'var(--border-color)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}>
              <Trophy size={14} />
              <span>{userPoints} pts</span>
            </div>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)' }}>
              <Flame size={14} />
              <span>{userStreak} days</span>
            </div>
          </div>
        )}

        {/* Theme and Logout control */}
        <div style={{ display: 'flex', gap: '8px' }} className="nav-buttons">
          <button 
            onClick={toggleTheme}
            className="btn btn-secondary"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            style={{ flex: 1, padding: '8px', minWidth: '40px' }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button 
            onClick={logout}
            className="btn btn-secondary"
            aria-label="Logout"
            style={{ flex: 1, padding: '8px', minWidth: '40px', color: 'var(--danger)' }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '12px'
          }} className="nav-user-card">
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none',
              backgroundSize: 'cover'
            }}>
              {!user.avatarUrl && (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="nav-user-info">
              <span style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.displayName || 'Grid Member'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
