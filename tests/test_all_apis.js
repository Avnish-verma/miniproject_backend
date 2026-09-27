const axios = require('axios');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');

const LOCAL_URL = 'http://localhost:5000';
const RENDER_URL = 'https://miniproject-backend-rdei.onrender.com';

// Target URL can be set via CLI argument: node test_all_apis.js [local|render]
const targetArg = process.argv[2] || 'local';
const TARGET_BASE = targetArg === 'render' ? RENDER_URL : LOCAL_URL;

async function runAllApiChecks() {
  console.log('======================================================================');
  console.log('🚀 NOVA FULL-SYSTEM API VERIFICATION & ENDPOINT CALL AUDIT');
  console.log(`   Target Server: ${TARGET_BASE} (${targetArg.toUpperCase()} environment)`);
  console.log('   Timestamp: ' + new Date().toISOString());
  console.log('======================================================================\n');

  // Connect to DB to ensure test users exist
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[DB] Local MongoDB connected for test account alignment');
  } catch (err) {
    console.warn('[DB] Could not connect to local MongoDB (using existing accounts):', err.message);
  }

  let passed = 0;
  let failed = 0;
  const results = [];

  async function callApi({ name, method, endpoint, data = null, headers = {}, expectedStatuses = [200, 201] }) {
    const url = `${TARGET_BASE}${endpoint}`;
    const startTime = Date.now();
    try {
      const res = await axios({
        method,
        url,
        data,
        headers,
        timeout: 15000,
        validateStatus: () => true, // Don't throw so we can inspect status
      });
      const duration = Date.now() - startTime;
      const isOk = expectedStatuses.includes(res.status);

      if (isOk) {
        console.log(`  ✅ [${res.status}] ${method.toUpperCase()} ${endpoint} (${duration}ms) - ${name}`);
        passed++;
      } else {
        console.error(`  ❌ [${res.status}] ${method.toUpperCase()} ${endpoint} (${duration}ms) - ${name}`);
        console.error(`     Response:`, JSON.stringify(res.data).substring(0, 150));
        failed++;
      }

      results.push({
        name,
        method: method.toUpperCase(),
        endpoint,
        status: res.status,
        duration: `${duration}ms`,
        ok: isOk,
        data: res.data,
      });

      return res;
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`  💥 [ERROR] ${method.toUpperCase()} ${endpoint} (${duration}ms) - ${name}: ${err.message}`);
      failed++;
      results.push({
        name,
        method: method.toUpperCase(),
        endpoint,
        status: 'ERR',
        duration: `${duration}ms`,
        ok: false,
        error: err.message,
      });
      return null;
    }
  }

  // 1. SYSTEM HEALTH APIS
  console.log('\n--- 1. SYSTEM HEALTH APIS ---');
  await callApi({
    name: 'Platform Health Check',
    method: 'get',
    endpoint: '/api/v1/health',
    expectedStatuses: [200],
  });

  await callApi({
    name: 'API Status Status Endpoint',
    method: 'get',
    endpoint: '/api-status',
    expectedStatuses: [200],
  });

  // 2. AUTHENTICATION APIS
  console.log('\n--- 2. AUTHENTICATION APIS ---');
  const loginRes = await callApi({
    name: 'User Login (Alice)',
    method: 'post',
    endpoint: '/api/v1/auth/login',
    data: { userId: 'alice_chen', password: 'NovaPass123!' },
    expectedStatuses: [200],
  });

  const aliceToken = loginRes?.data?.data?.token || loginRes?.data?.token;
  const aliceUser = loginRes?.data?.data?.user || loginRes?.data?.user;
  const authHeaders = aliceToken ? { Authorization: `Bearer ${aliceToken}` } : {};

  const bobLoginRes = await callApi({
    name: 'User Login (Bob)',
    method: 'post',
    endpoint: '/api/v1/auth/login',
    data: { userId: 'bob_vance', password: 'NovaPass123!' },
    expectedStatuses: [200],
  });
  const bobToken = bobLoginRes?.data?.data?.token || bobLoginRes?.data?.token;
  const bobHeaders = bobToken ? { Authorization: `Bearer ${bobToken}` } : {};

  // Auth Me
  await callApi({
    name: 'Get Current Authenticated User (/auth/me)',
    method: 'get',
    endpoint: '/api/v1/auth/me',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  // User Registration (Test with timestamp to avoid duplicates)
  const testUsername = `api_user_${Date.now().toString().slice(-6)}`;
  const regRes = await callApi({
    name: 'User Registration',
    method: 'post',
    endpoint: '/api/v1/auth/register',
    data: {
      fullname: 'API Test User',
      userId: testUsername,
      emailId: `${testUsername}@nova.test`,
      password: 'NovaPass123!',
    },
    expectedStatuses: [201, 409],
  });

  // Forgot Password
  await callApi({
    name: 'Forgot Password Request',
    method: 'post',
    endpoint: '/api/v1/auth/forgot-password',
    data: { userId: 'alice_chen' },
    expectedStatuses: [200],
  });

  // 3. USER & PROFILE APIS
  console.log('\n--- 3. USER & PROFILE APIS ---');
  await callApi({
    name: 'Get Me Profile (/users/me)',
    method: 'get',
    endpoint: '/api/v1/users/me',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Get Profile by Username (/users/profile/:username)',
    method: 'get',
    endpoint: '/api/v1/users/profile/bob_vance',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Search Users (/users/search?q=...)',
    method: 'get',
    endpoint: '/api/v1/users/search?q=alice',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Update Profile Bio (/users/profile)',
    method: 'put',
    endpoint: '/api/v1/users/profile',
    data: {
      fullname: 'Alice Chen',
      bio: 'Staff Product Engineer at NOVA — Verified ' + new Date().toLocaleTimeString(),
      gender: 'Prefer not to say',
    },
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Get User Followers (/users/:username/followers)',
    method: 'get',
    endpoint: '/api/v1/users/alice_chen/followers',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Get User Following (/users/:username/following)',
    method: 'get',
    endpoint: '/api/v1/users/alice_chen/following',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  // 4. POSTS & ENGAGEMENT APIS
  console.log('\n--- 4. POSTS & ENGAGEMENT APIS ---');
  await callApi({
    name: 'Get Trending Hashtags (/posts/trending-tags)',
    method: 'get',
    endpoint: '/api/v1/posts/trending-tags',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  const createPostRes = await callApi({
    name: 'Create Post (/posts)',
    method: 'post',
    endpoint: '/api/v1/posts',
    data: {
      caption: 'API Test Post across system #NovaTest #Verification',
      media: [],
    },
    headers: authHeaders,
    expectedStatuses: [201],
  });

  const createdPostId = createPostRes?.data?.data?._id || createPostRes?.data?._id;

  if (createdPostId) {
    await callApi({
      name: 'Get Post by ID (/posts/:id)',
      method: 'get',
      endpoint: `/api/v1/posts/${createdPostId}`,
      headers: authHeaders,
      expectedStatuses: [200],
    });

    await callApi({
      name: 'Toggle Like Post (/posts/:id/like)',
      method: 'post',
      endpoint: `/api/v1/posts/${createdPostId}/like`,
      headers: authHeaders,
      expectedStatuses: [200],
    });

    const commentRes = await callApi({
      name: 'Add Comment to Post (/posts/:id/comment)',
      method: 'post',
      endpoint: `/api/v1/posts/${createdPostId}/comment`,
      data: { text: 'Automated test comment from Alice' },
      headers: authHeaders,
      expectedStatuses: [201],
    });

    const commentId = commentRes?.data?.data?._id || commentRes?.data?._id;

    if (commentId) {
      await callApi({
        name: 'Delete Comment (/posts/:id/comments/:commentId)',
        method: 'delete',
        endpoint: `/api/v1/posts/${createdPostId}/comments/${commentId}`,
        headers: authHeaders,
        expectedStatuses: [200],
      });
    }

    // Save & Unsave Post
    await callApi({
      name: 'Save / Bookmark Post (/posts/:id/save)',
      method: 'post',
      endpoint: `/api/v1/posts/${createdPostId}/save`,
      headers: bobHeaders,
      expectedStatuses: [200, 201],
    });

    await callApi({
      name: 'Get Saved Posts Library (/posts/saved)',
      method: 'get',
      endpoint: '/api/v1/posts/saved',
      headers: bobHeaders,
      expectedStatuses: [200],
    });

    await callApi({
      name: 'Unsave Post (/posts/:id/save)',
      method: 'delete',
      endpoint: `/api/v1/posts/${createdPostId}/save`,
      headers: bobHeaders,
      expectedStatuses: [200],
    });
  }

  await callApi({
    name: 'Get User Posts (/posts/user/:username)',
    method: 'get',
    endpoint: '/api/v1/posts/user/alice_chen',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Get User Media-Only Posts (/posts/user/:username/media)',
    method: 'get',
    endpoint: '/api/v1/posts/user/alice_chen/media',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  // 5. ALGORITHMIC FEED APIS
  console.log('\n--- 5. ALGORITHMIC FEED APIS ---');
  await callApi({
    name: 'Get For You Feed (/feed?type=for_you)',
    method: 'get',
    endpoint: '/api/v1/feed?type=for_you',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Get Following Feed (/feed?type=following)',
    method: 'get',
    endpoint: '/api/v1/feed?type=following',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  // 6. 24-HOUR STORIES APIS
  console.log('\n--- 6. 24-HOUR STORIES APIS ---');
  const storyRes = await callApi({
    name: 'Create Story (/stories)',
    method: 'post',
    endpoint: '/api/v1/stories',
    data: {
      text: 'Alice automated verification story update',
      backgroundColor: '#1E293B',
    },
    headers: authHeaders,
    expectedStatuses: [201],
  });

  const createdStoryId = storyRes?.data?.data?._id || storyRes?.data?._id;

  await callApi({
    name: 'Get Active Stories Feed (/stories/feed)',
    method: 'get',
    endpoint: '/api/v1/stories/feed',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  if (createdStoryId) {
    await callApi({
      name: 'Record Story View (/stories/:id/view)',
      method: 'post',
      endpoint: `/api/v1/stories/${createdStoryId}/view`,
      headers: bobHeaders,
      expectedStatuses: [200],
    });

    await callApi({
      name: 'Get Story Viewers (/stories/:id/viewers)',
      method: 'get',
      endpoint: `/api/v1/stories/${createdStoryId}/viewers`,
      headers: authHeaders,
      expectedStatuses: [200],
    });

    await callApi({
      name: 'Delete Story (/stories/:id)',
      method: 'delete',
      endpoint: `/api/v1/stories/${createdStoryId}`,
      headers: authHeaders,
      expectedStatuses: [200],
    });
  }

  // 7. REAL-TIME CHAT & MESSAGING APIS
  console.log('\n--- 7. REAL-TIME CHAT & MESSAGING APIS ---');
  const convsRes = await callApi({
    name: 'Get Conversations (/chat/conversations)',
    method: 'get',
    endpoint: '/api/v1/chat/conversations',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  const createConvRes = await callApi({
    name: 'Get or Create Conversation (/chat/conversations)',
    method: 'post',
    endpoint: '/api/v1/chat/conversations',
    data: { recipientId: 'bob_vance' },
    headers: authHeaders,
    expectedStatuses: [200, 201],
  });

  const convId = createConvRes?.data?.data?._id || convsRes?.data?.data?.[0]?._id;

  if (convId) {
    await callApi({
      name: 'Send Chat Message (/chat/messages)',
      method: 'post',
      endpoint: '/api/v1/chat/messages',
      data: {
        conversationId: convId,
        text: 'Automated test message between Alice and Bob',
        content: 'Automated test message between Alice and Bob',
      },
      headers: authHeaders,
      expectedStatuses: [201],
    });

    await callApi({
      name: 'Get Conversation Messages (/chat/messages/:convId)',
      method: 'get',
      endpoint: `/api/v1/chat/messages/${convId}`,
      headers: authHeaders,
      expectedStatuses: [200],
    });
  }

  // 8. SOCIAL FOLLOW & BLOCK APIS
  console.log('\n--- 8. SOCIAL FOLLOW & BLOCK APIS ---');
  if (bobLoginRes?.data?.data?.user?._id) {
    const bobUserId = bobLoginRes.data.data.user._id;
    await callApi({
      name: 'Toggle Follow User (/social/follow/:userId)',
      method: 'post',
      endpoint: `/api/v1/social/follow/${bobUserId}`,
      headers: authHeaders,
      expectedStatuses: [200],
    });
  }

  // 9. NOTIFICATIONS APIS
  console.log('\n--- 9. NOTIFICATIONS APIS ---');
  await callApi({
    name: 'Get Notifications (/notifications)',
    method: 'get',
    endpoint: '/api/v1/notifications',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Mark All Notifications Read (/notifications/read-all)',
    method: 'post',
    endpoint: '/api/v1/notifications/read-all',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  // 10. WEBRTC CALLS APIS
  console.log('\n--- 10. WEBRTC CALLS APIS ---');
  await callApi({
    name: 'Get Call History (/calls/history)',
    method: 'get',
    endpoint: '/api/v1/calls/history',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  // 11. MEDIA UPLOAD SIGNING APIS
  console.log('\n--- 11. MEDIA UPLOAD SIGNING APIS ---');
  await callApi({
    name: 'Get Upload Post Signature (/media/upload-post)',
    method: 'get',
    endpoint: '/api/v1/media/upload-post',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Get Upload Avatar Signature (/media/upload-avatar)',
    method: 'get',
    endpoint: '/api/v1/media/upload-avatar',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  await callApi({
    name: 'Get Upload Story Signature (/media/upload-story)',
    method: 'get',
    endpoint: '/api/v1/media/upload-story',
    headers: authHeaders,
    expectedStatuses: [200],
  });

  // 12. CLEANUP POST
  if (createdPostId) {
    await callApi({
      name: 'Delete Test Post (/posts/:id)',
      method: 'delete',
      endpoint: `/api/v1/posts/${createdPostId}`,
      headers: authHeaders,
      expectedStatuses: [200],
    });
  }

  // Summary
  console.log('\n======================================================================');
  console.log(`TOTAL APIS CHECKED: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SUCCESS RATE: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('======================================================================\n');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runAllApiChecks().catch((err) => {
  console.error('Fatal API Audit Error:', err);
  process.exit(1);
});
