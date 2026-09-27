# NOVA — Frontend & Backend API Alignment Audit

## 1. Overview
This document logs every identified contract discrepancy, route variance, or response structure mismatch between the React frontend client and Express backend API, along with their resolutions.

---

## 2. API Contract Mismatches & Resolutions

| # | Feature Area | Endpoint | Issue Identified | Resolution Implemented |
|---|---|---|---|---|
| 1 | **Trending Topics** | `GET /api/v1/posts/trending-tags` | Frontend (`DiscoverPage`, `AppLayout`) displayed hardcoded topics with fake counts. Backend had no aggregation endpoint. | Implemented MongoDB aggregation pipeline on `Post.hashtags` returning real active tags with real post counts. |
| 2 | **Stories Feed Route** | `GET /api/v1/stories/feed` | Frontend called `/api/v1/stories/feed`, but backend only had `GET /api/v1/stories`. | Added alias `router.get('/feed', ...)` in `storyRoutes.js` supporting both path styles. |
| 3 | **Story Text Property** | `POST /api/v1/stories` | Client sent `{ text }`, but backend validator previously only checked `{ textContent }`. | Updated `storyService.createStory` to accept `text || textContent || caption` and added virtual `text` getter to `Story` schema. |
| 4 | **Story Viewers Array** | `GET /api/v1/stories/:id/viewers` | Backend returned `{ storyId, viewsCount, viewers }`, causing `res.data.data.map` to fail when client expected array. | Updated controller to return `data: result.viewers` with `total: result.viewsCount` metadata. |
| 5 | **Chat Conversation Creation**| `POST /api/v1/chat/conversations` | Client `ShareModal` sent `{ recipientId }` in request body, while route only matched `/:targetId`. | Updated controller to accept `req.params.targetId || req.body.targetId || req.body.recipientId` and mounted `POST /conversations`. |
| 6 | **Save / Unsave Flags** | `POST /api/v1/posts/:id/save` | Client toggle expected `isSaved` or `saved` boolean. | Standardized response data to return `{ isSaved: boolean, saved: boolean }`. |
| 7 | **URL Sync & Direct Deep Link**| `/feed?post=<id>` | Client ignored `?post=` search params on page load. | Added URL query parameter parser in `App.jsx` to initialize `focusedPostId` and synchronize browser history. |
