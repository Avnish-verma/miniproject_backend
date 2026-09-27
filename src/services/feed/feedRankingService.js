/**
 * NOVA Feed Algorithm — V1 Transparent Ranking Service
 * 
 * Computes deterministic, normalized candidate scores based on:
 * 1. Relationship Signal (Follow graph + Direct message interaction)
 * 2. Normalized Engagement (Logarithmic engagement scaling)
 * 3. Freshness Decay (Exponential decay over time)
 * 4. Content Interest (Hashtag and topic alignment)
 */
class FeedRankingService {
  constructor() {
    // Relative signal weights summing to 1.0
    this.weights = {
      relationship: 0.35,
      engagement: 0.25,
      freshness: 0.20,
      interest: 0.20,
    };
    // Freshness decay constant in hours
    this.freshnessDecayHours = 48;
  }

  /**
   * Score an array of candidate posts for a given viewer context
   * @param {Array} posts - Candidate Post documents
   * @param {Object} viewerContext - { userId, followingIds, conversationPeerIds, userInterestedTags }
   * @returns {Array} posts with attached ._score and ._scoreBreakdown
   */
  rankCandidates(posts, viewerContext = {}) {
    const {
      userId = null,
      followingIds = new Set(),
      conversationPeerIds = new Set(),
      userInterestedTags = new Set(),
    } = viewerContext;

    const now = Date.now();

    return posts.map((post) => {
      const authorId = post.postedBy?._id ? post.postedBy._id.toString() : (post.postedBy ? post.postedBy.toString() : '');

      // 1. Relationship Score (0.0 to 1.0)
      let relationshipScore = 0.1; // Base discovery baseline
      if (userId && authorId === userId.toString()) {
        relationshipScore = 0.5; // Own posts
      } else if (followingIds.has(authorId)) {
        relationshipScore = 0.85; // Directly followed
        if (conversationPeerIds.has(authorId)) {
          relationshipScore = 1.0; // Close connection (chat peer)
        }
      } else if (conversationPeerIds.has(authorId)) {
        relationshipScore = 0.7; // Prior conversation partner
      }

      // 2. Normalized Engagement Score (0.0 to 1.0)
      const likesCount = post.likes ? post.likes.length : (post.likesCount || 0);
      const commentsCount = post.commentsCount || 0;
      // Logarithmic scaling prevents high-follower accounts from dominating
      const rawEngagement = Math.log(1 + likesCount + (2 * commentsCount));
      const maxNormalizedEngagement = Math.log(1 + 100); // 100 interaction saturation point
      const engagementScore = Math.min(1.0, rawEngagement / maxNormalizedEngagement);

      // 3. Freshness Exponential Decay Score (0.0 to 1.0)
      const postCreatedAt = new Date(post.createdAt || now).getTime();
      const ageHours = Math.max(0, (now - postCreatedAt) / (1000 * 60 * 60));
      const freshnessScore = Math.exp(-ageHours / this.freshnessDecayHours);

      // 4. Content Interest Alignment (0.0 to 1.0)
      let interestScore = 0.2; // Baseline
      if (post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0) {
        const matches = post.hashtags.filter((tag) => userInterestedTags.has(tag.toLowerCase()));
        if (matches.length > 0) {
          interestScore = Math.min(1.0, 0.4 + (matches.length * 0.2));
        }
      }
      // Rich media format engagement factor
      if ((post.media && post.media.length > 0) || post.postUrl) {
        interestScore = Math.min(1.0, interestScore + 0.15);
      }

      // Final Weighted Score
      const finalScore =
        this.weights.relationship * relationshipScore +
        this.weights.engagement * engagementScore +
        this.weights.freshness * freshnessScore +
        this.weights.interest * interestScore;

      return {
        ...post,
        _score: Number(finalScore.toFixed(4)),
        _scoreBreakdown: {
          relationship: Number(relationshipScore.toFixed(2)),
          engagement: Number(engagementScore.toFixed(2)),
          freshness: Number(freshnessScore.toFixed(2)),
          interest: Number(interestScore.toFixed(2)),
        },
      };
    }).sort((a, b) => b._score - a._score);
  }
}

module.exports = new FeedRankingService();
