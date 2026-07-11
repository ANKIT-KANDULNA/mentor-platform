const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Chat
  JOIN_CONVERSATION: 'join-conversation',
  LEAVE_CONVERSATION: 'leave-conversation',
  SEND_MESSAGE: 'send-message',
  RECEIVE_MESSAGE: 'receive-message',
  TYPING: 'typing',
  STOP_TYPING: 'stop-typing',
  USER_TYPING: 'user-typing',
  USER_STOP_TYPING: 'user-stop-typing',
  MARK_READ: 'mark-read',
  MESSAGE_READ: 'message-read',
  
  // Global Chat
  JOIN_GLOBAL: 'join-global-chat',
  SEND_GLOBAL: 'send-global-message',
  GLOBAL_MESSAGE: 'global-message',
  
  // Presence
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
  ONLINE_USERS: 'online-users',
  
  // Sessions
  JOIN_SESSION: 'join-session',
  LEAVE_SESSION: 'leave-session',
  SESSION_STARTED: 'session-started',
  
  // Notifications
  NOTIFICATION: 'notification',
};

export default SOCKET_EVENTS;
