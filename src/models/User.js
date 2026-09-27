const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Do not return by default in queries
    },
    emailId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 300,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say',
    },
    otp: {
      type: Number,
      select: false, // Sensitive security field
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    profilePic: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
    },
    coverPic: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
    },
    follower: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedPost: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // Fixed reference
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    privacy: {
      isPrivate: { type: Boolean, default: false },
      allowDirectMessages: {
        type: String,
        enum: ['everyone', 'following', 'none'],
        default: 'everyone',
      },
    },
    appearance: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'dark',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for clean modern naming while preserving backward compatibility
userSchema.virtual('username')
  .get(function () { return this.userId; })
  .set(function (v) { this.userId = v; });

userSchema.virtual('email')
  .get(function () { return this.emailId; })
  .set(function (v) { this.emailId = v; });

userSchema.virtual('followersCount').get(function () {
  return this.follower ? this.follower.length : 0;
});

userSchema.virtual('followingCount').get(function () {
  return this.following ? this.following.length : 0;
});

// Avoid OverwriteModelError if model already registered
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
