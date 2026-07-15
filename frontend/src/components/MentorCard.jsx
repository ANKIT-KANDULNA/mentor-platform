import React from 'react';
import { Link } from 'react-router-dom';
import { Star, GraduationCap, Briefcase, MessageCircle, TrendingUp, Users, Building, ShieldCheck } from 'lucide-react';

export default function MentorCard({ mentor }) {
  const { user, collegeName, branch, graduationYear, bio, headline, expertiseTags, hourlyRate, avgRating, ratingCount } = mentor;
  const fullName = user?.fullName || 'Anonymous Mentor';
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const rating = avgRating ? parseFloat(avgRating).toFixed(1) : '4.9';
  const reviews = ratingCount || 24;

  return (
    <div className="glass-card animate-scale" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Accent Header Bar */}
      <div style={{ height: '4px', background: 'var(--color-primary)' }} />

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {/* Profile Info */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div className="avatar" style={{
            width: '64px', height: '64px', borderRadius: '14px',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 800,
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
          }}>{initials}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: '0 0 2px', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fullName}
            </h3>
            <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building size={12} />
              <span>Senior Software Engineer</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="badge-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                <Star size={11} fill="currentColor" color="currentColor" />
                <span>{rating}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({reviews} reviews)</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>EXPERIENCE</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>12 Years</span>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>RESPONSE RATE</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--status-success)' }}>98%</span>
          </div>
        </div>

        {/* Info detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <GraduationCap size={14} color="var(--color-primary)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {collegeName || 'BITS Pilani'} · {graduationYear || '2016'}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(expertiseTags && expertiseTags.length > 0 ? expertiseTags : ['React', 'Node.js', 'System Design']).slice(0, 3).map((tag, i) => (
            <span key={i} className="tag" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>{tag}</span>
          ))}
        </div>

        {/* Footer CTAs */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hourly Rate</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
              ₹799<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/hr</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/mentors/${mentor.id}`} style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
              View Profile
            </Link>
            <Link to={`/mentors/${mentor.id}?book=true`} className="btn-primary" style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem', borderRadius: '8px', boxShadow: 'none' }}>
              Book Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
