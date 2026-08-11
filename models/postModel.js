const mongoose= require("mongoose");
const newPost= new mongoose.Schema({
    postedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    caption:String,
    postUrl:String,
    public_id:String,
    description:String,
    likes:[{type:mongoose.Schema.Types.ObjectId,ref:"User",default:[]}],
   },{timestamps:true});
const postModel=mongoose.model("Post",newPost);
module.exports=postModel;
