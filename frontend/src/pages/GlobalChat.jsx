import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { getGlobalMessages } from '../api/chat.api';
import { connectSocket, getSocket } from '../socket/socket';
import SOCKET_EVENTS from '../constants/events';
import { Send, Users, Loader } from 'lucide-react';

/**
 * Community board view enabling real-time community text messaging threads.
 */
export default function GlobalChat() {
  const { user: currentUser } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  // Load history & set up sockets
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getGlobalMessages();
        setMessages(data.data || []);
      } catch (err) {
        console.error('Failed to fetch global chat history:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    connectSocket();

    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.JOIN_GLOBAL);

      socket.on(SOCKET_EVENTS.GLOBAL_MESSAGE, (msg) => {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });
    }

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off(SOCKET_EVENTS.GLOBAL_MESSAGE);
      }
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.SEND_GLOBAL, { content: text.trim() }, (res) => {
        if (res?.success) {
          setText('');
        } else {
          console.error('Failed to send global message:', res?.error);
        }
      });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 110px)' }} className="animate-fade">
      <div>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Community Board</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Connect, ask questions, and share insights with the entire MentorMatch community</p>
      </div>

      <div className="glass-panel" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: 0,
      }}>
        {/* Messages Feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <Users size={48} style={{ color: 'var(--text-dark)', marginBottom: '12px' }} />
              <h3>Welcome to the Community!</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Be the first to post a message to the group.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const senderName = msg.sender?.fullName || 'User';
              const senderRole = msg.sender?.role || 'STUDENT';

              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start',
                  width: '100%',
                }} className="animate-slide">
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{senderName}</span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      color: senderRole === 'MENTOR' ? 'var(--color-secondary)' : senderRole === 'ADMIN' ? 'var(--status-danger)' : 'var(--color-primary)',
                      textTransform: 'uppercase',
                    }}>
                      [{senderRole}]
                    </span>
                  </div>
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    borderTopRightRadius: isMine ? '2px' : '12px',
                    borderTopLeftRadius: isMine ? '12px' : '2px',
                    backgroundColor: isMine ? 'var(--color-primary)' : 'var(--bg-surface)',
                    color: '#FFF',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.9rem',
                    border: '1px solid var(--border-color)',
                  }}>
                    <div style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>{msg.content}</div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: isMine ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)',
                      marginTop: '4px',
                      textAlign: 'right',
                    }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Panel */}
        <form 
          onSubmit={handleSend}
          style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <input
            type="text"
            className="input-field"
            style={{ flex: 1 }}
            placeholder="Type your message to the community..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '42px', height: '42px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={!text.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
