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
    gender:{type:String,enum:['Male','Female','Other']
    },
    otp:Number,
    profilePic:{url:String,public_id:String},
    follower:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
    following:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
    savedPost:[{type:mongoose.Schema.Types.ObjectId,ref:"posts",default:[]}],
    isEmailVerified:{
        type:Boolean,
        default:false
    }},{timestamp:true}
);
const userModel=mongoose.model("User",newUser);
module.exports=userModel;