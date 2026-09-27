const User = require('../models/User');
const Block = require('../models/Block');
const Notification = require('../models/Notification');
const { ValidationError, NotFoundError, ForbiddenError } = require('../errors/errorTypes');

class SocialService {
  async toggleFollow(currentUserId, targetIdentifier) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetIdentifier);
    const query = isObjectId ? { _id: targetIdentifier } : { userId: targetIdentifier.toLowerCase() };

    const targetUser = await User.findOne(query);
    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }

    if (targetUser._id.equals(currentUserId)) {
      throw new ValidationError('You cannot follow yourself');
    }

    // Check if blocked
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: currentUserId, blocked: targetUser._id },
        { blocker: targetUser._id, blocked: currentUserId },
      ],
    });
    if (isBlocked) {
      throw new ForbiddenError('Unable to follow this user due to privacy/block settings.');
    }

    // Safe ObjectId comparison using .some(id => id.equals(currentUserId))
    const isCurrentlyFollowing = targetUser.follower.some((id) => id.equals(currentUserId));

    if (isCurrentlyFollowing) {
      // Unfollow atomically
      await Promise.all([
        User.findByIdAndUpdate(targetUser._id, { $pull: { follower: currentUserId } }),
        User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUser._id } }),
      ]);
      return { isFollowing: false, message: `Unfollowed ${targetUser.userId}` };
    } else {
      // Follow atomically
      await Promise.all([
        User.findByIdAndUpdate(targetUser._id, { $addToSet: { follower: currentUserId } }),
        User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUser._id } }),
      ]);

      // Create in-app notification
      await Notification.create({
        recipient: targetUser._id,
        sender: currentUserId,
        type: 'FOLLOW',
        message: 'started following you',
      });

      return { isFollowing: true, message: `Now following ${targetUser.userId}` };
    }
  }

  async blockUser(currentUserId, targetUserId) {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    if (targetUser._id.equals(currentUserId)) {
      throw new ValidationError('You cannot block yourself');
    }

    // Upsert block
    await Block.findOneAndUpdate(
      { blocker: currentUserId, blocked: targetUser._id },
      { $set: { blocker: currentUserId, blocked: targetUser._id } },
      { upsert: true }
    );

    // Atomically remove from each other's follower/following lists
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUser._id, follower: targetUser._id },
      }),
      User.findByIdAndUpdate(targetUser._id, {
        $pull: { following: currentUserId, follower: currentUserId },
      }),
    ]);

    return { message: `Blocked ${targetUser.userId}` };
  }

  async unblockUser(currentUserId, targetUserId) {
    await Block.deleteOne({ blocker: currentUserId, blocked: targetUserId });
    return { message: 'User unblocked successfully' };
  }

  async getBlockedUsers(currentUserId) {
    const blocks = await Block.find({ blocker: currentUserId }).populate(
      'blocked',
      'userId fullname profilePic'
    );
    return blocks.map((b) => b.blocked).filter(Boolean);
  }
}

module.exports = new SocialService();
