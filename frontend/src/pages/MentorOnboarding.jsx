import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyMentorProfile, updateMentorProfile } from '../api/mentor.api';
import { useAuthStore } from '../store/useAuthStore';
import {
  User, Briefcase, GraduationCap, DollarSign, Tag, Plus, X, CheckCircle2,
  BookOpen, Loader2, Save, Clock, Calendar,
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SUGGESTED_TAGS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'Machine Learning', 'Data Science',
  'System Design', 'DSA', 'Java', 'Career Prep', 'Resume Review', 'Interview Prep',
  'DevOps', 'AWS', 'Product Management', 'UI/UX Design',
];

/**
 * Mentor profile onboarding/editing page.
 * Allows mentors to set bio, headline, expertise tags, hourly rate, and availability.
 */
export default function MentorOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  useEffect(() => {
    if (user?.role !== 'MENTOR') {
      navigate('/dashboard');
      return;
    }
    const load = async () => {
      try {
        const data = await getMyMentorProfile();
        if (data.data) {
          const p = data.data;
          setHeadline(p.headline || '');
          setBio(p.bio || '');
          setCollegeName(p.collegeName || '');
          setBranch(p.branch || '');
          setGraduationYear(p.graduationYear?.toString() || '');
          setHourlyRate(p.hourlyRate?.toString() || '');
          setIsAvailable(p.isAvailable ?? true);
          setExpertiseTags(p.expertiseTags || []);
        }
      } catch (err) {
        console.error('Failed to load profile:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  const toggleTag = (tag) => {
    setExpertiseTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !expertiseTags.includes(trimmed)) {
      setExpertiseTags(prev => [...prev, trimmed]);
    }
    setCustomTag('');
  };

  const removeTag = (tag) => setExpertiseTags(prev => prev.filter(t => t !== tag));

  const handleSave = async () => {
    setError(''); setSaving(true); setSuccess(false);
    try {
      await updateMentorProfile({
        headline,
        bio,
        collegeName,
        branch,
        graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        isAvailable,
        expertiseTags,
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="animate-fade">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 6px' }}>
          {step === 1 ? 'Tell us about yourself' : step === 2 ? 'Your expertise' : 'Availability & pricing'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Complete your mentor profile to start receiving bookings
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Step {step} of {totalSteps}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{Math.round((step / totalSteps) * 100)}% complete</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${(step / totalSteps) * 100}%`,
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
            borderRadius: '999px', transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.875rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '12px 16px', color: 'var(--status-success)', fontSize: '0.875rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> Profile saved! Redirecting to dashboard...
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="glass-panel animate-scale" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label className="input-label">Professional Headline</label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="input-field" style={{ width: '100%', paddingLeft: '44px' }}
                placeholder="e.g. Senior Software Engineer at Google"
                value={headline} onChange={e => setHeadline(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Bio / About You</label>
            <textarea className="input-field" style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
              placeholder="Tell students about your background, experience, and what you can help with..."
              value={bio} onChange={e => setBio(e.target.value)} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bio.length}/500 characters</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">College / University</label>
              <div style={{ position: 'relative' }}>
                <GraduationCap size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input-field" style={{ width: '100%', paddingLeft: '44px' }}
                  placeholder="e.g. IIT Delhi" value={collegeName} onChange={e => setCollegeName(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Branch / Major</label>
              <input type="text" className="input-field" style={{ width: '100%' }}
                placeholder="e.g. Computer Science" value={branch} onChange={e => setBranch(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Graduation Year</label>
            <input type="number" className="input-field" style={{ width: '200px' }}
              placeholder="e.g. 2022" min="2000" max="2030"
              value={graduationYear} onChange={e => setGraduationYear(e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 2: Expertise Tags */}
      {step === 2 && (
        <div className="glass-panel animate-scale" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>
              Click to add expertise tags (up to 10)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SUGGESTED_TAGS.map(tag => {
                const selected = expertiseTags.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleTag(tag)} type="button"
                    disabled={!selected && expertiseTags.length >= 10}
                    style={{
                      padding: '7px 16px', borderRadius: '999px', cursor: selected || expertiseTags.length < 10 ? 'pointer' : 'not-allowed',
                      border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      background: selected ? 'var(--color-primary-glow)' : 'transparent',
                      color: selected ? 'var(--color-primary)' : 'var(--text-muted)',
                      fontSize: '0.82rem', fontWeight: selected ? 600 : 400,
                      transition: 'all 0.15s', opacity: !selected && expertiseTags.length >= 10 ? 0.4 : 1,
                    }}>
                    {selected && '✓ '}{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom tag input */}
          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Add custom skill</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" className="input-field" style={{ flex: 1 }}
                placeholder="e.g. GraphQL, Kubernetes..."
                value={customTag} onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())} />
              <button onClick={addCustomTag} className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Selected tags */}
          {expertiseTags.length > 0 && (
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Selected ({expertiseTags.length}/10)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {expertiseTags.map(tag => (
                  <span key={tag} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                    borderRadius: '999px', background: 'var(--color-primary)', color: '#FFF',
                    fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    {tag}
                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 0, display: 'flex' }}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Pricing + Availability */}
      {step === 3 && (
        <div className="glass-panel animate-scale" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="input-group">
            <label className="input-label">Hourly Rate (USD)</label>
            <div style={{ position: 'relative', width: '200px' }}>
              <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="number" className="input-field" style={{ width: '100%', paddingLeft: '40px' }}
                placeholder="0" min="0" max="999"
                value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Set to 0 for free sessions. Platform fee: 10%
            </p>
          </div>

          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '10px' }}>Availability Status</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[{ val: true, label: '✅ Available for bookings', color: 'var(--status-success)' }, { val: false, label: '⏸️ Not accepting bookings', color: 'var(--text-muted)' }].map(({ val, label, color }) => (
                <button key={String(val)} type="button" onClick={() => setIsAvailable(val)} style={{
                  flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                  border: `1px solid ${isAvailable === val ? color : 'var(--border-color)'}`,
                  background: isAvailable === val ? `${color}20` : 'transparent',
                  color: isAvailable === val ? color : 'var(--text-muted)',
                  fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Availability schedule hint */}
          <div style={{ background: 'var(--color-primary-glow)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Calendar size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Availability Schedule</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  After saving your profile, you can set your weekly availability schedule (days and times) from your profile settings. Students will see your available slots when booking.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '12px' }}>
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
            ← Back
          </button>
        ) : <div style={{ flex: 1 }} />}

        {step < totalSteps ? (
          <button onClick={() => setStep(s => s + 1)} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
            Continue →
          </button>
        ) : (
          <button onClick={handleSave} className="btn btn-primary" disabled={saving || success} style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saving ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <><Save size={18} /> Save Profile</>}
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
