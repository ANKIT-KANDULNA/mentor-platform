import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock, TrendingUp, Users, Star, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
      {/* LEFT PANEL */}
      <div style={{
        width: '45%',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(5, 150, 105, 0.03) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        borderRight: '1px solid var(--border-color)'
      }}>
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div className="avatar" style={{
              width: '48px', height: '48px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
            }}>M</div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>MentorMatch</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '16px' }}>
            Unlock Your
            <span style={{ display: 'block', color: 'var(--color-primary)' }}>Full Potential</span>
            With Expert Mentors
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '40px' }}>
            Join thousands of students who accelerated their careers through 1:1 mentorship.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: <Users size={18} />, label: '10,000+ Students', color: 'var(--status-success)' },
              { icon: <Star size={18} />, label: '500+ Expert Mentors', color: 'var(--color-primary)' },
              { icon: <TrendingUp size={18} />, label: '4.9/5 Average Rating', color: 'var(--color-rating)' },
            ].map(({ icon, label, color }, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: 'var(--bg-card)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                animation: `fadeInUp 0.5s ${0.2 + i * 0.1}s both`
              }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Form */}
      <div style={{
        flex: 1, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '2rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Welcome back!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', fontFamily: 'var(--font-sans)' }}>Sign in to continue your mentorship journey</p>

          {error && (
            <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: '10px', padding: '12px 16px', color: 'var(--status-danger)', fontSize: '0.875rem', marginBottom: '20px', fontFamily: 'var(--font-sans)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="input-field" style={{ width: '100%', paddingLeft: '44px' }} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" className="input-field" style={{ width: '100%', paddingLeft: '44px' }} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px', fontSize: '1rem' }} disabled={loading}>
              {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }}>
            New to MentorMatch?{' '}
            <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
