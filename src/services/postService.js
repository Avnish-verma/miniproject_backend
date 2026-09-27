const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const SavedPost = require('../models/SavedPost');
const Notification = require('../models/Notification');
const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/errorTypes');

class PostService {
  async createPost(userId, { caption = '', description = '', postUrl = '', public_id = '', media = [], hashtags = [] }) {
    // Extract hashtags from caption if not provided
    let extractedTags = [...hashtags];
    if (caption) {
      const matched = caption.match(/#[a-z0-9_]+/gi);
      if (matched) {
        extractedTags = Array.from(new Set([...extractedTags, ...matched.map((t) => t.slice(1).toLowerCase())]));
      }
    }

    // Build media array (supporting both legacy single postUrl and new multi-media)
    const mediaArray = [...media];
    if (postUrl && mediaArray.length === 0) {
      const isVideo = postUrl.endsWith('.mp4') || postUrl.endsWith('.mov') || postUrl.includes('/video/');
      mediaArray.push({
        url: postUrl,
        public_id,
        mediaType: isVideo ? 'video' : 'image',
      });
    }

    const post = await Post.create({
      postedBy: userId,
      caption,
      description,
      postUrl,
      public_id,
      media: mediaArray,
      hashtags: extractedTags,
      likes: [],
      reactions: [],
    });

    const populatedPost = await Post.findById(post._id)
      .populate('postedBy', 'userId fullname profilePic')
      .lean();

    return populatedPost;
  }

  async getPostById(postId, currentUserId = null) {
    const post = await Post.findById(postId)
      .populate('postedBy', 'userId fullname profilePic')
      .lean();

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const isLiked = currentUserId && post.likes
      ? post.likes.some((id) => id.toString() === currentUserId.toString())
      : false;

    return { ...post, isLiked, likesCount: post.likes ? post.likes.length : 0 };
  }

  async deletePost(postId, currentUserId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (!post.postedBy.equals(currentUserId)) {
      throw new ForbiddenError('You are not authorized to delete this post');
    }

    await Promise.all([
      Post.findByIdAndDelete(postId),
      Comment.deleteMany({ postId }),
      Notification.deleteMany({ referenceId: postId }),
    ]);

    return { message: 'Post deleted successfully' };
  }

  async toggleLike(postId, currentUserId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const isLiked = post.likes.some((id) => id.equals(currentUserId));
    let update;

    if (isLiked) {
      update = { $pull: { likes: currentUserId } };
    } else {
      update = { $addToSet: { likes: currentUserId } };
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, update, { new: true })
      .populate('postedBy', 'userId fullname profilePic')
      .lean();

    // Trigger notification if newly liked and not own post
    if (!isLiked && !post.postedBy.equals(currentUserId)) {
      await Notification.create({
        recipient: post.postedBy,
        sender: currentUserId,
        type: 'LIKE',
        referenceId: post._id,
        message: 'liked your post',
      });
    }

    return {
      isLiked: !isLiked,
      likesCount: updatedPost.likes.length,
      post: updatedPost,
    };
  }

  async toggleReaction(postId, currentUserId, reactionType = 'LIKE') {
    const post = await Post.findById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const existingReactionIndex = post.reactions.findIndex((r) =>
      r.user.equals(currentUserId)
    );

    if (existingReactionIndex > -1) {
      if (post.reactions[existingReactionIndex].type === reactionType) {
        // Remove reaction
        post.reactions.splice(existingReactionIndex, 1);
        post.likes.pull(currentUserId);
      } else {
        // Change reaction
        post.reactions[existingReactionIndex].type = reactionType;
      }
    } else {
      // Add reaction
      post.reactions.push({ user: currentUserId, type: reactionType });
      post.likes.addToSet(currentUserId);
    }

    await post.save();
    return { reactions: post.reactions, likesCount: post.likes.length };
  }

  async addComment(postId, currentUserId, { text, parentCommentId = null }) {
    if (!text || text.trim() === '') {
      throw new ValidationError('Comment text is required');
    }

    const post = await Post.findById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const comment = await Comment.create({
      postId,
      commentedBy: currentUserId,
      text: text.trim(),
      parentCommentId: parentCommentId || null,
    });

    // Increment post comments count
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    const populatedComment = await Comment.findById(comment._id)
      .populate('commentedBy', 'userId fullname profilePic')
      .lean();

    // Notify author if not commenting on own post
    if (!post.postedBy.equals(currentUserId)) {
      await Notification.create({
        recipient: post.postedBy,
        sender: currentUserId,
        type: 'COMMENT',
        referenceId: post._id,
        message: 'commented on your post',
      });
    }

    return populatedComment;
  }

  async getComments(postId, { page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      Comment.find({ postId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('commentedBy', 'userId fullname profilePic')
        .lean(),
      Comment.countDocuments({ postId }),
    ]);

    return { comments, total, page, limit };
  }

  async deleteComment(postId, commentId, currentUserId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.postId.toString() !== post._id.toString()) {
      throw new ValidationError('Comment does not belong to this post');
    }

    const isCommentAuthor = comment.commentedBy.equals(currentUserId);
    const isPostAuthor = post.postedBy.equals(currentUserId);

    if (!isCommentAuthor && !isPostAuthor) {
      throw new ForbiddenError('You are not authorized to delete this comment');
    }

    await Comment.findByIdAndDelete(commentId);

    await Post.findByIdAndUpdate(postId, {
      $inc: { commentsCount: -1 },
    });
    await Post.updateOne({ _id: postId, commentsCount: { $lt: 0 } }, { $set: { commentsCount: 0 } });

    return { message: 'Comment deleted successfully' };
  }

  async getUserPosts(targetUserId, currentUserId = null, { page = 1, limit = 20 } = {}) {
    let resolvedUserId = targetUserId;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetUserId);
    if (!isObjectId) {
      const user = await User.findOne({ userId: targetUserId.toLowerCase() });
      if (!user) {
        return { posts: [], total: 0, page, limit };
      }
      resolvedUserId = user._id;
    }

    const skip = (page - 1) * limit;
    const [rawPosts, total] = await Promise.all([
      Post.find({ postedBy: resolvedUserId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('postedBy', 'userId fullname profilePic')
        .lean(),
      Post.countDocuments({ postedBy: resolvedUserId }),
    ]);

    // Check saved status if currentUserId is provided
    let savedPostIds = new Set();
    if (currentUserId && rawPosts.length > 0) {
      const postIds = rawPosts.map((p) => p._id);
      const savedDocs = await SavedPost.find({
        user: currentUserId,
        post: { $in: postIds },
      }).select('post').lean();
      savedDocs.forEach((s) => savedPostIds.add(s.post.toString()));
    }

    const posts = rawPosts.map((post) => {
      const isLiked = currentUserId && post.likes
        ? post.likes.some((id) => id.toString() === currentUserId.toString())
        : false;
      const isSaved = savedPostIds.has(post._id.toString());
      return {
        ...post,
        isLiked,
        isSaved,
        likesCount: post.likes ? post.likes.length : 0,
      };
    });

    return { posts, total, page, limit };
  }

  async getUserMediaPosts(targetUserId, currentUserId = null, { page = 1, limit = 20 } = {}) {
    let resolvedUserId = targetUserId;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetUserId);
    if (!isObjectId) {
      const user = await User.findOne({ userId: targetUserId.toLowerCase() });
      if (!user) {
        return { posts: [], total: 0, page, limit };
      }
      resolvedUserId = user._id;
    }

    const skip = (page - 1) * limit;
    // Genuinely filter posts containing media (images, videos, or reels)
    const mediaQuery = {
      postedBy: resolvedUserId,
      $or: [
        { 'media.0': { $exists: true } },
        { postUrl: { $exists: true, $ne: '' } },
      ],
    };

    const [rawPosts, total] = await Promise.all([
      Post.find(mediaQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('postedBy', 'userId fullname profilePic')
        .lean(),
      Post.countDocuments(mediaQuery),
    ]);

    let savedPostIds = new Set();
    if (currentUserId && rawPosts.length > 0) {
      const postIds = rawPosts.map((p) => p._id);
      const savedDocs = await SavedPost.find({
        user: currentUserId,
        post: { $in: postIds },
      }).select('post').lean();
      savedDocs.forEach((s) => savedPostIds.add(s.post.toString()));
    }

    const posts = rawPosts.map((post) => {
      const isLiked = currentUserId && post.likes
        ? post.likes.some((id) => id.toString() === currentUserId.toString())
        : false;
      const isSaved = savedPostIds.has(post._id.toString());
      return {
        ...post,
        isLiked,
        isSaved,
        likesCount: post.likes ? post.likes.length : 0,
      };
    });

    return { posts, total, page, limit };
  }

  async savePost(postId, currentUserId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Atomic upsert in dedicated SavedPost collection
    await SavedPost.findOneAndUpdate(
      { user: currentUserId, post: postId },
      { $setOnInsert: { user: currentUserId, post: postId } },
      { upsert: true, new: true }
    );

    // Keep legacy User.savedPost synchronized
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { savedPost: postId },
    });

    return { isSaved: true, message: 'Post saved successfully' };
  }

  async unsavePost(postId, currentUserId) {
    await SavedPost.findOneAndDelete({ user: currentUserId, post: postId });

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { savedPost: postId },
    });

    return { isSaved: false, message: 'Post removed from saved' };
  }

  async getSavedPosts(currentUserId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [savedDocs, total] = await Promise.all([
      SavedPost.find({ user: currentUserId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'post',
          populate: { path: 'postedBy', select: 'userId fullname profilePic' },
        })
        .lean(),
      SavedPost.countDocuments({ user: currentUserId }),
    ]);

    // Extract populated posts and filter out any whose original post was deleted
    const posts = savedDocs
      .filter((doc) => doc.post != null)
      .map((doc) => {
        const post = doc.post;
        const isLiked = currentUserId && post.likes
          ? post.likes.some((id) => id.toString() === currentUserId.toString())
          : false;
        return {
          ...post,
          isLiked,
          isSaved: true,
          likesCount: post.likes ? post.likes.length : 0,
          savedAt: doc.createdAt,
        };
      });

    return { posts, total, page, limit };
  }

  async getTrendingTags(limit = 10) {
    const trending = await Post.aggregate([
      { $match: { hashtags: { $exists: true, $ne: [] } } },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1,
        },
      },
    ]);

    return trending.map((item) => ({
      tag: item.tag.startsWith('#') ? item.tag : `#${item.tag}`,
      count: `${item.count} ${item.count === 1 ? 'post' : 'posts'}`,
      category: 'Trending on NOVA',
    }));
  }
}

module.exports = new PostService();
