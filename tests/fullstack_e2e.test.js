const axios = require('axios');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('🔬 NOVA FULLSTACK END-TO-END VERIFICATION SUITE');
  console.log('====================================================');

  await mongoose.connect(env.MONGO_URI);
  console.log('[Connected to MongoDB]');

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
    // 1. Authenticate Alice, Bob, Clara
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

    assert(aliceToken && bobToken && claraToken, 'All 3 test users authenticated');

    // 2. Test GET /api/v1/users/me and GET /api/v1/users/profile
    const meRes = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(meRes.status === 200 && meRes.data.data.userId === 'alice_chen', 'GET /api/v1/users/me retrieves authenticated user profile');

    const profileMeRes = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(profileMeRes.status === 200 && profileMeRes.data.data.userId === 'alice_chen', 'GET /api/v1/users/profile retrieves authenticated user profile');

    // 3. Test GET /api/v1/users/profile/:userId with username and ObjectId
    const profileByUsername = await axios.get(`${BASE_URL}/users/profile/bob_vance`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(profileByUsername.status === 200 && profileByUsername.data.data.userId === 'bob_vance', 'GET /api/v1/users/profile/:username resolves by username string');

    const profileById = await axios.get(`${BASE_URL}/users/profile/${bobId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(profileById.status === 200 && profileById.data.data._id === bobId, 'GET /api/v1/users/profile/:userId resolves by ObjectId');

    // 4. Test Followers and Following endpoints
    const followersRes = await axios.get(`${BASE_URL}/users/alice_chen/followers`);
    assert(followersRes.status === 200 && Array.isArray(followersRes.data.data), 'GET /api/v1/users/:username/followers returns paginated followers list');

    const followingRes = await axios.get(`${BASE_URL}/users/alice_chen/following`);
    assert(followingRes.status === 200 && Array.isArray(followingRes.data.data), 'GET /api/v1/users/:username/following returns paginated following list');

    // 5. Test GET /api/v1/posts/user/:userId with username (The previously broken profile bug)
    const postsByUsername = await axios.get(`${BASE_URL}/posts/user/alice_chen`);
    assert(postsByUsername.status === 200 && Array.isArray(postsByUsername.data.data), 'GET /api/v1/posts/user/alice_chen resolves username and returns user posts without CastError');

    // 6. Test Post Creation, Comment Addition, and Comment Deletion
    const newPostRes = await axios.post(
      `${BASE_URL}/posts`,
      { caption: 'Testing comments & fullstack functionality #editorial #quality' },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    const createdPost = newPostRes.data.data;
    assert(createdPost && createdPost._id, 'Alice published test post');

    // Bob comments on Alice's post
    const commentRes = await axios.post(
      `${BASE_URL}/posts/${createdPost._id}/comments`,
      { text: 'Great work on this platform update!' },
      { headers: { Authorization: `Bearer ${bobToken}` } }
    );
    const createdComment = commentRes.data.data;
    assert(createdComment && createdComment.text === 'Great work on this platform update!', 'Bob successfully added comment');

    // Verify post commentsCount is 1
    const postWithComment = await Post.findById(createdPost._id);
    assert(postWithComment.commentsCount === 1, 'Post commentsCount incremented to 1');

    // Clara attempts to delete Bob's comment (Unauthorized)
    let unauthorizedBlocked = false;
    try {
      await axios.delete(
        `${BASE_URL}/posts/${createdPost._id}/comments/${createdComment._id}`,
        { headers: { Authorization: `Bearer ${claraToken}` } }
      );
    } catch (err) {
      if (err.response && err.response.status === 403) {
        unauthorizedBlocked = true;
      }
    }
    assert(unauthorizedBlocked, 'IDOR Protection: Clara cannot delete Bob\'s comment (HTTP 403 Forbidden)');

    // Bob deletes his own comment
    const deleteRes = await axios.delete(
      `${BASE_URL}/posts/${createdPost._id}/comments/${createdComment._id}`,
      { headers: { Authorization: `Bearer ${bobToken}` } }
    );
    assert(deleteRes.status === 200 && deleteRes.data.success, 'Bob successfully deleted his own comment');

    // Verify comment removed from DB and count decremented
    const deletedCommentCheck = await Comment.findById(createdComment._id);
    const postAfterDelete = await Post.findById(createdPost._id);
    assert(!deletedCommentCheck && postAfterDelete.commentsCount === 0, 'Comment removed from DB and commentsCount decremented back to 0');

    // Clean up created post
    await axios.delete(`${BASE_URL}/posts/${createdPost._id}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(true, 'Test post cleaned up');

    // 7. Test Profile Update persistence
    const originalBio = meRes.data.data.bio || '';
    const updatedBio = 'Staff Product Engineer & Architect · NOVA Core Team';
    const updateRes = await axios.put(
      `${BASE_URL}/users/profile`,
      { bio: updatedBio, fullname: 'Alice Chen' },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    assert(updateRes.data.data.bio === updatedBio, 'Profile bio updated via PUT /api/v1/users/profile');

    const verifyProfile = await axios.get(`${BASE_URL}/users/profile/alice_chen`);
    assert(verifyProfile.data.data.bio === updatedBio, 'Updated bio persisted in MongoDB and returned on subsequent fetch');

    // Restore original bio
    await axios.put(
      `${BASE_URL}/users/profile`,
      { bio: originalBio },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );

    // 8. Test Feed compatibility endpoint
    const feedRes = await axios.get(`${BASE_URL}/feed`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(feedRes.status === 200 && Array.isArray(feedRes.data.posts) && Array.isArray(feedRes.data.data), 'Feed endpoint supplies both posts and data arrays');

  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('====================================================');
    console.log(`END-TO-END SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runEndToEndTests();
