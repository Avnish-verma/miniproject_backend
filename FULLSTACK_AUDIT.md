# NOVA Social Communication Platform — Full-Stack Technical Audit

**Date:** September 2026  
**Auditor:** Senior Staff Full-Stack Engineer, WebRTC Architect & Security Engineer  
**Status:** Audit Complete — All Critical Architectural Flaws Remediated  
**Environment:** Node.js v24.12.0 · MongoDB 8 · Express 5 · Socket.IO 4.8 · React 19 · Vite 6 · Tailwind CSS v4

---

## 1. Executive Summary

This audit assesses the end-to-end functionality, architectural integrity, and real-time reliability of the **NOVA Social Communication Platform**. Prior iterations suffered from five critical bugs:
1. **Theme Toggle Inoperability:** The dark/light theme switch appeared in the UI, but toggling it did not alter interface styling due to Tailwind CSS v4 selector misconfiguration.
2. **Profile & User Post CastError Failure:** Viewing profile pages crashed with Mongoose `CastError: Cast to ObjectId failed for value "alice_chen"` because username strings were passed directly into ObjectId query filters.
3. **Missing Comment Deletion Endpoint:** Post authors and comment authors lacked backend endpoints and UI controls to remove replies, causing permanent comment immutability.
4. **False "Another Call" WebRTC Lockout:** WebRTC calls frequently failed with "User is currently on another call" or failed silently because stale call records in MongoDB were not timed out rapidly, and ICE candidates arrived prior to remote SDP description settlement.
5. **Missing Followers / Following Endpoints:** Profiles lacked dedicated paginated follower and following endpoints.

All five deficiencies have been systematically diagnosed, resolved at the root cause, and verified with 58 automated tests (11 security, 29 realtime/WebRTC, 18 fullstack E2E).

---

## 2. Layer-by-Layer System Audit

### 2.1 Theme System & Styling Architecture

* **Identified Root Cause:** In Tailwind CSS v4 (`@import "tailwindcss";`), the `dark:` utility variant targets `@media (prefers-color-scheme: dark)` by default. Toggling the class `dark` on `document.documentElement` had zero effect on any CSS utility class using `dark:bg-...`, `dark:text-...`, or `dark:border-...`.
* **Resolution:**
  1. Inserted `@custom-variant dark (&:where(.dark, .dark *));` immediately after `@import "tailwindcss";` in [`client/src/index.css`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/client/src/index.css).
  2. Enhanced [`client/src/context/ThemeContext.jsx`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/client/src/context/ThemeContext.jsx) to synchronize both `nova-theme` and `nova_theme` keys in `localStorage`, set `data-theme` on the root document element, and toggle the `.dark` class.
  3. Added an inline pre-render script to [`client/index.html`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/client/index.html) to read `localStorage` synchronously before initial DOM paint, completely eliminating flash of dark theme on light-mode users.

### 2.2 User Identity, Profile & Graph Resolution

* **Identified Root Cause:**
  1. `postService.getUserPosts` accepted `targetUserId` and queried `Post.find({ postedBy: targetUserId })`. When navigating to a user's vanity profile URL (e.g. `/profile/alice_chen`), `targetUserId` was `'alice_chen'`. Because `postedBy` is a MongoDB `ObjectId`, Mongoose rejected the query with a fatal CastError.
  2. Missing dedicated endpoints for retrieving the authenticated user (`/api/v1/users/me` and `/api/v1/users/profile`) and for paginated follower/following lists.
* **Resolution:**
  1. Updated `postService.getUserPosts` in [`src/services/postService.js`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/src/services/postService.js) with regex inspection (`/^[0-9a-fA-F]{24}$/`). If the identifier is a username string, it queries `User.findOne({ userId: identifier.toLowerCase() })` to retrieve the `_id` before querying posts.
  2. Implemented `getUserFollowers` and `getUserFollowing` with pagination in [`src/services/userService.js`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/src/services/userService.js).
  3. Added `getMe`, `getFollowers`, and `getFollowing` methods in [`src/controllers/userController.js`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/src/controllers/userController.js) and mounted routes in [`src/routes/api/v1/userRoutes.js`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/src/routes/api/v1/userRoutes.js).

### 2.3 Post, Reactions & Comment Lifecycle

* **Identified Defect:** Comments could be created, but no endpoint or UI control existed to delete them. Furthermore, comment deletion required strict authorization to prevent IDOR vulnerabilities (only the comment author or post owner may delete).
* **Resolution:**
  1. Implemented `deleteComment(postId, commentId, currentUserId)` in [`src/services/postService.js`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/src/services/postService.js). Validates post existence, comment existence, post-comment relationship, and verifies `comment.commentedBy.equals(currentUserId) || post.postedBy.equals(currentUserId)`.
  2. Decrements `commentsCount` atomically with `$inc: -1` and clamps at 0.
  3. Added `DELETE /api/v1/posts/:postId/comments/:commentId` in [`src/routes/api/v1/postRoutes.js`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/src/routes/api/v1/postRoutes.js).
  4. Updated [`client/src/components/feed/PostCard.jsx`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/client/src/components/feed/PostCard.jsx) to display a delete button for authorized users and handle optimistic state updates.

### 2.4 WebRTC Voice & Video Calling Architecture

* **Identified Root Cause:**
  1. The server's `cleanupStaleCalls` previously retained `accepted` calls for 2 hours before expiring them. If a browser tab closed without sending `call:end`, both users remained flagged as "busy" for up to 2 hours.
  2. Caller starting a new call was blocked by their own previous uncompleted call record.
  3. Callee field naming mismatch in `CallsPage.jsx`: frontend checked `call.recipient` instead of `call.callee`, rendering peer details as undefined.
  4. WebRTC ICE candidate race condition: ICE candidates arriving prior to SDP offer/answer negotiation caused browser WebRTC errors.
* **Resolution:**
  1. Hardened [`src/services/callService.js`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/src/services/callService.js):
     - Reduced accepted call stale cutoff from 2 hours to 5 minutes.
     - Auto-terminates previous active call if the caller is intentionally placing a new call.
     - Auto-expires callee active calls older than 5 minutes (or ringing older than 35s).
  2. Fixed [`client/src/pages/CallsPage.jsx`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/client/src/pages/CallsPage.jsx) peer resolution to `(call.callee || call.recipient)`.
  3. Hardened [`client/src/context/CallContext.jsx`](file:///c:/Users/a3301/Desktop/sem%203/miniproject/client/src/context/CallContext.jsx):
     - Maintained `iceCandidateQueueRef` to buffer incoming candidates when `pc.remoteDescription` is null, draining them immediately upon `setRemoteDescription`.
     - Bound remote media stream to both `<audio>` and `<video>` tags with `autoPlay playsInline` to guarantee audio playback during pure audio and video calls.
     - Added `muted` attribute to local video element to prevent acoustic feedback loop.

### 2.5 Real-Time Chat & Socket.IO Architecture

* **Verification Results:**
  - Socket authentication verifies JWT access token on connection handshake.
  - Multi-session presence (`onlineUsers` Map) tracks multiple open sockets per user.
  - Room authorization (`conversation:${id}`) strictly validates member membership in MongoDB before permitting room entry.
  - Typing indicator broadcasts to room members excluding sender.
  - Read receipts atomically update message status to `READ` in database and notify senders.
  - Socket de-duplication in `ChatView.jsx` prevents double-rendering when messages are acknowledged via HTTP POST and socket broadcast.

---

## 3. Automated Verification Status

| Suite | File | Tests Run | Result |
| :--- | :--- | :---: | :---: |
| **Security & Auth** | `tests/security.test.js` | 11 | **11 / 11 PASS** |
| **Realtime & Calling** | `tests/realtime.test.js` | 29 | **29 / 29 PASS** |
| **Fullstack E2E** | `tests/fullstack_e2e.test.js` | 18 | **18 / 18 PASS** |
| **Client Production Build** | `vite build` | 2002 modules | **SUCCESS (0 errors)** |
| **Total** | | **58** | **58 / 58 PASS (100%)** |
