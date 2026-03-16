const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"BuddyMate" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });
    
    console.log(`✉️ Notification sent to ${to}`);
  } catch (error) {
    console.error("Email failed to send:", error);
  }
};

module.exports = sendEmail;