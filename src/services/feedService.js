const Post = require('../models/Post');
const User = require('../models/User');
const Block = require('../models/Block');
const SavedPost = require('../models/SavedPost');
const Conversation = require('../models/Conversation');
const feedRankingService = require('./feed/feedRankingService');
const feedDiversityService = require('./feed/feedDiversityService');

class FeedService {
  async getFeed(currentUserId = null, { page = 1, limit = 15, feedType = 'for_you' }) {
    let followingIds = new Set();
    let conversationPeerIds = new Set();
    let userInterestedTags = new Set();
    let blockedUserIds = [];

    // 1. Gather viewer context if authenticated
    if (currentUserId) {
      const [currentUser, blocks, conversations, recentLikedPosts] = await Promise.all([
        User.findById(currentUserId).select('following').lean(),
        Block.find({
          $or: [{ blocker: currentUserId }, { blocked: currentUserId }],
        }).lean(),
        Conversation.find({ members: currentUserId }).select('members').lean(),
        Post.find({ likes: currentUserId }).sort({ updatedAt: -1 }).limit(20).select('hashtags').lean(),
      ]);

      if (currentUser && currentUser.following) {
        currentUser.following.forEach((id) => followingIds.add(id.toString()));
      }

      blockedUserIds = blocks.map((b) =>
        b.blocker.toString() === currentUserId.toString() ? b.blocked.toString() : b.blocker.toString()
      );

      conversations.forEach((conv) => {
        conv.members.forEach((m) => {
          if (m.toString() !== currentUserId.toString()) {
            conversationPeerIds.add(m.toString());
          }
        });
      });

      recentLikedPosts.forEach((p) => {
        if (p.hashtags && Array.isArray(p.hashtags)) {
          p.hashtags.forEach((tag) => userInterestedTags.add(tag.toLowerCase()));
        }
      });
    }

    // 2. Candidate Generation Pipeline
    const baseFilter = {};
    if (blockedUserIds.length > 0) {
      baseFilter.postedBy = { $nin: blockedUserIds };
    }

    if (feedType === 'following' && currentUserId) {
      // Social-graph only feed
      baseFilter.postedBy = { $in: Array.from(followingIds) };
    }

    // Candidate window capped to avoid full collection scan (top 200 recent candidates)
    const candidateLimit = 200;
    const candidates = await Post.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(candidateLimit)
      .populate('postedBy', 'userId fullname profilePic privacy')
      .lean();

    // 3. Privacy Filter: Filter out private profiles if viewer does not follow them
    const authorizedCandidates = candidates.filter((post) => {
      if (!post.postedBy) return false;
      const author = post.postedBy;
      const authorId = author._id ? author._id.toString() : author.toString();

      if (currentUserId && authorId === currentUserId.toString()) return true; // Own post

      if (author.privacy && author.privacy.isPrivate) {
        return followingIds.has(authorId);
      }
      return true;
    });

    // 4. Algorithmic Ranking & Scoring
    const viewerContext = {
      userId: currentUserId,
      followingIds,
      conversationPeerIds,
      userInterestedTags,
    };

    let processedPosts;
    if (feedType === 'following') {
      // For Following tab, sort chronologically among followed accounts
      processedPosts = authorizedCandidates;
    } else {
      // For You tab: run through NOVA V1 Ranking and Diversity services
      const ranked = feedRankingService.rankCandidates(authorizedCandidates, viewerContext);
      processedPosts = feedDiversityService.applyDiversity(ranked, followingIds);
    }

    // 5. Paginate in-memory from processed candidate pool
    const total = processedPosts.length;
    const skip = (page - 1) * limit;
    const paginated = processedPosts.slice(skip, skip + limit);

    // 6. Enrich with isLiked and isSaved status
    const postIds = paginated.map((p) => p._id);
    let savedPostIds = new Set();

    if (currentUserId && postIds.length > 0) {
      const savedDocs = await SavedPost.find({
        user: currentUserId,
        post: { $in: postIds },
      }).select('post').lean();
      savedDocs.forEach((s) => savedPostIds.add(s.post.toString()));
    }

    const enrichedPosts = paginated.map((post) => {
      const isLiked = currentUserId && post.likes
        ? post.likes.some((id) => id.toString() === currentUserId.toString())
        : false;
      const isSaved = savedPostIds.has(post._id.toString());
      const likesCount = post.likes ? post.likes.length : (post.likesCount || 0);

      return {
        ...post,
        isLiked,
        isSaved,
        likesCount,
      };
    });

    return {
      posts: enrichedPosts,
      post: enrichedPosts,
      data: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: skip + enrichedPosts.length < total,
      },
    };
  }
}

module.exports = new FeedService();
