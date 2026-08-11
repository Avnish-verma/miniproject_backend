const express = require("express");
const router = express.Router();
const postModel = require("../models/postModel");
const upload = require("../controller/upload");
const commentModel = require("../models/commentModel"); 
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
router.post("/like/:postId",async(req,res)=>{
    const {postId} = req.params;
    const post = await postModel.findById(postId);
    const isLiked =await post.likes.includes(req.user._id);
    if(isLiked){
        post.likes.pull(req.user._id);
    } else {
        post.likes.push(req.user._id);
    }
    await post.save();
    res.status(200).json({success:true,message:"Post liked",data:post});
}); 
router.post("/comment/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;

        if (!text || text.trim() === "") {
            return res.status(400).json({ success: false, message: "Comment text cannot be empty" });
        }
        console.log("Comment Text:", text);
        const post = await postModel.findById(postId);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const newComment = new commentModel({
            postId,
            commentedBy: req.user._id,
            text
        });
        console.log("New Comment Object:", newComment);
        await newComment.save();
        res.status(201).json({ success: true, message: "Comment added successfully", data: newComment });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});

router.get("/comments/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await commentModel.find({ postId }).populate("commentedBy", "userId fullname profilePic").sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: comments });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});
module.exports= router;