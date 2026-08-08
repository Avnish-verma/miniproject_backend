const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure:false,
    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASS
    }

})
const sendMail=async (userName,userEmail,subject,message)=>{
    try{
        const mailOptions={
            form:"instagram",
            to:userEmail,
            subject:`${subject}`,
            html:`
            <div style="font-family: Arial,sans-serif;padding:20px; border: 1px solid #eee;">
            <h2> Hi ${userName}</h2>
            <p>${message} </p>
            </div>
            `
        }
        await transporter.sendMail(mailOptions);
    }
    catch(err){
        console.error("Nodemailer Error Details:", err);
    return err;
    }
}
module.exports=sendMail;
