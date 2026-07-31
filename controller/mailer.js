const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASS
    }

})
const sendOtp=async (userName,userEmail,otp)=>{
    try{
        const mailOptions={
            form:"instagram",
            to:userEmail,
            subject:"otp verification code",
            html:`
            <div style="font-family: Arial,sans-serif;padding:20px; border: 1px solid #eee;">
            <h2> Hi ${userName}</h2>
            <p> please use the following one time password to complete your registration this otp is valid for 5 minutes <h1> ${otp}</h1> if you did not request this code please ignore this email.</p>
            </div>
            `
        }
        await transporter.sendMail(mailOptions);
    }
    catch(err){
    return err;
    }
}
module.exports=sendOtp;