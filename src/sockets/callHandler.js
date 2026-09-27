const SOCKET_EVENTS = require('../constants/events');
const callService = require('../services/callService');
const Call = require('../models/Call');
const Notification = require('../models/Notification');
const pushService = require('../services/pushService');
const logger = require('../utils/logger');
const { isUserOnline } = require('./presenceHandler');

const callHandler = (io, socket) => {
  const currentUserId = socket.user._id;

  // 1. Initiate 1-to-1 WebRTC Call
  socket.on(SOCKET_EVENTS.CALL_INITIATE, async ({ recipientId, type = 'video' }, callback) => {
    try {
      if (!recipientId) {
        if (typeof callback === 'function') callback({ error: 'RECIPIENT_ID_REQUIRED' });
        return;
      }

      // Check if recipient is online
      const isOnline = isUserOnline(recipientId);
      if (!isOnline) {
        // Record missed call in DB
        const missedCall = await Call.create({
          caller: currentUserId,
          callee: recipientId,
          callType: type,
          status: 'missed',
        });

        await Notification.create({
          recipient: recipientId,
          sender: currentUserId,
          type: 'CALL_MISSED',
          referenceId: missedCall._id,
          message: `missed a ${type} call`,
        });

        pushService.sendToUser(recipientId, {
          title: 'Missed Call',
          body: `Missed a ${type} call from ${socket.user.fullname || socket.user.userId}`,
          icon: socket.user.profilePic || '/favicon.svg',
          tag: `missed-call-${missedCall._id}`,
          data: { url: '/calls', type: 'CALL_MISSED' },
        }).catch((err) => logger.warn(`[Call Handler] Push error: ${err.message}`));

        if (typeof callback === 'function') callback({ error: 'USER_OFFLINE', isOffline: true });
        return;
      }

      // Initiate Call Session via CallService (checks blocked status and busy status)
      const call = await callService.initiateCall(currentUserId, recipientId, type);

      // Join call room for signaling
      socket.join(`call:${call._id}`);

      // Emit incoming call to recipient's personal socket room
      io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.CALL_INCOMING, {
        callId: call._id,
        caller: {
          _id: socket.user._id,
          userId: socket.user.userId,
          fullname: socket.user.fullname,
          profilePic: socket.user.profilePic,
        },
        callType: type,
      });

      // Dispatch high-priority Web Push notification for background/PWA
      pushService.sendToUser(recipientId, {
        title: `Incoming ${type === 'video' ? 'Video' : 'Audio'} Call`,
        body: `${socket.user.fullname || socket.user.userId} is calling you on ShiftAura...`,
        icon: socket.user.profilePic || '/favicon.svg',
        tag: `call-${call._id}`,
        urgency: 'high',
        vibrate: [300, 200, 300, 200, 500],
        data: {
          url: `/calls?callId=${call._id}`,
          callId: call._id.toString(),
          type: 'CALL_INCOMING',
        },
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' },
        ],
      }).catch((err) => logger.warn(`[Call Handler] Incoming call push error: ${err.message}`));

      // Emit ringing back to caller
      socket.emit(SOCKET_EVENTS.CALL_RINGING, { callId: call._id });

      if (typeof callback === 'function') callback({ success: true, call });
    } catch (err) {
      logger.error(`[Call Handler] Error initiating call: ${err.message}`);
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });

  // 2. Accept Call
  socket.on(SOCKET_EVENTS.CALL_ACCEPT, async ({ callId }, callback) => {
    try {
      const call = await Call.findById(callId);
      if (!call || !call.callee.equals(currentUserId)) {
        if (typeof callback === 'function') callback({ error: 'CALL_NOT_FOUND_OR_UNAUTHORIZED' });
        return;
      }

      await callService.updateCallStatus(callId, 'accepted');
      socket.join(`call:${callId}`);

      // Notify caller and room that call was accepted
      const payload = {
        callId,
        callerId: call.caller.toString(),
        calleeId: call.callee.toString(),
      };
      io.to(`user:${call.caller.toString()}`).emit(SOCKET_EVENTS.CALL_ACCEPTED, payload);
      io.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_ACCEPTED, payload);
      if (typeof callback === 'function') callback({ success: true, ...payload });
    } catch (err) {
      logger.error(`[Call Handler] Error accepting call: ${err.message}`);
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });

  // 3. Reject Call
  socket.on(SOCKET_EVENTS.CALL_REJECT, async ({ callId, reason = 'declined' }) => {
    try {
      const call = await Call.findById(callId);
      if (!call) return;

      const newStatus = reason === 'busy' ? 'failed' : 'rejected';
      await callService.updateCallStatus(callId, newStatus);

      io.to(`user:${call.caller.toString()}`).emit(SOCKET_EVENTS.CALL_REJECTED, {
        callId,
        reason,
      });
    } catch (err) {
      logger.error(`[Call Handler] Error rejecting call: ${err.message}`);
    }
  });

  // 4. Cancel Call (Caller hangs up while ringing)
  socket.on(SOCKET_EVENTS.CALL_CANCEL, async ({ callId }) => {
    try {
      const call = await Call.findById(callId);
      if (!call || !call.caller.equals(currentUserId)) return;

      await callService.updateCallStatus(callId, 'cancelled');

      io.to(`user:${call.callee.toString()}`).emit(SOCKET_EVENTS.CALL_CANCELLED, { callId });
    } catch (err) {
      logger.error(`[Call Handler] Error cancelling call: ${err.message}`);
    }
  });

  // 5. WebRTC Offer (Caller -> Callee)
  socket.on(SOCKET_EVENTS.CALL_OFFER, async ({ callId, sdp }) => {
    try {
      const call = await Call.findById(callId);
      if (!call) return;

      // Authorize that sender is a participant
      const targetUserId = call.caller.equals(currentUserId) ? call.callee : call.caller;

      io.to(`user:${targetUserId.toString()}`).emit(SOCKET_EVENTS.CALL_OFFER, {
        callId,
        sdp,
      });
    } catch (err) {
      logger.error(`[Call Handler] Error forwarding offer: ${err.message}`);
    }
  });

  // 6. WebRTC Answer (Callee -> Caller)
  socket.on(SOCKET_EVENTS.CALL_ANSWER, async ({ callId, sdp }) => {
    try {
      const call = await Call.findById(callId);
      if (!call) return;

      const targetUserId = call.callee.equals(currentUserId) ? call.caller : call.callee;

      io.to(`user:${targetUserId.toString()}`).emit(SOCKET_EVENTS.CALL_ANSWER, {
        callId,
        sdp,
      });
    } catch (err) {
      logger.error(`[Call Handler] Error forwarding answer: ${err.message}`);
    }
  });

  // 7. WebRTC ICE Candidate Exchange (Bidirectional)
  socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, async ({ callId, candidate }) => {
    try {
      const call = await Call.findById(callId);
      if (!call || !candidate) return;

      const targetUserId = call.caller.equals(currentUserId) ? call.callee : call.caller;

      io.to(`user:${targetUserId.toString()}`).emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, {
        callId,
        candidate,
      });
    } catch (err) {
      logger.error(`[Call Handler] Error forwarding ICE candidate: ${err.message}`);
    }
  });

  // 8. End Call (Hangup)
  socket.on(SOCKET_EVENTS.CALL_END, async ({ callId, duration = 0 }) => {
    try {
      const call = await Call.findById(callId);
      if (!call) return;

      await callService.updateCallStatus(callId, 'completed', duration);

      // Notify other participant
      const targetUserId = call.caller.equals(currentUserId) ? call.callee : call.caller;
      io.to(`user:${targetUserId.toString()}`).emit(SOCKET_EVENTS.CALL_ENDED, {
        callId,
        duration,
      });

      socket.leave(`call:${callId}`);
    } catch (err) {
      logger.error(`[Call Handler] Error ending call: ${err.message}`);
    }
  });
};

module.exports = callHandler;
