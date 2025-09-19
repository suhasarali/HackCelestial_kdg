// routes/profile.route.js
import express from "express";
import { getProfile, updateProfile } from "../controller/profile.controller.js";
import { protect } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/profile", protect, getProfile);    // fetch profile
router.put("/profile-update", protect, updateProfile); // update profile

export default router;

