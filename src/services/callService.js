const Call = require('../models/Call');
const User = require('../models/User');
const Block = require('../models/Block');
const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/errorTypes');

class CallService {
  async cleanupStaleCalls(userId = null) {
    const now = new Date();
    const query = userId
      ? { $or: [{ caller: userId }, { callee: userId }] }
      : {};

    // 1. Any call in 'ringing' status for > 35 seconds is expired as 'missed'
    const staleRingingCutoff = new Date(now.getTime() - 35 * 1000);
    await Call.updateMany(
      {
        ...query,
        status: 'ringing',
        createdAt: { $lt: staleRingingCutoff },
      },
      {
        $set: {
          status: 'missed',
          endedAt: now,
        },
      }
    );

    // 2. Any call in 'accepted' status without endedAt for > 5 minutes is marked 'completed'
    const staleAcceptedCutoff = new Date(now.getTime() - 5 * 60 * 1000);
    await Call.updateMany(
      {
        ...query,
        status: 'accepted',
        $or: [
          { startedAt: { $lt: staleAcceptedCutoff } },
          { createdAt: { $lt: staleAcceptedCutoff } },
        ],
      },
      {
        $set: {
          status: 'completed',
          endedAt: now,
        },
      }
    );
  }

  async initiateCall(callerId, targetIdentifier, callType = 'video') {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetIdentifier);
    const query = isObjectId ? { _id: targetIdentifier } : { userId: targetIdentifier.toLowerCase() };

    const callee = await User.findOne(query);
    if (!callee) {
      throw new NotFoundError('Recipient not found');
    }

    if (callee._id.equals(callerId)) {
      throw new ValidationError('You cannot call yourself');
    }

    // Check if blocked
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: callerId, blocked: callee._id },
        { blocker: callee._id, blocked: callerId },
      ],
    });
    if (isBlocked) {
      throw new ForbiddenError('Call could not be placed due to privacy/block settings');
    }

    // Auto-cleanup any stale ringing or orphaned calls for both participants
    await Promise.all([
      this.cleanupStaleCalls(callerId),
      this.cleanupStaleCalls(callee._id),
    ]);

    // Check caller's own call status: if caller starts a new call, auto-clear previous call
    const callerActiveCall = await Call.findOne({
      $or: [{ caller: callerId }, { callee: callerId }],
      status: { $in: ['ringing', 'accepted'] },
    });
    if (callerActiveCall) {
      await this.updateCallStatus(
        callerActiveCall._id,
        callerActiveCall.status === 'ringing' ? 'cancelled' : 'completed'
      );
    }

    // Check if callee is currently in another active call
    const calleeActiveCall = await Call.findOne({
      $or: [{ caller: callee._id }, { callee: callee._id }],
      status: { $in: ['ringing', 'accepted'] },
    });
    if (calleeActiveCall) {
      const now = new Date();
      const callAge = now.getTime() - new Date(calleeActiveCall.updatedAt || calleeActiveCall.createdAt).getTime();
      if ((calleeActiveCall.status === 'ringing' && callAge > 35000) || (calleeActiveCall.status === 'accepted' && callAge > 5 * 60 * 1000)) {
        await this.updateCallStatus(
          calleeActiveCall._id,
          calleeActiveCall.status === 'ringing' ? 'missed' : 'completed'
        );
      } else {
        throw new ValidationError('User is currently on another call', { isBusy: true });
      }
    }

    const call = await Call.create({
      caller: callerId,
      callee: callee._id,
      callType,
      status: 'ringing',
    });

    const populatedCall = await Call.findById(call._id)
      .populate('caller', 'userId fullname profilePic')
      .populate('callee', 'userId fullname profilePic')
      .lean();

    return populatedCall;
  }

  async updateCallStatus(callId, status, duration = 0) {
    const update = { status };
    if (status === 'accepted') {
      update.startedAt = new Date();
    } else if (['completed', 'rejected', 'missed', 'cancelled', 'failed'].includes(status)) {
      update.endedAt = new Date();
      if (duration > 0) {
        update.duration = duration;
      }
    }

    const call = await Call.findByIdAndUpdate(callId, { $set: update }, { new: true })
      .populate('caller', 'userId fullname profilePic')
      .populate('callee', 'userId fullname profilePic');

    return call;
  }

  async getCallHistory(userId, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const filter = { $or: [{ caller: userId }, { callee: userId }] };

    const [calls, total] = await Promise.all([
      Call.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('caller', 'userId fullname profilePic')
        .populate('callee', 'userId fullname profilePic')
        .lean(),
      Call.countDocuments(filter),
    ]);

    return { calls, total, page, limit };
  }
}

module.exports = new CallService();
