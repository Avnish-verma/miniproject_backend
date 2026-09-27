const mediaService = require('../services/mediaService');
const HTTP_STATUS = require('../constants/httpStatusCodes');

class MediaController {
  getUploadSignature(folder = 'posts', prefix = 'media') {
    return (req, res, next) => {
      try {
        const userId = req.user ? req.user.userId || req.user._id : 'anonymous';
        const uploadInfo = mediaService.generateUploadSignature(folder, prefix, userId);

        req.uploadInfo = uploadInfo; // Backward compatibility

        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: 'Upload parameters generated successfully',
          data: uploadInfo,
          // Legacy format compatibility
          uploadInfo,
        });
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = new MediaController();
