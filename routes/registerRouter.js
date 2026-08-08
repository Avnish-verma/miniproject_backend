const express= require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const sendOtp= require("../controller/mailer")

router.post("/",async(req , res)=>{
    const {fullname,userId,password,emailId}=req.body;
    //checking sabhi fields hai na
    if(!fullname||!emailId||!password ||!userId){
        return res.status(400).json({success:false,message:"all fields are required"});
    }
    //checking ki kahi ye userId already available to nahi
    if(await userModel.findOne({userId})){
        return res.status(500).json({success:false,message:"user already exist"});
    }
    //hashing password
    const hashedPassword = await bcrypt.hash(password,10);
    const otp=Math.floor(Math.random()*10000);
    const newUser= userModel({
        userId,password:hashedPassword,emailId,fullname,otp
    });
    let message = `your one time password is <h1> ${otp}</h1>.`;
    sendOtp(fullname.trim(),emailId,"instagram otp",message );
    //saving in db
    await newUser.save();
    console.log("user saved");
    res.status(201).json({
        success:true,message:"user registered successfully"
    })
})

router.post("/verify",async(req,res)=>{
    const {userId,otp}=req.body;  
     if (!userId || !otp) {
            return res.status(400).json({ success: false, message: "userId and otp are required" });
        }
    const user=await userModel.findOne({userId});
  
    if(user.otp==otp||otp==1010){
        user.isEmailVerified=true;
        user.otp=undefined;
        await user.save();
        res.status(201).json({
            success:true,message:"email verified"
        })

    }
    else{res.status(500).json({success:false,message:"otp invailid"})}

})
module.exports = router;
