const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");


router.get("/",async(req,res)=>{
    const {userId,emailId,fullname,follower,following,profilePic} = req.user;

    const data = {userId,emailId,fullname,follower,following,profilePic};
    
    res.status(200).json({success:true,message:"profile found",data:data});
})
router.post("/",async(req,res)=>{
    const {bio,gender} = req.body;
    const user = req.user;
    
})

module.exports= router;