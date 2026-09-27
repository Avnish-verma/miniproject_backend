const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    // Backwards compatibility with existing single media posts
    postUrl: {
      type: String,
      default: '',
    },
    public_id: {
      type: String,
      default: '',
    },
    // Modern multi-media array
    media: [
      {
        url: { type: String, required: true },
        public_id: { type: String, default: '' },
        mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
          type: String,
          enum: ['LIKE', 'LOVE', 'FIRE', 'INSIGHT', 'CLAP'],
          default: 'LIKE',
        },
      },
    ],
    hashtags: [{ type: String, lowercase: true, trim: true, index: true }],
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.index({ createdAt: -1 });

postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

module.exports = Post;
