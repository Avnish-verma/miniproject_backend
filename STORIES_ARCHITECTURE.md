# NOVA — Real 24-Hour Stories & Status System Architecture

## 1. Overview
NOVA's Status & Stories feature provides lightweight, ephemeral updates that expire automatically 24 hours after publishing. The system guarantees instant expiration at query time, robust view deduplication, owner-restricted viewer analytics, and an interactive, mobile-optimized player.

---

## 2. Data Models & Index Strategy

### 2.1 Story Schema (`src/models/Story.js`)
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video', 'text'], default: 'image' },
  caption: { type: String, maxlength: 500 },
  textContent: { type: String, maxlength: 1000 },
  backgroundColor: { type: String, default: '#FF5C35' },
  visibility: { type: String, enum: ['public', 'followers'], default: 'public' },
  viewsCount: { type: Number, default: 0 },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Exactly 24 hours
  }
}
```
**Indexes**:
- Compound: `{ user: 1, expiresAt: 1 }`
- Single: `{ expiresAt: 1 }`

### 2.2 StoryView Schema (`src/models/StoryView.js`)
```javascript
{
  story: { type: ObjectId, ref: 'Story', required: true },
  viewer: { type: ObjectId, ref: 'User', required: true },
  viewedAt: { type: Date, default: Date.now }
}
```
**Compound Unique Index**:
- `{ story: 1, viewer: 1 }` (unique: true)
- Guarantees strict deduplication: repeated views by the same user do not inflate `viewsCount` or create redundant rows.

---

## 3. Query-Time Immediate Expiration

While MongoDB TTL background sweeps run only every 60 seconds, NOVA enforces **zero-latency query-time expiration**:

```javascript
const now = new Date();
const filter = { expiresAt: { $gt: now } };
```

This guarantees that:
1. Stories older than 24 hours vanish instantly from the rail across all devices.
2. Direct deep links to expired stories yield HTTP 404 cleanly.
3. No stale stories ever appear in feed aggregation.

---

## 4. Feed Grouping & Ordering Pipeline

When `GET /api/v1/stories/feed` is requested:
1. Active stories are retrieved and filtered against the user's block list and account privacy settings.
2. Stories are grouped by creator into an array of author nodes:
   ```json
   {
     "user": { "_id": "...", "fullname": "...", "profilePic": "..." },
     "isSelf": false,
     "hasUnviewed": true,
     "stories": [...]
   }
   ```
3. Authors are sorted deterministically:
   - **Self First**: The authenticated user's own stories appear at the beginning of the rail.
   - **Unviewed Priority**: Creators with unseen stories appear before fully consumed story sets.
   - **Fully Viewed**: Placed at the end with muted border indicators.

---

## 5. Viewer Tracking & Security

- View recording (`POST /api/v1/stories/:id/view`) is idempotent.
- Viewer inspection (`GET /api/v1/stories/:id/viewers`) enforces strict authorization: only the story's creator can view the viewer list (`403 Forbidden` for non-authors).

---

## 6. Frontend Interactive Story Player

The `StoryViewerModal` and `StoryRail` components deliver:
- **Segmented Progress Bars**: Visual time segment for each story in the group.
- **Auto-Advance**: 5000ms timer advances to the next segment automatically.
- **Press-and-Hold Pause**: Pauses playback on pointer-down or touch-start.
- **Left / Right Tap Navigation**: 33% width tap target zones for instant forward/backward navigation.
- **Author Viewers Drawer**: Allows the creator to swipe up and inspect the real-time list of viewers.
- **Owner Controls**: Inline delete option for the author.
