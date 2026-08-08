const cloudinary = require("cloudinary");
const express = require("express");
const router = express.Router();
const requireAuth = require("../controller/protect");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
router.get('/api/cloudinary-signature', requireAuth, (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  // Define upload options (folder structure, allowed formats)
  const paramsToSign = {
    timestamp: timestamp,
    folder: 'instagram_clone_posts',
  };

  // Generate signature using API Secret
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: 'instagram_clone_posts',
  });
});
module.exports = router;