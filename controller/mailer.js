const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // host, port aur family hata kar seedha service use karein
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    },
    // Cloudflare/Render TLS handshake issues ko bypass karne ke liye:
    tls: {
        rejectUnauthorized: false 
    },
    family:4
});

const sendMail = async (userName, userEmail, subject, message) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to: userEmail,
            subject: `${subject}`,
            html: `
            <div style="font-family: Arial,sans-serif;padding:20px; border: 1px solid #eee;">
            <h2> Hi ${userName}</h2>
            <p>${message} </p>
            </div>
            `
        };
        
        console.log("Mail bhejne ki koshish kar raha hai..."); 
        await transporter.sendMail(mailOptions);
        console.log("Mail successfully send ho gaya!"); 
        
    } catch(err) {
        console.error("Nodemailer Error Details:", err);
        return err;
    }
};

module.exports = sendMail;
