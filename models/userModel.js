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
    bio:String,
    gender:{type:String,enum:['male','female','other']
    },
    otp:Number,
    profilePic:{type:String,default:""},
    follower:{type:mongoose.Schema.Types.ObjectId,ref:"users"},
    following:{type:mongoose.Schema.Types.ObjectId,ref:"users"},
    savedPost:[{type:mongoose.Schema.Types.ObjectId,ref:"posts"}],
    isEmailVerified:{
        type:Boolean,
        default:false
    }},{timestamp:true}
);
const userModel=mongoose.model("users",newUser);
module.exports=userModel;