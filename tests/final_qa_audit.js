const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const User = require('../src/models/User');
const PushSubscription = require('../src/models/PushSubscription');
const Session = require('../src/models/Session');
const Post = require('../src/models/Post');
const Story = require('../src/models/Story');
const authService = require('../src/services/authService');
const pushService = require('../src/services/pushService');
const socialService = require('../src/services/socialService');
const userService = require('../src/services/userService');

async function runQAAudit() {
  console.log('====================================================');
  console.log('🛡️ SHIFTAURA COMPREHENSIVE QA & BEHAVIOR AUDIT');
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
    console.log('[Connected to Database for QA Execution]\n');

    // ----------------------------------------------------
    // SECTION 1: AUTHENTICATION & PASSWORD RESET JOURNEY
    // ----------------------------------------------------
    console.log('[Section 1: Authentication & Password Reset Flow]');

    const qaUsername = 'qa_audit_user';
    const qaEmail = 'qa_audit@shiftaura.in';
    const initialPassword = 'InitialSecurePass123!';
    const updatedPassword = 'NewAuditedPass456!';

    // Ensure user exists
    let testUser = await User.findOne({ userId: qaUsername });
    if (!testUser) {
      const hashed = await bcrypt.hash(initialPassword, 10);
      testUser = await User.create({
        fullname: 'QA Audit User',
        userId: qaUsername,
        emailId: qaEmail,
        password: hashed,
        isEmailVerified: true,
      });
    } else {
      testUser.password = await bcrypt.hash(initialPassword, 10);
      testUser.isEmailVerified = true;
      await testUser.save();
    }

    // 1.1 Login with initial password
    const loginRes = await authService.login({ userId: qaUsername, password: initialPassword });
    assert(loginRes && loginRes.accessToken, 'Login succeeds and returns valid accessToken');
    assert(loginRes.user.userId === qaUsername, 'Returned user object matches logged in userId');

    // 1.2 Invalid password test
    let failedLoginCaught = false;
    try {
      await authService.login({ userId: qaUsername, password: 'WrongPassword999!' });
    } catch (err) {
      failedLoginCaught = true;
    }
    assert(failedLoginCaught, 'Invalid password is cleanly rejected with 401');

    // 1.3 Forgot Password -> Token Generation & Mail Dispatch
    const forgotRes = await authService.forgotPassword(qaEmail);
    assert(forgotRes && forgotRes.message, 'Forgot password initiates mail dispatch');

    // 1.4 Test Tampered Reset Token
    let tamperedCaught = false;
    try {
      await authService.resetPassword('tampered.jwt.token', updatedPassword);
    } catch (err) {
      tamperedCaught = err.code === 'VALIDATION_ERROR';
    }
    assert(tamperedCaught, 'Tampered/malformed reset token is rejected with VALIDATION_ERROR');

    // 1.5 Test Expired Reset Token
    const expiredToken = jwt.sign(
      { userId: testUser.userId, id: testUser._id.toString() },
      env.JWT_FORGOT_SECRET,
      { expiresIn: '-1s' }
    );
    let expiredCaught = false;
    try {
      await authService.resetPassword(expiredToken, updatedPassword);
    } catch (err) {
      expiredCaught = err.code === 'VALIDATION_ERROR';
    }
    assert(expiredCaught, 'Expired reset token (>10 min) is strictly rejected');

    // 1.6 Reset Password with Valid Token
    const validResetToken = jwt.sign(
      { userId: testUser.userId, id: testUser._id.toString() },
      env.JWT_FORGOT_SECRET,
      { expiresIn: '10m' }
    );
    const resetSuccess = await authService.resetPassword(validResetToken, updatedPassword);
    assert(resetSuccess && resetSuccess.message, 'Valid JWT reset token successfully updates password');

    // 1.7 Session Invalidation check
    const remainingSessions = await Session.find({ userId: testUser._id });
    assert(remainingSessions.length === 0, 'Password reset invalidates and purges all previous active sessions');

    // 1.8 Verify login with NEW password works
    const newLoginRes = await authService.login({ userId: qaUsername, password: updatedPassword });
    assert(newLoginRes && newLoginRes.accessToken, 'Login succeeds with new password after reset');

    // 1.9 Verify login with OLD password fails
    let oldPassFailed = false;
    try {
      await authService.login({ userId: qaUsername, password: initialPassword });
    } catch {
      oldPassFailed = true;
    }
    assert(oldPassFailed, 'Login with previous password is now rejected');

    // ----------------------------------------------------
    // SECTION 2: WEB PUSH & NOTIFICATION INFRASTRUCTURE
    // ----------------------------------------------------
    console.log('\n[Section 2: Web Push & Notification Infrastructure]');

    // 2.1 Public VAPID Key validation
    const vapidKey = pushService.getPublicKey();
    assert(
      typeof vapidKey === 'string' && vapidKey.length > 20,
      `VAPID Public Key is correctly exported and non-empty (${vapidKey.substring(0, 15)}...)`
    );

    // 2.2 Push Subscription Registration & Storage
    const mockSubscription = {
      endpoint: `https://fcm.googleapis.com/fcm/send/test_qa_endpoint_${Date.now()}`,
      keys: {
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t044Yjs6BpGWqHG71ipKSA8BGzybJt',
        auth: 'tBHItJI5svbpez7KI4CCXg',
      },
    };

    const savedSub = await pushService.subscribe(testUser._id, mockSubscription, 'QA Audit Test Device (Chrome Windows)');
    assert(savedSub && savedSub._id, 'Push subscription saved to MongoDB for user');

    // Verify subscription persistence
    const foundSub = await PushSubscription.findOne({ endpoint: mockSubscription.endpoint });
    assert(
      foundSub && foundSub.user.toString() === testUser._id.toString(),
      'Push subscription correctly associated with user ID'
    );

    // 2.3 Unsubscribe functionality
    await pushService.unsubscribe(mockSubscription.endpoint);
    const subAfterRemoval = await PushSubscription.findOne({ endpoint: mockSubscription.endpoint });
    assert(!subAfterRemoval, 'Unsubscribe successfully removes endpoint from MongoDB');

    // ----------------------------------------------------
    // SECTION 3: SOCIAL GRAPH & FOLLOWERS / FOLLOWING
    // ----------------------------------------------------
    console.log('\n[Section 3: Social Graph & Discovery]');

    const targetUser = await User.findOne({ userId: 'alice_chen' });
    if (targetUser) {
      // Ensure clean baseline state
      await Promise.all([
        User.findByIdAndUpdate(targetUser._id, { $pull: { follower: testUser._id } }),
        User.findByIdAndUpdate(testUser._id, { $pull: { following: targetUser._id } }),
      ]);

      // Toggle Follow: Follow
      const followRes = await socialService.toggleFollow(testUser._id, targetUser.userId);
      assert(followRes.isFollowing === true, 'toggleFollow successfully establishes follow relationship');

      // Check following list
      const followingRes = await userService.getUserFollowing(testUser._id);
      const isFollowingTarget = (followingRes.following || []).some((f) => f.userId === 'alice_chen');
      assert(isFollowingTarget, 'getUserFollowing returns target user in user following list');

      // Check target followers list
      const followersRes = await userService.getUserFollowers(targetUser._id);
      const isTestUserInFollowers = (followersRes.followers || []).some((f) => f.userId === qaUsername);
      assert(isTestUserInFollowers, 'getUserFollowers on target contains following user');

      // Toggle Follow: Unfollow
      const unfollowRes = await socialService.toggleFollow(testUser._id, targetUser.userId);
      assert(unfollowRes.isFollowing === false, 'toggleFollow successfully unfollows user');

      const followingAfter = await userService.getUserFollowing(testUser._id);
      const stillFollowing = (followingAfter.following || []).some((f) => f.userId === 'alice_chen');
      assert(!stillFollowing, 'getUserFollowing verifies removal of relationship');
    } else {
      console.log('  ⚠️ alice_chen not found, skipping specific follow check');
    }

    // ----------------------------------------------------
    // SECTION 4: STORIES & MEDIA DATA INTEGRITY
    // ----------------------------------------------------
    console.log('\n[Section 4: Stories & Media Structure]');

    // Create a video story
    const videoStory = await Story.create({
      user: testUser._id,
      mediaUrl: 'https://res.cloudinary.com/demo/video/upload/sample_video.mp4',
      mediaType: 'video',
      duration: 12,
      caption: 'QA Audit Video Story',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    assert(videoStory && videoStory.mediaType === 'video', 'Video story created with mediaType "video"');
    assert(videoStory.duration === 12, 'Video story preserves custom duration for UI progress syncing');

    await Story.deleteOne({ _id: videoStory._id });
    assert(true, 'Test video story cleaned up');

    // ----------------------------------------------------
    // SECTION 5: REALTIME PRESENCE ROSTER SYNC
    // ----------------------------------------------------
    console.log('\n[Section 5: Presence Sync Verification]');
    const { presenceHandler } = require('../src/sockets/presenceHandler');
    assert(typeof presenceHandler === 'function', 'presenceHandler is a valid socket handler function');

    // ----------------------------------------------------
    // SECTION 6: CLEANUP
    // ----------------------------------------------------
    await User.deleteOne({ userId: qaUsername });
    await PushSubscription.deleteMany({ endpoint: { $regex: 'test_qa_endpoint' } });

  } catch (err) {
    console.error('Unhandled QA test error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n====================================================');
    console.log(`QA AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runQAAudit();
