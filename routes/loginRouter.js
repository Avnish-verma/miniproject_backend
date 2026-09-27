const express = require('express');
const router = express.Router();
const authService = require('../src/services/authService');

router.post('/', async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'userId or password is empty' });
    }

<<<<<<< HEAD
    const result = await authService.login({
      userId,
      password,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
    });

    res
      .status(200)
      .cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      .json({
        message: 'Logged in successfully',
        token: result.accessToken,
        accessToken: result.accessToken,
        user: result.user,
      });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
=======
router.post("/",async(req,res)=>{
    const {userId,password}=req.body;
    if(userId=="" || password==""){return res.status(400).json({success:false,message:"userId or password is empty"})};
    const user = await userModel.findOne({userId});
    const comp=bcrypt.compare(password,user.password);
    console.log(user);
    if(!comp){return res.status(400).json({success:false,message:"userId or password is invailid"})};
    if(!user.isEmailVerified){return res.status(400).json({success:"true",message:"verify your email"})};
    const token = jwt.sign({userId,name:user.fullname},process.env.SECRET,{expiresIn:"24hr"});
    res.status(201).cookie("token",token).json({success:true,message:"logged in successfully"});
console.log(token);
>>>>>>> 96bde56ea8e6df196f58cf219f212aed9b3b92a1
});

router.post('/forgotpassword', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const result = await authService.forgotPassword(userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
});
<<<<<<< HEAD

router.get('/forgotpassword/:token', (req, res) => {
  // Return simple verification confirmation for token validity check
  res.status(200).json({ success: true, message: 'Reset token active' });
});

router.post('/forgotpassword/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    const result = await authService.resetPassword(token, password);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
=======
router.post("/forgotpassword/:token",async(req,res)=>{
    const verify = jwt.verify(req.params.token,process.env.SECRET_FOR_FORGOT);
    if(!verify){return res.json({success:"false",message:"invalid"})};
    const user= await userModel.findOne({userId:verify.userId}); 
    user.password=await bcrypt.hash(req.body.password,10);
    await  user.save();
    res.status(200).json({success:true,message:"password changed"})
})
module.exports=router; 
>>>>>>> 96bde56ea8e6df196f58cf219f212aed9b3b92a1
