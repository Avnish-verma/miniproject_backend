const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


router.post("/",async(req,res)=>{
    const {userId,password}=req.body;
    const user = await userModel.findOne({userId});
    const comp=bcrypt.compare(password,user.password);
    
    if(!comp){return res.status(400).json({success:false,message:"userId or password is invailid"})};
    if(!user.isEmailVerfied){return res.status(400).json({success:"true",message:"verify your email"})};
    const token = jwt.sign({userId,name:user.fullname},process.env.SECRET,{expiresIn:"24hr"});
    res.status(201).cookie("token",token).json({message:"logged in successfully"});
console.log(token);
})
module.exports=router;