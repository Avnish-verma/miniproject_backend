# NOVA Real-Time & UI/UX Architectural Audit

**Document Date**: September 26, 2026  
**Auditor**: Senior Full-Stack, WebRTC & Product Systems Engineer  
**Status**: Real-time Defects & UI Deficiencies Identified

---

## 1. Real-Time Chat Audit

### Current Connection Flow
1. Client initializes Socket.IO (`SocketContext.jsx`) pointing to `window.location.origin` with `auth: { token }`.
2. Server handshake in `socketServer.js` decodes JWT via `jwt.verify(token, env.JWT_ACCESS_SECRET)`, fetches `User`, and binds `socket.user`.
3. Socket joins private room `user:{userId}`.

### Current Conversation Join Flow
1. Client opens conversation in `ChatView.jsx` and emits `chat:join` with `{ conversationId }`.
2. Server `chatHandler.js` checks `Conversation.findOne({ _id: conversationId, members: currentUserId })`. If found, socket joins `conversation:{conversationId}`.

### Current Message Flow & Critical Defects
1. **Critical Defect — REST Message Disconnect**:
   * In `ChatView.jsx` (`handleSendMessage`), the client was submitting messages via `api.post('/api/v1/chat/messages/:conversationId')`.
   * In `chatController.js` (`sendMessage`), the server persisted the message to MongoDB, BUT **never emitted `message:new` over Socket.IO** to the conversation room or recipient!
   * **Result**: User B never received messages in real-time. Messages were only visible upon a hard page reload or switching tabs.
2. **Duplicate Message Risk**:
   * Client optimistically or unconditionally appended HTTP responses to `messages` state while also listening to `message:new` without deduplication by `message._id`.
3. **Delivery / Read Receipts**:
   * Read receipts were emitted on component mount, but without verifying if recipient was actively viewing the viewport.
4. **Stale Event Listeners**:
   * `useEffect` hooks in `ChatView.jsx` lacked proper cleanup and reconciliation on conversation switching, risking listener stacking.

---

## 2. WebRTC Call Audit

### The Authoritative Root Cause of "Another Call" / User Locked Out
1. **Permanent DB Call State Corruption**:
   * In `src/services/callService.js` (`initiateCall`):
     ```javascript
     const activeCall = await Call.findOne({
       $or: [{ caller: callee._id }, { callee: callee._id }],
       status: { $in: ['ringing', 'accepted'] },
     });
     if (activeCall) {
       throw new ValidationError('User is currently on another call', { isBusy: true });
     }
     ```
   * **The Flaw**: When a call was created and transitioned to `ringing` or `accepted`, there was **zero automatic timeout expiration**, **zero disconnect cleanup**, and **zero age verification**!
   * An orphaned call from 3 hours ago with `status: 'accepted'` remained indefinitely in MongoDB with `endedAt: null`.
   * Any subsequent call attempt to either user permanently failed with `"User is currently on another call"`!
2. **Socket Disconnect Does Not Clean Up Calls**:
   * When a user closed their browser tab, navigated away, or lost connection, `presenceHandler.js` removed the socket ID from memory, but **never checked or terminated active calls in the database**.
3. **Missing ICE Candidate Queueing**:
   * In `CallContext.jsx`, incoming ICE candidates arriving via `call:ice-candidate` immediately invoked `pc.addIceCandidate()`.
   * If candidates arrived before `pc.setRemoteDescription()` completed (standard in trickle ICE over fast WebSockets), WebRTC threw `InvalidStateError`, dropping candidates and causing the call to fail or freeze in `connecting`.
4. **Missing Lifecycle Cleanup on Browser Unload**:
   * No `beforeunload` or `pagehide` listeners existed to notify peers and clean up DB state when a user closed the browser.
5. **No Ringing Timeout**:
   * Calls could ring forever without a 30-45 second timeout transitioning them to `missed`.

---

## 3. UI/UX & Aesthetics Audit

### Root Causes of the Generic / AI-Generated Appearance
1. **Generic Gradients & Blobs**:
   * Overuse of purple/indigo gradients (`from-indigo-600 to-indigo-400`, `bg-gradient-to-r`) mimicking standard AI template dashboards.
2. **Weak Typography & Visual Hierarchy**:
   * Lack of editorial weight; standard sans-serif with uniform sizing and insufficient leading.
   * Headings and body copy lack confident contrast.
3. **Overuse of Standard Rounded Cards**:
   * Every section is wrapped in identical `border-gray-200 dark:border-[#1F2937] rounded-2xl` containers, creating visual fatigue and a template feeling.
4. **Meaningless Informational Boxes**:
   * Context panels contain generic filler cards (e.g., "NOVA Real-Time Engine active") rather than high-utility, human-focused social widgets.
5. **Chat & Call Visuals**:
   * Call screen resembled a generic video conference utility rather than a minimal, intimate, communication-first interface.
   * Chat bubbles lacked precision typography, compact padding, and clear status iconography.

---

## 4. Remediation Plan

1. **Phase 1: Real-Time Chat Engine**:
   * Unify messaging pipeline: persistence + authoritative `io.to().emit('message:new')`.
   * Client message deduplication and deterministic reconciliation.
   * Throttled typing indicator with auto-clearing timer.
   * Verified read receipt pipeline.
2. **Phase 2: Authoritative Call State Machine**:
   * Implement strict state machine: `IDLE` → `OUTGOING_CALL` → `RINGING` → `INCOMING_CALL` → `CONNECTING` → `CONNECTED` → `ENDING` → `IDLE`.
   * Server-side stale call auto-expiration (ringing calls expire after 35s; orphaned accepted calls clean up on disconnect).
   * WebRTC ICE candidate queuing until `setRemoteDescription` succeeds.
   * Full browser `beforeunload` and socket disconnect cleanup.
   * Development diagnostic overlay panel.
3. **Phase 3: Realtime Testing Suite**:
   * Automated multi-client test script validating chat, audio, video, rejects, cancels, and consecutive calls.
4. **Phase 4 & 5: UI/UX Redesign**:
   * Bespoke design tokens, editorial typography, minimal borders, subtle dark surfaces, and a human-first conversation interface.
