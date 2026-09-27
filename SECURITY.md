# Security Architecture & Verification: NOVA

NOVA enforces defense-in-depth security principles across transport, authentication, authorization, data persistence, and real-time WebSocket communications.

---

## 1. Verified Security Checklist

All checks in this matrix are validated by automated regression tests in `tests/security.test.js`:

| Security Domain | Vulnerability / Threat | Mitigation Mechanism | Test Status |
| :--- | :--- | :--- | :---: |
| **Authentication** | Missing `await bcrypt.compare` bypass | `AuthService.login` strictly awaits password comparison before token generation. | ✅ PASSED |
| **Authentication** | Cross-request token leakage | Request-scoped token extraction in `auth.js` middleware replaces module-scoped variables. | ✅ PASSED |
| **Authentication** | Expired or malformed JWT | Intercepted via try/catch returning structured HTTP 401 without unhandled crashes. | ✅ PASSED |
| **Authentication** | Brute force login attacks | `express-rate-limit` limits login attempts to 20 per 15 minutes per IP. | ✅ PASSED |
| **Authorization** | IDOR on post deletion | `PostService.deletePost` validates `post.postedBy.equals(currentUserId)` (HTTP 403). | ✅ PASSED |
| **Authorization** | Unauthorized room access | Sockets must authenticate via JWT handshake and verify conversation membership. | ✅ PASSED |
| **Authorization** | Sender ID spoofing | Sockets override client-supplied `senderId` with authoritative `socket.user._id`. | ✅ PASSED |
| **Data Protection** | Sensitive field exposure | Queries and feed population explicitly project out `-password -otp -otpExpiresAt`. | ✅ PASSED |
| **Social Safety** | Self-follow & block abuse | Validation blocks self-follows; block lists prevent messaging and call initiation. | ✅ PASSED |
| **Input Security** | NoSQL query injection | Middleware recursively strips keys beginning with `$` or containing `.`. | ✅ PASSED |
| **Input Security** | Malformed ObjectIds | Mongoose `CastError` is caught by centralized error handler returning HTTP 400. | ✅ PASSED |

---

## 2. Authentication & Session Lifecycles

* **Access Token**: Short-lived JWT (signed with `JWT_ACCESS_SECRET`) containing user ID and handle, valid for 24 hours.
* **Refresh Token**: Signed with `JWT_REFRESH_SECRET` and persisted in the `Session` collection in MongoDB, valid for 7 days.
* **Session Revocation**: Logging out deletes the session from MongoDB; password resets revoke all active sessions.

---

## 3. Data Protection at Rest and in Transit

* Passwords are hashed using `bcrypt` with a salt work factor of 10.
* Cloudinary direct uploads use server-generated HMAC-SHA256 signatures, avoiding passing raw media payloads through the Node application layer.
* HTTP headers are secured using Helmet (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
