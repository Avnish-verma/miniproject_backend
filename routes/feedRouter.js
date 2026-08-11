const express = require("express");
const router = express.Router();
const postModel  = require("../models/postModel");

router.get("/",async(req,res)=>{
    const page = parseInt(req.query.page)||1;
    const limit = parseInt(req.query.limit)||10;
    const skip = (page-1)*limit;
    const post = await postModel.find().sort({createdAt:-1}).skip(skip).limit(limit).populate("postedBy").lean();
    res.json({post});
})
module.exports= router;