const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'text'],
      default: 'image',
    },
    duration: {
      type: Number,
      default: 5,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    textContent: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    backgroundColor: {
      type: String,
      default: '#FF5C35',
    },
    visibility: {
      type: String,
      enum: ['public', 'followers'],
      default: 'public',
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Strictly 24 hours
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual 'text' property for easy frontend access
storySchema.virtual('text').get(function () {
  return this.textContent || this.caption || '';
});

// Indexes for high-performance feed filtering and user story grouping
storySchema.index({ user: 1, expiresAt: 1 });
storySchema.index({ expiresAt: 1 });

const Story = mongoose.models.Story || mongoose.model('Story', storySchema);

module.exports = Story;
