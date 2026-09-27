# NOVA — In-App Post Sharing Architecture

## 1. Overview
NOVA's sharing architecture enables one-click post sharing directly into active conversations and peer direct messages, without creating dead-end web links or disconnecting the recipient from the social context.

---

## 2. Data Model Extensions (`src/models/Message.js`)

```javascript
const messageSchema = new mongoose.Schema({
  conversationId: { type: ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  messageType: {
    type: String,
    enum: ['TEXT', 'POST_SHARE', 'MEDIA'],
    default: 'TEXT',
  },
  sharedPostId: {
    type: ObjectId,
    ref: 'Post',
    default: null,
  },
  status: { type: String, enum: ['SENT', 'DELIVERED', 'READ'], default: 'SENT' },
  createdAt: { type: Date, default: Date.now },
});
```

---

## 3. End-to-End Sharing Workflow

```
[Post in Feed / Profile]
         │
         ▼  (User clicks Share button)
┌──────────────────────────────────────────────┐
│ ShareModal.jsx                               │
│  - Fetches user conversations               │
│  - Instant conversation search filter        │
│  - Optional personal note input              │
│  - Fallback: "Copy Link" to clipboard        │
└──────────────────────┬───────────────────────┘
                       │  POST /api/v1/chat/messages/:convId
                       ▼  { messageType: 'POST_SHARE', sharedPostId: post._id }
┌──────────────────────────────────────────────┐
│ ChatService & Sockets                        │
│  - Message persisted with sharedPostId       │
│  - Populated with postedBy { userId, name }  │
│  - Emits message:new via Socket.IO           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼  Real-time delivery to recipient
┌──────────────────────────────────────────────┐
│ ChatView.jsx                                 │
│  - Detects messageType === 'POST_SHARE'      │
│  - Renders interactive post preview card     │
│  - Click -> onSelectPost(sharedPostId)       │
└──────────────────────┬───────────────────────┘
                       │
                       ▼  Deep navigation
┌──────────────────────────────────────────────┐
│ FeedPage.jsx                                 │
│  - Scrolls directly to post in timeline      │
│  - Highlights post with accent focus ring    │
│  - Preserves continuous surrounding context  │
└──────────────────────────────────────────────┘
```

---

## 4. Privacy & Authorization Preservation
- If a post belongs to a private account, the recipient's ability to view full content in feed context continues to enforce relationship rules.
- If a shared post is deleted by its author, `sharedPostId` gracefully returns `null`, and the chat card indicates that the content has been removed by its author.
