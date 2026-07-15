import React, { useState, useEffect } from 'react';
import { getStats, getActiveMentors, getUpcomingSessions } from '../api/dashboard.api';
import { getMyMentorProfile } from '../api/mentor.api';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Video, MessageSquare, Star, Calendar, Loader2,
  ChevronRight, TrendingUp, DollarSign, BookOpen, Award, Zap,
  CheckSquare, ArrowRight, Brain, Clock, BarChart3
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeMentors, setActiveMentors] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good Morning');

  // AI Roadmap Generator States
  const [roadmapPrompt, setRoadmapPrompt] = useState('');
  const [aiRoadmap, setAiRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const isMentor = user?.role === 'MENTOR';

  useEffect(() => {
    // Set dynamic greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

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

  const handleGenerateRoadmap = (e) => {
    e.preventDefault();
    if (!roadmapPrompt.trim()) return;
    setRoadmapLoading(true);
    // Simulate AI Generation
    setTimeout(() => {
      setAiRoadmap({
        topic: roadmapPrompt.trim(),
        steps: [
          { num: 1, title: 'Foundations & Setup', desc: 'Acquire required toolkits, syntax basics, and sandbox environment configuration.' },
          { num: 2, title: 'Intermediate Concepts', desc: 'Dive into states, modules, data flows, and routing systems.' },
          { num: 3, title: 'Production & Security', desc: 'Integrate WebRTC, live sockets, API pipelines, and secure cookies.' },
          { num: 4, title: 'Deployment & CI/CD', desc: 'Configure Docker files, deploy to static clouds, and optimize response speeds.' }
        ]
      });
      setRoadmapLoading(false);
    }, 1500);
  };

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '16px' }}>
        {/* Skeleton Hero */}
        <div className="glass-panel bento-col-2" style={{ padding: '40px', height: '280px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '200px', height: '24px', background: 'var(--border-color)', borderRadius: '8px' }} />
            <div style={{ width: '60%', height: '48px', background: 'var(--border-color)', borderRadius: '8px' }} />
            <div style={{ width: '80%', height: '20px', background: 'var(--border-color)', borderRadius: '8px', opacity: 0.7 }} />
          </div>
        </div>
        
        {/* Skeleton Profile Card */}
        <div className="glass-panel" style={{ padding: '28px', height: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--border-color)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '70%', height: '20px', background: 'var(--border-color)', borderRadius: '8px', marginBottom: '8px' }} />
              <div style={{ width: '40%', height: '16px', background: 'var(--border-color)', borderRadius: '8px', opacity: 0.7 }} />
            </div>
          </div>
          <div style={{ width: '100%', height: '48px', background: 'var(--border-color)', borderRadius: '8px' }} />
        </div>
        
        {/* Skeleton Session Card */}
        <div className="glass-panel" style={{ padding: '28px', height: '200px' }}>
          <div style={{ width: '40%', height: '24px', background: 'var(--border-color)', borderRadius: '8px', marginBottom: '20px' }} />
          <div style={{ width: '80%', height: '60px', background: 'var(--border-color)', borderRadius: '8px', opacity: 0.7 }} />
        </div>
        
        {/* Skeleton Weekly Chart */}
        <div className="glass-panel" style={{ padding: '28px', height: '200px' }}>
          <div style={{ width: '40%', height: '24px', background: 'var(--border-color)', borderRadius: '8px', marginBottom: '20px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', height: '70px' }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{ width: '12%', height: '100%', background: 'var(--border-color)', borderRadius: '6px', opacity: 0.7 }} />
            ))}
          </div>
        </div>
        
        {/* Skeleton Mentors */}
        <div className="glass-panel" style={{ padding: '28px', height: '200px' }}>
          <div style={{ width: '40%', height: '24px', background: 'var(--border-color)', borderRadius: '8px', marginBottom: '20px' }} />
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', marginBottom: '12px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--border-color)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '60%', height: '16px', background: 'var(--border-color)', borderRadius: '8px', marginBottom: '6px' }} />
                <div style={{ width: '40%', height: '14px', background: 'var(--border-color)', borderRadius: '8px', opacity: 0.7 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completion = isMentor ? getCompletionScore() : 0;
  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;
  const nextSessionDate = nextSession ? new Date(nextSession.scheduledAt) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '16px' }} className="animate-fade">
      
      {/* ─── BENTO GRID LAYOUT ─── */}
      <div className="bento-grid">
        
        {/* HERO SECTION: Span 2 Columns */}
        <div className="hero-banner bento-col-2" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '28px' }}>
          <div>
            <p style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              {greeting}
            </p>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-sans)', margin: '0 0 12px', color: 'var(--text-main)' }}>
              Welcome back, {user?.fullName?.split(' ')[0]}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0', maxWidth: '520px', lineHeight: 1.5 }}>
              {isMentor 
                ? 'Your students are waiting for guidance. Check your calendar for upcoming bookings.' 
                : 'Accelerate your career goals. Meet with verified industry professionals today.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
            {/* Learning Progress Widget */}
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>LEARNING PROGRESS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '80%', height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--status-success))', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>80%</span>
              </div>
            </div>

            {/* Checklist Goals */}
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>CURRENT GOALS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', transition: 'all 0.2s ease' }}>
                  <CheckSquare size={14} color="var(--status-success)" style={{ flexShrink: 0 }} />
                  <span>Resume Review</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', transition: 'all 0.2s ease' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '3px', border: '1px solid var(--border-strong)', display: 'inline-block', flexShrink: 0 }} />
                  <span>Mock System Design</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR: Profile Card / Stats */}
        <div className="glass-panel" style={{ padding: '28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px', transition: 'all 0.3s ease' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div className="avatar" style={{ width: '52px', height: '52px', borderRadius: '50%', fontSize: '1.15rem', boxShadow: 'var(--shadow-md)' }}>
                {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>{user?.fullName}</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>{user?.role}</p>
              </div>
            </div>

            {isMentor ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Profile Completion</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 700 }}>{completion}%</span>
                </div>
                <div className="completion-bar">
                  <div className="completion-fill" style={{ width: `${completion}%` }} />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                  A completed profile makes you stand out and secure bookings faster.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Learning Hours</span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--color-primary)' }}>12.5 hrs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Completed Reviews</span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--status-success)' }}>4</strong>
                </div>
              </div>
            )}
          </div>

          <Link to="/profile" style={{ width: '100%', fontSize: '0.88rem', padding: '12px', justifyContent: 'center', background: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '10px', color: '#ffffff', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}>
            View Account Settings
          </Link>
        </div>

        {/* ─── NEXT SESSION FOCUS ─── */}
        <div className="glass-panel" style={{ padding: '28px', transition: 'all 0.3s ease' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <h2>
              <Clock size={16} color="var(--color-primary)" />
              Next Session
            </h2>
          </div>
          {nextSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{nextSession.title}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Today · {nextSessionDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  with {isMentor ? nextSession.creator?.fullName : nextSession.mentorProfile?.user?.fullName}
                </p>
              </div>
              <Link to="/sessions" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.85rem', justifyContent: 'center' }}>
                Join Call
              </Link>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <Calendar size={32} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>You're all caught up!</h4>
              <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Book your next mentoring session.</p>
              {!isMentor && (
                <Link to="/mentors" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                  Explore Mentors
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ─── WEEKLY HOURS DATA VISUALIZATION ─── */}
        <div className="glass-panel" style={{ padding: '28px', transition: 'all 0.3s ease' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <h2>
              <BarChart3 size={16} color="var(--color-teal)" />
              Weekly Sessions
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Visual sessions chart bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '70px', padding: '0 8px' }}>
              {[15, 8, 30, 45, 60, 40, 20].map((h, i) => (
                <div 
                  key={i} 
                  style={{ 
                    width: '12%', 
                    background: i === 4 ? 'var(--color-primary)' : 'var(--border-color)', 
                    height: `${h}%`, 
                    borderRadius: '6px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }} 
                  onMouseEnter={e => {
                    e.currentTarget.style.background = i === 4 ? 'var(--color-primary-hover)' : 'var(--border-strong)';
                    e.currentTarget.style.transform = 'scaleY(1.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = i === 4 ? 'var(--color-primary)' : 'var(--border-color)';
                    e.currentTarget.style.transform = 'scaleY(1)';
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* ─── RECOMMENDED MENTORS PANEL ─── */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <h2>
              <Star size={16} color="var(--color-rating)" />
              Verified Mentors
            </h2>
            <Link to="/mentors" className="section-link">All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeMentors.length > 0 ? (
              activeMentors.slice(0, 2).map((m) => (
                <Link to={`/mentors/${m.id}`} key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', padding: '10px', borderRadius: '8px', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ width: '36px', height: '36px', borderRadius: '8px', fontSize: '0.85rem' }}>
                      {m.user?.fullName?.charAt(0)}
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{m.user?.fullName}</h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.headline || 'SDE'}</span>
                    </div>
                  </div>
                  <div className="badge-rating" style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Star size={10} fill="currentColor" />
                    <span>{m.avgRating ? parseFloat(m.avgRating).toFixed(1) : '5.0'}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <p style={{ margin: 0 }}>No mentors available</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── AI ROADMAP GENERATOR (Bento Span 3 Columns) ─── */}
        <div className="glass-panel bento-col-3" style={{ padding: '32px', transition: 'all 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-primary-glow)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>AI Roadmap Planner</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Generate customized step-by-step career blueprints instantly</p>
            </div>
          </div>

          <form onSubmit={handleGenerateRoadmap} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="What do you want to learn? (e.g., Full Stack Engineer, Devops Specialist)"
              style={{ flex: 1, height: '48px', fontSize: '0.95rem' }}
              value={roadmapPrompt}
              onChange={e => setRoadmapPrompt(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 24px', height: '48px', fontSize: '0.95rem' }} disabled={roadmapLoading}>
              {roadmapLoading ? 'Planning...' : 'Generate Roadmap'}
            </button>
          </form>

          {aiRoadmap && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '28px' }} className="animate-scale">
              <h4 style={{ margin: '0 0 20px', fontSize: '1rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ROADMAP FOR: <strong style={{ color: 'var(--color-primary)' }}>{aiRoadmap.topic}</strong>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {aiRoadmap.steps.map((step, index) => (
                  <div 
                    key={step.num} 
                    style={{ 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px', 
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    className={`stagger-${index + 1}`}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.background = 'var(--color-primary-soft)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'var(--bg-card)';
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-primary-glow)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', marginBottom: '10px' }}>
                      Step {step.num}
                    </span>
                    <h5 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>{step.title}</h5>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ─── QUICK ACTIONS GRID ─── */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-sans)', color: 'var(--text-main)', marginBottom: '20px', fontWeight: 600 }}>Quick Navigation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { label: 'Browse Mentors', desc: 'Find your perfect industry fit', icon: <Users size={22} />, to: '/mentors', color: '#6366F1', glow: 'rgba(99,102,241,0.1)' },
            { label: 'Book Session', desc: 'Secure customized video slots', icon: <Calendar size={22} />, to: '/mentors', color: '#3B82F6', glow: 'rgba(59,130,246,0.1)' },
            { label: 'Join Community', desc: 'Participate in group chats', icon: <BookOpen size={22} />, to: '/community', color: '#10B981', glow: 'rgba(16,185,129,0.1)' },
            { label: 'Resume Review', desc: 'Prepare for mock reviews', icon: <CheckSquare size={22} />, to: '/chat', color: '#F59E0B', glow: 'rgba(245,158,11,0.1)' }
          ].map((act, i) => (
            <Link key={i} to={act.to} style={{ textDecoration: 'none' }}>
              <div className="quick-action" style={{ padding: '28px' }}>
                <div className="quick-action-icon" style={{ background: act.glow, color: act.color, width: '52px', height: '52px' }}>
                  {act.icon}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>{act.label}</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{act.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
    </div>
  );
}
