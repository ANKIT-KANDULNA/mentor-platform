import React, { useState, useEffect } from 'react';
import { getStats, getActiveMentors, getUpcomingSessions } from '../api/dashboard.api';
import { getMyMentorProfile } from '../api/mentor.api';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Video, MessageSquare, Star, Calendar, Loader2,
  ChevronRight, TrendingUp, DollarSign, BookOpen, Award, Zap,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Role-aware dashboard: students see mentor suggestions + upcoming sessions,
 * mentors see their profile completion, bookings, and earnings summary.
 */
export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeMentors, setActiveMentors] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMentor = user?.role === 'MENTOR';

  useEffect(() => {
    const loadData = async () => {
      try {
        const promises = [
          getStats().catch(() => ({ data: { totalStudents: 0, totalMentors: 0, totalSessions: 0, totalMessages: 0 } })),
          getActiveMentors().catch(() => ({ data: [] })),
          getUpcomingSessions().catch(() => ({ data: [] })),
        ];
        if (isMentor) {
          promises.push(getMyMentorProfile().catch(() => ({ data: null })));
        }

        const results = await Promise.all(promises);
        setStats(results[0].data);
        setActiveMentors(results[1].data || []);
        setUpcomingSessions(results[2].data || []);
        if (isMentor && results[3]) setMentorProfile(results[3].data);
      } catch (err) {
        console.error('Failed to load dashboard:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isMentor]);

  // Calculate mentor profile completion
  const getCompletionScore = () => {
    if (!mentorProfile) return 0;
    const fields = ['headline', 'bio', 'collegeName', 'branch', 'hourlyRate', 'expertiseTags'];
    const filled = fields.filter(f => {
      const val = mentorProfile[f];
      return val && (Array.isArray(val) ? val.length > 0 : true);
    });
    return Math.round((filled.length / fields.length) * 100);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  const completion = isMentor ? getCompletionScore() : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade">

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.1) 50%, rgba(236,72,153,0.08) 100%)',
        border: '1px solid rgba(139,92,246,0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', top: '-100px', right: '-50px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ color: 'var(--color-secondary)', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Welcome back 👋
              </p>
              <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 8px' }}>
                {user?.fullName}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                {isMentor
                  ? "Here's an overview of your mentorship activity today."
                  : "Discover mentors, book sessions, and accelerate your career."}
              </p>
            </div>
            {isMentor && (
              <Link to="/profile" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                Edit Profile <ChevronRight size={16} />
              </Link>
            )}
            {!isMentor && (
              <Link to="/mentors" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                Find Mentors <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mentor Profile Completion (Mentors only) */}
      {isMentor && completion < 100 && (
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={20} color="#F59E0B" />
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Complete Your Profile</span>
              <span style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>{completion}%</span>
            </div>
            <Link to="/profile" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>Complete →</Link>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${completion}%`,
              background: 'linear-gradient(90deg, #F59E0B, #EC4899)',
              borderRadius: '999px', transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
            A complete profile gets 3x more bookings. Add your bio, headline, and expertise tags.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { icon: <Users size={22} />, value: stats?.totalStudents || 0, label: 'Active Students', color: 'var(--color-primary)', bg: 'var(--color-primary-glow)' },
          { icon: <Award size={22} />, value: stats?.totalMentors || 0, label: 'Verified Mentors', color: 'var(--color-secondary)', bg: 'var(--color-secondary-glow)' },
          { icon: <Video size={22} />, value: stats?.totalSessions || 0, label: 'Sessions Held', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
          { icon: <MessageSquare size={22} />, value: stats?.totalMessages || 0, label: 'Messages', color: 'var(--color-accent)', bg: 'rgba(236,72,153,0.1)' },
        ].map(({ icon, value, label, color, bg }, i) => (
          <div key={i} className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)', lineHeight: 1 }}>{value.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Upcoming Sessions */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--color-primary)" />
              Upcoming Sessions
            </h2>
            <Link to="/sessions" style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Calendar size={36} style={{ opacity: 0.3, marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
              No upcoming sessions.{' '}
              {!isMentor && <Link to="/mentors" style={{ color: 'var(--color-primary)' }}>Book one now!</Link>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingSessions.slice(0, 4).map(session => {
                const date = new Date(session.scheduledAt);
                return (
                  <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {isMentor ? session.creator?.fullName : session.mentorProfile?.user?.fullName || 'Mentor'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--color-secondary)', fontWeight: 600, flexShrink: 0, marginLeft: '12px' }}>
                      <div>{date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      <div style={{ opacity: 0.8 }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Mentors / Recent Activity */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={18} color="var(--status-warning)" />
              Top Mentors
            </h2>
            <Link to="/mentors" style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Browse All <ChevronRight size={14} />
            </Link>
          </div>
          {activeMentors.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Users size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }} />
              No mentors available right now.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeMentors.slice(0, 4).map(mentor => {
                const initials = mentor.user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <Link to={`/mentors/${mentor.id}`} key={mentor.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', background: 'rgba(255,255,255,0.02)',
                    borderRadius: '10px', border: '1px solid var(--border-color)', textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.82rem', color: '#FFF',
                      }}>{initials}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{mentor.user?.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mentor.collegeName} · {mentor.branch}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: '999px' }}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F59E0B' }}>
                        {mentor.avgRating ? parseFloat(mentor.avgRating).toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {(!isMentor ? [
          { icon: <Users size={20} />, label: 'Browse Mentors', desc: 'Find the perfect mentor', to: '/mentors', color: 'var(--color-primary)' },
          { icon: <MessageSquare size={20} />, label: 'Messages', desc: 'Chat with your mentors', to: '/chat', color: 'var(--color-secondary)' },
          { icon: <Calendar size={20} />, label: 'My Sessions', desc: 'View booked sessions', to: '/sessions', color: 'var(--status-success)' },
          { icon: <BookOpen size={20} />, label: 'Community', desc: 'Join discussions', to: '/community', color: 'var(--color-accent)' },
        ] : [
          { icon: <Users size={20} />, label: 'My Profile', desc: 'Edit mentor profile', to: '/profile', color: 'var(--color-primary)' },
          { icon: <Calendar size={20} />, label: 'Sessions', desc: 'Manage your sessions', to: '/sessions', color: 'var(--color-secondary)' },
          { icon: <MessageSquare size={20} />, label: 'Messages', desc: 'Chat with students', to: '/chat', color: 'var(--status-success)' },
          { icon: <BookOpen size={20} />, label: 'Community', desc: 'Engage with students', to: '/community', color: 'var(--color-accent)' },
        ]).map(({ icon, label, desc, to, color }, i) => (
          <Link key={i} to={to} style={{ textDecoration: 'none' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
