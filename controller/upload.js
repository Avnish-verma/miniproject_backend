const cloudinary = require("cloudinary");
const express = require("express");

const requireAuth = require("../controller/protect");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
 const upload =(folder,prefix)=>{
  return (req, res,next) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const unique_public_id = `${prefix}_${Date.now()}_${req.user.userId}`; // Generate a unique public ID
  // Define upload options (folder structure, allowed formats)
  const paramsToSign = {
    timestamp: timestamp,
    folder: `instagram_clone/${folder}`, // Specify the folder structure in Cloudinary
    public_id: unique_public_id, // Unique public ID for the uploaded file
  };

  // Generate signature using API Secret
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET,
    
  );

  req.uploadInfo=({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: `instagram_clone/${folder}`,
    public_id: unique_public_id // Return the unique public ID to the client
  });
  next();
  
};}
module.exports = upload;