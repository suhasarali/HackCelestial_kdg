import fisherman from "../models/fisherman.model.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import otpGenerator from 'otp-generator';
import transporter from '../config/nodemailer.js';


export async function signup(req, res) {
  try {
    const { 
      name, 
      email, 
      password, 
      experienceYears,   // how long he has been a fisherman
      boatLicenseId,     // boat license number/id
      port,              // region/port he belongs to
    } = req.body;

    // --- Validation ---
    if (!name || !email || !password || !experienceYears || !boatLicenseId || !port) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password should be at least 6 characters" 
      });
    }

    // --- Hash password ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Create User ---
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      experienceYears,
      boatLicenseId,
      port,
    });

    await newUser.save();

    // --- Generate Token ---
    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        email: newUser.email,
        experienceYears: newUser.experienceYears,
        boatLicenseId: newUser.boatLicenseId,
        port: newUser.port,
      },
    });

  } catch (error) {
    console.log("Error in signup:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token, // 🔑 send token to frontend
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.log("Error in login:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function logout(req, res) {
  try {
    // No cookie to clear anymore
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const forgotPassword = async (req, res) => {
  try {
   const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate a 4-digit OTP using otp-generator
    const otp = otpGenerator.generate(4, { digits: true, alphabets: false, specialChars: false });

    // Set OTP expiration time (5 minutes)
    const otpExpires = Date.now() + 300000; // 5 minutes in milliseconds

    // Save OTP and its expiration time to the user's document in DB
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'OTP for Password Reset',
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong>. This OTP is valid for 5 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP sent to email' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }}

export const verifyOtp = async (req, res) => {
  try {
     const { email, otp } = req.body;

    // Check if OTP and email are provided
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if OTP is correct and has not expired
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // OTP is valid, proceed to password reset screen
    res.json({ message: 'OTP verified successfully, proceed to reset password' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    


    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP is valid
    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    

    // Clear reset token
    user.otp = null;
    user.otpExpires = null;
    

    await user.save();

    res.status(200).json({ message: "Password reset successfully" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal Server Error" , error:error.message });
  }
}