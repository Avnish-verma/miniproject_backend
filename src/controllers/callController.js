const callService = require('../services/callService');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class CallController {
  async initiateCall(req, res, next) {
    try {
      const { targetId, callType = 'video' } = req.body;
      const call = await callService.initiateCall(req.user._id, targetId, callType);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCallStatus(req, res, next) {
    try {
      const { callId } = req.params;
      const { status, duration } = req.body;
      const call = await callService.updateCallStatus(callId, status, duration);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCallHistory(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await callService.getCallHistory(req.user._id, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.calls,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCallById(req, res, next) {
    try {
      const { callId } = req.params;
      const Call = require('../models/Call');
      const call = await Call.findById(callId)
        .populate('caller', 'userId fullname profilePic')
        .populate('callee', 'userId fullname profilePic');

      if (!call) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: { message: 'Call not found' },
        });
      }

      if (!call.caller._id.equals(req.user._id) && !call.callee._id.equals(req.user._id)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: { message: 'Unauthorized access to call session' },
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: call,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CallController();
