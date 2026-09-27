# NOVA Social Content System — Pre-Implementation Audit

**Audit Date:** September 2026  
**Auditor:** Senior Staff Full-Stack Engineer & Product Architect  
**Objective:** Complete audit of content architecture, data models, APIs, and UI states before implementing real social content infrastructure.

---

## 1. Feature-by-Feature State Assessment

| Feature | Frontend Exists? | Backend Exists? | Database Exists? | API Exists? | Actually Connected? | Current Bug / Gap | Required Implementation |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **Profile: Posts Tab** | YES | PARTIAL | YES | YES | PARTIAL | `getUserPosts` returned all posts without pagination in UI; profile posts tab reloaded same state. | Dedicated `GET /api/v1/posts/user/:userId?page=...` with separate profile state, pagination, and empty state. |
| **Profile: Media Tab** | YES | NO | PARTIAL | NO | NO | Frontend simply filtered `posts.filter(p => p.media)` from the generic posts array. No dedicated media query exists on backend. | Dedicated `GET /api/v1/posts/user/:userId/media` querying posts with non-empty media or `postUrl`, paginated, separate loading/empty states. |
| **Profile: Saved Tab** | YES | NO | NO (Legacy array only) | NO | NO | Frontend returned identical `posts` array when Saved was active. No dedicated `SavedPost` collection or APIs. `handleToggleSave` only changed local state. | Dedicated `SavedPost` collection with unique compound index `{ user, post }`. `POST /posts/:postId/save`, `DELETE /posts/:postId/save`, `GET /users/me/saved`. Strict user isolation. |
| **Login Demo Accounts** | YES | YES | YES | YES | YES | `LoginPage.jsx` had "One-Click Demo Profiles" with hardcoded buttons for Alice and Bob. | Complete eradication of demo buttons, demo credentials, and quick login UI from production login screen. |
| **Feed Algorithm** | PARTIAL | PARTIAL | YES | YES | PARTIAL | Backend was strictly chronological (`Post.find().sort({ createdAt: -1 })`). No relationship, interaction, freshness decay, or diversity scoring. | Transparent V1 Feed Algorithm with candidate generation, scoring (relationship, engagement, interest, freshness, interaction history), diversity constraints (max 2 consecutive per creator), and 75/25 personalization-discovery balance. |
| **Post Click → Feed** | NO | NO | N/A | NO | NO | Clicking posts in Profile or Discover grid did nothing. | `onSelectPost` callback entering `/feed?post=<id>` or focused post state in `FeedPage` for continuous scrolling. |
| **Post Sharing to Chat** | PARTIAL (OS Share only) | NO | NO | NO | NO | `PostCard.jsx` only called `navigator.share`. No conversation picker, no in-app message creation. | Share modal with conversation selector and copy link. Message model extended with `messageType: 'POST_SHARE'` and `sharedPostId`. Rich preview card in ChatView. |
| **Stories / Status System** | NO | NO | NO | NO | NO | No story model, no story rail, no creation flow, no 24-hour expiration filter, no view tracking. | `Story` model (userId, mediaUrl, mediaType, caption, expiresAt: +24h), `StoryView` model (storyId, viewerId, viewedAt), story rail on Home/Feed, story creator, and full screen story player. |
| **Story Privacy & Views** | NO | NO | NO | NO | NO | Story views and privacy did not exist. | Filter stories by block and privacy rules. Story view tracking endpoint `POST /stories/:id/view` with deduplication and viewer listing for author. |

---

## 2. Model & Database Deficiencies Identified

1. **`Message` Model (`src/models/Message.js`):**
   - Lacks `messageType` (`'TEXT'`, `'POST_SHARE'`, `'MEDIA'`).
   - Lacks `sharedPostId` (ObjectId referencing `Post`).
2. **`SavedPost` Model (Missing):**
   - Need dedicated `SavedPost` schema: `{ user: ObjectId, post: ObjectId, createdAt: Date }` with compound unique index `{ user: 1, post: 1 }`.
3. **`Story` Model (Missing):**
   - Need dedicated `Story` schema: `{ user: ObjectId, mediaUrl: String, mediaType: String, caption: String, expiresAt: Date, visibility: String }` with indexes on `{ user: 1 }` and `{ expiresAt: 1 }`.
4. **`StoryView` Model (Missing):**
   - Need dedicated `StoryView` schema: `{ story: ObjectId, viewer: ObjectId, viewedAt: Date }` with compound unique index `{ story: 1, viewer: 1 }`.

---

## 3. Implementation Blueprint

1. **Database Layer:**
   - Create `src/models/SavedPost.js`.
   - Create `src/models/Story.js`.
   - Create `src/models/StoryView.js`.
   - Extend `src/models/Message.js` with `messageType` and `sharedPostId`.
2. **Backend Services & Controllers:**
   - Create `src/services/feed/FeedCandidateService.js`, `FeedRankingService.js`, `FeedDiversityService.js`.
   - Update `src/services/feedService.js` to run the algorithmic pipeline.
   - Update `src/services/postService.js` with `savePost`, `unsavePost`, `getSavedPosts`, `getUserMediaPosts`.
   - Create `src/services/storyService.js` with `createStory`, `getFeedStories`, `getStoryById`, `recordStoryView`, `getStoryViewers`, `deleteStory`.
   - Create `src/controllers/storyController.js` and `src/routes/api/v1/storyRoutes.js`.
   - Update `src/services/chatService.js` to support `POST_SHARE` message type and populate `sharedPostId`.
3. **Frontend Integration:**
   - Remove demo credentials from `LoginPage.jsx`.
   - Refactor `ProfilePage.jsx` into three distinct datasets: Posts (`api.get('/api/v1/posts/user/:id')`), Media (`api.get('/api/v1/posts/user/:id/media')`), and Saved (`api.get('/api/v1/users/me/saved')`).
   - Implement Post Share modal in `PostCard.jsx` allowing sending to any user conversation or copying link.
   - Implement rich post preview in `ChatView.jsx` with 1-click navigation to feed context.
   - Implement Story rail at the top of `FeedPage.jsx` with live story modal viewer and creator.
   - Wire grid clicks in `ProfilePage.jsx` and `DiscoverPage.jsx` to enter continuous feed context.
4. **Testing & Verification:**
   - Author comprehensive automated integration test suite in `tests/social_content.test.js`.
