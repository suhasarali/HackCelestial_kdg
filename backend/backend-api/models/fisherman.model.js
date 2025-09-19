// models/fisherman.model.js
import mongoose from "mongoose";

const fishermanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    otp: {
      type: String, // store generated OTP
      default: null,
    },
    otpExpires: {
      type: Date, // expiry time for OTP
      default: null,
    },
  },
  { timestamps: true }
);

const Fisherman = mongoose.model("Fisherman", fishermanSchema);

export default Fisherman;
