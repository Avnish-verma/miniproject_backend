const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel")
let token;
const protect = async(req,res,next)=>{
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.replace("Bearer","").trim();
    }
    if(!token){
        return res.status(400).json({success:false,message:"login now"});
    }
    console.log(token);
    const verify = jwt.verify(token,process.env.SECRET);
    const {userId,fullname} = verify;
    req.user= userModel.findOne({userId});
    next();

}
module.exports = protect;