# NOVA — Browser Acceptance & Full System Audit

## 1. System Inventory & Architecture Overview

The NOVA Social Platform consists of:
- **Backend**: Node.js + Express + Mongoose + Socket.IO + WebRTC signaling running on port 5000 (`server.js`).
- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4 running on port 5173 (`client/`).
- **Database**: MongoDB with collections: `users`, `posts`, `savedposts`, `stories`, `storyviews`, `conversations`, `messages`, `calls`, `notifications`, `sessions`, `blocks`, `comments`.

---

## 2. What Is Implemented & Connected

| Subsystem | Components / Services | Connection Status | Notes |
|---|---|---|---|
| **Authentication** | `authController`, `authService`, `AuthContext.jsx`, `LoginPage.jsx`, `RegisterPage.jsx` | Connected | Real JWT access/refresh tokens in localStorage & HTTP-only cookies. |
| **Profile Content** | `postController`, `postService`, `ProfilePage.jsx` | Connected | 3 separate endpoints for Posts, Media, and Saved. |
| **Saved Posts** | `SavedPost` model, `postController`, `PostCard.jsx` | Connected | Compound unique index `{ user, post }`. Private to session owner. |
| **Feed Algorithm V1** | `feedRankingService`, `feedDiversityService`, `feedController`, `FeedPage.jsx` | Connected | Scored candidate pipeline, 48h half-life, diversity constraint. |
| **Post Sharing** | `Message` model (`POST_SHARE`), `chatService`, `ShareModal.jsx`, `ChatView.jsx` | Connected | Realtime direct message with rich post preview and deep link. |
| **24h Stories / Status** | `Story`, `StoryView`, `storyService`, `StoryRail.jsx`, `StoryViewerModal.jsx` | Connected | Query-time expiration, view deduplication, viewers list. |
| **Realtime Messaging** | `chatHandler.js`, `ChatView.jsx`, Socket.IO | Connected | Typing indicators, delivered/read receipts, conversation updates. |
| **WebRTC Calls** | `callHandler.js`, `CallContext.jsx`, `CallOverlay.jsx`, `CallsPage.jsx` | Connected | 1-to-1 audio/video peer calling with signaling lifecycle. |
| **Notifications** | `notificationService`, `NotificationDrawer.jsx` | Connected | Real events (likes, comments, follows, missed calls). |
| **Theme System** | `ThemeContext.jsx`, `index.css`, Tailwind v4 variant | Connected | Central theme toggling dark/light mode with localStorage persistence. |

---

## 3. Discovered Bugs, Discrepancies & Audit Findings

### Issue A: URL Routing & Browser History / Refresh Desynchronization
- **Finding**: In `client/src/App.jsx`, `currentTab` is managed strictly as local React state (`useState('feed')`).
- **Impact**:
  1. If a user refreshes while on `/profile`, `/discover`, or `/chat`, the page resets to Home/Feed.
  2. Browser Back and Forward buttons do not navigate between visited tabs.
  3. Direct URL access (e.g. typing `/profile` or `/chat` in browser address bar) does not load that screen.
  4. The required deep link `/feed?post=<POST_ID>` cannot be loaded directly on initial browser launch because URL search query is not parsed into `focusedPostId` on startup.
- **Fix Required**: Synchronize `currentTab` and `focusedPostId` with `window.location.pathname`, `window.location.search`, and listen to `popstate` events.

### Issue B: Hardcoded Trending Topics in Frontend
- **Finding**:
  1. `client/src/pages/DiscoverPage.jsx` (lines 80-86) defines a hardcoded array `trendingTopics` with fake counts: `#Engineering (142.8K posts)`, `#ProductDesign (89.4K posts)`.
  2. `client/src/components/layout/AppLayout.jsx` (lines 358-363) defines another hardcoded array with fake counts: `#Engineering (14.2K posts)`, `#ProductDesign (8.5K posts)`.
- **Impact**: Violates the absolute rule "NO MOCK DATA. NO FAKE COUNTS."
- **Fix Required**: Create a backend endpoint `GET /api/v1/posts/trending-tags` that aggregates real hashtags from MongoDB `Post.hashtags`. Update both `DiscoverPage` and `AppLayout` to fetch real tags, and display a genuine empty state when none exist.

### Issue C: Development Registration & Verification Flow
- **Finding**: When registering in local development without SMTP credentials, `sendMail` logs the OTP to server console, but the frontend requires entering the 6-digit code.
- **Impact**: Users registering in dev mode cannot see the OTP in the browser UI.
- **Fix Required**: In non-production environments (`NODE_ENV !== 'production'`), include `devOtp` in the registration response or provide an automatic OTP helper so browser acceptance flows can register new accounts seamlessly.

### Issue D: 401 Session Expiration Event Propagation
- **Finding**: When an API request returns 401, `api.js` clears `localStorage`, but `AuthContext` state is not updated until page reload.
- **Impact**: The UI can stay in an authenticated appearance with failing network requests until refreshed.
- **Fix Required**: Dispatch a custom `auth:unauthorized` window event from `api.js` and listen in `AuthContext` to trigger clean logout.

### Issue E: Search Fallback & Empty State Handling in Discover
- **Finding**: `DiscoverPage.jsx` handles user search, but empty results should clearly communicate "No users found matching query" without infinite spin.
- **Fix Required**: Ensure clean error and empty states for all search conditions.

---

## 4. Verification Plan for Real Browser Acceptance

1. **Fix Audit Findings** (URL sync, trending tags endpoint, 401 event, dev OTP).
2. **Setup Browser Automation with Edge Chromium**:
   - Install `puppeteer-core`.
   - Write comprehensive browser test driver (`tests/browser_acceptance.test.js`) connecting to actual browser instances for User A and User B.
3. **Execute Acceptance Scenarios**:
   - Scenario 1: Authentication, Registration, Session Persistence across reloads.
   - Scenario 2: Profile (User A edit, persistence, view User B profile, ownership IDOR prevention).
   - Scenario 3: Posts & Media separation (text-only vs media posts).
   - Scenario 4: Saved posts (Save, Unsave, persistence, strict privacy isolation between User A & B).
   - Scenario 5: Post Click -> Feed context (`/feed?post=<id>`).
   - Scenario 6: Feed Algorithm & Filtering (`for_you` vs `following`).
   - Scenario 7: Real 24h Stories (Create, rail display, view tracking, deduplication, viewer drawer).
   - Scenario 8: Direct Post Sharing (Share modal, `POST_SHARE` message, interactive card, deep navigation).
   - Scenario 9: Full Navigation, Theme Toggling (light/dark persistence), and Responsive viewports.
4. **Run Platform Regression Tests** (`npm test`, `tests/realtime.test.js`, `tests/fullstack_e2e.test.js`, `tests/social_content.test.js`).
5. **Generate Final Acceptance Report** (`BROWSER_ACCEPTANCE_REPORT.md`).
