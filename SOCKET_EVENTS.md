# Socket.IO Real-Time Event Protocol: NOVA

All Socket.IO connections require a valid JWT passed in `socket.handshake.auth.token` or in the `token` cookie. Unauthenticated connections are rejected during the handshake.

---

## 1. Presence & Lifecycle Events

### `connection`
* Client connects with valid JWT.
* Server places client in room `user:{userId}`.
* Emits `user:online` to all other connected clients.

### `disconnect`
* Triggered when socket disconnects.
* If user has no other active sockets, server emits `user:offline` to all connected clients.

### `user:online`
* **Payload**: `{ userId: string, _id: string }`
* Notifies clients that a user has come online.

### `user:offline`
* **Payload**: `{ userId: string, _id: string }`
* Notifies clients that a user has gone offline.

---

## 2. Messaging & Chat Events

### `chat:join`
* **Client Emits**: `{ conversationId: string }`
* **Server Verification**: Verifies `Conversation.findOne({ _id: conversationId, members: socket.user._id })`.
* If authorized, socket joins room `conversation:{conversationId}`.

### `chat:leave`
* **Client Emits**: `{ conversationId: string }`
* Socket leaves room `conversation:{conversationId}`.

### `message:send`
* **Client Emits**: `{ conversationId: string, text: string, mediaUrl?: string, mediaType?: string, replyTo?: string }`
* **Server Verification**: Validates conversation membership and ensures recipient has not blocked sender.
* **Server Action**: Persists message to MongoDB with `status: 'SENT'` and emits `message:new` to `conversation:{conversationId}` and `message:delivered` to recipients.

### `message:typing`
* **Client Emits**: `{ conversationId: string, isTyping: boolean }`
* **Server Action**: Broadcasts `message:typing` to room `conversation:{conversationId}` (excluding the sender).

### `message:read`
* **Client Emits**: `{ conversationId: string }`
* **Server Action**: Updates unread messages in conversation to `status: 'READ'` and emits `message:read` to other conversation members.

---

## 3. WebRTC Call Signaling Events

All signaling events travel over TLS (`wss://`) authenticated by JWT. The server validates that caller and callee match the active session.

### `call:initiate`
* **Client Emits**: `{ recipientId: string, type: 'audio' | 'video' }`
* **Server Verification**: Validates recipient is online, not blocked, and not in another call.
* **Server Emits**:
  * `call:incoming` to `user:{recipientId}`: `{ callId, caller: { _id, userId, fullname, profilePic }, callType }`
  * `call:ringing` to caller: `{ callId }`

### `call:accept`
* **Client Emits**: `{ callId: string }`
* **Server Action**: Updates call status to `accepted`, joins room `call:{callId}`, emits `call:accepted` to caller.

### `call:reject`
* **Client Emits**: `{ callId: string, reason?: 'declined' | 'busy' }`
* **Server Action**: Updates call status, emits `call:rejected` to caller.

### `call:cancel`
* **Client Emits**: `{ callId: string }`
* **Server Action**: Updates status to `cancelled`, emits `call:cancelled` to callee.

### `call:offer`
* **Client Emits**: `{ callId: string, sdp: RTCSessionDescriptionInit }`
* **Server Action**: Forwards SDP Offer to callee's personal room.

### `call:answer`
* **Client Emits**: `{ callId: string, sdp: RTCSessionDescriptionInit }`
* **Server Action**: Forwards SDP Answer to caller's personal room.

### `call:ice-candidate`
* **Client Emits**: `{ callId: string, candidate: RTCIceCandidateInit }`
* **Server Action**: Forwards ICE candidate to the peer.

### `call:end`
* **Client Emits**: `{ callId: string, duration?: number }`
* **Server Action**: Updates call status to `completed`, computes duration, and emits `call:ended` to other party.
