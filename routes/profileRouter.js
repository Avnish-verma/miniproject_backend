const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const upload = require("../controller/upload");

router.get("/",async(req,res)=>{
    const {userId,emailId,fullname,follower,following,profilePic} = req.user;

    const data = {userId,emailId,fullname,follower,following,profilePic};
    
    res.status(200).json({success:true,message:"profile found",data:data});
})
router.post("/",async(req,res)=>{
    const {bio,gender} = req.body;
    const user = req.user;
    
})
router.get("/upload-profile-pic",upload("profile_pics","profile"),async(req,res)=>{
    res.status(200).json({success:true,message:"upload info",data:req.uploadInfo});
});
router.put("/update-profile-pic",async(req,res)=>{
    const {url,public_id}= req.body;
    const user = req.user;
    user.profilePic = {url,public_id};
    await user.save();
    res.status(200).json({success:true,message:"profile pic updated",data:{profilePic:url}});
});

module.exports= router;