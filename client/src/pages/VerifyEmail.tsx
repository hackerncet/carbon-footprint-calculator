import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Mail, RefreshCw, LogOut, AlertCircle, CheckCircle, ExternalLink, ShieldAlert, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { formatAuthError } from '../utils/authErrors.ts';

export default function VerifyEmail() {
  const { user, logout, sendVerification, reloadUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheck = async () => {
    try {
      setError('');
      setChecking(true);
      await reloadUser();
      
      // Give feedback if they click it but are still not verified
      if (user && !user.emailVerified) {
        setError('Email not verified yet. Please click the link in your verification email and try again.');
      }
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setError('');
      setMessage('');
      setResending(true);
      await sendVerification();
      setMessage('Verification email sent! Please check your inbox (and spam folder).');
      setCooldown(60);
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--bg-app)',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      {/* Decorative Spheres */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)',
        top: '15%',
        left: '20%',
        filter: 'blur(40px)',
        zIndex: 1
      }}></div>

      <div className="card-glass animate-fade-in" style={{
        width: '100%',
        maxWidth: '500px',
        padding: '36px 28px',
        zIndex: 10,
        boxShadow: 'var(--shadow-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--primary)',
            padding: '16px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Mail size={40} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Confirm Your Email Address
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
            A confirmation link has been dispatched to <strong style={{ color: 'var(--text-main)' }}>{user?.email}</strong>. 
            Please click the verification link in that email to activate your account.
          </p>
          
          {/* Enhanced Alert Notice for Spam Folder */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '16px',
            width: '100%',
            display: 'flex',
            gap: '12px',
            textAlign: 'left',
            marginTop: '8px'
          }}>
            <ShieldAlert size={22} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                📧 Check Spam / Junk / Promotions Folder
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                If the verification email doesn't land in your inbox within 1-2 minutes, please search your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folders. Unverified sender subdomains are frequently misclassified by email security filters.
              </p>
            </div>
          </div>

          {/* Quick-links Grid to open Mail Web Apps */}
          <div style={{ width: '100%', marginTop: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
              Search in your webmail client:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <a 
                href="https://mail.google.com/mail/u/0/#search/ZeroGrid" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  background: 'rgba(234, 67, 53, 0.06)',
                  border: '1px solid rgba(234, 67, 53, 0.15)',
                  borderRadius: '8px',
                  color: '#ea4335',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Gmail <ExternalLink size={12} />
              </a>
              <a 
                href="https://outlook.live.com/mail/0/junkemail" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  background: 'rgba(0, 120, 215, 0.06)',
                  border: '1px solid rgba(0, 120, 215, 0.15)',
                  borderRadius: '8px',
                  color: '#0078d7',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Outlook <ExternalLink size={12} />
              </a>
              <a 
                href="https://mail.yahoo.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  background: 'rgba(96, 1, 219, 0.06)',
                  border: '1px solid rgba(96, 1, 219, 0.15)',
                  borderRadius: '8px',
                  color: '#6001db',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                Yahoo <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.08)',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.08)',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem'
            }}>
              <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{message}</span>
            </div>
          )}

          <button
            onClick={handleCheck}
            disabled={checking}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '46px',
              gap: '10px',
              fontSize: '0.95rem'
            }}
          >
            <RefreshCw size={18} className={checking ? 'animate-spin' : ''} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
            {checking ? 'Checking Status...' : 'I have verified my email'}
          </button>

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="btn btn-secondary"
            style={{
              width: '100%',
              height: '46px',
              fontSize: '0.95rem'
            }}
          >
            {cooldown > 0 
              ? `Resend Email in ${cooldown}s` 
              : resending 
                ? 'Sending Link...' 
                : 'Resend Verification Link'}
          </button>

          {/* Interactive Delivery Troubleshooting Accordion */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
            <button 
              type="button"
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <span>Experiencing issues? Inbox delivery guide</span>
              {showTroubleshooting ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showTroubleshooting && (
              <div className="animate-fade-in" style={{
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                textAlign: 'left',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: '1.45'
              }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--primary)', borderRadius: '6px' }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>1. Mark as 'Not Spam'</strong>
                  Locate the email in your Spam or Junk folder, open it, and select <strong>"Not Spam"</strong> (or drag it to your Primary Inbox). This trains your mail provider to trust future emails.
                </div>
                
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--primary)', borderRadius: '6px' }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>2. Add Sender to Contacts</strong>
                  Add our sending email address to your email contacts/address book to whitelist the sender.
                </div>
                
                <div style={{ padding: '12px', background: 'rgba(14, 165, 233, 0.05)', borderLeft: '3px solid var(--secondary)', borderRadius: '6px' }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>🌐 Admin: Deliver directly to Inbox</strong>
                  To force verification emails to land directly in users' Inbox / Important folder:
                  <ol style={{ marginLeft: '16px', marginTop: '6px', paddingLeft: '4px' }}>
                    <li style={{ marginBottom: '4px' }}>Go to Firebase Console &gt; Authentication &gt; Templates &gt; Custom Domain.</li>
                    <li style={{ marginBottom: '4px' }}>Add your custom domain: <strong>carbonfootprintcalculator.me</strong></li>
                    <li style={{ marginBottom: '4px' }}>Configure the generated <strong>SPF (TXT)</strong> and <strong>DKIM (TXT)</strong> DNS keys at your domain registrar.</li>
                    <li>Add a <strong>DMARC (TXT)</strong> record: <code>v=DMARC1; p=none; rua=mailto:dmarc@carbonfootprintcalculator.me</code></li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              width: '100%',
              height: '46px',
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              marginTop: '12px',
              fontSize: '0.95rem',
              gap: '10px'
            }}
          >
            <LogOut size={18} />
            Sign Out & Switch Account
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '0.72rem',
          marginTop: '24px',
          opacity: 0.8
        }}>
          <Lock size={12} style={{ color: 'var(--success)' }} />
          <span>SSL Secured official registration checkpoint</span>
        </div>
      </div>
    </div>
  );
}
