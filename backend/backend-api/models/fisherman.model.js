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
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    experience: {
      type: Number, // years of fishing
      default: 0,
    },
    boatLicenseId: {
      type: String,
      default: null,
    },
    port: {
      type: String, // region fisherman belongs to
      default: null,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Fisherman = mongoose.model("Fisherman", fishermanSchema);

export default Fisherman;
