const axios = require('axios');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const SavedPost = require('../src/models/SavedPost');
const Story = require('../src/models/Story');
const StoryView = require('../src/models/StoryView');
const Message = require('../src/models/Message');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runSocialContentTests() {
  console.log('====================================================');
  console.log('🧪 NOVA SOCIAL CONTENT SYSTEM VERIFICATION SUITE');
  console.log('====================================================');

  await mongoose.connect(env.MONGO_URI);
  console.log('[Connected to MongoDB for Test Verification]');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Authentication & User Verification
    // ----------------------------------------------------
    console.log('\n--- 1. Authentication of Test Users ---');
    const aliceRes = await axios.post(`${BASE_URL}/auth/login`, {
      userId: 'alice_chen',
      password: 'NovaPass123!',
    });
    const aliceToken = aliceRes.data.data.token;
    const aliceId = aliceRes.data.data.user._id;

    const bobRes = await axios.post(`${BASE_URL}/auth/login`, {
      userId: 'bob_vance',
      password: 'NovaPass123!',
    });
    const bobToken = bobRes.data.data.token;
    const bobId = bobRes.data.data.user._id;

    const claraRes = await axios.post(`${BASE_URL}/auth/login`, {
      userId: 'clara_o',
      password: 'NovaPass123!',
    });
    const claraToken = claraRes.data.data.token;
    const claraId = claraRes.data.data.user._id;

    assert(aliceToken && bobToken && claraToken, 'Alice, Bob, and Clara authenticated successfully');

    // Reset social graph for test isolation
    await User.updateMany(
      { _id: { $in: [aliceId, bobId, claraId] } },
      { $set: { follower: [], following: [] } }
    );

    // ----------------------------------------------------
    // TEST 2: Profile Content Differentiation (Posts vs Media vs Saved)
    // ----------------------------------------------------
    console.log('\n--- 2. Profile Content Endpoints (Posts vs Media) ---');
    // Alice creates 1 text post and 1 media post
    const textPostRes = await axios.post(
      `${BASE_URL}/posts`,
      { caption: `Architecture discussion ${Date.now()}` },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    const textPostId = textPostRes.data.data._id;

    const mediaPostRes = await axios.post(
      `${BASE_URL}/posts`,
      {
        caption: `Design system photo preview ${Date.now()}`,
        postUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        media: [
          {
            url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            mediaType: 'image',
          },
        ],
      },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    const mediaPostId = mediaPostRes.data.data._id;

    assert(textPostId && mediaPostId, 'Alice created text post and media post');

    // Fetch user posts
    const allPostsRes = await axios.get(`${BASE_URL}/posts/user/alice_chen`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const allPostIds = allPostsRes.data.data.map((p) => p._id.toString());
    assert(
      allPostIds.includes(textPostId.toString()) && allPostIds.includes(mediaPostId.toString()),
      'GET /api/v1/posts/user/:userId returns both text and media posts'
    );

    // Fetch user media posts
    const mediaPostsRes = await axios.get(`${BASE_URL}/posts/user/alice_chen/media`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const mediaPostIds = mediaPostsRes.data.data.map((p) => p._id.toString());
    assert(
      mediaPostIds.includes(mediaPostId.toString()) && !mediaPostIds.includes(textPostId.toString()),
      'GET /api/v1/posts/user/:userId/media returns ONLY media posts (text-only posts excluded)'
    );

    // ----------------------------------------------------
    // TEST 3: Dedicated Saved Posts System
    // ----------------------------------------------------
    console.log('\n--- 3. Dedicated Saved Posts System & Privacy ---');
    // Bob saves Alice's media post
    const saveRes = await axios.post(
      `${BASE_URL}/posts/${mediaPostId}/save`,
      {},
      { headers: { Authorization: `Bearer ${bobToken}` } }
    );
    assert(saveRes.status === 200 && saveRes.data.data.saved === true, 'Bob successfully saved Alice post');

    // Bob attempts to save again (Idempotency check)
    const duplicateSaveRes = await axios.post(
      `${BASE_URL}/posts/${mediaPostId}/save`,
      {},
      { headers: { Authorization: `Bearer ${bobToken}` } }
    );
    assert(duplicateSaveRes.status === 200 && duplicateSaveRes.data.data.saved === true, 'Duplicate save request is idempotent and handled gracefully');

    // Bob retrieves saved posts
    const bobSavedRes = await axios.get(`${BASE_URL}/posts/saved`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const bobSavedIds = bobSavedRes.data.data.map((p) => p._id.toString());
    assert(bobSavedIds.includes(mediaPostId.toString()), 'GET /api/v1/posts/saved returns saved post for Bob');
    const bobSavedItem = bobSavedRes.data.data.find((p) => p._id.toString() === mediaPostId.toString());
    assert(bobSavedItem?.isSaved === true, 'Saved post item is enriched with isSaved === true');

    // Alternative user endpoint: GET /api/v1/users/me/saved
    const meSavedRes = await axios.get(`${BASE_URL}/users/me/saved`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(meSavedRes.data.data.some((p) => p._id.toString() === mediaPostId.toString()), 'GET /api/v1/users/me/saved returns identical saved items');

    // Privacy verification: Alice's saved posts must NOT contain Bob's saved posts
    const aliceSavedRes = await axios.get(`${BASE_URL}/posts/saved`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const aliceSavedIds = aliceSavedRes.data.data.map((p) => p._id.toString());
    assert(!aliceSavedIds.includes(mediaPostId.toString()), 'Privacy enforced: Bob saved posts are private and inaccessible to Alice');

    // Bob unsaves the post
    const unsaveRes = await axios.delete(`${BASE_URL}/posts/${mediaPostId}/save`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(unsaveRes.status === 200 && unsaveRes.data.data.saved === false, 'Bob successfully unsaved post');

    // Verify Bob's saved posts no longer has it
    const bobAfterUnsaveRes = await axios.get(`${BASE_URL}/posts/saved`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(
      !bobAfterUnsaveRes.data.data.some((p) => p._id.toString() === mediaPostId.toString()),
      'Saved post is removed from Bob saved library'
    );

    // ----------------------------------------------------
    // TEST 4: Algorithmic Feed V1 (Scoring, Following, Diversity)
    // ----------------------------------------------------
    console.log('\n--- 4. Algorithmic Feed V1 (Scoring, Feed Types, Enrichment) ---');
    const forYouRes = await axios.get(`${BASE_URL}/feed?type=for_you&page=1&limit=10`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(forYouRes.status === 200 && Array.isArray(forYouRes.data.posts), 'GET /api/v1/feed?type=for_you returns scored candidate feed');

    if (forYouRes.data.posts.length > 0) {
      const firstPost = forYouRes.data.posts[0];
      assert(
        typeof firstPost.isLiked === 'boolean' && typeof firstPost.isSaved === 'boolean',
        'Feed posts are enriched with authenticated user isLiked and isSaved flags'
      );
    }

    // Verify following feed
    const followingRes = await axios.get(`${BASE_URL}/feed?type=following&page=1&limit=10`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(followingRes.status === 200 && Array.isArray(followingRes.data.posts), 'GET /api/v1/feed?type=following returns filtered feed');

    // ----------------------------------------------------
    // TEST 5: Direct Post Sharing in Chat
    // ----------------------------------------------------
    console.log('\n--- 5. Direct Post Sharing System ---');
    // Bob sends a POST_SHARE message referencing mediaPostId to Alice
    const convRes = await axios.post(
      `${BASE_URL}/chat/conversations`,
      { recipientId: aliceId },
      { headers: { Authorization: `Bearer ${bobToken}` } }
    );
    const conversationId = convRes.data.data._id;
    assert(conversationId, 'Conversation established between Bob and Alice');

    const shareMsgRes = await axios.post(
      `${BASE_URL}/chat/messages/${conversationId}`,
      {
        text: 'Take a look at this design work!',
        messageType: 'POST_SHARE',
        sharedPostId: mediaPostId,
      },
      { headers: { Authorization: `Bearer ${bobToken}` } }
    );
    const sharedMsg = shareMsgRes.data.data;
    assert(
      sharedMsg.messageType === 'POST_SHARE' &&
      sharedMsg.sharedPostId &&
      sharedMsg.sharedPostId.postedBy?.userId === 'alice_chen',
      'POST /api/v1/chat/messages creates POST_SHARE message with populated sharedPostId and author'
    );

    // Verify retrieval of messages
    const getMessagesRes = await axios.get(`${BASE_URL}/chat/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const foundSharedMsg = getMessagesRes.data.data.find((m) => m._id.toString() === sharedMsg._id.toString());
    assert(
      foundSharedMsg && foundSharedMsg.messageType === 'POST_SHARE' && foundSharedMsg.sharedPostId?._id,
      'GET /api/v1/chat/messages/:convId preserves POST_SHARE payload and sharedPostId reference'
    );

    // ----------------------------------------------------
    // TEST 6: Real 24h Stories System
    // ----------------------------------------------------
    console.log('\n--- 6. Real 24-Hour Stories / Status System ---');
    // Clara (public account) creates a text story
    const createStoryRes = await axios.post(
      `${BASE_URL}/stories`,
      {
        text: `NOVA real-time sprint status update! ${Date.now()}`,
        backgroundColor: '#FF5C35',
        mediaType: 'text',
      },
      { headers: { Authorization: `Bearer ${claraToken}` } }
    );
    const createdStory = createStoryRes.data.data;
    assert(createdStory && createdStory._id, 'Clara created a 24h status story');

    // Verify 24h expiration timestamp
    const storyExpiry = new Date(createdStory.expiresAt).getTime();
    const now = Date.now();
    const diffHours = (storyExpiry - now) / (1000 * 60 * 60);
    assert(diffHours >= 23.9 && diffHours <= 24.1, 'Story expiresAt is strictly set to 24 hours in future');

    // Also Alice (private account) creates a story to test privacy exclusion
    await User.findByIdAndUpdate(aliceId, { 'privacy.isPrivate': true, follower: [] });
    await User.findByIdAndUpdate(bobId, { following: [] });
    const alicePrivateStoryRes = await axios.post(
      `${BASE_URL}/stories`,
      {
        text: 'Alice private secret update',
        backgroundColor: '#1E3A8A',
        mediaType: 'text',
      },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    const alicePrivateStory = alicePrivateStoryRes.data.data;

    // Bob retrieves stories feed
    const storiesFeedRes = await axios.get(`${BASE_URL}/stories/feed`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const claraStoryGroup = storiesFeedRes.data.data.find(
      (g) => g.user?._id.toString() === claraId.toString()
    );
    assert(
      claraStoryGroup && claraStoryGroup.stories.some((s) => s._id.toString() === createdStory._id.toString()),
      'GET /api/v1/stories/feed groups active stories by author'
    );
    assert(claraStoryGroup?.hasUnviewed === true, 'Story is flagged as unviewed for Bob initially');

    // Verify Alice private story is NOT in Bob feed because Bob does not follow Alice
    const aliceInBobFeed = storiesFeedRes.data.data.find(
      (g) => g.user?._id.toString() === aliceId.toString()
    );
    assert(!aliceInBobFeed, 'Story privacy: Private user stories are hidden from non-followers in feed');

    // Bob records a view on Clara's story
    const recordViewRes = await axios.post(
      `${BASE_URL}/stories/${createdStory._id}/view`,
      {},
      { headers: { Authorization: `Bearer ${bobToken}` } }
    );
    assert(recordViewRes.status === 200, 'Bob recorded view on Clara story');

    // Bob records view again (Deduplication / Idempotency)
    await axios.post(
      `${BASE_URL}/stories/${createdStory._id}/view`,
      {},
      { headers: { Authorization: `Bearer ${bobToken}` } }
    );

    // Clara checks viewers of her story
    const viewersRes = await axios.get(`${BASE_URL}/stories/${createdStory._id}/viewers`, {
      headers: { Authorization: `Bearer ${claraToken}` },
    });
    const viewerIds = viewersRes.data.data.map((v) => v.viewer?._id.toString());
    assert(viewerIds.includes(bobId.toString()), 'GET /api/v1/stories/:id/viewers returns Bob in viewer list');
    const bobViewerOccurrences = viewersRes.data.data.filter((v) => v.viewer?._id.toString() === bobId.toString());
    assert(bobViewerOccurrences.length === 1, 'Story views are deduplicated per viewer');

    // Expiration verification: expired story is filtered out
    const expiredStory = new Story({
      user: claraId,
      textContent: 'Expired test story',
      mediaType: 'text',
      expiresAt: new Date(Date.now() - 1000 * 60 * 60), // Expired 1 hour ago
    });
    await expiredStory.save();

    const feedAfterExpiredRes = await axios.get(`${BASE_URL}/stories/feed`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const allActiveStoryIds = feedAfterExpiredRes.data.data.flatMap((g) => g.stories.map((s) => s._id.toString()));
    assert(
      !allActiveStoryIds.includes(expiredStory._id.toString()),
      'Expired stories (>24h) are filtered out from feed at query time'
    );
    await Story.findByIdAndDelete(expiredStory._id);

    // Clara deletes her story
    const deleteStoryRes = await axios.delete(`${BASE_URL}/stories/${createdStory._id}`, {
      headers: { Authorization: `Bearer ${claraToken}` },
    });
    assert(deleteStoryRes.status === 200, 'DELETE /api/v1/stories/:id successfully removes story');
    await Story.findByIdAndDelete(alicePrivateStory._id);

    // Clean up test post created
    await axios.delete(`${BASE_URL}/posts/${textPostId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    await axios.delete(`${BASE_URL}/posts/${mediaPostId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

  } catch (err) {
    console.error('Test execution failed with error:', err.response?.data || err.message);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n====================================================');
    console.log(`TOTAL SOCIAL CONTENT TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runSocialContentTests();
