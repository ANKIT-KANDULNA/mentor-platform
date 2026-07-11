import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';

/**
 * Interactive notification bell dropdown component.
 */
export default function NotificationBell() {
  const { notifications, unreadCount, getNotifications, markRead, markAllRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          color: 'var(--text-main)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'var(--status-danger)',
            color: '#FFF',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="glass-panel" style={{
          position: 'absolute',
          top: '48px',
          right: 0,
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
          padding: '12px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px',
            marginBottom: '4px',
          }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Notifications</h4>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}>
              No notifications yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: n.isRead ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
                    borderLeft: n.isRead ? 'none' : '3px solid var(--color-primary)',
                    cursor: n.isRead ? 'default' : 'pointer',
                    fontSize: '0.85rem',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>{n.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{n.body}</div>
                  <div style={{ color: 'var(--text-dark)', fontSize: '0.7rem', marginTop: '4px', textAlign: 'right' }}>
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
