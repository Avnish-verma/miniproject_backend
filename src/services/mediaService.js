const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const { ValidationError } = require('../errors/errorTypes');

class MediaService {
  generateUploadSignature(folder = 'posts', prefix = 'media', userIdentifier = 'user') {
    if (!env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_CLOUD_NAME) {
      throw new ValidationError('Cloudinary storage is not properly configured on server');
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_]/g, '');
    const cleanFolder = folder.replace(/[^a-zA-Z0-9_/]/g, '');
    const unique_public_id = `${cleanPrefix}_${Date.now()}_${userIdentifier}`;

    const paramsToSign = {
      timestamp,
      folder: `nova_platform/${cleanFolder}`,
      public_id: unique_public_id,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      folder: `nova_platform/${cleanFolder}`,
      public_id: unique_public_id,
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    };
  }
}

module.exports = new MediaService();
