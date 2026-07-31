const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const sendMail = require("../controller/mailer");
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
});
router.post("/forgotpassword",async(req,res)=>{
    const {userId}=req.body;
    console.log(userId);
    const user = await userModel.findOne({userId});
    const token = jwt.sign({userId:user.userId,name:user.fullname},process.env.SECRET_FOR_FORGOT,{expiresIn:"10min"});
    sendMail(user.fullname,user.emailId,"to forgot password",`to forgot password <br><a  href="${process.env.API_BASE_URL}/login/forgotpassword/${token}">click here</a>`);
    res.status(200).json({success:true,message:"check you email inbox"});
})
router.get("/forgotpassword/:token",(req,res)=>{
    const verify = jwt.verify(req.params.token,process.env.SECRET_FOR_FORGOT);
    if(!verify){return res.json({success:"false",message:"invalid url"})};
    const user= userModel.findOne({userId:verify.userId}); 
    res.status(200).json({success:true,message:"verified"})
});
router.post("/forgotpassword/:token",async(req,res)=>{
    const verify = jwt.verify(req.params.token,process.env.SECRET_FOR_FORGOT);
    if(!verify){return res.json({success:"false",message:"invalid"})};
    const user= await userModel.findOne({userId:verify.userId}); 
    user.password=await bcrypt.hash(req.body.password,10);
    await  user.save();
    res.status(200).json({success:true,message:"password changed"})
})
module.exports=router; 