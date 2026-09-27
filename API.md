# REST API Documentation: NOVA Platform

All modern endpoints are versioned under `/api/v1/`. Legacy endpoints are maintained as secure compatibility adapters.

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | No | Register new user account; sends 6-digit OTP email. |
| `POST` | `/api/v1/auth/verify-otp` | No | Verify email OTP; issues access & refresh tokens. |
| `POST` | `/api/v1/auth/login` | No | Authenticate user; returns tokens and user profile. |
| `POST` | `/api/v1/auth/refresh-token` | No | Exchange refresh token for fresh access token. |
| `POST` | `/api/v1/auth/logout` | Yes | Invalidate session and clear auth cookies. |
| `POST` | `/api/v1/auth/forgot-password`| No | Dispatch 10-minute timed password reset link. |
| `POST` | `/api/v1/auth/reset-password/:token` | No | Reset password using verified token. |
| `GET` | `/api/v1/auth/me` | Yes | Get currently authenticated user profile. |

---

## 2. User & Profile Endpoints (`/api/v1/users`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/users/profile/:userId` | Optional | Retrieve user profile (excluding sensitive fields). |
| `PUT` | `/api/v1/users/profile` | Yes | Update display name, bio, gender, privacy settings. |
| `PUT` | `/api/v1/users/avatar` | Yes | Update profile avatar via Cloudinary reference. |
| `PUT` | `/api/v1/users/cover` | Yes | Update profile cover picture. |
| `GET` | `/api/v1/users/search` | Optional | Debounced search for members by handle or name. |

---

## 3. Social Graph Endpoints (`/api/v1/social`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/social/follow/:userId` | Yes | Atomic follow / unfollow toggle. |
| `POST` | `/api/v1/social/block/:userId` | Yes | Block user and sever existing follow relationships. |
| `DELETE` | `/api/v1/social/block/:userId` | Yes | Unblock user. |
| `GET` | `/api/v1/social/blocked` | Yes | List currently blocked users. |

---

## 4. Posts & Comments Endpoints (`/api/v1/posts`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/posts` | Yes | Create post with captions, hashtags, and media. |
| `GET` | `/api/v1/posts/:postId` | Optional | Get post by ID with like/reaction status. |
| `DELETE` | `/api/v1/posts/:postId` | Yes | Delete post (IDOR verified; author only). |
| `POST` | `/api/v1/posts/:postId/like` | Yes | Toggle like on post atomically. |
| `POST` | `/api/v1/posts/:postId/react` | Yes | Toggle custom reaction (`LIKE`, `LOVE`, `FIRE`, etc.). |
| `POST` | `/api/v1/posts/:postId/comments` | Yes | Add comment or threaded reply. |
| `GET` | `/api/v1/posts/:postId/comments` | Optional | Paginated comments list for post. |
| `GET` | `/api/v1/posts/user/:userId` | Optional | Paginated posts created by a specific user. |

---

## 5. Feed Endpoint (`/api/v1/feed`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/feed` | Optional | Paginated chronological feed excluding sensitive fields. |

---

## 6. Direct Messaging Endpoints (`/api/v1/chat`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/chat/conversations` | Yes | List conversations for authenticated user with unread counts. |
| `POST` | `/api/v1/chat/conversations/:targetId` | Yes | Fetch or create 1-to-1 conversation. |
| `GET` | `/api/v1/chat/messages/:conversationId` | Yes | Fetch paginated conversation message history. |
| `POST` | `/api/v1/chat/messages/:conversationId` | Yes | Send text or media message. |
| `PUT` | `/api/v1/chat/messages/:conversationId/read` | Yes | Mark conversation messages as read. |

---

## 7. Calling & Media Endpoints (`/api/v1/calls` & `/api/v1/media`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/calls/initiate` | Yes | Record new call session and verify recipient state. |
| `PUT` | `/api/v1/calls/:callId/status` | Yes | Update call status (`accepted`, `rejected`, `completed`). |
| `GET` | `/api/v1/calls/history` | Yes | Retrieve call logs and history. |
| `GET` | `/api/v1/media/upload-post` | Yes | Generate signed upload parameters for post media. |
| `GET` | `/api/v1/media/upload-avatar` | Yes | Generate signed upload parameters for avatar media. |

---

## 8. Backwards-Compatible Legacy Endpoints

| Method | Legacy Route | Maps To Secure Service |
| :--- | :--- | :--- |
| `POST` | `/register` | `authService.register` |
| `POST` | `/register/verify` | `authService.verifyOtp` |
| `POST` | `/login` | `authService.login` (with `await bcrypt.compare`) |
| `POST` | `/login/forgotpassword` | `authService.forgotPassword` |
| `POST` | `/post/create-post` | `postService.createPost` |
| `POST` | `/post/like/:postId` | `postService.toggleLike` (atomic) |
| `GET` | `/feed` | `feedService.getFeed` (sanitized projection) |
| `GET` | `/profile` | `userService.getProfile` |
