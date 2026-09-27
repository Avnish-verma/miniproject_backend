# NOVA — Social Content System Architecture

## Executive Summary
NOVA's social content architecture replaces fragmented or demo-driven presentation with a unified, end-to-end data pipeline backed by MongoDB, Express, Socket.IO, and React 19. All user profiles, feeds, saved items, stories, and shared posts are dynamically driven by real database documents, strict authorization checks, and zero synthetic/mock data.

---

## 1. Domain Entities & Schema Design

```
+-----------------------------------------------------------------------------------+
|                                  MongoDB Domain Model                             |
+-----------------------------------------------------------------------------------+

     +-----------------------+                    +------------------------+
     |         User          |                    |          Post          |
     |-----------------------|                    |------------------------|
     | _id: ObjectId         | 1               *  | _id: ObjectId          |
     | userId: String (uniq) |<-------------------| postedBy: ref(User)    |
     | fullname: String      |                    | caption: String        |
     | emailId: String       |                    | postUrl: String        |
     | profilePic: String    |                    | media: [MediaItem]     |
     | followers: [ref]      |                    | likes: [ref(User)]     |
     | following: [ref]      |                    | likesCount: Number     |
     | privacy: { isPrivate }|                    | commentsCount: Number  |
     +-----------------------+                    | createdAt: Date        |
           ^            ^                         +------------------------+
           |            |                                    ^
           |            |                                    | 1
           |            |                                    |
           |            +-----------------------+            | *
           | 1                                * |            |
     +-----------------------+            +------------------------+
     |         Story         |            |       SavedPost        |
     |-----------------------|            |------------------------|
     | _id: ObjectId         |            | _id: ObjectId          |
     | user: ref(User)       |            | user: ref(User)        |
     | mediaUrl: String      |            | post: ref(Post)        |
     | textContent: String   |            | createdAt: Date        |
     | backgroundColor: Str  |            +------------------------+
     | expiresAt: Date (24h) |            * Compound index:        |
     | viewsCount: Number    |              { user: 1, post: 1 }   |
     +-----------------------+              (Unique per user-post) |
           ^
           | 1
           | *
     +-----------------------+            +------------------------+
     |       StoryView       |            |        Message         |
     |-----------------------|            |------------------------|
     | _id: ObjectId         |            | _id: ObjectId          |
     | story: ref(Story)     |            | conversationId: ref    |
     | viewer: ref(User)     |            | sender: ref(User)      |
     | viewedAt: Date        |            | text: String           |
     +-----------------------+            | messageType: Enum      |
     * Compound unique index:             |   [TEXT, POST_SHARE]   |
       { story: 1, viewer: 1 }            | sharedPostId: ref(Post)|
                                          +------------------------+
```

---

## 2. Profile Content Endpoints & Data Differentiation

### 2.1 Tab Partitioning
A core requirement was that `Posts`, `Media`, and `Saved` must represent **three genuinely distinct datasets**:
1. **Posts Tab**:
   - Route: `GET /api/v1/posts/user/:identifier`
   - Content: All top-level posts authored by the user (both text thoughts and media posts).
   - Enriched with: `isLiked`, `isSaved`.
2. **Media Tab**:
   - Route: `GET /api/v1/posts/user/:identifier/media`
   - Content: Strictly posts containing image/video assets (`media.0` exists OR `postUrl != ''`).
   - Pure text posts are excluded at the database aggregation query level.
3. **Saved Tab (Private Library)**:
   - Route: `GET /api/v1/posts/saved` or `GET /api/v1/users/me/saved`
   - Security: Accessible **only** by the authenticated session owner (`isSelf`). If a user visits another profile (`!isSelf`), the Saved tab is strictly hidden from the UI and forbidden via API.
   - Populated from the dedicated `SavedPost` collection with compound `{ user, post }` uniqueness.

---

## 3. Dedicated Saved Post System

### 3.1 Idempotency & Database Integrity
- **Model**: `src/models/SavedPost.js`
- **Unique Compound Index**: `{ user: 1, post: 1 }` guarantees that concurrent or repeated save requests never create duplicate bookmarks.
- **Save Operation**:
  ```javascript
  await SavedPost.findOneAndUpdate(
    { user: userId, post: postId },
    { $setOnInsert: { user: userId, post: postId } },
    { upsert: true, new: true }
  );
  ```
- **Unsave Operation**:
  ```javascript
  await SavedPost.findOneAndDelete({ user: userId, post: postId });
  ```

---

## 4. End-to-End Deep Navigation & Post Focus

When navigating from any context (chat shared message, discover media grid, profile grid, or direct link):
1. Client calls `handleSelectPost(postId)`.
2. Active tab transitions to `'feed'`.
3. If the post exists in the active client feed array, it is smoothly scrolled into the center viewport with a focus accent indicator (`isFocused`).
4. If the post is outside the current pagination window, `GET /api/v1/posts/:postId` is dynamically fetched and prepended to the continuous feed stream, preserving surrounding context.
