import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { createConversation } from '../api/chat.api';
import { connectSocket, getSocket } from '../socket/socket';
import SOCKET_EVENTS from '../constants/events';
import VideoCall from '../components/VideoCall';
import {
  Send, Search, Video, Phone, MoreVertical, Smile, Paperclip,
  Loader, ArrowLeft, Circle, X, MessageSquare,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Emoji Picker (lightweight, no dependency)
───────────────────────────────────────────── */
const EMOJI_ROWS = [
  ['😀','😂','🥲','😍','🥰','😎','🤩','😭','😤','🤔'],
  ['👍','👎','🙏','🤝','✌️','🔥','💯','🎉','❤️','💜'],
  ['🚀','⭐','💡','📌','📎','🎯','🌟','💪','🧠','🤖'],
];

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', bottom: '64px', left: '16px',
      background: 'rgba(20,26,40,0.98)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
      padding: '12px', zIndex: 100, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      animation: 'scaleIn 0.15s ease forwards',
    }}>
      {EMOJI_ROWS.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: '4px', marginBottom: i < EMOJI_ROWS.length - 1 ? '4px' : 0 }}>
          {row.map(emoji => (
            <button key={emoji} onClick={() => onSelect(emoji)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.4rem', padding: '4px', borderRadius: '8px',
              transition: 'background 0.1s',
              lineHeight: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >{emoji}</button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Avatar Helper
───────────────────────────────────────────── */
function Avatar({ name, size = 40, gradient = 'linear-gradient(135deg,#8B5CF6,#7c3aed)' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: gradient, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#FFF', fontWeight: 700,
      fontSize: size * 0.35, flexShrink: 0, letterSpacing: '0.5px',
    }}>{initials}</div>
  );
}

/* ─────────────────────────────────────────────
   Online dot
───────────────────────────────────────────── */
function OnlineDot({ online }) {
  if (!online) return null;
  return (
    <div style={{
      width: 10, height: 10, borderRadius: '50%',
      background: '#10B981', border: '2px solid var(--bg-main)',
      position: 'absolute', bottom: 0, right: 0,
      boxShadow: '0 0 6px rgba(16,185,129,0.6)',
    }} />
  );
}

/* ─────────────────────────────────────────────
   Time formatting
───────────────────────────────────────────── */
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatConvTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ─────────────────────────────────────────────
   Message Bubble
───────────────────────────────────────────── */
function MessageBubble({ msg, isMine, prevMsg }) {
  const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
  return (
    <div style={{
      display: 'flex',
      justifyContent: isMine ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '4px',
    }}>
      {!isMine && (
        <div style={{ width: 28, flexShrink: 0 }}>
          {showAvatar && (
            <Avatar name={msg.sender?.fullName || 'U'} size={28}
              gradient="linear-gradient(135deg,#06B6D4,#0891b2)" />
          )}
        </div>
      )}
      <div style={{
        maxWidth: '62%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
        gap: '2px',
      }}>
        <div style={{
          padding: '10px 15px',
          borderRadius: '18px',
          borderBottomRightRadius: isMine ? '4px' : '18px',
          borderBottomLeftRadius: isMine ? '18px' : '4px',
          background: isMine
            ? 'linear-gradient(135deg,#8B5CF6,#7c3aed)'
            : 'rgba(30,38,55,0.9)',
          color: '#FFF',
          fontSize: '0.9rem',
          lineHeight: '1.45',
          wordBreak: 'break-word',
          boxShadow: isMine
            ? '0 4px 12px rgba(139,92,246,0.25)'
            : '0 2px 8px rgba(0,0,0,0.2)',
          border: isMine ? 'none' : '1px solid rgba(255,255,255,0.07)',
        }}>
          {msg.content}
        </div>
        <div style={{
          fontSize: '0.68rem',
          color: 'rgba(255,255,255,0.3)',
          padding: '0 4px',
        }}>
          {formatTime(msg.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Date separator
───────────────────────────────────────────── */
function DateSeparator({ dateStr }) {
  const label = (() => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  })();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 8px' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
      <span style={{
        fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)',
        background: 'rgba(255,255,255,0.05)', padding: '3px 12px',
        borderRadius: '999px', letterSpacing: '0.5px', whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Chat Component
───────────────────────────────────────────── */
export default function Chat() {
  const { user: currentUser } = useAuthStore();
  const {
    conversations, activeConversation, messages, loading,
    getConversations, setActiveConversation, addMessage,
    sendMessage, setUserTyping, typingUsers,
  } = useChatStore();

  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeCall, setActiveCall] = useState(null); // { targetUserId, targetName }
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, callId }
  const [unreadCounts, setUnreadCounts] = useState({});
  const [mobileSidebar, setMobileSidebar] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('userId');

  // ── Socket setup ──────────────────────────
  useEffect(() => {
    getConversations();
    connectSocket();

    const socket = getSocket();
    if (!socket) return;

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, (msg) => {
      addMessage(msg);
      // Track unread
      const active = useChatStore.getState().activeConversation;
      if (!active || active.id !== msg.conversationId) {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.conversationId]: (prev[msg.conversationId] || 0) + 1,
        }));
      }
    });

    socket.on(SOCKET_EVENTS.USER_TYPING, ({ userId, conversationId }) => {
      if (userId !== currentUser.id) setUserTyping(conversationId, userId, true);
    });

    socket.on(SOCKET_EVENTS.USER_STOP_TYPING, ({ userId, conversationId }) => {
      if (userId !== currentUser.id) setUserTyping(conversationId, userId, false);
    });

    socket.on(SOCKET_EVENTS.ONLINE_USERS, (users) => setOnlineUsers(users));

    // WebRTC incoming call
    socket.on('webrtc:call-request', ({ callerId, callerName, sessionId }) => {
      setIncomingCall({ callerId, callerName, sessionId });
    });

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
      socket.off(SOCKET_EVENTS.USER_TYPING);
      socket.off(SOCKET_EVENTS.USER_STOP_TYPING);
      socket.off(SOCKET_EVENTS.ONLINE_USERS);
      socket.off('webrtc:call-request');
    };
  }, [getConversations, addMessage, setUserTyping, currentUser.id]);

  // ── Auto-start conversation from URL ──────
  useEffect(() => {
    const startNewConv = async () => {
      if (targetUserId) {
        try {
          const data = await createConversation(targetUserId);
          const newConv = data.data;
          setActiveConversation(newConv);
          setUnreadCounts(prev => ({ ...prev, [newConv.id]: 0 }));
          getConversations();
          setMobileSidebar(false);
        } catch (err) {
          console.error('Failed to create conversation:', err.message);
        }
      }
    };
    startNewConv();
  }, [targetUserId, setActiveConversation, getConversations]);

  // ── Scroll to bottom ──────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Room join/leave ───────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (socket && activeConversation) {
      socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId: activeConversation.id });
      setUnreadCounts(prev => ({ ...prev, [activeConversation.id]: 0 }));
    }
    return () => {
      const socket = getSocket();
      if (socket && activeConversation) {
        socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId: activeConversation.id });
      }
    };
  }, [activeConversation]);

  // ── Helpers ───────────────────────────────
  const getOpponentUser = useCallback((conv) => {
    return conv.userAId === currentUser.id ? conv.userB : conv.userA;
  }, [currentUser.id]);

  const activeOpponent = activeConversation ? getOpponentUser(activeConversation) : null;
  const isOpponentOnline = activeOpponent && onlineUsers.includes(activeOpponent.id);
  const isTyping = activeConversation && typingUsers[activeConversation.id]?.length > 0;

  const filteredConversations = conversations.filter(conv => {
    const opponent = getOpponentUser(conv);
    return opponent?.fullName?.toLowerCase().includes(search.toLowerCase());
  });

  // ── Typing ────────────────────────────────
  const handleKeyDown = () => {
    const socket = getSocket();
    if (socket && activeConversation) {
      socket.emit(SOCKET_EVENTS.TYPING, { conversationId: activeConversation.id });
      clearTimeout(window._typingTimeout);
      window._typingTimeout = setTimeout(() => {
        socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId: activeConversation.id });
      }, 2000);
    }
  };

  // ── Send ──────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;
    const socket = getSocket();
    if (socket) socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId: activeConversation.id });
    try {
      await sendMessage(activeConversation.id, text.trim());
      setText('');
      setShowEmoji(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Send failed:', err.message);
    }
  };

  // ── Select conversation ───────────────────
  const handleSelectConv = (conv) => {
    setActiveConversation(conv);
    setUnreadCounts(prev => ({ ...prev, [conv.id]: 0 }));
    setMobileSidebar(false);
  };

  // ── Date separators ───────────────────────
  const msgsWithDates = (() => {
    const result = [];
    let lastDate = null;
    messages.forEach((msg, i) => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (dateKey !== lastDate) {
        result.push({ type: 'date', key: `date-${i}`, dateStr: msg.createdAt });
        lastDate = dateKey;
      }
      result.push({ type: 'msg', key: msg.id, msg, prev: messages[i - 1] });
    });
    return result;
  })();

  // ── Video call ────────────────────────────
  const startVideoCall = () => {
    if (!activeOpponent) return;
    setActiveCall({
      targetUserId: activeOpponent.id,
      targetName: activeOpponent.fullName,
    });
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      targetUserId: incomingCall.callerId,
      targetName: incomingCall.callerName,
    });
    setIncomingCall(null);
  };

  const rejectCall = () => {
    const socket = getSocket();
    if (socket && incomingCall) {
      socket.emit('webrtc:call-rejected', { callerId: incomingCall.callerId });
    }
    setIncomingCall(null);
  };

  // ─────────────────────────────────────────
  return (
    <>
      {/* Active Video Call overlay */}
      {activeCall && (
        <VideoCall
          targetUserId={activeCall.targetUserId}
          targetName={activeCall.targetName}
          onClose={() => setActiveCall(null)}
        />
      )}

      {/* Incoming Call Toast */}
      {incomingCall && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9998,
          background: 'rgba(20,26,40,0.98)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16,185,129,0.4)', borderRadius: '20px',
          padding: '20px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: '16px',
          animation: 'slideUp 0.3s ease forwards', minWidth: '320px',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg,#10B981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ringPulse 1.5s infinite', flexShrink: 0,
          }}>
            <Video size={22} color="#FFF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFF' }}>
              Incoming Call
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
              {incomingCall.callerName} is calling...
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={acceptIncomingCall} style={{
              background: '#10B981', border: 'none', borderRadius: '12px',
              padding: '8px 14px', cursor: 'pointer', color: '#FFF', fontWeight: 600,
              fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Phone size={14} /> Accept
            </button>
            <button onClick={rejectCall} style={{
              background: '#EF4444', border: 'none', borderRadius: '12px',
              padding: '8px 14px', cursor: 'pointer', color: '#FFF', fontWeight: 600,
              fontSize: '0.82rem',
            }}>Decline</button>
          </div>
        </div>
      )}

      {/* Main Chat Layout */}
      <div className="glass-panel animate-fade" style={{
        display: 'flex',
        height: 'calc(100vh - 110px)',
        padding: 0,
        overflow: 'hidden',
        borderRadius: '20px',
      }}>

        {/* ── Sidebar ─────────────────────────── */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          display: mobileSidebar ? 'flex' : 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(11,14,20,0.6)',
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '20px 18px 12px' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: '1.15rem', marginBottom: '14px',
              background: 'linear-gradient(135deg,#F3F4F6,#9CA3AF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Messages</div>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)',
              }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem', height: '38px' }}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
            {loading && conversations.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{
                padding: '40px 16px', textAlign: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem',
              }}>
                <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                {search ? 'No results found' : 'No conversations yet.\nGo to Mentors to start a chat!'}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const opponent = getOpponentUser(conv);
                const isActive = activeConversation?.id === conv.id;
                const unread = unreadCounts[conv.id] || 0;
                const isOnline = onlineUsers.includes(opponent?.id);
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv)}
                    style={{
                      width: '100%', background: isActive
                        ? 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05))'
                        : 'transparent',
                      border: 'none', borderRadius: '14px',
                      padding: '12px', display: 'flex',
                      alignItems: 'center', gap: '12px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                      borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar name={opponent?.fullName} size={42} />
                      <OnlineDot online={isOnline} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{
                          fontWeight: isActive ? 700 : 600, color: '#F3F4F6',
                          fontSize: '0.88rem', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                        }}>
                          {opponent?.fullName || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: '8px' }}>
                          {formatConvTime(conv.lastMsgAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                        <div style={{
                          color: unread > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                          fontSize: '0.78rem', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                          fontWeight: unread > 0 ? 500 : 400,
                        }}>
                          {conv.lastMessage || 'Say hello!'}
                        </div>
                        {unread > 0 && (
                          <div style={{
                            background: 'var(--color-primary)', color: '#FFF',
                            borderRadius: '999px', minWidth: '18px', height: '18px',
                            padding: '0 5px', fontSize: '0.7rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginLeft: '6px', flexShrink: 0,
                            boxShadow: '0 0 8px rgba(139,92,246,0.5)',
                          }}>
                            {unread > 9 ? '9+' : unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat Pane ───────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {activeConversation ? (
            <>
              {/* Header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.2)',
                backdropFilter: 'blur(12px)',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setMobileSidebar(true)}
                    style={{
                      display: 'none', background: 'none', border: 'none',
                      cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '4px',
                    }}
                    className="mobile-back-btn"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={activeOpponent?.fullName} size={40} gradient="linear-gradient(135deg,#06B6D4,#0891b2)" />
                    <OnlineDot online={isOpponentOnline} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F3F4F6' }}>
                      {activeOpponent?.fullName}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: isTyping ? '#10B981' : isOpponentOnline ? '#10B981' : 'rgba(255,255,255,0.35)',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      {isTyping ? (
                        <>
                          <span>typing</span>
                          <TypingDots />
                        </>
                      ) : isOpponentOnline ? (
                        <><Circle size={7} fill="#10B981" strokeWidth={0} /> Online</>
                      ) : 'Offline'}
                    </div>
                  </div>
                </div>

                {/* Header actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HeaderBtn
                    onClick={startVideoCall}
                    title="Video Call"
                    style={{ color: '#10B981' }}
                  >
                    <Video size={18} />
                  </HeaderBtn>
                  <HeaderBtn title="More Options">
                    <MoreVertical size={18} />
                  </HeaderBtn>
                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '20px 24px',
                display: 'flex', flexDirection: 'column',
                background: 'rgba(0,0,0,0.08)',
              }}>
                {loading && messages.length === 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
                  </div>
                )}
                {msgsWithDates.map(item =>
                  item.type === 'date'
                    ? <DateSeparator key={item.key} dateStr={item.dateStr} />
                    : (
                      <MessageBubble
                        key={item.key}
                        msg={item.msg}
                        isMine={item.msg.senderId === currentUser.id}
                        prevMsg={item.prev}
                      />
                    )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={{
                padding: '14px 18px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(0,0,0,0.15)',
                position: 'relative',
                flexShrink: 0,
              }}>
                {showEmoji && (
                  <EmojiPicker
                    onSelect={(emoji) => { setText(t => t + emoji); inputRef.current?.focus(); }}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px', padding: '6px 6px 6px 14px',
                  transition: 'border-color 0.2s',
                }}>
                  <button
                    type="button"
                    onClick={() => setShowEmoji(s => !s)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: showEmoji ? 'var(--color-primary)' : 'rgba(255,255,255,0.4)',
                      display: 'flex', alignItems: 'center', padding: '4px', flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                  >
                    <Smile size={20} />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Write a message..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                      flex: 1, background: 'none', border: 'none', outline: 'none',
                      color: 'var(--text-main)', fontSize: '0.9rem',
                      fontFamily: 'var(--font-sans)',
                    }}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    style={{
                      background: text.trim()
                        ? 'linear-gradient(135deg,#8B5CF6,#7c3aed)'
                        : 'rgba(255,255,255,0.08)',
                      border: 'none', borderRadius: '10px',
                      width: '38px', height: '38px', cursor: text.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FFF', flexShrink: 0, transition: 'all 0.2s',
                      boxShadow: text.trim() ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Empty state */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.25)', gap: '16px',
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '24px',
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageSquare size={36} style={{ color: 'rgba(139,92,246,0.5)' }} />
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)',
                  textAlign: 'center', marginBottom: '6px',
                }}>No conversation selected</div>
                <div style={{ fontSize: '0.84rem', textAlign: 'center' }}>
                  Pick a chat from the left, or visit Mentors to start messaging.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { transform: scale(1.06); box-shadow: 0 0 0 14px rgba(16,185,129,0); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}

/* ─── Sub-components ─────────────────────── */
function HeaderBtn({ children, onClick, title, style = {} }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '8px', cursor: 'pointer',
        color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center',
        transition: 'all 0.15s', ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#FFF'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = style.color || 'rgba(255,255,255,0.6)'; }}
    >
      {children}
    </button>
  );
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: '50%',
          background: '#10B981', display: 'inline-block',
          animation: `typingBounce 1s ease ${i * 0.15}s infinite`,
        }} />
      ))}
    </span>
  );
}
