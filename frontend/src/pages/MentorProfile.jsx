import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMentorById } from '../api/mentor.api';
import { createSession } from '../api/session.api';
import { createReview, getReviewsByMentor } from '../api/review.api';
import { useAuthStore } from '../store/useAuthStore';
import {
  GraduationCap, Award, Star, AlertCircle, X, Calendar, Clock,
  DollarSign, MessageCircle, BookOpen, Loader2, ThumbsUp, ChevronRight, Video,
} from 'lucide-react';

const TABS = ['About', 'Expertise', 'Reviews', 'Availability'];

/**
 * Full mentor profile with tabbed content, booking modal, and review submission.
 */
export default function MentorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('About');
  const [showModal, setShowModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Booking state
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const data = await getMentorById(id);
        setMentor(data.data);
      } catch (err) {
        console.error('Failed to get mentor:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMentor();
  }, [id]);

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
    e.preventDefault();
    setBookingError('');
    setBookingSuccess(false);
    if (!sessionTitle || !sessionDate || !sessionTime) {
      setBookingError('Please fill in all required fields.');
      return;
    }
    setBookingLoading(true);
    try {
      const scheduledAt = new Date(`${sessionDate}T${sessionTime}`).toISOString();
      await createSession({
        title: sessionTitle,
        description: sessionDesc,
        type: 'ONE_TO_ONE',
        scheduledAt,
        maxParticipants: 1,
        mentorProfileId: mentor.id,
      });
      setBookingSuccess(true);
      setSessionTitle(''); setSessionDesc(''); setSessionDate(''); setSessionTime('');
      setTimeout(() => { setShowModal(false); setBookingSuccess(false); navigate('/sessions'); }, 2000);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book session');
    } finally {
      setBookingLoading(false);
    }
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
      // Refresh mentor to update avgRating
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--status-danger)" style={{ marginBottom: '16px' }} />
        <h3>Mentor profile not found</h3>
        <button onClick={() => navigate('/mentors')} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Back to Directory
        </button>
      </div>
    );
  }

  const mentorName = mentor.user?.fullName || 'Anonymous';
  const initials = mentorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const isOwnProfile = currentUser?.id === mentor.userId;
  const rating = mentor.avgRating ? parseFloat(mentor.avgRating).toFixed(1) : '5.0';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade">
      {/* Hero Header */}
      <div className="glass-panel" style={{
        padding: '36px', marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(6,182,212,0.05) 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          top: '-100px', right: '-60px', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', position: 'relative' }}>
          {/* Avatar */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '24px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 800, color: '#FFF',
            boxShadow: '0 8px 32px rgba(139,92,246,0.4)',
          }}>{initials}</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 4px' }}>{mentorName}</h1>
                <p style={{ color: 'var(--color-secondary)', fontWeight: 600, fontSize: '1rem', margin: '0 0 12px' }}>
                  {mentor.headline || 'Expert Mentor'}
                </p>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <InfoChip icon={<GraduationCap size={15} />} text={`${mentor.collegeName || 'N/A'} · ${mentor.graduationYear || 'N/A'}`} />
                  <InfoChip icon={<Award size={15} />} text={mentor.branch || 'General'} />
                  <InfoChip
                    icon={<Star size={15} fill="var(--status-warning)" color="var(--status-warning)" />}
                    text={`${rating} (${mentor.ratingCount || 0} reviews)`}
                    color="var(--status-warning)"
                  />
                </div>
              </div>

              {!isOwnProfile && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    to={`/chat?userId=${mentor.userId}`}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <MessageCircle size={16} /> Message
                  </Link>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Video size={16} /> Book Session
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: '32px', marginTop: '28px',
          paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <StatItem value={rating} label="Rating" />
          <StatItem value={mentor.ratingCount || 0} label="Reviews" />
          <StatItem value={`$${mentor.hourlyRate || 0}`} label="Per Hour" highlight />
          <StatItem value={mentor.isAvailable ? '✓' : '—'} label="Available" color={mentor.isAvailable ? 'var(--status-success)' : 'var(--text-muted)'} />
        </div>
      </div>

      {/* Tabs + Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        <div>
          {/* Tab Bar */}
          <div style={{
            display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px', padding: '4px', marginBottom: '24px', width: 'fit-content',
          }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem',
                background: activeTab === tab ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab ? '#FFF' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>{tab}</button>
            ))}
          </div>

          {/* Tab: About */}
          {activeTab === 'About' && (
            <div className="glass-panel animate-scale" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                About {mentorName}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                {mentor.bio || `${mentorName} is an experienced mentor helping students and professionals achieve their goals. Book a session to get personalized guidance.`}
              </p>
            </div>
          )}

          {/* Tab: Expertise */}
          {activeTab === 'Expertise' && (
            <div className="glass-panel animate-scale" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                Expertise & Skills
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {(mentor.expertiseTags || []).length > 0
                  ? mentor.expertiseTags.map((tag, idx) => (
                    <span key={idx} style={{
                      padding: '8px 18px', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600,
                      background: idx % 3 === 0 ? 'var(--color-primary-glow)' : idx % 3 === 1 ? 'var(--color-secondary-glow)' : 'rgba(236,72,153,0.1)',
                      color: idx % 3 === 0 ? 'var(--color-primary)' : idx % 3 === 1 ? 'var(--color-secondary)' : 'var(--color-accent)',
                      border: `1px solid ${idx % 3 === 0 ? 'rgba(139,92,246,0.25)' : idx % 3 === 1 ? 'rgba(6,182,212,0.25)' : 'rgba(236,72,153,0.25)'}`,
                    }}>{tag}</span>
                  ))
                  : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No expertise tags listed yet.</p>
                }
              </div>
            </div>
          )}

          {/* Tab: Reviews */}
          {activeTab === 'Reviews' && (
            <div className="animate-scale" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Submit Review (students only) */}
              {currentUser?.role === 'STUDENT' && !isOwnProfile && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Write a Review</h3>
                  {reviewSuccess && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '10px 14px', color: 'var(--status-success)', fontSize: '0.875rem', marginBottom: '16px' }}>
                      ✅ Review submitted successfully!
                    </div>
                  )}
                  {reviewError && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#FCA5A5', fontSize: '0.875rem', marginBottom: '16px' }}>
                      {reviewError}
                    </div>
                  )}
                  <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Your Rating</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setReviewRating(star)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                          >
                            <Star size={28}
                              fill={(hoverRating || reviewRating) >= star ? '#F59E0B' : 'transparent'}
                              color="#F59E0B"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Comment (optional)</label>
                      <textarea className="input-field" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                        placeholder="Share your experience with this mentor..."
                        value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={reviewLoading} style={{ width: '100%' }}>
                      {reviewLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
                  All Reviews <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.875rem' }}>({reviews.length})</span>
                </h3>
                {reviewsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                  </div>
                ) : reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <BookOpen size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Availability */}
          {activeTab === 'Availability' && (
            <div className="glass-panel animate-scale" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                Availability Schedule
              </h2>
              {(mentor.availability || []).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  This mentor hasn't set up their availability schedule yet. Book a session and they'll confirm a time.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mentor.availability.map((slot, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px', border: '1px solid var(--border-color)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={16} color="var(--color-primary)" />
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][slot.dayOfWeek] || slot.dayOfWeek}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Clock size={14} />
                        {slot.startTime} – {slot.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Booking Panel */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div className="glass-panel" style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(6,182,212,0.04) 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Session Rate</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-secondary)', lineHeight: 1 }}>
                  ${mentor.hourlyRate || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per hour</div>
              </div>
            </div>

            {/* Rating summary */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
              background: 'rgba(245,158,11,0.08)', borderRadius: '10px', marginBottom: '20px',
              border: '1px solid rgba(245,158,11,0.2)',
            }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} fill={i <= Math.round(parseFloat(rating)) ? '#F59E0B' : 'transparent'} color="#F59E0B" />
                ))}
              </div>
              <span style={{ fontWeight: 700, color: '#F59E0B' }}>{rating}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>· {mentor.ratingCount || 0} reviews</span>
            </div>

            {isOwnProfile ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
                This is your public mentor profile.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Calendar size={18} /> Book a Session
                </button>
                <Link
                  to={`/chat?userId=${mentor.userId}`}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '14px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <MessageCircle size={18} /> Send a Message
                </Link>
              </div>
            )}

            {/* Trust badges */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              {[
                '✅ Verified mentor profile',
                '🔒 Secure payment processing',
                '📅 Easy rescheduling',
                '💯 Satisfaction guaranteed',
              ].map((badge, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '4px 0' }}>{badge}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 5000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s',
        }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '480px', padding: '32px', margin: '20px',
            animation: 'scaleIn 0.3s ease', position: 'relative',
          }}>
            <button onClick={() => setShowModal(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px',
              padding: '6px', cursor: 'pointer', color: 'var(--text-muted)',
            }}><X size={18} /></button>

            <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Book Session with {mentorName}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Rate: <strong style={{ color: 'var(--color-secondary)' }}>${mentor.hourlyRate}/hr</strong>
            </p>

            {bookingError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#FCA5A5', fontSize: '0.875rem', marginBottom: '16px' }}>
                {bookingError}
              </div>
            )}
            {bookingSuccess && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '10px 14px', color: 'var(--status-success)', fontSize: '0.875rem', marginBottom: '16px' }}>
                ✅ Session booked! Redirecting to your sessions...
              </div>
            )}

            <form onSubmit={handleBookSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Session Topic *</label>
                <input type="text" className="input-field" style={{ width: '100%' }}
                  placeholder="e.g. Mock Interview Prep, Career Guidance" required
                  value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Additional Notes</label>
                <textarea className="input-field" style={{ width: '100%', minHeight: '70px', resize: 'vertical' }}
                  placeholder="What do you want to focus on?"
                  value={sessionDesc} onChange={e => setSessionDesc(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Date *</label>
                  <input type="date" className="input-field" style={{ width: '100%' }}
                    min={new Date().toISOString().split('T')[0]} required
                    value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Time *</label>
                  <input type="time" className="input-field" style={{ width: '100%' }}
                    required value={sessionTime} onChange={e => setSessionTime(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={bookingLoading || bookingSuccess}
                style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {bookingLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : (
                  <><Calendar size={18} /> Confirm Booking</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

function InfoChip({ icon, text, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: color || 'var(--text-muted)' }}>
      {icon} {text}
    </div>
  );
}

function StatItem({ value, label, highlight, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: color || (highlight ? 'var(--color-secondary)' : 'var(--text-main)') }}>
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function ReviewCard({ review }) {
  const date = new Date(review.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  const initials = review.author?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <div style={{
      padding: '16px', background: 'rgba(255,255,255,0.02)',
      borderRadius: '12px', border: '1px solid var(--border-color)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#FFF', flexShrink: 0,
          }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{review.author?.fullName || 'Anonymous'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{date}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={14} fill={i <= review.rating ? '#F59E0B' : 'transparent'} color="#F59E0B" />
          ))}
        </div>
      </div>
      {review.comment && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          {review.comment}
        </p>
      )}
    </div>
  );
}
