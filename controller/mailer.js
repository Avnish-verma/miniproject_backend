const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,             // Port 465 hata kar 587 (STARTTLS) use karein
    secure: false,         // Port 587 ke liye secure 'false' hona zaroori hai
    requireTLS: true,      // Secure false hai, par hum connection ko strongly TLS par upgrade karne ko bol rahe hain
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    },
    family: 4,             // IPv6 error se bachne ke liye
    connectionTimeout: 20000, // Render thoda slow hai, isliye hum time 20 seconds de rahe hain
    greetingTimeout: 20000,   // Server ke response ka wait time badha diya
    tls: {
        rejectUnauthorized: false
    }
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
        console.log("Mail bhejne ki koshish kar raha hai (Port 587)...");
        await transporter.sendMail(mailOptions);
        console.log("Mail successfully send ho gaya!");
    } catch(err) {
        console.error("Nodemailer Error Details:", err);
        return err;
    }
};

module.exports = sendMail;
