import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
  getCommunities,
  getCommunityById,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMessages,
} from '../api/community.api';
import { connectSocket, getSocket } from '../socket/socket';
import SOCKET_EVENTS from '../constants/events';
import {
  Send, Plus, Users, Hash, LogIn, LogOut, X, Loader,
  Globe, Lock, Search, ChevronRight,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────────── */
const roleColor = (role) =>
  role === 'MENTOR' ? 'var(--color-secondary)' : role === 'ADMIN' ? 'var(--status-danger)' : 'var(--color-primary)';

const fmt = (d) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ─── Create Community Modal ──────────────────────────────────────────── */
function CreateModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await createCommunity({ name: name.trim(), description: desc.trim() });
      onCreate(data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: '20px',
        border: '1px solid var(--border-color)', padding: '32px',
        width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)',
        animation: 'fadeUp 0.25s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              Create Community
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Open to all mentors and students
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: '10px', padding: '10px 14px', color: 'var(--status-danger)', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
              Community Name *
            </label>
            <input
              className="input-field"
              placeholder="e.g. JEE Aspirants, React Developers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
              Description (optional)
            </label>
            <textarea
              className="input-field"
              placeholder="What is this community about?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={200}
              rows={3}
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!name.trim() || loading}>
              {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Community Members Modal ────────────────────────────────────────── */
function MembersModal({ communityId, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchMembers = async () => {
      try {
        const data = await getCommunityById(communityId);
        if (active) {
          setMembers(data.data?.members || []);
        }
      } catch (err) {
        if (active) {
          setError('Failed to load members');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchMembers();
    return () => { active = false; };
  }, [communityId]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: '20px',
        border: '1px solid var(--border-color)', padding: '32px',
        width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)',
        animation: 'fadeUp 0.25s ease',
        display: 'flex', flexDirection: 'column', maxHeight: '80vh',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              Community Members
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              People registered in this group
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
          </div>
        ) : error ? (
          <div style={{ color: 'var(--status-danger)', padding: '20px 0', textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {members.map((m) => {
              const u = m.user || {};
              const initials = u.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.75rem', color: '#FFF',
                    }}>{initials}</div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{u.fullName}</div>
                      <span style={{ fontSize: '0.72rem', color: roleColor(u.role), fontWeight: 700 }}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                  {m.role === 'OWNER' && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: 'var(--color-primary-glow)', color: 'var(--color-primary)', fontWeight: 600, border: '1px solid rgba(139,92,246,0.3)' }}>
                      Owner
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Chat Panel ──────────────────────────────────────────────────────── */
function CommunityChat({ community, currentUser, isMember, onJoin, onLeave }) {
  const [showMembers, setShowMembers] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const bottomRef = useRef(null);

  // Load history + join socket room
  useEffect(() => {
    if (!community) return;
    setLoading(true);
    setMessages([]);

    const load = async () => {
      try {
        if (isMember) {
          const data = await getCommunityMessages(community.id);
          setMessages(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load messages:', err.message);
      } finally {
        setLoading(false);
      }
    };

    load();

    if (isMember) {
      const socket = getSocket();
      if (socket) {
        socket.emit(SOCKET_EVENTS.JOIN_COMMUNITY, { communityId: community.id });
        socket.on(SOCKET_EVENTS.COMMUNITY_MESSAGE, (msg) => {
          if (msg.communityId === community.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        });
      }
    }

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off(SOCKET_EVENTS.COMMUNITY_MESSAGE);
        if (isMember) socket.emit(SOCKET_EVENTS.LEAVE_COMMUNITY, { communityId: community.id });
      }
    };
  }, [community?.id, isMember]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.SEND_COMMUNITY_MSG, { communityId: community.id, content: text.trim() }, (res) => {
        if (res?.success) setText('');
        else console.error('Send failed:', res?.error);
      });
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinCommunity(community.id);
      onJoin(community.id);
    } catch (err) {
      console.error('Failed to join:', err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveCommunity(community.id);
      onLeave(community.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave community');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFF', fontSize: '1.1rem', fontWeight: 700,
          }}>
            {community.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
              {community.name}
            </div>
            <button
              onClick={() => setShowMembers(true)}
              style={{
                background: 'none', border: 'none', padding: 0, margin: 0,
                fontSize: '0.75rem', color: 'var(--color-primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'underline'
              }}
            >
              <Users size={12} />
              {community._count?.members ?? 0} members (view list)
            </button>
          </div>
        </div>

        {community.creatorId !== currentUser.id && (
          isMember ? (
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleLeave}>
              <LogOut size={14} /> Leave
            </button>
          ) : (
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleJoin} disabled={joining}>
              {joining ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><LogIn size={14} /> Join</>}
            </button>
          )
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!isMember ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-muted)' }}>
            <Lock size={40} style={{ color: 'var(--text-dark)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Join to participate</p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>{community.description || 'Be part of this community to view and send messages.'}</p>
            </div>
            <button className="btn btn-primary" onClick={handleJoin} disabled={joining} style={{ marginTop: '8px' }}>
              {joining ? 'Joining...' : 'Join Community'}
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <Hash size={40} style={{ color: 'var(--text-dark)', marginBottom: '12px' }} />
            <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No messages yet</p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{msg.sender?.fullName || 'User'}</span>
                  <span style={{ fontWeight: 700, color: roleColor(msg.sender?.role), textTransform: 'uppercase', fontSize: '0.63rem' }}>
                    [{msg.sender?.role || 'STUDENT'}]
                  </span>
                  <span>{fmt(msg.createdAt)}</span>
                </div>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: '12px',
                  borderTopRightRadius: isMine ? '2px' : '12px',
                  borderTopLeftRadius: isMine ? '12px' : '2px',
                  background: isMine ? 'var(--color-primary)' : 'var(--bg-surface)',
                  color: '#FFF', fontSize: '0.88rem', lineHeight: 1.5,
                  boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)',
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isMember && (
        <form onSubmit={handleSend} style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-color)',
          display: 'flex', gap: '10px', alignItems: 'center',
          background: 'rgba(0,0,0,0.15)',
        }}>
          <input
            className="input-field"
            style={{ flex: 1 }}
            placeholder={`Message #${community.name.toLowerCase()}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary"
            style={{ width: '42px', height: '42px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={!text.trim()}>
            <Send size={17} />
          </button>
        </form>
      )}
      {/* Members Modal */}
      {showMembers && (
        <MembersModal communityId={community.id} onClose={() => setShowMembers(false)} />
      )}
    </div>
  );
}

/* ─── Main Communities Page ───────────────────────────────────────────── */
export default function Communities() {
  const { user: currentUser } = useAuthStore();
  const [communities, setCommunities] = useState([]);
  const [myMemberships, setMyMemberships] = useState(new Set()); // Set of communityIds
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const loadCommunities = useCallback(async () => {
    try {
      const data = await getCommunities();
      const list = data.data || [];
      setCommunities(list);

      // Backend now returns isMember: true/false per community for the logged-in user
      const mine = new Set(list.filter((c) => c.isMember).map((c) => c.id));
      setMyMemberships(mine);

      // Auto-select first community
      if (list.length > 0) setSelected((prev) => prev ?? list[0]);
    } catch (err) {
      console.error('Failed to load communities:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    connectSocket();
    loadCommunities();
  }, []);

  const handleCreate = (newCommunity) => {
    setCommunities((prev) => [newCommunity, ...prev]);
    setMyMemberships((prev) => new Set([...prev, newCommunity.id]));
    setSelected(newCommunity);
  };

  const handleJoin = (communityId) => {
    setMyMemberships((prev) => new Set([...prev, communityId]));
    // Refresh the selected community so member count updates
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? { ...c, _count: { ...c._count, members: (c._count?.members || 0) + 1 } }
          : c
      )
    );
  };

  const handleLeave = (communityId) => {
    setMyMemberships((prev) => {
      const next = new Set(prev);
      next.delete(communityId);
      return next;
    });
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? { ...c, _count: { ...c._count, members: Math.max(0, (c._count?.members || 1) - 1) } }
          : c
      )
    );
  };

  const filtered = communities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const myCommunities = filtered.filter((c) => myMemberships.has(c.id));
  const otherCommunities = filtered.filter((c) => !myMemberships.has(c.id));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 110px)', gap: '0', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }} className="animate-fade">

      {/* ── Left Sidebar ── */}
      <div style={{
        width: '280px', flexShrink: 0,
        background: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
              Communities
            </span>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreate(true)}
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '8px' }}
            >
              <Plus size={14} /> New
            </button>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: '30px', fontSize: '0.82rem', height: '34px' }}
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Community List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
            </div>
          ) : (
            <>
              {myCommunities.length > 0 && (
                <>
                  <div style={{ padding: '8px 10px 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    My Communities
                  </div>
                  {myCommunities.map((c) => (
                    <CommunityItem key={c.id} community={c} selected={selected?.id === c.id} onClick={() => setSelected(c)} isMember />
                  ))}
                </>
              )}

              {otherCommunities.length > 0 && (
                <>
                  <div style={{ padding: '12px 10px 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Discover
                  </div>
                  {otherCommunities.map((c) => (
                    <CommunityItem key={c.id} community={c} selected={selected?.id === c.id} onClick={() => setSelected(c)} />
                  ))}
                </>
              )}

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 16px', fontSize: '0.85rem' }}>
                  <Globe size={32} style={{ color: 'var(--text-dark)', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                  {search ? 'No communities match your search' : 'No communities yet. Create the first one!'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', minWidth: 0 }}>
        {selected ? (
          <CommunityChat
            key={selected.id}
            community={selected}
            currentUser={currentUser}
            isMember={myMemberships.has(selected.id)}
            onJoin={handleJoin}
            onLeave={handleLeave}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '12px' }}>
            <Globe size={48} style={{ color: 'var(--text-dark)' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Select a community to start chatting</p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Or create a new one to connect with others</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Create Community
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* ─── Sidebar Item ────────────────────────────────────────────────────── */
function CommunityItem({ community, selected, onClick, isMember }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      background: selected ? 'var(--color-primary-glow)' : 'transparent',
      borderLeft: selected ? '3px solid var(--color-primary)' : '3px solid transparent',
      transition: 'all 0.15s', marginBottom: '2px',
    }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Avatar */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: selected
          ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
          : 'rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: selected ? '#FFF' : 'var(--text-muted)',
        fontWeight: 700, fontSize: '0.9rem',
      }}>
        {community.name[0].toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.85rem', fontWeight: selected ? 700 : 500,
          color: selected ? 'var(--color-primary)' : 'var(--text-main)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {community.name}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {community._count?.members ?? 0} members
          {isMember && <span style={{ marginLeft: '6px', color: 'var(--color-primary)', fontWeight: 600 }}>• joined</span>}
        </div>
      </div>

      {selected && <ChevronRight size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
    </button>
  );
}
