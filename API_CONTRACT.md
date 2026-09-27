# NOVA Platform — API & Real-Time Socket Contract

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api/v1`  
**Protocol:** REST (JSON) + Socket.IO v4 (WebSocket / Polling)  
**Security:** JWT Bearer Authentication (`Authorization: Bearer <token>`) & HttpOnly Session Cookies

---

## 1. Authentication & Session Endpoints

### `POST /api/v1/auth/register`
Creates a new user profile and issues an initial verification record.
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "fullname": "Alice Chen",
    "userId": "alice_chen",
    "emailId": "alice@nova.social",
    "password": "NovaPassword123!"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "_id": "6ab76630689e38516492276c",
        "userId": "alice_chen",
        "fullname": "Alice Chen",
        "emailId": "alice@nova.social",
        "isEmailVerified": false
      }
    }
  }
  ```

---

### `POST /api/v1/auth/login`
Authenticates user with username/email and password.
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "userId": "alice_chen",
    "password": "NovaPassword123!"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "6ab76630689e38516492276c",
        "userId": "alice_chen",
        "fullname": "Alice Chen",
        "emailId": "alice@nova.social",
        "profilePic": { "url": "", "public_id": "" }
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### `POST /api/v1/auth/logout`
Clears session cookies and invalidates current device token.
* **Auth Required:** Optional / Clean Clear
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 2. User & Profile Endpoints

### `GET /api/v1/users/me` & `GET /api/v1/users/profile`
Retrieves the authenticated user's own profile with counts and privacy settings.
* **Auth Required:** Yes (`Bearer <token>`)
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ab76630689e38516492276c",
      "userId": "alice_chen",
      "fullname": "Alice Chen",
      "emailId": "alice@nova.social",
      "bio": "Staff Product Engineer · NOVA Core Team",
      "gender": "Prefer not to say",
      "profilePic": { "url": "", "public_id": "" },
      "coverPic": { "url": "", "public_id": "" },
      "followersCount": 42,
      "followingCount": 18,
      "postsCount": 5,
      "privacy": { "isPrivate": false },
      "appearance": { "theme": "dark" },
      "isSelf": true,
      "isFollowing": false,
      "canViewContent": true
    }
  }
  ```

---

### `GET /api/v1/users/profile/:userId`
Retrieves a user profile by either their MongoDB `_id` or string `userId` (username).
* **Auth Required:** Optional (provides `isFollowing` and `canViewContent` if authenticated)
* **URL Parameters:** `userId` (ObjectId or username string)
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "6ab76630689e38516492276d",
      "userId": "bob_vance",
      "fullname": "Bob Vance",
      "bio": "Building realtime WebRTC pipelines",
      "profilePic": { "url": "", "public_id": "" },
      "followersCount": 105,
      "followingCount": 60,
      "postsCount": 12,
      "privacy": { "isPrivate": false },
      "isSelf": false,
      "isFollowing": true,
      "canViewContent": true
    }
  }
  ```

---

### `GET /api/v1/users/:userId/followers` & `GET /api/v1/users/profile/:userId/followers`
Retrieves a paginated list of a user's followers.
* **Auth Required:** Optional
* **Query Parameters:** `page=1`, `limit=20`
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6ab76630689e38516492276d",
        "userId": "bob_vance",
        "fullname": "Bob Vance",
        "profilePic": { "url": "" }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
  ```

---

### `GET /api/v1/users/:userId/following` & `GET /api/v1/users/profile/:userId/following`
Retrieves a paginated list of users followed by the target user.
* **Auth Required:** Optional
* **Query Parameters:** `page=1`, `limit=20`
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6ab76630689e38516492276e",
        "userId": "clara_o",
        "fullname": "Clara Oswald",
        "profilePic": { "url": "" }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
  ```

---

### `PUT /api/v1/users/profile`
Updates profile metadata (fullname, bio, gender, privacy, appearance).
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "fullname": "Alice Chen",
    "bio": "Staff Product Engineer & Architect",
    "gender": "Female",
    "privacy": { "isPrivate": false }
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": { ...updatedUser }
  }
  ```

---

### `GET /api/v1/users/search`
Searches users by username or full name with debounce support.
* **Auth Required:** Optional
* **Query Parameters:** `q=alice`, `page=1`, `limit=20`
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "_id": "6ab76630689e38516492276c",
          "userId": "alice_chen",
          "fullname": "Alice Chen",
          "profilePic": { "url": "" },
          "bio": "Staff Product Engineer"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20
    }
  }
  ```

---

## 3. Social Graph Endpoints

### `POST /api/v1/social/follow/:userId`
Toggles follow status for target user (atomic follow/unfollow with notification).
* **Auth Required:** Yes
* **URL Parameters:** `userId` (target ObjectId or username)
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Now following bob_vance",
    "data": { "isFollowing": true }
  }
  ```

---

### `POST /api/v1/social/block/:userId` & `DELETE /api/v1/social/block/:userId`
Blocks or unblocks target user, immediately terminating visibility and calls.
* **Auth Required:** Yes
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "User blocked successfully"
  }
  ```

---

## 4. Post & Comment Endpoints

### `POST /api/v1/posts`
Publishes a new post with optional multi-media array and auto-extracted hashtags.
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "caption": "Exploring new editorial design principles in NOVA #design #webrtc",
    "media": [
      { "url": "https://res.cloudinary.com/demo/image.jpg", "mediaType": "image" }
    ]
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Post created successfully",
    "data": {
      "_id": "6ab76630689e38516492288a",
      "caption": "Exploring new editorial design principles in NOVA #design #webrtc",
      "hashtags": ["design", "webrtc"],
      "media": [ ... ],
      "likes": [],
      "commentsCount": 0,
      "postedBy": {
        "_id": "6ab76630689e38516492276c",
        "userId": "alice_chen",
        "fullname": "Alice Chen"
      }
    }
  }
  ```

---

### `GET /api/v1/posts/user/:userId`
Retrieves posts published by a given user. Supports both ObjectId and username.
* **Auth Required:** Optional
* **URL Parameters:** `userId` (e.g. `'alice_chen'` or `'6ab76630689e38516492276c'`)
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [ ...posts ],
    "pagination": { "page": 1, "limit": 20, "total": 5 }
  }
  ```

---

### `DELETE /api/v1/posts/:postId`
Deletes a post. Strictly restricted to the post author.
* **Auth Required:** Yes
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Post deleted successfully"
  }
  ```
* **Error Response (403 Forbidden):** Non-author attempt returns `FORBIDDEN`.

---

### `POST /api/v1/posts/:postId/like`
Toggles like status on a post.
* **Auth Required:** Yes
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "isLiked": true,
      "likesCount": 1
    }
  }
  ```

---

### `POST /api/v1/posts/:postId/comments`
Appends a comment to a post.
* **Auth Required:** Yes
* **Request Body:**
  ```json
  { "text": "Incredible architecture and clean layout!" }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Comment added successfully",
    "data": {
      "_id": "6ab76630689e38516492299b",
      "postId": "6ab76630689e38516492288a",
      "text": "Incredible architecture and clean layout!",
      "commentedBy": {
        "_id": "6ab76630689e38516492276d",
        "userId": "bob_vance",
        "fullname": "Bob Vance"
      },
      "createdAt": "2026-09-26T11:00:00.000Z"
    }
  }
  ```

---

### `DELETE /api/v1/posts/:postId/comments/:commentId`
Deletes a comment. Authorized for the comment author or the post author.
* **Auth Required:** Yes
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Comment deleted successfully"
  }
  ```
* **Error Response (403 Forbidden):** Unauthorized user returns `FORBIDDEN`.

---

## 5. Feed Endpoint

### `GET /api/v1/feed`
Retrieves chronological and engagement-ranked home feed posts from followed users and platform highlights.
* **Auth Required:** Optional (returns public highlights if unauthenticated)
* **Query Parameters:** `page=1`, `limit=15`
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [ ...posts ],
    "posts": [ ...posts ],
    "pagination": { "page": 1, "limit": 15, "total": 45, "totalPages": 3 }
  }
  ```

---

## 6. Real-Time Chat Endpoints & Socket Events

### REST Endpoints
* `GET /api/v1/chat/conversations`: Retrieves all active 1-to-1 conversations for the authenticated user.
* `POST /api/v1/chat/conversations/:targetId`: Resolves or creates a 1-to-1 conversation room with the target user.
* `GET /api/v1/chat/messages/:conversationId`: Retrieves paginated messages for a conversation.
* `POST /api/v1/chat/messages/:conversationId`: Sends a message (`{ "text": "..." }`).
* `PUT /api/v1/chat/messages/:conversationId/read`: Marks all unread messages as read.

### Socket.IO Events
| Event Name | Direction | Payload | Semantics |
| :--- | :--- | :--- | :--- |
| `chat:join` | Client -> Server | `{ "conversationId": "..." }` | Joins the conversation room after DB membership verification |
| `chat:leave` | Client -> Server | `{ "conversationId": "..." }` | Leaves the conversation room |
| `message:send` | Client -> Server | `{ "conversationId": "...", "text": "..." }` | Emits message with author set to authenticated socket user |
| `message:new` | Server -> Client | `{ "conversationId": "...", "message": { ... } }` | Broadcast to conversation room and recipient personal room |
| `message:delivered`| Server -> Client | `{ "conversationId": "...", "messageId": "..." }` | Emitted when peer is online upon message arrival |
| `message:typing` | Bidirectional | `{ "conversationId": "...", "isTyping": true }` | Broadcast to room members excluding sender |
| `message:read` | Bidirectional | `{ "conversationId": "...", "readBy": "..." }` | Marks messages read and notifies senders |

---

## 7. WebRTC Audio & Video Calling Socket Protocol

| Event Name | Direction | Payload | Semantics |
| :--- | :--- | :--- | :--- |
| `call:initiate` | Client -> Server | `{ "recipientId": "...", "type": "audio"|"video" }` | Initiates call. Checks online and busy state in DB |
| `call:incoming` | Server -> Callee | `{ "callId": "...", "caller": { ... }, "callType": "..." }` | Callee receives incoming ringing toast |
| `call:ringing` | Server -> Caller | `{ "callId": "..." }` | Informs caller that callee device is ringing |
| `call:accept` | Callee -> Server | `{ "callId": "..." }` | Callee accepts call. Status set to `accepted` in DB |
| `call:accepted` | Server -> Caller | `{ "callId": "...", "callerId": "...", "calleeId": "..." }` | Caller receives accept event and creates WebRTC SDP Offer |
| `call:offer` | Caller -> Callee | `{ "callId": "...", "sdp": { ... } }` | Forwards SDP Offer to callee |
| `call:answer` | Callee -> Caller | `{ "callId": "...", "sdp": { ... } }` | Forwards SDP Answer to caller |
| `call:ice-candidate` | Bidirectional | `{ "callId": "...", "candidate": { ... } }` | Relays STUN/TURN ICE candidate |
| `call:reject` | Callee -> Server | `{ "callId": "...", "reason": "declined"|"busy" }` | Declines incoming call. Status updated in DB |
| `call:rejected` | Server -> Caller | `{ "callId": "...", "reason": "..." }` | Alerts caller of rejection |
| `call:cancel` | Caller -> Server | `{ "callId": "..." }` | Caller cancels call before answer |
| `call:cancelled` | Server -> Callee | `{ "callId": "..." }` | Dismisses incoming call modal on callee |
| `call:end` | Client -> Server | `{ "callId": "...", "duration": 120 }` | Hangs up active call. Status set to `completed` in DB |
| `call:ended` | Server -> Peer | `{ "callId": "...", "duration": 120 }` | Cleans up media stream on peer device |
