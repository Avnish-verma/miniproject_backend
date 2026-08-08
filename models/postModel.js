const mongoose= require("mongoose");
const newPost= mongoose.Schema({

});
const postModel=mongoose.model("posts",newPost);
module.exports=postModel;
