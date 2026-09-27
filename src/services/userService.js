const User = require('../models/User');
const Post = require('../models/Post');
const Block = require('../models/Block');
const { NotFoundError, ForbiddenError } = require('../errors/errorTypes');

class UserService {
  async getProfile(targetUsernameOrId, currentUserId = null) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetUsernameOrId);
    const query = isObjectId ? { _id: targetUsernameOrId } : { userId: targetUsernameOrId.toLowerCase() };

    const user = await User.findOne(query)
      .select('-password -otp -otpExpiresAt')
      .populate('follower', 'userId fullname profilePic')
      .populate('following', 'userId fullname profilePic');

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    // Check if blocked
    if (currentUserId) {
      const isBlocked = await Block.findOne({
        $or: [
          { blocker: currentUserId, blocked: user._id },
          { blocker: user._id, blocked: currentUserId },
        ],
      });
      if (isBlocked) {
        throw new ForbiddenError('You cannot view this profile.');
      }
    }

    const postsCount = await Post.countDocuments({ postedBy: user._id });

    const isSelf = currentUserId ? user._id.equals(currentUserId) : false;
    const isFollowing = currentUserId
      ? user.follower.some((f) => f._id.equals(currentUserId))
      : false;

    // Privacy check: if private profile and not self and not following, hide posts
    const canViewContent = !user.privacy.isPrivate || isSelf || isFollowing;

    return {
      user: {
        _id: user._id,
        userId: user.userId,
        fullname: user.fullname,
        emailId: isSelf ? user.emailId : undefined,
        bio: user.bio,
        gender: user.gender,
        profilePic: user.profilePic,
        coverPic: user.coverPic,
        followersCount: user.follower.length,
        followingCount: user.following.length,
        postsCount,
        privacy: user.privacy,
        appearance: user.appearance,
        isSelf,
        isFollowing,
        canViewContent,
      },
    };
  }

  async updateProfile(userId, updateData) {
    const allowedFields = ['fullname', 'bio', 'gender', 'privacy', 'appearance'];
    const filteredUpdate = {};

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredUpdate[key] = updateData[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdate },
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpiresAt');

    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return updatedUser;
  }

  async updateAvatar(userId, { url, public_id }) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePic: { url, public_id } } },
      { new: true }
    ).select('-password -otp -otpExpiresAt');

    return user;
  }

  async updateCover(userId, { url, public_id }) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { coverPic: { url, public_id } } },
      { new: true }
    ).select('-password -otp -otpExpiresAt');

    return user;
  }

  async searchUsers(query, currentUserId = null, { page = 1, limit = 20 }) {
    if (!query || query.trim() === '') return { users: [], total: 0 };

    const regex = new RegExp(query.trim(), 'i');
    const filter = {
      $or: [{ userId: regex }, { fullname: regex }],
    };

    // Exclude blocked users if authenticated
    if (currentUserId) {
      const blocks = await Block.find({
        $or: [{ blocker: currentUserId }, { blocked: currentUserId }],
      });
      const blockedIds = blocks.map((b) =>
        b.blocker.equals(currentUserId) ? b.blocked : b.blocker
      );
      if (blockedIds.length > 0) {
        filter._id = { $nin: blockedIds };
      }
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('userId fullname profilePic bio')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return { users, total, page, limit };
  }

  async getUserFollowers(targetUsernameOrId, { page = 1, limit = 20 }) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetUsernameOrId);
    const query = isObjectId ? { _id: targetUsernameOrId } : { userId: targetUsernameOrId.toLowerCase() };

    const user = await User.findOne(query)
      .select('follower')
      .populate({
        path: 'follower',
        select: 'userId fullname profilePic bio',
      });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const total = user.follower ? user.follower.length : 0;
    const skip = (page - 1) * limit;
    const followers = (user.follower || []).slice(skip, skip + limit);

    return { followers, total, page, limit };
  }

  async getUserFollowing(targetUsernameOrId, { page = 1, limit = 20 }) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetUsernameOrId);
    const query = isObjectId ? { _id: targetUsernameOrId } : { userId: targetUsernameOrId.toLowerCase() };

    const user = await User.findOne(query)
      .select('following')
      .populate({
        path: 'following',
        select: 'userId fullname profilePic bio',
      });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const total = user.following ? user.following.length : 0;
    const skip = (page - 1) * limit;
    const following = (user.following || []).slice(skip, skip + limit);

    return { following, total, page, limit };
  }
}

module.exports = new UserService();
