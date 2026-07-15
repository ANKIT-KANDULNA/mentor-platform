import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSessions, updateSessionStatus } from '../api/session.api';
import { Calendar, Video, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronRight, Users, Play, Clock3 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import VideoCall from '../components/VideoCall';
import { getSocket, connectSocket } from '../socket/socket';

export default function Session() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
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
  const upcoming = sessions.filter(s => (s.status === 'SCHEDULED' || s.status === 'PENDING') && new Date(s.scheduledAt) >= now);
  const past = sessions.filter(s => (s.status !== 'SCHEDULED' && s.status !== 'PENDING') || new Date(s.scheduledAt) < now);
  const displayedSessions = activeTab === 'upcoming' ? upcoming : past;

  return (
    <>
      {/* Incoming Call Toast */}
      {incomingCall && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 8000,
          background: 'var(--bg-surface)', border: '1px solid var(--color-primary)',
          borderRadius: '16px', padding: '20px 24px',
          boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '16px',
          minWidth: '300px', animation: 'slideInRight 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar" style={{
              width: '48px', height: '48px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: 700,
            }}>{incomingCall.callerName?.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.95rem' }}>Incoming Call</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{incomingCall.callerName} is calling...</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleAcceptIncomingCall} className="btn-primary" style={{ flex: 1, padding: '8px' }}>
              Accept
            </button>
            <button onClick={handleRejectIncomingCall} className="btn-secondary" style={{ flex: 1, padding: '8px', color: 'var(--status-danger)' }}>
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Active Video Call Overlay */}
      {activeCall && (
        <VideoCall
          session={activeCall.session}
          targetUserId={activeCall.targetUserId}
          targetName={activeCall.targetName}
          onClose={() => setActiveCall(null)}
        />
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '16px' }} className="animate-fade">
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--text-main)', margin: '0 0 4px 0' }}>My Sessions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Review, approve, and join scheduled collaboration sessions.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {['upcoming', 'past'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem',
              background: activeTab === tab ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab ? '#FFF' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
          </div>
        ) : displayedSessions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📅</span>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px' }}>You're all caught up!</h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>No upcoming sessions. Book a slot with a mentor.</p>
          </div>
        ) : (
          <div className="timeline-container">
            {displayedSessions.map((session, idx) => {
              const scheduledDate = new Date(session.scheduledAt);
              const dateStr = scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isUpcoming = new Date() < scheduledDate;
              const isUpdating = updatingId === session.id;

              let markerClass = 'pending';
              if (session.status === 'COMPLETED') markerClass = 'completed';
              if (session.status === 'SCHEDULED' || session.status === 'LIVE') markerClass = 'active';

              return (
                <div key={session.id} className="timeline-item">
                  {/* Circle marker */}
                  <div className={`timeline-marker ${markerClass}`} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '20px 24px', borderRadius: '14px', marginLeft: '12px' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {dateStr} · {timeStr}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                          {session.status}
                        </span>
                      </div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{session.title}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        with <strong>{user.role === 'MENTOR' ? session.creator?.fullName : session.mentorProfile?.user?.fullName}</strong>
                      </p>
                    </div>

                    {/* Actions block */}
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                      {session.status === 'PENDING' && user.role === 'MENTOR' && (
                        <>
                          <button onClick={() => handleStatusUpdate(session.id, 'SCHEDULED')} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                            Accept
                          </button>
                          <button onClick={() => handleStatusUpdate(session.id, 'CANCELLED')} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem', color: 'var(--status-danger)' }}>
                            Decline
                          </button>
                        </>
                      )}

                      {session.status === 'PENDING' && user.role !== 'MENTOR' && (
                        <button onClick={() => handleStatusUpdate(session.id, 'CANCELLED')} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem', color: 'var(--status-danger)' }}>
                          Cancel Request
                        </button>
                      )}

                      {session.status === 'SCHEDULED' && isUpcoming && (
                        <button onClick={() => handleJoinCall(session)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Play size={14} /> Join Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
