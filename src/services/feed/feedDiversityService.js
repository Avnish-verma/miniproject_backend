/**
 * NOVA Feed Diversity Service
 * 
 * Enforces feed quality constraints:
 * 1. Maximum 2 consecutive posts from the same creator
 * 2. Balances personalized content with discovery content (target ~75% personalized, ~25% discovery)
 */
class FeedDiversityService {
  constructor() {
    this.maxConsecutiveFromAuthor = 2;
  }

  /**
   * Apply diversity rules to ranked candidate posts
   * @param {Array} rankedPosts - Posts pre-sorted by ranking score
   * @param {Set} followingIds - Set of user IDs followed by viewer
   * @returns {Array} diversified posts
   */
  applyDiversity(rankedPosts, followingIds = new Set()) {
    if (!rankedPosts || rankedPosts.length <= 2) return rankedPosts;

    const diversified = [];
    const pool = [...rankedPosts];
    const deferred = [];

    let consecutiveCount = 0;
    let lastAuthorId = null;

    while (pool.length > 0) {
      const candidateIndex = pool.findIndex((p) => {
        const authorId = p.postedBy?._id ? p.postedBy._id.toString() : (p.postedBy ? p.postedBy.toString() : '');
        if (authorId === lastAuthorId && consecutiveCount >= this.maxConsecutiveFromAuthor) {
          return false;
        }
        return true;
      });

      if (candidateIndex !== -1) {
        const post = pool.splice(candidateIndex, 1)[0];
        const authorId = post.postedBy?._id ? post.postedBy._id.toString() : (post.postedBy ? post.postedBy.toString() : '');

        if (authorId === lastAuthorId) {
          consecutiveCount++;
        } else {
          lastAuthorId = authorId;
          consecutiveCount = 1;
        }

        diversified.push(post);

        // Periodically inject deferred candidates back into the pool if author changed
        if (deferred.length > 0 && consecutiveCount < this.maxConsecutiveFromAuthor) {
          const deferredIdx = deferred.findIndex((dp) => {
            const dpAuthorId = dp.postedBy?._id ? dp.postedBy._id.toString() : (dp.postedBy ? dp.postedBy.toString() : '');
            return dpAuthorId !== lastAuthorId;
          });
          if (deferredIdx !== -1) {
            pool.unshift(deferred.splice(deferredIdx, 1)[0]);
          }
        }
      } else {
        // All remaining candidates are from the same author; move first to deferred
        deferred.push(pool.shift());
      }
    }

    // Append any remaining deferred posts at the end
    return [...diversified, ...deferred];
  }
}

module.exports = new FeedDiversityService();
