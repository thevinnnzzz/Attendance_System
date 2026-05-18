import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully');
    } catch (err: any) {
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        toast.error('Invalid email or password');
      } else {
        toast.error(err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #0d1117;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(180, 150, 80, 0.12) 0%, transparent 70%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
        }

        .login-panel {
          width: 100%;
          max-width: 440px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .login-panel.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        .login-card {
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(201, 168, 76, 0.18);
          border-radius: 20px;
          padding: 3rem 2.5rem 2.5rem;
          backdrop-filter: blur(16px);
          position: relative;
          overflow: hidden;
        }

        .login-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(201, 168, 76, 0.07) 0%, transparent 50%);
          pointer-events: none;
        }

        .crest {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 2rem;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.6s 0.2s ease, transform 0.6s 0.2s ease;
        }

        .login-panel.mounted .crest {
          opacity: 1;
          transform: translateY(0);
        }

        .crest-icon {
          width: 52px;
          height: 52px;
          border: 1.5px solid rgba(201, 168, 76, 0.5);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(201, 168, 76, 0.08);
          margin-bottom: 4px;
        }

        .crest-icon svg {
          width: 26px;
          height: 26px;
          color: #c9a84c;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .login-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 500;
          color: #f0e9d2;
          letter-spacing: 0.01em;
          line-height: 1.15;
          text-align: center;
        }

        .login-subtitle {
          font-size: 0.8rem;
          font-weight: 400;
          color: rgba(201, 168, 76, 0.7);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-align: center;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 2rem;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(201, 168, 76, 0.15);
        }

        .divider-diamond {
          width: 5px;
          height: 5px;
          background: rgba(201, 168, 76, 0.4);
          transform: rotate(45deg);
          flex-shrink: 0;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 1.75rem;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.6s 0.35s ease, transform 0.6s 0.35s ease;
        }

        .login-panel.mounted .field-group {
          opacity: 1;
          transform: translateY(0);
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(240, 233, 210, 0.55);
        }

        .field-wrap {
          position: relative;
        }

        .field-input {
          width: 100%;
          height: 48px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(201, 168, 76, 0.15);
          border-radius: 10px;
          padding: 0 14px 0 40px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #f0e9d2;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .field-input::placeholder {
          color: rgba(240, 233, 210, 0.2);
        }

        .field-input:hover {
          border-color: rgba(201, 168, 76, 0.3);
          background: rgba(255, 255, 255, 0.06);
        }

        .field-input:focus {
          border-color: rgba(201, 168, 76, 0.55);
          background: rgba(201, 168, 76, 0.05);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.08);
        }

        .field-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          width: 17px;
          height: 17px;
          color: rgba(201, 168, 76, 0.45);
          pointer-events: none;
        }

        .field-icon svg {
          width: 100%;
          height: 100%;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(240, 233, 210, 0.3);
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .toggle-btn:hover {
          color: rgba(201, 168, 76, 0.7);
        }

        .toggle-btn svg {
          width: 17px;
          height: 17px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .password-input {
          padding-right: 42px;
        }

        .submit-btn {
          width: 100%;
          height: 50px;
          background: linear-gradient(135deg, #c9a84c 0%, #a8883a 100%);
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1a1306;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
          opacity: 0;
          animation: fadeUp 0.5s 0.5s forwards;
        }

        @keyframes fadeUp {
          to { opacity: 1; }
        }

        .submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          pointer-events: none;
        }

        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 24px rgba(201, 168, 76, 0.25);
          transform: translateY(-1px);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        .submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(26, 19, 6, 0.3);
          border-top-color: #1a1306;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .footer-note {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.75rem;
          color: rgba(240, 233, 210, 0.22);
          letter-spacing: 0.04em;
          opacity: 0;
          animation: fadeUp 0.5s 0.65s forwards;
        }

        .footer-note span {
          color: rgba(201, 168, 76, 0.45);
        }
      `}</style>

      <div className="login-root">
        <div className={`login-panel${mounted ? ' mounted' : ''}`}>
          <div className="login-card">

            {/* Header */}
            <div className="crest">
              <div className="crest-icon">
                {/* Mortarboard / school icon */}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3L1 9l11 6 9-4.91V17M5 13.07V19l7 3 7-3v-5.93"/>
                </svg>
              </div>
              <h1 className="login-title">EduTrack</h1>
              <p className="login-subtitle">Attendance System</p>
            </div>

            <div className="divider">
              <div className="divider-line" />
              <div className="divider-diamond" />
              <div className="divider-line" />
            </div>

            <form onSubmit={handleLogin}>
              <div className="field-group">
                {/* Email */}
                <div className="field">
                  <label className="field-label" htmlFor="email">Email Address</label>
                  <div className="field-wrap">
                    <span className="field-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                      </svg>
                    </span>
                    <input
                      id="email"
                      className="field-input"
                      type="email"
                      placeholder="admin@school.edu"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="field">
                  <label className="field-label" htmlFor="password">Password</label>
                  <div className="field-wrap">
                    <span className="field-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      id="password"
                      className={`field-input password-input`}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-btn"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Signing In…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="footer-note">
              Secure access for <span>authorized personnel only</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}