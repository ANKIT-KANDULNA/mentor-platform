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
        flex: '0 0 45%',
        background: 'linear-gradient(145deg, #13082a 0%, #0f1f3d 40%, #0a1628 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px', position: 'relative', overflow: 'hidden',
        animation: 'slideInLeft 0.6s ease',
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(139,92,246,0.12)', top: '-100px', left: '-100px', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', bottom: '-80px', right: '-60px', filter: 'blur(60px)' }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '360px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 900, color: '#FFF',
              boxShadow: '0 0 24px rgba(139,92,246,0.5)',
            }}>M</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: '#FFF', letterSpacing: '-0.03em' }}>MentorMatch</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: '#FFF', lineHeight: 1.2, marginBottom: '16px' }}>
            Unlock Your
            <span style={{ display: 'block', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Full Potential</span>
            With Expert Mentors
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '40px' }}>
            Join thousands of students who accelerated their careers through 1:1 mentorship.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: <Users size={18} />, label: '10,000+ Students', color: 'var(--color-primary)' },
              { icon: <Star size={18} />, label: '500+ Expert Mentors', color: 'var(--color-secondary)' },
              { icon: <TrendingUp size={18} />, label: '4.9/5 Average Rating', color: 'var(--color-accent)' },
            ].map(({ icon, label, color }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                padding: '12px 16px', color: '#FFF', animation: `fadeInUp 0.5s ${0.2 + i * 0.1}s both`,
              }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Form */}
      <div style={{
        flex: 1, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', animation: 'slideInRight 0.6s ease',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>Welcome back!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>Sign in to continue your mentorship journey</p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.875rem', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="input-field" style={{ width: '100%', paddingLeft: '44px' }} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" className="input-field" style={{ width: '100%', paddingLeft: '44px' }} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px', fontSize: '1rem' }} disabled={loading}>
              {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            New to MentorMatch?{' '}
            <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create account</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
