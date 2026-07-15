import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock, User, Loader2, GraduationCap, Briefcase } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(fullName, email, password, role);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
      {/* LEFT PANEL */}
      <div className="auth-left-panel">
        <div className="auth-orb-1" style={{ top: '-80px', right: '-80px', left: 'auto' }} />
        <div className="auth-orb-2" style={{ bottom: '-60px', left: '-60px', right: 'auto' }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '360px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div className="avatar" style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, boxShadow: '0 0 24px rgba(5,150,105,0.4)' }}>M</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: '#FFF', letterSpacing: '-0.03em' }}>MentorMatch</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#FFF', lineHeight: 1.2, marginBottom: '16px' }}>
            Start Your
            <span style={{ display: 'block', color: '#34D399' }}>Growth Journey</span>
            Today
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.6 }}>Whether you are a student looking for guidance or an expert ready to teach — we have a place for you.</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', overflowY: 'auto', animation: 'slideInRight 0.6s ease' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>Join MentorMatch and unlock your potential</p>

          {/* Role Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label className="input-label" style={{ display: 'block', marginBottom: '10px' }}>I am joining as...</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { value: 'STUDENT', label: 'Student', sub: 'Find mentors & book sessions', icon: <GraduationCap size={24} /> },
                { value: 'MENTOR', label: 'Mentor', sub: 'Share knowledge & earn', icon: <Briefcase size={24} /> },
              ].map(({ value, label, sub, icon }) => (
                <button key={value} type="button" onClick={() => setRole(value)} style={{
                  padding: '16px', borderRadius: '12px', border: `2px solid ${role === value ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  background: role === value ? 'var(--color-primary-glow)' : 'var(--bg-surface)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  boxShadow: role === value ? '0 0 0 3px var(--color-primary-soft)' : 'var(--shadow-sm)',
                }}>
                  <span style={{ color: role === value ? 'var(--color-primary)' : 'var(--text-muted)' }}>{icon}</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: role === value ? 'var(--color-primary)' : 'var(--text-main)', fontSize: '0.95rem' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--status-danger-bg)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '10px', padding: '12px 16px', color: 'var(--status-danger)', fontSize: '0.875rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input-field" style={{ width: '100%', paddingLeft: '44px' }} placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            </div>
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
                <input type="password" className="input-field" style={{ width: '100%', paddingLeft: '44px' }} placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '4px', fontSize: '1rem' }} disabled={loading}>
              {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : `Create ${role === 'MENTOR' ? 'Mentor' : 'Student'} Account`}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
