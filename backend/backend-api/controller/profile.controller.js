// controllers/profile.controller.js
import Fisherman from "../models/fisherman.model.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // assuming middleware sets req.user from JWT

    const fisherman = await Fisherman.findById(userId).select("-password -otp -otpExpires");
    if (!fisherman) {
      return res.status(404).json({ success: false, message: "Fisherman not found" });
      
    }

    res.json({ success: true, profile: fisherman });
  } catch (error) {
    console.error("Get Profile Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, experience, boatLicenseId, port } = req.body;

    const fisherman = await Fisherman.findById(userId);
    if (!fisherman) {
      return res.status(404).json({ success: false, message: "Fisherman not found" });
    }

    // update fields if provided
    if (name) fisherman.name = name;
    if (experience !== undefined) fisherman.experience = experience;
    if (boatLicenseId) fisherman.boatLicenseId = boatLicenseId;
    if (port) fisherman.port = port;

    await fisherman.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: fisherman,
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
