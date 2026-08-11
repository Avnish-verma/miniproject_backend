const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const upload = require("../controller/upload");

router.get("/",async(req,res)=>{
    const {_id,userId,emailId,fullname,follower,following,profilePic,bio,gender} = await req.user.populate("follower following","userId fullname profilePic _id");

    const data = {userId,emailId,fullname,follower,following,profilePic,bio,gender};
    
    res.status(200).json({success:true,message:"profile found",data:data});
})
router.post("/",async(req,res)=>{
    const {bio,gender} = req.body;
    console.log("Incoming Bio & Gender Body:", req.body);
        console.log("Current User from Middleware:", req.user);
    req.user.bio=bio;
    req.user.gender=gender;
    
    await req.user.save();
    res.status(200).json({success:true,message:"profile updated",data:req.user});   
    
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
router.post("/follow/:userId",async(req,res)=>{
    const {userId} = req.params;
    const userToFollow = await userModel.findOne({userId}); 
    if(!userToFollow){
        return res.status(404).json({success:false,message:"User not found"});
    }
    if(userToFollow.follower.includes(req.user._id)){
       userToFollow.follower.pull(req.user._id);
       req.user.following.pull(userToFollow._id);
    }
    else{ userToFollow.follower.push(req.user._id);
         req.user.following.push(userToFollow._id);
    }
    await userToFollow.save();
    await req.user.save();
    res.status(200).json({success:true,message:"User followed",data:userToFollow});
});

router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Fetching profile for userId:", userId);
        const targetUser = await userModel.findOne({ userId });
        console.log("Target User Found:", targetUser);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if currently logged-in user is following this target user
        const isFollowing = targetUser.follower.includes(req.user._id);
        console.log(`Is the logged-in user following ${userId}?`, isFollowing);
        const data = {
            userId: targetUser.userId,
            emailId: targetUser.emailId,
            fullname: targetUser.fullname,
            follower: targetUser.follower,
            following: targetValue = targetUser.following,
            profilePic: targetUser.profilePic,
            bio: targetUser.bio,
            gender: targetUser.gender,
            isFollowing
        };
        console.log("Profile Data to be sent:", data);
        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});
module.exports= router;