const { io } = require('../client/node_modules/socket.io-client');
const axios = require('axios');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const authService = require('../src/services/authService');
const callService = require('../src/services/callService');
const chatService = require('../src/services/chatService');
const Call = require('../src/models/Call');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

const API_URL = 'http://localhost:5000';

async function runRealtimeTests() {
  console.log('====================================================');
  console.log('📡 NOVA REALTIME & WEBRTC CALLING TEST SUITE');
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

  // Connect to MongoDB for state verification
  await mongoose.connect(env.MONGO_URI);
  console.log('[Connected to MongoDB]\n');

  // Step 1: Authenticate Alice, Bob, and Clara
  console.log('--- Authenticating Test Users ---');
  const aliceAuth = await authService.login({ userId: 'alice_chen', password: 'NovaPass123!' });
  const bobAuth = await authService.login({ userId: 'bob_vance', password: 'NovaPass123!' });
  const claraAuth = await authService.login({ userId: 'clara_o', password: 'NovaPass123!' });

  const aliceId = aliceAuth.user._id.toString();
  const bobId = bobAuth.user._id.toString();
  const claraId = claraAuth.user._id.toString();

  assert(aliceAuth && aliceAuth.accessToken, `Alice authenticated (${aliceId})`);
  assert(bobAuth && bobAuth.accessToken, `Bob authenticated (${bobId})`);
  assert(claraAuth && claraAuth.accessToken, `Clara authenticated (${claraId})`);

  // Step 2: Connect Sockets for Alice, Bob, and Clara
  console.log('\n--- Establishing Real-time Socket Connections ---');
  const createSocket = (token) => {
    return io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });
  };

  const aliceSocket = createSocket(aliceAuth.accessToken);
  const bobSocket = createSocket(bobAuth.accessToken);
  const claraSocket = createSocket(claraAuth.accessToken);

  await Promise.all([
    new Promise((resolve) => aliceSocket.on('connect', resolve)),
    new Promise((resolve) => bobSocket.on('connect', resolve)),
    new Promise((resolve) => claraSocket.on('connect', resolve)),
  ]);

  assert(aliceSocket.connected, 'Alice Socket connected to server');
  assert(bobSocket.connected, 'Bob Socket connected to server');
  assert(claraSocket.connected, 'Clara Socket connected to server');

  // Helper wait
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Get or create conversation between Alice and Bob
  const conversation = await chatService.getOrCreateConversation(aliceId, bobId);
  const convId = conversation._id.toString();

  // ----------------------------------------------------
  // TEST A: Real-Time Chat & Typing & Read Receipts
  // ----------------------------------------------------
  console.log('\n[Test Suite A: Real-Time Chat Messaging, Typing & Read Receipts]');

  // Join rooms
  aliceSocket.emit('chat:join', { conversationId: convId });
  bobSocket.emit('chat:join', { conversationId: convId });
  await sleep(200);

  // A1: Typing indicator
  const typingPromise = new Promise((resolve) => {
    aliceSocket.once('message:typing', (data) => {
      resolve(data);
    });
  });
  bobSocket.emit('message:typing', { conversationId: convId, isTyping: true });
  const typingEvent = await typingPromise;
  assert(typingEvent && typingEvent.isTyping === true && typingEvent.userId === 'bob_vance',
    'Alice received Bob\'s real-time typing indicator');

  // A2: Real-time Message Send & Instant Delivery Event
  const msgText = `Hello Bob from Alice at ${Date.now()}`;
  const bobMsgPromise = new Promise((resolve) => {
    bobSocket.once('message:new', (data) => resolve(data));
  });
  const aliceDeliveredPromise = new Promise((resolve) => {
    aliceSocket.once('message:delivered', (data) => resolve(data));
  });

  aliceSocket.emit('message:send', { conversationId: convId, text: msgText });

  const receivedMsg = await bobMsgPromise;
  assert(receivedMsg && receivedMsg.message.text === msgText,
    'Bob received Alice\'s message over Socket.IO without page reload');

  const deliveredEvent = await aliceDeliveredPromise;
  assert(deliveredEvent && deliveredEvent.conversationId === convId,
    'Alice received message:delivered event confirming receipt');

  // A3: Read Receipt
  const aliceReadPromise = new Promise((resolve) => {
    aliceSocket.once('message:read', (data) => resolve(data));
  });
  bobSocket.emit('message:read', { conversationId: convId });
  const readEvent = await aliceReadPromise;
  assert(readEvent && readEvent.readBy === bobId,
    'Alice received real-time read receipt from Bob');

  // ----------------------------------------------------
  // TEST B: WebRTC Audio Call Lifecycle & Immediate Second Call
  // ----------------------------------------------------
  console.log('\n[Test Suite B: WebRTC Audio Call Lifecycle & Stale Call Prevention]');

  let incomingCallEvent = null;
  const bobIncomingPromise = new Promise((resolve) => {
    bobSocket.once('call:incoming', (data) => resolve(data));
  });
  const aliceRingingPromise = new Promise((resolve) => {
    aliceSocket.once('call:ringing', (data) => resolve(data));
  });

  aliceSocket.emit('call:initiate', { recipientId: bobId, type: 'audio' });

  incomingCallEvent = await bobIncomingPromise;
  const ringingEvent = await aliceRingingPromise;

  assert(incomingCallEvent && incomingCallEvent.callType === 'audio',
    'Bob received incoming audio call');
  assert(ringingEvent && ringingEvent.callId === incomingCallEvent.callId,
    'Alice received call:ringing notification');

  const audioCallId = incomingCallEvent.callId;

  // Bob accepts
  const aliceAcceptedPromise = new Promise((resolve) => {
    aliceSocket.once('call:accepted', (data) => resolve(data));
  });
  bobSocket.emit('call:accept', { callId: audioCallId });
  const acceptedEvent = await aliceAcceptedPromise;
  assert(acceptedEvent && acceptedEvent.callId === audioCallId,
    'Alice received call:accepted event');

  // Alice sends WebRTC Offer
  const bobOfferPromise = new Promise((resolve) => {
    bobSocket.once('call:offer', (data) => resolve(data));
  });
  const mockOffer = { type: 'offer', sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
  aliceSocket.emit('call:offer', { callId: audioCallId, sdp: mockOffer });
  const receivedOffer = await bobOfferPromise;
  assert(receivedOffer && receivedOffer.sdp.type === 'offer',
    'Bob received WebRTC Offer SDP');

  // Bob sends WebRTC Answer
  const aliceAnswerPromise = new Promise((resolve) => {
    aliceSocket.once('call:answer', (data) => resolve(data));
  });
  const mockAnswer = { type: 'answer', sdp: 'v=0\r\no=- 67890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
  bobSocket.emit('call:answer', { callId: audioCallId, sdp: mockAnswer });
  const receivedAnswer = await aliceAnswerPromise;
  assert(receivedAnswer && receivedAnswer.sdp.type === 'answer',
    'Alice received WebRTC Answer SDP');

  // Bidirectional ICE Candidate exchange
  const bobIcePromise = new Promise((resolve) => {
    bobSocket.once('call:ice-candidate', (data) => resolve(data));
  });
  aliceSocket.emit('call:ice-candidate', { callId: audioCallId, candidate: { candidate: 'candidate:1 1 UDP 2122260223 127.0.0.1 50000 typ host' } });
  const receivedIce = await bobIcePromise;
  assert(receivedIce && receivedIce.candidate,
    'Bob received ICE candidate from Alice');

  // Bob hangs up
  const aliceEndedPromise = new Promise((resolve) => {
    aliceSocket.once('call:ended', (data) => resolve(data));
  });
  bobSocket.emit('call:end', { callId: audioCallId, duration: 15 });
  const endedEvent = await aliceEndedPromise;
  assert(endedEvent && endedEvent.callId === audioCallId,
    'Alice received call:ended event with duration');

  // Verify call record in MongoDB
  const dbCallB = await Call.findById(audioCallId);
  assert(dbCallB && dbCallB.status === 'completed' && dbCallB.endedAt != null,
    'Call document marked completed with endedAt in MongoDB');

  // IMMEDIATE SECOND CALL TEST (Crucial: Tests fix for "User is currently on another call")
  console.log('\n--- Immediate Second Call Verification ---');
  let secondCallOk = false;
  try {
    const bobSecondIncoming = new Promise((resolve) => {
      bobSocket.once('call:incoming', (data) => resolve(data));
    });
    aliceSocket.emit('call:initiate', { recipientId: bobId, type: 'audio' });
    const secondCall = await bobSecondIncoming;
    if (secondCall && secondCall.callId) {
      secondCallOk = true;
      // Hang up
      aliceSocket.emit('call:cancel', { callId: secondCall.callId });
    }
  } catch (err) {
    secondCallOk = false;
  }
  assert(secondCallOk, 'Immediate second call succeeded without "Another call" lockout');

  await sleep(300);

  // ----------------------------------------------------
  // TEST C: WebRTC Video Call Lifecycle
  // ----------------------------------------------------
  console.log('\n[Test Suite C: WebRTC Video Call Lifecycle]');

  const bobVideoIncomingPromise = new Promise((resolve) => {
    bobSocket.once('call:incoming', (data) => resolve(data));
  });
  aliceSocket.emit('call:initiate', { recipientId: bobId, type: 'video' });
  const videoIncoming = await bobVideoIncomingPromise;
  assert(videoIncoming && videoIncoming.callType === 'video',
    'Bob received incoming video call');

  const videoCallId = videoIncoming.callId;

  // Bob accepts
  const aliceVideoAcceptedPromise = new Promise((resolve) => {
    aliceSocket.once('call:accepted', (data) => resolve(data));
  });
  bobSocket.emit('call:accept', { callId: videoCallId });
  await aliceVideoAcceptedPromise;

  // Alice ends
  const bobVideoEndedPromise = new Promise((resolve) => {
    bobSocket.once('call:ended', (data) => resolve(data));
  });
  aliceSocket.emit('call:end', { callId: videoCallId, duration: 8 });
  await bobVideoEndedPromise;

  const dbCallC = await Call.findById(videoCallId);
  assert(dbCallC && dbCallC.status === 'completed',
    'Video call successfully established and cleanly ended');

  await sleep(300);

  // ----------------------------------------------------
  // TEST D: Call Rejection Lifecycle
  // ----------------------------------------------------
  console.log('\n[Test Suite D: Call Rejection Lifecycle]');

  const bobRejectIncoming = new Promise((resolve) => {
    bobSocket.once('call:incoming', (data) => resolve(data));
  });
  aliceSocket.emit('call:initiate', { recipientId: bobId, type: 'audio' });
  const rejectedCallData = await bobRejectIncoming;

  const aliceRejectedPromise = new Promise((resolve) => {
    aliceSocket.once('call:rejected', (data) => resolve(data));
  });
  bobSocket.emit('call:reject', { callId: rejectedCallData.callId, reason: 'declined' });
  const rejectEvent = await aliceRejectedPromise;
  assert(rejectEvent && rejectEvent.reason === 'declined',
    'Alice received call:rejected with reason declined');

  const dbCallD = await Call.findById(rejectedCallData.callId);
  assert(dbCallD && dbCallD.status === 'rejected',
    'Call document marked as rejected in database');

  // Verify immediate new call works after rejection
  let afterRejectCallOk = false;
  const bobAfterRejectIncoming = new Promise((resolve) => {
    bobSocket.once('call:incoming', (data) => resolve(data));
  });
  aliceSocket.emit('call:initiate', { recipientId: bobId, type: 'audio' });
  const afterRejectCall = await bobAfterRejectIncoming;
  if (afterRejectCall) {
    afterRejectCallOk = true;
    aliceSocket.emit('call:cancel', { callId: afterRejectCall.callId });
  }
  assert(afterRejectCallOk, 'New call placed immediately after rejection succeeded');

  await sleep(300);

  // ----------------------------------------------------
  // TEST E: Call Cancellation Lifecycle
  // ----------------------------------------------------
  console.log('\n[Test Suite E: Call Cancellation Lifecycle]');

  const bobCancelIncoming = new Promise((resolve) => {
    bobSocket.once('call:incoming', (data) => resolve(data));
  });
  aliceSocket.emit('call:initiate', { recipientId: bobId, type: 'video' });
  const cancelCallData = await bobCancelIncoming;

  const bobCancelledPromise = new Promise((resolve) => {
    bobSocket.once('call:cancelled', (data) => resolve(data));
  });
  aliceSocket.emit('call:cancel', { callId: cancelCallData.callId });
  const cancelledEvent = await bobCancelledPromise;
  assert(cancelledEvent && cancelledEvent.callId === cancelCallData.callId,
    'Bob received call:cancelled when caller hung up before answer');

  const dbCallE = await Call.findById(cancelCallData.callId);
  assert(dbCallE && dbCallE.status === 'cancelled',
    'Call document marked as cancelled in database');

  // ----------------------------------------------------
  // TEST F: Ringing Auto-Expiration (Stale Call Cleanup)
  // ----------------------------------------------------
  console.log('\n[Test Suite F: Ringing Auto-Expiration (Stale Call Cleanup)]');

  // Insert a mock call that has been ringing for 40 seconds
  const staleCall = await Call.create({
    caller: aliceId,
    callee: bobId,
    callType: 'audio',
    status: 'ringing',
    createdAt: new Date(Date.now() - 40 * 1000),
  });

  await callService.cleanupStaleCalls(aliceId);

  const staleAfterCleanup = await Call.findById(staleCall._id);
  assert(staleAfterCleanup && staleAfterCleanup.status === 'missed',
    'Stale ringing call (>35s) automatically expired to missed status');

  // ----------------------------------------------------
  // TEST G: Genuine Busy Call Enforcement
  // ----------------------------------------------------
  console.log('\n[Test Suite G: Genuine Busy Call Enforcement]');

  // Alice calls Bob, Bob accepts
  const bobBusyIncoming = new Promise((resolve) => {
    bobSocket.once('call:incoming', (data) => resolve(data));
  });
  aliceSocket.emit('call:initiate', { recipientId: bobId, type: 'video' });
  const busyCallData = await bobBusyIncoming;
  bobSocket.emit('call:accept', { callId: busyCallData.callId });
  await sleep(300);

  // Now Clara tries to call Alice while Alice is in call with Bob
  let busyErrorCaught = false;
  try {
    await callService.initiateCall(claraId, aliceId, 'audio');
  } catch (err) {
    if (err.message && err.message.includes('another call')) {
      busyErrorCaught = true;
    }
  }
  assert(busyErrorCaught, 'Third-party (Clara) received busy error when Alice is genuinely in a call');

  // Alice ends call with Bob
  aliceSocket.emit('call:end', { callId: busyCallData.callId, duration: 10 });
  await sleep(300);

  // Now Clara calls Alice -> Should succeed!
  let claraCallOk = false;
  try {
    const aliceIncomingFromClara = new Promise((resolve) => {
      aliceSocket.once('call:incoming', (data) => resolve(data));
    });
    claraSocket.emit('call:initiate', { recipientId: aliceId, type: 'audio' });
    const callFromClara = await aliceIncomingFromClara;
    if (callFromClara) {
      claraCallOk = true;
      claraSocket.emit('call:cancel', { callId: callFromClara.callId });
    }
  } catch (err) {
    claraCallOk = false;
  }
  assert(claraCallOk, 'After active call ended, new call from Clara succeeded immediately');

  // Clean up sockets & DB
  aliceSocket.disconnect();
  bobSocket.disconnect();
  claraSocket.disconnect();
  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRealtimeTests().catch((err) => {
  console.error('[Test Execution Failed]:', err);
  process.exit(1);
});
