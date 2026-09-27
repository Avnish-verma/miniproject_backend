const SOCKET_EVENTS = {
  // Connection & Auth
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  ERROR: 'error',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Chat & Messaging
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  MESSAGE_TYPING: 'message:typing',
  MESSAGE_REACTION: 'message:reaction',

  // WebRTC Signaling
  CALL_INITIATE: 'call:initiate',
  CALL_INCOMING: 'call:incoming',
  CALL_RINGING: 'call:ringing',
  CALL_ACCEPT: 'call:accept',
  CALL_ACCEPTED: 'call:accepted',
  CALL_REJECT: 'call:reject',
  CALL_REJECTED: 'call:rejected',
  CALL_CANCEL: 'call:cancel',
  CALL_CANCELLED: 'call:cancelled',
  CALL_OFFER: 'call:offer',
  CALL_ANSWER: 'call:answer',
  CALL_ICE_CANDIDATE: 'call:ice-candidate',
  CALL_END: 'call:end',
  CALL_ENDED: 'call:ended',
  CALL_BUSY: 'call:busy',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
};

module.exports = SOCKET_EVENTS;
