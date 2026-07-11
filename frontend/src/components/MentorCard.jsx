import React from 'react';
import { Link } from 'react-router-dom';
import { Star, GraduationCap, Briefcase, MessageCircle, TrendingUp } from 'lucide-react';

export default function MentorCard({ mentor }) {
  const { user, collegeName, branch, graduationYear, bio, headline, expertiseTags, hourlyRate, avgRating, ratingCount } = mentor;
  const fullName = user?.fullName || 'Anonymous Mentor';
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const rating = avgRating ? parseFloat(avgRating).toFixed(1) : '5.0';
  const reviews = ratingCount || 0;

  // Gradient based on name hash
  const gradients = [
    'linear-gradient(135deg, #8B5CF6, #06B6D4)',
    'linear-gradient(135deg, #EC4899, #8B5CF6)',
    'linear-gradient(135deg, #06B6D4, #10B981)',
    'linear-gradient(135deg, #F59E0B, #EC4899)',
    'linear-gradient(135deg, #10B981, #06B6D4)',
  ];
  const gradient = gradients[fullName.charCodeAt(0) % gradients.length];

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'visible', position: 'relative' }}>
      {/* Card top accent bar */}
      <div style={{ height: '4px', background: gradient, borderRadius: '16px 16px 0 0' }} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {/* Header: Avatar + Name + Rating */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: gradient, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: 800, color: '#FFF',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>{initials}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: '0 0 2px', fontSize: '1.05rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fullName}
            </h3>
            <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: 'var(--color-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {headline || 'Expert Mentor'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={11} fill={i <= Math.round(parseFloat(rating)) ? '#F59E0B' : 'transparent'} color="#F59E0B" />
                ))}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{rating}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({reviews} reviews)</span>
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <GraduationCap size={14} color="var(--color-primary)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {collegeName || 'University'} · {graduationYear || 'N/A'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Briefcase size={14} color="var(--color-secondary)" />
            <span>{branch || 'General'}</span>
          </div>
        </div>

        {/* Bio excerpt */}
        <p style={{
          fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', lineHeight: 1.5,
        }}>
          {bio || 'Experienced mentor ready to help you grow.'}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(expertiseTags || []).slice(0, 4).map((tag, i) => (
            <span key={i} style={{
              fontSize: '0.72rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 600,
              background: i % 2 === 0 ? 'var(--color-primary-glow)' : 'var(--color-secondary-glow)',
              color: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)',
              border: `1px solid ${i % 2 === 0 ? 'rgba(139,92,246,0.2)' : 'rgba(6,182,212,0.2)'}`,
            }}>{tag}</span>
          ))}
          {(expertiseTags || []).length > 4 && (
            <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '999px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)' }}>+{expertiseTags.length - 4}</span>
          )}
        </div>

        {/* Price + CTAs */}
        <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} color="var(--color-secondary)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Session Rate</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}>
              ${hourlyRate || 0}<span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/hr</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to={`/mentors/${mentor.id}`} className="btn btn-secondary" style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem', textAlign: 'center' }}>
              View Profile
            </Link>
            <Link to={`/chat?userId=${user?.id}`} className="btn btn-primary" style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <MessageCircle size={14} /> Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
