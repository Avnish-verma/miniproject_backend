const mongoose= require("mongoose");

const newUser=mongoose.Schema({
    fullname:{
        type:String,
        required:true
    },
    userId:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    emailId:{
        type:String,
        required:true
    },
    otp:Number,
    isEmailVerified:{
        type:Boolean,
        default:false
    }
})
const userModel=mongoose.model("users",newUser);
module.exports=userModel;