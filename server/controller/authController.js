const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend'); // Replaces nodemailer

const resend = new Resend(process.env.RESEND_API_KEY);

const isStrongPassword = (pw) => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(pw);

// 1. SIGNUP & SEND OTP
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: "Password must be min 8 chars, contain 1 number and 1 special character." });
    }

    let user = await User.findOne({ email });
    if (user && user.isVerified) return res.status(400).json({ error: "User already exists." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; 

    if (!user) {
      user = new User({ name, email, password: hashedPassword, otp, otpExpires });
    } else {
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpires = otpExpires;
    }
    await user.save();

    // Send the Email using Resend HTTP API
    await resend.emails.send({
      from: 'BuddyMate <onboarding@resend.dev>',
      to: email, 
      subject: "Your BuddyMate Verification Code",
      html: `<h2>Welcome to BuddyMate! 🏠</h2>
             <p>Hi ${name}, your verification code is:</p>
             <h1 style="color: #FF3CAC; letter-spacing: 5px;">${otp}</h1>
             <p>This code expires in 10 minutes.</p>`
    });

    res.status(200).json({ message: "OTP sent to your email!" });
  } catch (err) {
    console.log("SIGNUP ERROR: ", err); 
    res.status(500).json({ error: "Server error or Invalid Email credentials" });
  }
};