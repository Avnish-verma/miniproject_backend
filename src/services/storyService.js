const Story = require('../models/Story');
const StoryView = require('../models/StoryView');
const User = require('../models/User');
const Block = require('../models/Block');
const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/errorTypes');

class StoryService {
  async createStory(userId, { mediaUrl = '', mediaType = 'image', caption = '', text = '', textContent = '', backgroundColor = '#FF5C35', visibility = 'public' }) {
    const finalContent = (textContent || text || caption || '').trim();
    if (!mediaUrl && !finalContent) {
      throw new ValidationError('Story must contain either media or text content');
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiration

    const story = await Story.create({
      user: userId,
      mediaUrl,
      mediaType: mediaUrl ? (mediaType || 'image') : 'text',
      caption: caption.trim(),
      textContent: finalContent,
      backgroundColor,
      visibility,
      expiresAt,
    });

    const populatedStory = await Story.findById(story._id)
      .populate('user', 'userId fullname profilePic')
      .lean();

    return {
      ...populatedStory,
      text: populatedStory.textContent || populatedStory.caption || '',
    };
  }

  async getFeedStories(currentUserId = null) {
    const now = new Date();
    const filter = { expiresAt: { $gt: now } };

    let followingIds = new Set();
    let blockedIds = [];

    if (currentUserId) {
      const [currentUser, blocks] = await Promise.all([
        User.findById(currentUserId).select('following').lean(),
        Block.find({
          $or: [{ blocker: currentUserId }, { blocked: currentUserId }],
        }).lean(),
      ]);

      if (currentUser && currentUser.following) {
        currentUser.following.forEach((id) => followingIds.add(id.toString()));
      }

      blockedIds = blocks.map((b) =>
        b.blocker.toString() === currentUserId.toString() ? b.blocked.toString() : b.blocker.toString()
      );
    }

    if (blockedIds.length > 0) {
      filter.user = { $nin: blockedIds };
    }

    // Retrieve active stories
    const activeStories = await Story.find(filter)
      .sort({ createdAt: 1 })
      .populate('user', 'userId fullname profilePic privacy')
      .lean();

    // Check which stories current user has viewed
    const viewedStoryIds = new Set();
    if (currentUserId && activeStories.length > 0) {
      const storyIds = activeStories.map((s) => s._id);
      const views = await StoryView.find({
        viewer: currentUserId,
        story: { $in: storyIds },
      }).select('story').lean();
      views.forEach((v) => viewedStoryIds.add(v.story.toString()));
    }

    // Group stories by author
    const groupsMap = new Map();

    for (const story of activeStories) {
      if (!story.user) continue;
      const author = story.user;
      const authorId = author._id ? author._id.toString() : author.toString();

      // Privacy check: skip private account stories if not following and not self
      if (author.privacy && author.privacy.isPrivate) {
        const isSelf = currentUserId && authorId === currentUserId.toString();
        const isFollowed = followingIds.has(authorId);
        if (!isSelf && !isFollowed) continue;
      }

      const isViewed = viewedStoryIds.has(story._id.toString());
      const storyWithStatus = {
        ...story,
        text: story.textContent || story.text || story.caption || '',
        isViewed,
        viewedByCurrentUser: isViewed,
      };

      if (!groupsMap.has(authorId)) {
        groupsMap.set(authorId, {
          user: {
            _id: author._id,
            userId: author.userId,
            fullname: author.fullname,
            profilePic: author.profilePic,
          },
          isSelf: currentUserId ? authorId === currentUserId.toString() : false,
          hasUnviewed: false,
          stories: [],
        });
      }

      const group = groupsMap.get(authorId);
      group.stories.push(storyWithStatus);
      if (!isViewed) {
        group.hasUnviewed = true;
      }
    }

    const groups = Array.from(groupsMap.values());

    // Sort: Current user first, then users with unviewed stories, then fully viewed stories
    groups.sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    return groups;
  }

  async getStoryById(storyId, currentUserId = null) {
    const story = await Story.findById(storyId)
      .populate('user', 'userId fullname profilePic privacy')
      .lean();

    if (!story) {
      throw new NotFoundError('Story not found');
    }

    if (new Date(story.expiresAt) <= new Date()) {
      throw new NotFoundError('This story has expired');
    }

    // Privacy / block check
    if (currentUserId) {
      const authorId = story.user._id;
      const isBlocked = await Block.findOne({
        $or: [
          { blocker: currentUserId, blocked: authorId },
          { blocker: authorId, blocked: currentUserId },
        ],
      });
      if (isBlocked) {
        throw new ForbiddenError('You cannot view this story');
      }
    }

    return story;
  }

  async recordStoryView(storyId, viewerId) {
    const story = await Story.findById(storyId);
    if (!story) {
      throw new NotFoundError('Story not found');
    }

    if (new Date(story.expiresAt) <= new Date()) {
      throw new ValidationError('Cannot view an expired story');
    }

    // Author viewing their own story does not record a viewer entry
    if (story.user.equals(viewerId)) {
      return { success: true, isSelf: true, viewsCount: story.viewsCount };
    }

    // Deduplicated insert via unique compound index
    const existingView = await StoryView.findOne({ story: storyId, viewer: viewerId });
    if (!existingView) {
      await StoryView.create({ story: storyId, viewer: viewerId });
      await Story.findByIdAndUpdate(storyId, { $inc: { viewsCount: 1 } });
    }

    const updatedStory = await Story.findById(storyId).select('viewsCount');
    return { success: true, viewsCount: updatedStory ? updatedStory.viewsCount : story.viewsCount };
  }

  async getStoryViewers(storyId, currentUserId) {
    const story = await Story.findById(storyId);
    if (!story) {
      throw new NotFoundError('Story not found');
    }

    // Only author can view list of viewers
    if (!story.user.equals(currentUserId)) {
      throw new ForbiddenError('Only the story author can see who viewed this story');
    }

    const views = await StoryView.find({ story: storyId })
      .sort({ viewedAt: -1 })
      .populate('viewer', 'userId fullname profilePic')
      .lean();

    const viewers = views.map((v) => ({
      viewer: v.viewer,
      viewedAt: v.viewedAt,
    }));

    return {
      storyId,
      viewsCount: viewers.length,
      viewers,
    };
  }

  async deleteStory(storyId, currentUserId) {
    const story = await Story.findById(storyId);
    if (!story) {
      throw new NotFoundError('Story not found');
    }

    if (!story.user.equals(currentUserId)) {
      throw new ForbiddenError('You can only delete your own stories');
    }

    await Promise.all([
      Story.findByIdAndDelete(storyId),
      StoryView.deleteMany({ story: storyId }),
    ]);

    return { success: true, message: 'Story deleted successfully' };
  }
}

module.exports = new StoryService();
