import React, { useState, useEffect, useCallback } from 'react';
import { getSessions, updateSessionStatus } from '../api/session.api';
import { Calendar, Video, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronRight, Users } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import VideoCall from '../components/VideoCall';
import { getSocket, connectSocket } from '../socket/socket';

/**
 * Hub showing booked mentorship slots with real WebRTC video calling.
 * Mentors can accept/cancel sessions; both parties can join via real video.
 */
export default function Session() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null); // { session, targetUserId, targetName }
  const [incomingCall, setIncomingCall] = useState(null); // { callId, callerId, callerName, sessionId }
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    connectSocket();

    const socket = getSocket();
    if (socket) {
      // Listen for incoming call requests
      socket.on('webrtc:incoming-call', ({ callId, callerId, callerName, sessionId }) => {
        setIncomingCall({ callId, callerId, callerName, sessionId });
      });
      socket.on('webrtc:call-ended', () => {
        setActiveCall(null);
      });
    }

    return () => {
      const s = getSocket();
      if (s) {
        s.off('webrtc:incoming-call');
        s.off('webrtc:call-ended');
      }
    };
  }, [fetchSessions]);

  const handleStatusUpdate = async (sessionId, status) => {
    setUpdatingId(sessionId);
    try {
      await updateSessionStatus(sessionId, status);
      await fetchSessions();
    } catch (err) {
      console.error('Failed to update session status:', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleJoinCall = (session) => {
    const isMentor = user.role === 'MENTOR';
    const targetUser = isMentor ? session.creator : session.mentorProfile?.user;
    const targetUserId = targetUser?.id;
    const targetName = targetUser?.fullName || 'Participant';

    // Accept incoming call if pending
    const socket = getSocket();
    if (incomingCall && socket) {
      socket.emit('webrtc:call-accepted', {
        callId: incomingCall.callId,
        callerId: incomingCall.callerId,
      });
      setIncomingCall(null);
    }

    setActiveCall({ session, targetUserId, targetName });
  };

  const handleAcceptIncomingCall = () => {
    const socket = getSocket();
    if (!incomingCall || !socket) return;

    // Find the session associated with this call
    const session = sessions.find(s => s.id === incomingCall.sessionId) || sessions[0];

    socket.emit('webrtc:call-accepted', {
      callId: incomingCall.callId,
      callerId: incomingCall.callerId,
    });

    setActiveCall({
      session,
      targetUserId: incomingCall.callerId,
      targetName: incomingCall.callerName,
    });
    setIncomingCall(null);
  };

  const handleRejectIncomingCall = () => {
    const socket = getSocket();
    if (!incomingCall || !socket) return;
    socket.emit('webrtc:call-rejected', {
      callId: incomingCall.callId,
      callerId: incomingCall.callerId,
    });
    setIncomingCall(null);
  };

  const now = new Date();
  const upcoming = sessions.filter(s => s.status === 'SCHEDULED' && new Date(s.scheduledAt) >= now);
  const past = sessions.filter(s => s.status !== 'SCHEDULED' || new Date(s.scheduledAt) < now);
  const displayedSessions = activeTab === 'upcoming' ? upcoming : past;

  return (
    <>
      {/* Incoming Call Toast */}
      {incomingCall && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 8000,
          background: 'linear-gradient(135deg, #1a1f35, #0f1520)',
          border: '1px solid rgba(139,92,246,0.4)',
          borderRadius: '16px', padding: '20px 24px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.2)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: '16px',
          minWidth: '300px', animation: 'slideInRight 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: 700, color: '#FFF',
              animation: 'ringPulse 1s infinite',
            }}>
              {incomingCall.callerName?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.95rem' }}>Incoming Call</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>{incomingCall.callerName} is calling...</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleAcceptIncomingCall} className="btn" style={{
              flex: 1, background: '#10B981', color: '#FFF', padding: '10px',
              borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
            }}>
              ✅ Accept
            </button>
            <button onClick={handleRejectIncomingCall} className="btn" style={{
              flex: 1, background: 'rgba(239,68,68,0.2)', color: '#EF4444', padding: '10px',
              borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
              border: '1px solid rgba(239,68,68,0.3)',
            }}>
              ❌ Decline
            </button>
          </div>
        </div>
      )}

      {/* Active Video Call */}
      {activeCall && (
        <VideoCall
          session={activeCall.session}
          targetUserId={activeCall.targetUserId}
          targetName={activeCall.targetName}
          onClose={() => setActiveCall(null)}
        />
      )}

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }} className="animate-fade">
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            My Sessions
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Manage your mentorship sessions and join live video calls
          </p>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {['upcoming', 'past'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem',
              background: activeTab === tab ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab ? '#FFF' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{
                marginLeft: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '999px',
                padding: '1px 7px', fontSize: '0.75rem',
              }}>
                {tab === 'upcoming' ? upcoming.length : past.length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
          </div>
        ) : displayedSessions.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {displayedSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                user={user}
                updatingId={updatingId}
                onStatusUpdate={handleStatusUpdate}
                onJoinCall={handleJoinCall}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(139,92,246,0); }
        }
      `}</style>
    </>
  );
}

function SessionCard({ session, user, updatingId, onStatusUpdate, onJoinCall }) {
  const isMentor = user.role === 'MENTOR';
  const oppositeParty = isMentor ? session.creator?.fullName : session.mentorProfile?.user?.fullName;
  const scheduledDate = new Date(session.scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  const timeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isUpcoming = new Date() < scheduledDate;

  const statusConfig = {
    SCHEDULED: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Scheduled', icon: <CheckCircle2 size={14} /> },
    LIVE: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: '🔴 LIVE', icon: null },
    COMPLETED: { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', label: 'Completed', icon: <CheckCircle2 size={14} /> },
    CANCELLED: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'Cancelled', icon: <XCircle size={14} /> },
  };
  const status = statusConfig[session.status] || statusConfig.SCHEDULED;
  const isUpdating = updatingId === session.id;

  return (
    <div className="glass-card animate-slide" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: '999px',
          background: status.bg, color: status.color, fontSize: '0.75rem', fontWeight: 700,
        }}>
          {status.icon}
          {status.label}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{dateStr}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
            <Clock size={12} /> {timeStr}
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--text-main)' }}>{session.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Users size={14} />
          <span>with <strong style={{ color: 'var(--text-main)' }}>{oppositeParty || 'Unknown'}</strong></span>
        </div>
        {session.description && (
          <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {session.description}
          </p>
        )}
      </div>

      {/* Session type badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'var(--color-primary-glow)', color: 'var(--color-primary)',
        padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
        width: 'fit-content', border: '1px solid rgba(139,92,246,0.2)',
      }}>
        <Video size={12} />
        {session.type?.replace('_', ' ')}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
        {session.status === 'SCHEDULED' && isMentor && (
          <button
            onClick={() => onStatusUpdate(session.id, 'CANCELLED')}
            disabled={isUpdating}
            style={{
              flex: '0 0 auto', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
              background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '0.82rem',
            }}
          >
            {isUpdating ? '...' : 'Cancel'}
          </button>
        )}

        {session.status === 'SCHEDULED' && isUpcoming && (
          <button
            onClick={() => onJoinCall(session)}
            className="btn btn-accent"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
          >
            <Video size={16} />
            Join Video Call
            <ChevronRight size={16} />
          </button>
        )}

        {session.status === 'SCHEDULED' && !isUpcoming && (
          <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '10px' }}>
            Session time has passed
          </div>
        )}

        {session.status === 'COMPLETED' && (
          <div style={{ flex: 1, textAlign: 'center', color: 'var(--status-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} /> Session completed
          </div>
        )}

        {session.status === 'CANCELLED' && (
          <div style={{ flex: 1, textAlign: 'center', color: 'var(--status-danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <XCircle size={14} /> Cancelled
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ activeTab }) {
  return (
    <div className="glass-panel" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Calendar size={56} style={{ marginBottom: '16px', color: 'var(--text-dark)', opacity: 0.6 }} />
      <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '8px' }}>
        {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
      </h3>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>
        {activeTab === 'upcoming'
          ? 'Browse the mentor directory to book a session.'
          : 'Your completed sessions will appear here.'}
      </p>
    </div>
  );
}
