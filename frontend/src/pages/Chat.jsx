import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { createConversation } from '../api/chat.api';
import { connectSocket, getSocket } from '../socket/socket';
import SOCKET_EVENTS from '../constants/events';
import VideoCall from '../components/VideoCall';
import {
  Send, Search, Video, Phone, MoreVertical, Paperclip,
  Loader, ArrowLeft, Circle, X, MessageSquare, Pin, MessageCircle
} from 'lucide-react';



function Avatar({ name, size = 40 }) {
  const initials = name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#FFF', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0
    }}>{initials}</div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { user: currentUser } = useAuthStore();
  const {
    conversations, activeConversation, messages, loading,
    getConversations, setActiveConversation, addMessage,
    sendMessage, setUserTyping, typingUsers,
  } = useChatStore();

  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [mobileSidebar, setMobileSidebar] = useState(true);

  // Pinned Resources state
  const [pinnedResources, setPinnedResources] = useState([
    { title: 'System Design Interview Cheatsheet', url: '#' },
    { title: 'React Performance Benchmarks', url: '#' }
  ]);
  const [showPins, setShowPins] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('userId');

  useEffect(() => {
    getConversations();
    connectSocket();
    const socket = getSocket();
    if (!socket) return;

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, (msg) => {
      addMessage(msg);
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
          console.error(err);
        }
      }
    };
    startNewConv();
  }, [targetUserId, setActiveConversation, getConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;
    const socket = getSocket();
    if (socket) socket.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId: activeConversation.id });
    try {
      await sendMessage(activeConversation.id, text.trim());
      setText('');
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {activeCall && (
        <VideoCall
          targetUserId={activeCall.targetUserId}
          targetName={activeCall.targetName}
          onClose={() => setActiveCall(null)}
        />
      )}

      {incomingCall && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9998,
          background: 'var(--bg-surface)', border: '1px solid var(--color-primary)',
          borderRadius: '16px', padding: '20px 24px', boxShadow: 'var(--shadow-lg)',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={22} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.95rem' }}>Incoming Video Call</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{incomingCall.callerName} calling...</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={acceptIncomingCall} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>Accept</button>
            <button onClick={rejectCall} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem', color: 'var(--status-danger)' }}>Decline</button>
          </div>
        </div>
      )}

      <div className="glass-panel animate-fade" style={{ display: 'flex', height: 'calc(100vh - 110px)', padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
        
        {/* Left Side: Conversations list */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '20px 18px 12px' }}>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '12px' }}>Direct Messages</h4>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="input-field" style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredConversations.map(conv => {
              const opponent = getOpponentUser(conv);
              const isActive = activeConversation?.id === conv.id;
              return (
                <button key={conv.id} onClick={() => { setActiveConversation(conv); setMobileSidebar(false); }} style={{
                  width: '100%', background: isActive ? 'var(--color-primary-glow)' : 'transparent',
                  border: 'none', borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left',
                  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent', marginBottom: '4px'
                }}>
                  <Avatar name={opponent?.fullName} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>{opponent?.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessage || 'Click to chat'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Discord style chat space */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {activeConversation ? (
            <>
              {/* Header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar name={activeOpponent?.fullName} size={36} />
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>{activeOpponent?.fullName}</h5>
                    <span style={{ fontSize: '0.72rem', color: 'var(--status-success)' }}>
                      {isTyping ? 'typing...' : 'online'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => setShowPins(!showPins)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Pin size={14} /> Pinned
                  </button>
                  <button onClick={() => { setActiveCall({ targetUserId: activeOpponent.id, targetName: activeOpponent.fullName }); }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    <Video size={14} /> Join Video
                  </button>
                </div>
              </div>

              {/* Pinned panel drawer */}
              {showPins && (
                <div style={{ background: '#18181B', padding: '16px', borderBottom: '1px solid var(--border-color)' }} className="animate-scale">
                  <h5 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--color-primary)', fontFamily: 'var(--font-sans)' }}>CHANNEL PINNED RESOURCES:</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pinnedResources.map((res, i) => (
                      <div key={i} style={{ fontSize: '0.8rem' }}>
                        • <a href={res.url} style={{ textDecoration: 'underline', color: 'var(--text-secondary)' }}>{res.title}</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages feed */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, i) => {
                  const isMine = msg.senderId === currentUser.id;
                  const isCode = msg.content?.startsWith('```');
                  return (
                    <div key={msg.id || i} className="chat-bubble-container" style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: '12px', alignItems: 'flex-end' }}>
                      <Avatar name={msg.sender?.fullName || (isMine ? currentUser.fullName : activeOpponent?.fullName)} size={36} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
                            {msg.sender?.fullName || (isMine ? currentUser.fullName : activeOpponent?.fullName)}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatTime(msg.createdAt)}</span>
                        </div>
                        
                        {isCode ? (
                          <pre className="chat-snippet-code" style={{ background: isMine ? 'var(--color-primary)' : 'var(--bg-surface)', color: isMine ? '#fff' : 'var(--text-secondary)', borderRadius: '12px', padding: '10px 14px' }}>{msg.content.replace(/```/g, '')}</pre>
                        ) : (
                          <div style={{ fontSize: '0.88rem', color: isMine ? '#fff' : 'var(--text-main)', lineHeight: 1.4, background: isMine ? 'var(--color-primary)' : 'var(--bg-surface)', padding: '10px 14px', borderRadius: '12px', border: isMine ? 'none' : '1px solid var(--border-color)' }}>{msg.content}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer Input */}
              <form onSubmit={handleSend} style={{ padding: '14px 18px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input ref={inputRef} type="text" className="input-field" placeholder={`Message @${activeOpponent?.fullName}...`} style={{ flex: 1, height: '40px' }} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} />
                <button type="submit" className="btn-primary" style={{ padding: '0 16px', height: '40px' }} disabled={!text.trim()}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <MessageCircle size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ margin: 0 }}>Select a chat profile to start talking.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
