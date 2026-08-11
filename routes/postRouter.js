const express = require("express");
const router = express.Router();
const postModel = require("../models/postModel");
const upload = require("../controller/upload");

router.get("/upload-post",upload("posts","post"),async(req,res)=>{
    res.status(200).json({success:true,message:"upload info",data:req.uploadInfo});
});
router.post("/create-post",async(req,res)=>{
    const {caption,postUrl,public_id,description} = req.body;
    const newPost = new postModel({
        postedBy:req.user._id,
        caption,
        postUrl,
        public_id,
        description
    });
    console.log(newPost);
    await newPost.save();
    res.status(201).json({success:true,message:"Post created",data:newPost});
})
module.exports= router;