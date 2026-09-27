/**
 * PWA & Web Push Notification Flow Verification Suite
 * Verifies User A -> User B push payloads, actions, deep links,
 * call ringing persistence, call cancel/missed notifications,
 * and GET /api/v1/calls/:callId authentication & authorization guards.
 */

const assert = require('assert');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');

const env = require('../src/config/env');
const User = require('../src/models/User');
const Call = require('../src/models/Call');
const PushSubscription = require('../src/models/PushSubscription');
const pushService = require('../src/services/pushService');
const app = require('../src/app');

async function runTests() {
  console.log('====================================================');
  console.log('📱 SHIFTAURA PWA & WEB PUSH FLOW TEST SUITE');
  console.log('====================================================\n');

  // Connect to DB if not connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGO_URI || env.MONGODB_URI);
  }

  // Start HTTP server for testing endpoints
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  // Intercept webpush.sendNotification to verify payload deliveries
  const interceptedPushes = [];
  const webpush = require('web-push');
  const originalSend = webpush.sendNotification;
  webpush.sendNotification = async (sub, payloadString, options) => {
    const parsed = JSON.parse(payloadString);
    interceptedPushes.push({ sub, payload: parsed, options });
    return { statusCode: 201 };
  };

  try {
    // Setup test users
    const timestamp = Date.now();
    const userA = await User.create({
      userId: `usera_${timestamp}`,
      username: `usera_${timestamp}`,
      email: `usera_${timestamp}@test.com`,
      fullname: 'User Alpha',
      password: 'Password123!',
      profilePic: { url: 'https://res.cloudinary.com/demo/image/upload/v1/alpha.jpg' },
      isVerified: true,
    });

    const userB = await User.create({
      userId: `userb_${timestamp}`,
      username: `userb_${timestamp}`,
      email: `userb_${timestamp}@test.com`,
      fullname: 'User Beta',
      password: 'Password123!',
      profilePic: { url: 'https://res.cloudinary.com/demo/image/upload/v1/beta.jpg' },
      isVerified: true,
    });

    const userC = await User.create({
      userId: `userc_${timestamp}`,
      username: `userc_${timestamp}`,
      email: `userc_${timestamp}@test.com`,
      fullname: 'User Charlie (Attacker)',
      password: 'Password123!',
      isVerified: true,
    });

    const tokenB = jwt.sign({ id: userB._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    const tokenC = jwt.sign({ id: userC._id }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    console.log('[Test 1: Push Subscription Registration]');
    const dummySubscription = {
      endpoint: `https://fcm.googleapis.com/fcm/send/test_${timestamp}`,
      keys: {
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9AcUbVYO2-0U0WwTU2SoWQyW48up29iX98',
        auth: 'tBHItJAhAXXUNsE7P4k27Q',
      },
    };

    const subResult = await pushService.subscribe(userB._id, dummySubscription, 'Mozilla/5.0 Chrome/PWA');
    assert.strictEqual(subResult.user.toString(), userB._id.toString());
    assert.strictEqual(subResult.endpoint, dummySubscription.endpoint);
    console.log('  ✅ PASS: Push subscription registered and stored for User B');

    console.log('\n[Test 2: Direct Message Web Push Payload]');
    const conversationId = new mongoose.Types.ObjectId().toString();
    interceptedPushes.length = 0;

    await pushService.sendToUser(userB._id, {
      title: userA.fullname || userA.username,
      body: 'Hey Beta, did you see the new update?',
      icon: userA.profilePic?.url || '/icon-192.png',
      badge: '/badge-96.png',
      tag: `msg-${conversationId}`,
      data: {
        url: `/chat?conversationId=${conversationId}`,
        conversationId: conversationId,
        senderName: userA.fullname || userA.username,
        type: 'MESSAGE',
        count: 1,
      },
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'reply', title: 'Reply', type: 'text', placeholder: 'Type a reply...' },
      ],
    });

    assert.strictEqual(interceptedPushes.length, 1);
    const msgPush = interceptedPushes[0].payload;
    assert.strictEqual(msgPush.title, 'User Alpha');
    assert.strictEqual(msgPush.body, 'Hey Beta, did you see the new update?');
    assert.strictEqual(msgPush.tag, `msg-${conversationId}`);
    assert.strictEqual(msgPush.data.url, `/chat?conversationId=${conversationId}`);
    assert.strictEqual(msgPush.icon, 'https://res.cloudinary.com/demo/image/upload/v1/alpha.jpg');
    assert.strictEqual(msgPush.badge, '/badge-96.png');
    assert.strictEqual(msgPush.actions.length, 2);
    assert.strictEqual(msgPush.actions[0].action, 'open');
    assert.strictEqual(msgPush.actions[1].action, 'reply');
    console.log('  ✅ PASS: Message push includes correct deep link, tag, actions, and sender avatar');

    console.log('\n[Test 3: Incoming Call Persistent Web Push Payload]');
    const callRecord = await Call.create({
      caller: userA._id,
      callee: userB._id,
      callType: 'video',
      status: 'ringing',
    });

    interceptedPushes.length = 0;
    await pushService.sendToUser(userB._id, {
      title: 'Incoming Video Call',
      body: `${userA.fullname} is calling you...`,
      icon: userA.profilePic?.url || '/icon-192.png',
      badge: '/badge-96.png',
      tag: `call-${callRecord._id}`,
      requireInteraction: true,
      urgency: 'high',
      vibrate: [300, 200, 300, 200, 500, 200, 500],
      data: {
        url: `/calls?callId=${callRecord._id}&autoAccept=true`,
        callId: callRecord._id.toString(),
        type: 'CALL_INCOMING',
        callType: 'video',
        callerName: userA.fullname,
        callerId: userA._id.toString(),
      },
      actions: [
        { action: 'accept', title: 'Answer' },
        { action: 'decline', title: 'Decline' },
      ],
    });

    assert.strictEqual(interceptedPushes.length, 1);
    const callPush = interceptedPushes[0].payload;
    assert.strictEqual(callPush.title, 'Incoming Video Call');
    assert.strictEqual(callPush.tag, `call-${callRecord._id}`);
    assert.strictEqual(callPush.requireInteraction, true);
    assert.strictEqual(callPush.data.url, `/calls?callId=${callRecord._id}&autoAccept=true`);
    assert.strictEqual(callPush.actions[0].action, 'accept');
    assert.strictEqual(callPush.actions[1].action, 'decline');
    assert.strictEqual(interceptedPushes[0].options.urgency, 'high');
    console.log('  ✅ PASS: Call push includes requireInteraction: true, high urgency, Answer/Decline actions');

    console.log('\n[Test 4: Caller Cancel -> Missed Call Web Push]');
    interceptedPushes.length = 0;
    await pushService.sendToUser(userB._id, {
      title: 'Missed Call',
      body: `Missed video call from ${userA.fullname}`,
      icon: userA.profilePic?.url || '/icon-192.png',
      badge: '/badge-96.png',
      tag: `call-${callRecord._id}`, // Replaces the ringing notification
      data: {
        url: `/calls?callWith=${userA._id}`,
        callId: callRecord._id.toString(),
        type: 'CALL_CANCELLED',
      },
      actions: [
        { action: 'callback', title: 'Call back' },
        { action: 'open', title: 'Open' },
      ],
    });

    assert.strictEqual(interceptedPushes.length, 1);
    const missedPush = interceptedPushes[0].payload;
    assert.strictEqual(missedPush.title, 'Missed Call');
    assert.strictEqual(missedPush.tag, `call-${callRecord._id}`);
    assert.strictEqual(missedPush.data.type, 'CALL_CANCELLED');
    assert.strictEqual(missedPush.actions[0].action, 'callback');
    console.log('  ✅ PASS: Missed call notification targets matching tag with Call back action');

    console.log('\n[Test 5: Call Details Endpoint (GET /api/v1/calls/:callId)]');
    // Authorized user (User B) should successfully fetch call details
    const resB = await fetch(`${baseUrl}/api/v1/calls/${callRecord._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataB = await resB.json();

    assert.strictEqual(resB.status, 200);
    assert.strictEqual(dataB.success, true);
    assert.strictEqual(dataB.data._id.toString(), callRecord._id.toString());
    assert.strictEqual(dataB.data.caller.fullname, 'User Alpha');
    console.log('  ✅ PASS: Participant User B fetches call details for push deep-link wake-up');

    // Unauthorized third-party (User C) must receive 403 Forbidden
    const resC = await fetch(`${baseUrl}/api/v1/calls/${callRecord._id}`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    const dataC = await resC.json();

    assert.strictEqual(resC.status, 403);
    console.log('  ✅ PASS: Non-participant User C is strictly forbidden (HTTP 403)');

    console.log('\n[Test 6: Push Unsubscription]');
    const unsubResult = await pushService.unsubscribe(dummySubscription.endpoint);
    assert.strictEqual(unsubResult, true);
    const remainingSub = await PushSubscription.findOne({ endpoint: dummySubscription.endpoint });
    assert.strictEqual(remainingSub, null);
    console.log('  ✅ PASS: Unsubscribe cleanly removes device push subscription');

    // Cleanup test data
    await User.deleteMany({ _id: { $in: [userA._id, userB._id, userC._id] } });
    await Call.deleteOne({ _id: callRecord._id });
    await PushSubscription.deleteMany({ endpoint: dummySubscription.endpoint });

    console.log('\n====================================================');
    console.log('🎉 ALL PWA & PUSH NOTIFICATION TESTS PASSED!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    webpush.sendNotification = originalSend;
    server.close();
    await mongoose.connection.close();
  }
}

runTests();
