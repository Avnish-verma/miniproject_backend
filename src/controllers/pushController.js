const pushService = require('../services/pushService');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class PushController {
  getVapidPublicKey(req, res, next) {
    try {
      const publicKey = pushService.getVapidPublicKey();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { publicKey },
      });
    } catch (err) {
      next(err);
    }
  }

  async subscribe(req, res, next) {
    try {
      const userId = req.user._id;
      const { subscription } = req.body;
      const userAgent = req.headers['user-agent'] || '';

      if (!subscription || !subscription.endpoint) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: { message: 'Push subscription payload is required' },
        });
      }

      await pushService.subscribe(userId, subscription, userAgent);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Push subscription registered successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async unsubscribe(req, res, next) {
    try {
      const { endpoint } = req.body;
      if (endpoint) {
        await pushService.unsubscribe(endpoint);
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Push subscription removed successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PushController();
