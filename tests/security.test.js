const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const authService = require('../src/services/authService');
const postService = require('../src/services/postService');
const socialService = require('../src/services/socialService');
const feedService = require('../src/services/feedService');

async function runSecurityTests() {
  console.log('====================================================');
  console.log('🔒 NOVA PLATFORM AUTOMATED SECURITY TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[Connected to Database for Test Execution]\n');

    // ----------------------------------------------------
    // TEST 1: Password Verification (await bcrypt.compare Fix)
    // ----------------------------------------------------
    console.log('[Test Suite 1: Authentication & Password Verification]');
    const testPassword = 'SecurePassword123!';
    const wrongPassword = 'WrongPassword456!';
    const hashed = await bcrypt.hash(testPassword, 10);

    const testUser = await User.findOneAndUpdate(
      { userId: 'test_sec_user' },
      {
        fullname: 'Security Test User',
        userId: 'test_sec_user',
        emailId: 'test_sec@nova.dev',
        password: hashed,
        isEmailVerified: true,
      },
      { upsert: true, new: true }
    );

    // Verify correct password succeeds
    let loginSuccess = false;
    try {
      const res = await authService.login({ userId: 'test_sec_user', password: testPassword });
      if (res && res.accessToken) loginSuccess = true;
    } catch {
      loginSuccess = false;
    }
    assert(loginSuccess, 'Correct password successfully authenticates and returns access token');

    // Verify wrong password FAILS (Testing that bcrypt.compare is properly awaited)
    let wrongPassBlocked = false;
    try {
      await authService.login({ userId: 'test_sec_user', password: wrongPassword });
    } catch (err) {
      if (err.statusCode === 401 || err.code === 'AUTHENTICATION_ERROR') {
        wrongPassBlocked = true;
      }
    }
    assert(wrongPassBlocked, 'CRITICAL: Incorrect password is strictly rejected with 401 (Auth bypass prevented)');

    // ----------------------------------------------------
    // TEST 2: Token Scoping & Concurrency Isolation
    // ----------------------------------------------------
    console.log('\n[Test Suite 2: Request-Scoped Token Verification]');
    const { protect } = require('../src/middleware/auth');
    
    // Simulate Request 1 with valid token
    const token1 = jwt.sign({ id: testUser._id.toString(), userId: testUser.userId }, env.JWT_ACCESS_SECRET);
    const req1 = { headers: { authorization: `Bearer ${token1}` }, cookies: {} };
    const res1 = {};
    let req1User = null;
    await protect(req1, res1, () => { req1User = req1.user; });

    // Simulate concurrent Request 2 with NO token
    const req2 = { headers: {}, cookies: {} };
    let req2Error = null;
    await protect(req2, res1, (err) => { req2Error = err; });

    assert(req1User && req1User.userId === 'test_sec_user', 'Request 1 resolves authenticated user');
    assert(req2Error && req2Error.statusCode === 401, 'Request 2 without token is rejected (No cross-request token leak)');
    assert(req2.user === undefined, 'Request 2 does NOT inherit Request 1 user state');

    // ----------------------------------------------------
    // TEST 3: Expired & Malformed JWT Handling
    // ----------------------------------------------------
    console.log('\n[Test Suite 3: Expired / Malformed JWT Handling]');
    const expiredToken = jwt.sign({ id: testUser._id.toString() }, env.JWT_ACCESS_SECRET, { expiresIn: '1ms' });
    // wait 10ms
    await new Promise((r) => setTimeout(r, 10));

    const reqExpired = { headers: { authorization: `Bearer ${expiredToken}` }, cookies: {} };
    let expiredError = null;
    await protect(reqExpired, res1, (err) => { expiredError = err; });
    assert(expiredError && expiredError.statusCode === 401, 'Expired token is cleanly rejected without uncaught server crash');

    const reqMalformed = { headers: { authorization: 'Bearer invalid.token.payload' }, cookies: {} };
    let malformedError = null;
    await protect(reqMalformed, res1, (err) => { malformedError = err; });
    assert(malformedError && malformedError.statusCode === 401, 'Malformed token is cleanly rejected with 401');

    // ----------------------------------------------------
    // TEST 4: Sensitive Data Projection in Feed & Profile
    // ----------------------------------------------------
    console.log('\n[Test Suite 4: Sensitive Field Projection]');
    const feedResult = await feedService.getFeed(testUser._id, { page: 1, limit: 10 });
    let passwordExposed = false;
    let otpExposed = false;

    if (feedResult.posts && feedResult.posts.length > 0) {
      for (const p of feedResult.posts) {
        if (p.postedBy && (p.postedBy.password || p.postedBy.otp)) {
          passwordExposed = true;
          otpExposed = true;
        }
      }
    }
    assert(!passwordExposed, 'Feed items never expose user password hash in postedBy population');
    assert(!otpExposed, 'Feed items never expose user OTP in postedBy population');

    // ----------------------------------------------------
    // TEST 5: Social Graph & Self-Follow Prevention
    // ----------------------------------------------------
    console.log('\n[Test Suite 5: Social Graph Safety]');
    let selfFollowBlocked = false;
    try {
      await socialService.toggleFollow(testUser._id, testUser._id.toString());
    } catch (err) {
      if (err.statusCode === 400 || err.code === 'VALIDATION_ERROR') {
        selfFollowBlocked = true;
      }
    }
    assert(selfFollowBlocked, 'Self-follow attempt is blocked with 400 Validation Error');

    // ----------------------------------------------------
    // TEST 6: IDOR Protection on Post Deletion
    // ----------------------------------------------------
    console.log('\n[Test Suite 6: Authorization & IDOR Protection]');
    // Create post by testUser
    const testPost = await Post.create({
      postedBy: testUser._id,
      caption: 'Security test post',
    });

    // Create another user
    const otherUser = await User.findOneAndUpdate(
      { userId: 'test_sec_attacker' },
      {
        fullname: 'Attacker User',
        userId: 'test_sec_attacker',
        emailId: 'attacker@nova.dev',
        password: hashed,
        isEmailVerified: true,
      },
      { upsert: true, new: true }
    );

    let idorBlocked = false;
    try {
      // Attacker attempts to delete testUser's post
      await postService.deletePost(testPost._id, otherUser._id);
    } catch (err) {
      if (err.statusCode === 403 || err.code === 'FORBIDDEN_ERROR') {
        idorBlocked = true;
      }
    }
    assert(idorBlocked, 'IDOR Prevention: Non-author cannot delete another user post (HTTP 403)');

    // Cleanup test post
    await Post.findByIdAndDelete(testPost._id);

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');

    await mongoose.disconnect();
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runSecurityTests();
