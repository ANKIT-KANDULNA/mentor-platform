import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { connectSocket, getSocket } from '../socket/socket';
import { Home, Users, Calendar, MessageSquare, Globe, Bell, LogOut, User, Settings, ChevronDown, X, Menu } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, getNotifications, markRead, markAllRead, addNotification } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const navLinks = [
    { to: '/dashboard', label: 'Home', icon: <Home size={18} /> },
    { to: '/mentors', label: 'Mentors', icon: <Users size={18} /> },
    { to: '/sessions', label: 'Sessions', icon: <Calendar size={18} /> },
    { to: '/chat', label: 'Messages', icon: <MessageSquare size={18} /> },
    { to: '/community', label: 'Community', icon: <Globe size={18} /> },
  ];

  useEffect(() => {
    connectSocket();
    getNotifications();

    const socket = getSocket();
    if (socket) {
      socket.on('notification:new', (notif) => addNotification(notif));
    }
    return () => { const s = getSocket(); if (s) s.off('notification:new'); };
  }, [getNotifications, addNotification]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <nav style={{
      height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', background: 'rgba(11,14,20,0.95)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 1000,
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 900, color: '#FFF', fontSize: '1.1rem',
          boxShadow: '0 0 16px rgba(139,92,246,0.4)',
        }}>M</div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>MentorMatch</span>
      </Link>

      {/* Desktop Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="desktop-nav">
        {navLinks.map(({ to, label, icon }) => (
          <Link key={to} to={to} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 14px', borderRadius: '8px', textDecoration: 'none',
            fontSize: '0.88rem', fontWeight: isActive(to) ? 600 : 500,
            color: isActive(to) ? 'var(--color-primary)' : 'var(--text-muted)',
            background: isActive(to) ? 'var(--color-primary-glow)' : 'transparent',
            border: isActive(to) ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
            transition: 'all 0.2s',
          }}>
            {icon} {label}
          </Link>
        ))}
      </div>

      {/* Right: Notifications + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => { setNotifOpen(n => !n); setUserOpen(false); if (!notifOpen) getNotifications(); }} style={{
            position: 'relative', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
            borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: 'var(--color-accent)', color: '#FFF', borderRadius: '999px',
                fontSize: '0.65rem', fontWeight: 700, minWidth: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                border: '2px solid var(--bg-main)',
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: '340px', maxHeight: '420px', overflowY: 'auto',
              background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              borderRadius: '14px', boxShadow: 'var(--shadow-lg)', animation: 'dropDown 0.2s ease',
              zIndex: 100,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Notifications</span>
                {unreadCount > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Mark all read</button>}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No notifications yet</div>
              ) : notifications.slice(0, 10).map(n => (
                <div key={n.id} onClick={() => markRead(n.id)} style={{
                  padding: '14px 18px', cursor: 'pointer', transition: 'background 0.15s',
                  background: !n.isRead ? 'rgba(139,92,246,0.05)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: !n.isRead ? '3px solid var(--color-primary)' : '3px solid transparent',
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                   onMouseLeave={e => e.currentTarget.style.background = !n.isRead ? 'rgba(139,92,246,0.05)' : 'transparent'}>
                  <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '3px' }}>{n.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Avatar Dropdown */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button onClick={() => { setUserOpen(u => !u); setNotifOpen(false); }} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
            borderRadius: '10px', padding: '6px 12px 6px 6px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.8rem', color: '#FFF',
            }}>{initials}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>{user?.fullName?.split(' ')[0]}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{user?.role}</div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: userOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>

          {userOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: '200px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              borderRadius: '12px', boxShadow: 'var(--shadow-lg)', animation: 'dropDown 0.2s ease', zIndex: 100,
              padding: '6px',
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{user?.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              {[{ icon: <User size={15} />, label: 'Profile', action: () => navigate('/profile') },
                { icon: <Settings size={15} />, label: 'Settings', action: () => navigate('/profile') },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={() => { action(); setUserOpen(false); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                  background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '0.875rem', transition: 'all 0.15s', textAlign: 'left',
                }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  {icon} {label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '4px' }}>
                <button onClick={handleLogout} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
                  background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  color: 'var(--status-danger)', fontSize: '0.875rem', transition: 'all 0.15s', textAlign: 'left',
                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--status-danger-bg)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(m => !m)} className="mobile-menu-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'none', padding: '4px' }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '64px', left: 0, right: 0,
          background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)',
          padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 999,
        }}>
          {navLinks.map(({ to, label, icon }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
              borderRadius: '8px', color: isActive(to) ? 'var(--color-primary)' : 'var(--text-muted)',
              background: isActive(to) ? 'var(--color-primary-glow)' : 'transparent',
              textDecoration: 'none', fontWeight: isActive(to) ? 600 : 400,
            }}>{icon} {label}</Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @keyframes dropDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </nav>
  );
}
