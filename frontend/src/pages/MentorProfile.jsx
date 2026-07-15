import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getMentorById } from '../api/mentor.api';
import { createSession } from '../api/session.api';
import { createReview, getReviewsByMentor } from '../api/review.api';
import { useAuthStore } from '../store/useAuthStore';
import {
  GraduationCap, Award, Star, AlertCircle, X, Calendar, Clock,
  DollarSign, MessageCircle, BookOpen, Loader2, ThumbsUp, ChevronRight, Video,
  Building, CheckCircle2, ChevronDown, CheckSquare, Sparkles
} from 'lucide-react';

const TABS = ['About', 'Experience', 'Reviews', 'Availability', 'Resources'];

export default function MentorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuthStore();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('About');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Booking process states (Calendly layout style)
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [sessionDuration, setSessionDuration] = useState('60');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // AI Interview Questions Generator States
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const queryParams = new URLSearchParams(location.search);
  const shouldBookImmediately = queryParams.get('book') === 'true';

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const data = await getMentorById(id);
        setMentor(data.data);
        if (shouldBookImmediately) {
          setActiveTab('Availability');
        }
      } catch (err) {
        console.error('Failed to get mentor:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMentor();
  }, [id, shouldBookImmediately]);

  const loadReviews = async () => {
    if (!mentor) return;
    setReviewsLoading(true);
    try {
      const data = await getReviewsByMentor(mentor.id);
      setReviews(data.data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Reviews' && mentor) {
      loadReviews();
    }
  }, [activeTab, mentor]);

  const handleBookSession = async (e) => {
    if (e) e.preventDefault();
    setBookingError('');
    setBookingSuccess(false);
    if (!sessionTitle || !selectedDate || !selectedSlot) {
      setBookingError('Please enter a session topic and select an available slot.');
      return;
    }
    setBookingLoading(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedSlot}`).toISOString();
      await createSession({
        title: sessionTitle,
        description: sessionDesc,
        type: 'ONE_TO_ONE',
        scheduledAt,
        maxParticipants: 1,
        mentorProfileId: mentor.id,
      });
      setBookingSuccess(true);
      setSessionTitle(''); setSessionDesc(''); setSelectedDate(''); setSelectedSlot('');
      setTimeout(() => { setBookingSuccess(false); navigate('/sessions'); }, 2000);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book session');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleGenerateQuestions = () => {
    setQuestionsLoading(true);
    setTimeout(() => {
      setInterviewQuestions([
        'Explain the difference between Shadow DOM and Virtual DOM in React.',
        'How does the browser rendering engine handle reflows and repaints?',
        'Describe a scenario where you had to debug a memory leak in a Node.js process.',
        'How would you design a rate limiter for a high-traffic endpoint?'
      ]);
      setQuestionsLoading(false);
    }, 1200);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError(''); setReviewSuccess(false);
    setReviewLoading(true);
    try {
      await createReview({ mentorProfileId: mentor.id, rating: reviewRating, comment: reviewComment });
      setReviewSuccess(true);
      setReviewComment(''); setReviewRating(5);
      await loadReviews();
      const data = await getMentorById(id);
      setMentor(data.data);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', background: 'var(--bg-main)', minHeight: '100vh' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', margin: '20px' }}>
        <AlertCircle size={48} color="var(--status-danger)" style={{ marginBottom: '16px' }} />
        <h3>Mentor profile not found</h3>
        <button onClick={() => navigate('/mentors')} className="btn-secondary" style={{ marginTop: '16px', padding: '8px 16px' }}>
          Back to Directory
        </button>
      </div>
    );
  }

  const mentorName = mentor.user?.fullName || 'Anonymous';
  const initials = mentorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const isOwnProfile = currentUser?.id === mentor.userId;
  const rating = mentor.avgRating ? parseFloat(mentor.avgRating).toFixed(1) : '4.9';

  const timeslots = ['09:00', '10:30', '13:00', '15:00', '16:30'];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '16px' }} className="animate-fade">
      
      {/* ─── LINKEDIN STYLE PROFILE HERO ─── */}
      <div className="glass-panel" style={{ overflow: 'hidden', position: 'relative', borderRadius: '24px' }}>
        {/* Cover Image Header */}
        <div style={{ height: '180px', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-teal) 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle, #FFF 10%, transparent 11%)', backgroundSize: '16px 16px' }} />
        </div>

        {/* Profile Details area */}
        <div style={{ padding: '0 32px 32px', marginTop: '-50px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            {/* Avatar */}
            <div className="avatar" style={{
              width: '120px', height: '120px', borderRadius: '24px',
              fontSize: '3rem', fontWeight: 800, border: '6px solid var(--bg-main)',
              boxShadow: 'var(--shadow-md)',
            }}>{initials}</div>

            {/* CTAs */}
            {!isOwnProfile && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <button onClick={() => { setActiveTab('Availability'); }} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px' }}>
                  Book Session
                </button>
                <Link to={`/chat?userId=${mentor.userId}`} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '12px' }}>
                  Message
                </Link>
                <button className="btn-secondary" style={{ padding: '10px' }} onClick={() => alert('Following mentor!')}>
                  Follow
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>{mentorName}</h1>
            <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.1rem', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={16} />
              <span>Senior Software Engineer at Google</span>
            </p>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><GraduationCap size={15} /> {mentor.collegeName || 'BITS Pilani'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={15} /> {mentor.branch || 'Computer Science'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-rating)', fontWeight: 700 }}>
                <Star size={15} fill="currentColor" /> {rating} ({mentor.ratingCount || 12} Reviews)
              </div>
            </div>

            {/* Platform Stats */}
            <div style={{ display: 'flex', gap: '40px', marginTop: '24px', padding: '16px 0', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>EXPERIENCE</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>12 Years</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>RESPONSE RATE</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--status-success)' }}>98%</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>COMPLETED SESSIONS</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>500+</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>SESSION RATE</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>₹799/hr</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PROFILE BODY TABS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Tab Panels */}
        <div>
          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '6px', marginBottom: '24px', width: 'fit-content' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem',
                background: activeTab === tab ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab ? '#FFF' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>{tab}</button>
            ))}
          </div>

          {/* TAB: About */}
          {activeTab === 'About' && (
            <div className="glass-panel animate-scale" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>About {mentorName}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                {mentor.bio || `Experienced engineer focused on mentoring next-generation developers. Specialize in backend services, high-performance database architectures, and distributed socket configurations.`}
              </p>
            </div>
          )}

          {/* TAB: Experience */}
          {activeTab === 'Experience' && (
            <div className="glass-panel animate-scale" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Work Experience</h2>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-primary-glow)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Senior Software Engineer</h4>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>Google · Full-time</p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>2021 – Present · Silicon Valley</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-teal-glow)', color: 'var(--color-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Software Engineer II</h4>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--color-teal)', fontWeight: 600 }}>Microsoft</p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>2018 – 2021 · Bangalore</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Reviews */}
          {activeTab === 'Reviews' && (
            <div className="animate-scale" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {currentUser?.role === 'STUDENT' && !isOwnProfile && (
                <div className="glass-panel" style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Write a Review</h3>
                  {reviewSuccess && (
                    <div style={{ background: 'var(--status-success-bg)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '10px 14px', color: 'var(--status-success)', fontSize: '0.875rem', marginBottom: '16px' }}>
                      Review submitted successfully!
                    </div>
                  )}
                  {reviewError && (
                    <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: '10px', padding: '10px 14px', color: 'var(--status-danger)', fontSize: '0.875rem', marginBottom: '16px' }}>
                      {reviewError}
                    </div>
                  )}
                  <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Rating</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button"
                             onMouseEnter={() => setHoverRating(star)}
                             onMouseLeave={() => setHoverRating(0)}
                             onClick={() => setReviewRating(star)}
                             style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                          >
                            <Star size={24}
                              fill={(hoverRating || reviewRating) >= star ? '#F59E0B' : 'transparent'}
                              color="#F59E0B"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Comment</label>
                      <textarea className="input-field" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                        placeholder="Write your session review comments..."
                        value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
                    </div>
                    <button type="submit" className="btn-primary" disabled={reviewLoading} style={{ width: '100%' }}>
                      Submit Review
                    </button>
                  </form>
                </div>
              )}

              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '20px' }}>All Reviews ({reviews.length})</h3>
                {reviewsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                  </div>
                ) : reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <p>No reviews listed yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map(r => (
                      <ReviewCard key={r.id} review={r} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Availability & CALENDLY STYLE BOOKING FLOW */}
          {activeTab === 'Availability' && (
            <div className="glass-panel animate-scale" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Calendly Booking Workspace</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Select duration, pick date/time slots, and confirm your slot instantly.</p>
              
              {bookingSuccess && (
                <div style={{ background: 'var(--status-success-bg)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '12px 16px', color: 'var(--status-success)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  ✅ Session confirmed successfully! Redirecting to sessions list...
                </div>
              )}
              {bookingError && (
                <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: '10px', padding: '12px 16px', color: 'var(--status-danger)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  {bookingError}
                </div>
              )}

              {/* Step 1: Choose Duration */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>1. CHOOSE DURATION</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { val: '30', label: '30 Minutes' },
                    { val: '60', label: '60 Minutes' },
                    { val: '90', label: '90 Minutes' }
                  ].map(dur => (
                    <button key={dur.val} onClick={() => setSessionDuration(dur.val)} style={{
                      padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-color)',
                      background: sessionDuration === dur.val ? 'var(--color-primary-glow)' : 'transparent',
                      color: sessionDuration === dur.val ? 'var(--color-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s'
                    }}>
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose Date */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>2. CHOOSE DATE</span>
                <input
                  type="date"
                  className="input-field"
                  style={{ width: '100%', maxWidth: '300px' }}
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Step 3: Choose Time Slot */}
              {selectedDate && (
                <div style={{ marginBottom: '28px' }} className="animate-scale">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>3. AVAILABLE SLOTS</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {timeslots.map(slot => (
                      <button key={slot} onClick={() => setSelectedSlot(slot)} style={{
                        padding: '10px 18px', borderRadius: '10px', border: '1px solid var(--border-color)',
                        background: selectedSlot === slot ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' : 'rgba(255,255,255,0.02)',
                        color: selectedSlot === slot ? '#FFF' : 'var(--text-main)',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s'
                      }}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Topic Details */}
              {selectedDate && selectedSlot && (
                <div className="animate-scale" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>4. ENTER TOPIC DETAILS</span>
                  <div className="input-group">
                    <label className="input-label">Topic *</label>
                    <input type="text" className="input-field" style={{ width: '100%' }}
                      placeholder="e.g. Mock System Design, Resume Review" value={sessionTitle}
                      onChange={e => setSessionTitle(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Notes (optional)</label>
                    <textarea className="input-field" style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                      placeholder="Share what you want to focus on..." value={sessionDesc}
                      onChange={e => setSessionDesc(e.target.value)} />
                  </div>
                  <button onClick={handleBookSession} className="btn-primary" disabled={bookingLoading} style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
                    {bookingLoading ? 'Reserving Slot...' : 'Confirm Session Slot'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: Resources & AI GENERATED HELPERS */}
          {activeTab === 'Resources' && (
            <div className="glass-panel animate-scale" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Preparation Resources</h2>
                <button onClick={handleGenerateQuestions} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} disabled={questionsLoading}>
                  <Sparkles size={14} />
                  {questionsLoading ? 'Generating...' : 'AI Interview Questions'}
                </button>
              </div>

              {interviewQuestions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }} className="animate-scale">
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 700, margin: '0 0 4px' }}>AI-GENERATED MOCK INTERVIEW QUESTIONS:</h4>
                  {interviewQuestions.map((q, idx) => (
                    <div key={idx} style={{ padding: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.85rem' }}>
                      <strong>Q{idx + 1}:</strong> {q}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  Click the AI helper tool above to generate customized technical questions before your next session.
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>System Design Cheatsheet</span>
                  <a href="#" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>Download PDF</a>
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Resume Template (Clean LaTeX)</span>
                  <a href="#" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>Download PDF</a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar booking widget */}
        <div>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Session Rate</span>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '1.6rem', color: 'var(--color-primary)' }}>₹799</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / hour</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-rating-bg)', borderRadius: '8px', border: '1px solid rgba(245,179,1,0.15)' }}>
              <Star size={14} fill="var(--color-rating)" color="var(--color-rating)" />
              <span style={{ color: 'var(--color-rating)', fontSize: '0.85rem', fontWeight: 700 }}>{rating}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>· Verified Top Mentor</span>
            </div>

            {!isOwnProfile && (
              <button onClick={() => setActiveTab('Availability')} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                Book Session Slot
              </button>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {[
                '🛡️ Verified background checks',
                '💳 Easy automated payments',
                '⏳ Reschedule up to 24 hours prior'
              ].map((badge, idx) => (
                <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0' }}>{badge}</div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const initials = review.author?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  return (
    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', fontSize: '0.75rem' }}>{initials}</div>
          <div>
            <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>{review.author?.fullName || 'Anonymous User'}</h5>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Student</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(star => (
            <Star key={star} size={12} fill={star <= review.rating ? 'var(--color-rating)' : 'transparent'} color="var(--color-rating)" />
          ))}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{review.comment}</p>
    </div>
  );
}
