import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../socket/socket';
import { useAuthStore } from '../store/useAuthStore';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Hand,
  ScreenShare, ScreenShareOff, Maximize2, Minimize2, Users,
  Download, Sparkles,
} from 'lucide-react';

/**
 * Real WebRTC peer-to-peer video call component.
 * Uses Socket.IO as signaling server with Google STUN for NAT traversal.
 * UI restored from the original glassmorphism design, with the newer
 * Chat / Notes / AI Summary / Files sidebar merged in.
 */
export default function VideoCall({ session, targetUserId, targetName, onClose }) {
  const { user } = useAuthStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const callIdRef = useRef(null);

  const [callState, setCallState] = useState('connecting'); // connecting | active | ended
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [pip, setPip] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Collaboration sidebar state ──
  const [activeTab, setActiveTab] = useState('Chat');
  const [sharedNotes, setSharedNotes] = useState('// Document your session insights here...\n\n');
  const [sharedFiles, setSharedFiles] = useState([
    { name: 'resume_v2.pdf', size: '240 KB' },
    { name: 'system_design_sketch.png', size: '1.2 MB' },
  ]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // ── AI meeting summarizer state ──
  const [aiSummary, setAiSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Timer
  useEffect(() => {
    let timer;
    if (callState === 'active') {
      timer = setInterval(() => setCallTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const socket = getSocket();

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', {
          targetId: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setRemoteConnected(true);
      setCallState('active');
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleEndCall();
      }
    };

    return pc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  // Get local media and setup signaling
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    let isMounted = true;

    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection();
        pcRef.current = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        socket.emit('webrtc:call-request', {
          calleeId: targetUserId,
          sessionId: session?.id,
          callerName: user.fullName,
        });
      } catch (err) {
        console.error('Failed to get media:', err);
        const pc = createPeerConnection();
        pcRef.current = pc;
      }
    };

    const onCallAccepted = async ({ callId }) => {
      callIdRef.current = callId;
      if (!pcRef.current) return;
      try {
        const offer = await pcRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pcRef.current.setLocalDescription(offer);
        socket.emit('webrtc:offer', {
          calleeId: targetUserId,
          sdp: offer,
          callId,
        });
      } catch (err) {
        console.error('Failed to create offer:', err);
      }
    };

    const onOffer = async ({ sdp, callId, callerId }) => {
      callIdRef.current = callId;
      if (!pcRef.current) {
        const pc = createPeerConnection();
        pcRef.current = pc;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
        } catch (err) {
          console.error('Media error on answer side:', err);
        }
      }
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('webrtc:answer', { callerId, sdp: answer, callId });
        setCallState('active');
      } catch (err) {
        console.error('Failed to answer:', err);
      }
    };

    const onAnswer = async ({ sdp }) => {
      try {
        if (pcRef.current && pcRef.current.signalingState !== 'stable') {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          setCallState('active');
        }
      } catch (err) {
        console.error('Failed to set remote description:', err);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      try {
        if (pcRef.current && candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Failed to add ICE candidate:', err);
      }
    };

    const onCallEnded = () => {
      if (isMounted) handleEndCall();
    };

    const onCallInitiated = ({ callId }) => {
      callIdRef.current = callId;
    };

    // Optional: receive chat messages from the other participant
    const onChatMessage = ({ sender, text }) => {
      setChatMessages(prev => [...prev, { sender, text }]);
    };

    socket.on('webrtc:call-initiated', onCallInitiated);
    socket.on('webrtc:call-accepted', onCallAccepted);
    socket.on('webrtc:offer', onOffer);
    socket.on('webrtc:answer', onAnswer);
    socket.on('webrtc:ice-candidate', onIceCandidate);
    socket.on('webrtc:call-ended', onCallEnded);
    socket.on('webrtc:chat-message', onChatMessage);

    startCall();

    return () => {
      isMounted = false;
      socket.off('webrtc:call-initiated', onCallInitiated);
      socket.off('webrtc:call-accepted', onCallAccepted);
      socket.off('webrtc:offer', onOffer);
      socket.off('webrtc:answer', onAnswer);
      socket.off('webrtc:ice-candidate', onIceCandidate);
      socket.off('webrtc:call-ended', onCallEnded);
      socket.off('webrtc:chat-message', onChatMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, createPeerConnection, session]);

  const handleEndCall = () => {
    const socket = getSocket();
    if (socket && targetUserId) {
      socket.emit('webrtc:call-ended', { targetId: targetUserId, callId: callIdRef.current });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    setCallState('ended');
    setTimeout(() => onClose(), 500);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setMuted(m => !m);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setVideoOff(v => !v);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setScreenSharing(false);
      } catch (err) {
        console.error('Failed to revert to camera:', err);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
        if (localVideoRef.current) {
          const newStream = new MediaStream([screenTrack, ...localStreamRef.current.getAudioTracks()]);
          localVideoRef.current.srcObject = newStream;
        }
        screenTrack.onended = () => setScreenSharing(false);
        setScreenSharing(true);
      } catch (err) {
        console.error('Screen share failed:', err);
      }
    }
  };

  const handleSendCallChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const socket = getSocket();
    const msg = { sender: user.fullName, text: chatInput.trim() };
    setChatMessages(prev => [...prev, msg]);
    if (socket && targetUserId) {
      socket.emit('webrtc:chat-message', { targetId: targetUserId, ...msg });
    }
    setChatInput('');
  };

  const handleGenerateSummary = () => {
    setSummarizing(true);
    setActiveTab('AI Summary');
    setTimeout(() => {
      setAiSummary(
        '• Discussed system architecture bottleneck in resume_v2.pdf.\n' +
        '• Defined action items to explore Redis caching for high load.\n' +
        '• Scheduled next mock coding interview session.'
      );
      setSummarizing(false);
    }, 1500);
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#080b13',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: callState === 'active' ? '#10B981' : '#F59E0B',
            boxShadow: callState === 'active' ? '0 0 8px #10B981' : '0 0 8px #F59E0B',
            animation: callState !== 'active' ? 'pulse 1.5s infinite' : 'none',
          }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: '#FFF' }}>
              {session?.title || `Session with ${targetName}`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              {callState === 'connecting' ? 'Connecting...' : callState === 'active' ? `Live · ${formatTime(callTime)}` : 'Call ended'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleGenerateSummary}
            disabled={summarizing}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, var(--color-primary), #7c3aed)',
              border: 'none', borderRadius: '999px', padding: '8px 16px',
              cursor: summarizing ? 'default' : 'pointer', color: '#FFF',
              fontSize: '0.82rem', fontWeight: 600, opacity: summarizing ? 0.7 : 1,
            }}
          >
            <Sparkles size={14} />
            {summarizing ? 'Analyzing...' : 'AI Session Summary'}
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.06)', padding: '6px 14px',
            borderRadius: '999px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)',
          }}>
            <Users size={14} />
            <span>{remoteConnected ? '2 Connected' : 'Waiting for other participant...'}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(s => !s)}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}
          >
            {sidebarOpen ? 'Hide Panel' : 'Show Panel'}
          </button>
          <button
            onClick={() => setPip(p => !p)}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
          >
            {pip ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Main Body: video grid + collaboration sidebar */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Video Grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: remoteConnected ? '1fr 1fr' : '1fr',
          gap: '16px',
          padding: '20px',
          minHeight: 0,
        }}>
          {/* Remote Video */}
          {remoteConnected && (
            <div style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#0f1520',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              />
              <div style={{
                position: 'absolute', bottom: '16px', left: '16px',
                background: 'rgba(0,0,0,0.7)', padding: '4px 12px',
                borderRadius: '999px', fontSize: '0.82rem', color: '#FFF',
                backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                {targetName}
              </div>
            </div>
          )}

          {/* Local Video */}
          <div style={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            background: '#131c2e',
            border: handRaised ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: handRaised ? '0 0 20px rgba(139,92,246,0.4)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                position: 'absolute', inset: 0,
                display: videoOff ? 'none' : 'block',
                transform: 'scaleX(-1)',
              }}
            />
            {videoOff && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary), #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 700, color: '#FFF', margin: '0 auto 12px',
                  boxShadow: '0 0 30px rgba(139,92,246,0.4)',
                }}>
                  {initials(user.fullName)}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Camera Off</div>
              </div>
            )}
            {callState === 'connecting' && !remoteConnected && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', background: 'rgba(8,11,19,0.85)',
              }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-secondary), #0891b2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 700, color: '#FFF',
                  animation: 'ringPulse 1.5s infinite',
                  marginBottom: '16px',
                }}>
                  {initials(targetName)}
                </div>
                <div style={{ color: '#FFF', fontSize: '1.1rem', fontWeight: 600 }}>Calling {targetName}...</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '6px' }}>Waiting to connect</div>
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: '16px', left: '16px',
              background: 'rgba(0,0,0,0.7)', padding: '4px 12px',
              borderRadius: '999px', fontSize: '0.82rem', color: '#FFF',
              backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {muted && <MicOff size={12} color="#EF4444" />}
              You ({user.fullName})
              {handRaised && ' ✋'}
            </div>
          </div>
        </div>

        {/* Collaboration Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: '320px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Chat', 'Notes', 'AI Summary', 'Files'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '12px 4px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                    color: activeTab === tab ? '#FFF' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Chat */}
              {activeTab === 'Chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
                    {chatMessages.length === 0 && (
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', textAlign: 'center', marginTop: '20px' }}>
                        No messages yet
                      </div>
                    )}
                    {chatMessages.map((m, i) => (
                      <div key={i} style={{ fontSize: '0.82rem', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: 'rgba(255,255,255,0.85)' }}>
                        <strong style={{ color: 'var(--color-primary)' }}>{m.sender}:</strong> {m.text}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendCallChat} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Send chat to room..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      style={{
                        flex: 1, height: '36px', padding: '0 10px', borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                        color: '#FFF', fontSize: '0.82rem',
                      }}
                    />
                    <button type="submit" style={{
                      padding: '0 14px', height: '36px', borderRadius: '8px', border: 'none',
                      background: 'var(--color-primary)', color: '#FFF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                    }}>
                      Send
                    </button>
                  </form>
                </div>
              )}

              {/* Notes */}
              {activeTab === 'Notes' && (
                <textarea
                  value={sharedNotes}
                  onChange={e => setSharedNotes(e.target.value)}
                  style={{
                    flex: 1, fontFamily: 'monospace', fontSize: '0.82rem', resize: 'none',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', color: 'rgba(255,255,255,0.85)', padding: '12px',
                  }}
                />
              )}

              {/* AI Summary */}
              {activeTab === 'AI Summary' && (
                <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                  {aiSummary ? (
                    <div>
                      <h5 style={{ margin: '0 0 8px', color: 'var(--color-primary)', fontWeight: 700 }}>AI ACTION ITEMS & SUMMARY</h5>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'rgba(255,255,255,0.8)' }}>{aiSummary}</pre>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)' }}>
                      <p>Click "AI Session Summary" in the header to synthesize action items and a meeting brief.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Files */}
              {activeTab === 'Files' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sharedFiles.map((file, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: '#FFF' }}>{file.name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{file.size}</span>
                      </div>
                      <button
                        onClick={() => alert('Downloading file...')}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        padding: '20px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
      }}>
        <ControlBtn
          onClick={toggleMute}
          active={muted}
          activeColor="#EF4444"
          icon={muted ? <MicOff size={20} /> : <Mic size={20} />}
          label={muted ? 'Unmute' : 'Mute'}
        />
        <ControlBtn
          onClick={toggleVideo}
          active={videoOff}
          activeColor="#EF4444"
          icon={videoOff ? <VideoOff size={20} /> : <Video size={20} />}
          label={videoOff ? 'Start Video' : 'Stop Video'}
        />
        <ControlBtn
          onClick={toggleScreenShare}
          active={screenSharing}
          activeColor="var(--color-secondary)"
          icon={screenSharing ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
          label={screenSharing ? 'Stop Share' : 'Share Screen'}
        />
        <ControlBtn
          onClick={() => setHandRaised(h => !h)}
          active={handRaised}
          activeColor="var(--color-primary)"
          icon={<Hand size={20} />}
          label={handRaised ? 'Lower Hand' : 'Raise Hand'}
        />
        <button
          onClick={handleEndCall}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            background: '#EF4444', border: 'none', borderRadius: '14px',
            padding: '14px 28px', cursor: 'pointer', color: '#FFF',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem',
            boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
          onMouseLeave={e => e.currentTarget.style.background = '#EF4444'}
        >
          <PhoneOff size={20} />
          Leave
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(6,182,212,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(6,182,212,0); }
        }
      `}</style>
    </div>
  );
}

function ControlBtn({ onClick, active, activeColor, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        background: active ? `${activeColor}22` : 'rgba(255,255,255,0.08)',
        border: `1px solid ${active ? activeColor : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '14px', padding: '12px 20px', cursor: 'pointer',
        color: active ? activeColor : 'rgba(255,255,255,0.8)',
        fontSize: '0.75rem', fontFamily: 'var(--font-sans)',
        transition: 'all 0.2s',
        minWidth: '72px',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = active ? `${activeColor}33` : 'rgba(255,255,255,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? `${activeColor}22` : 'rgba(255,255,255,0.08)'; }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}