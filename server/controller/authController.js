const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ─── EMAIL TRANSPORTER SETUP ───
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Strict Password Validation: Min 8 chars, 1 number, 1 special char
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

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 mins

    if (!user) {
      user = new User({ name, email, password: hashedPassword, otp, otpExpires });
    } else {
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpires = otpExpires;
    }
    await user.save();

    // Send the Email
    await transporter.sendMail({
      from: `"BuddyMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your BuddyMate Verification Code",
      html: `<h2>Welcome to BuddyMate! 🏠</h2>
             <p>Hi ${name}, your verification code is:</p>
             <h1 style="color: #FF3CAC; letter-spacing: 5px;">${otp}</h1>
             <p>This code expires in 10 minutes.</p>`
    });

    res.status(200).json({ message: "OTP sent to your email!" });
} catch (err) {
    console.log("SIGNUP ERROR: ", err); // <-- ADD THIS LINE
    res.status(500).json({ error: "Server error or Invalid Email credentials" });
  }
};

// 2. VERIFY OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found." });
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // STRICT FLOW: Do NOT generate token here. Force them to log in.
    res.status(200).json({ message: "Account verified successfully! Please log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.isVerified) return res.status(400).json({ error: "Invalid credentials or unverified account." });

    // Compare submitted password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });

    // Generate JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, branch: user.branch } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { signup, verifyOtp, login };