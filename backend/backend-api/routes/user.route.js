// routes/profile.route.js
import express from "express";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);    // fetch profile
router.put("/profile-update", protect, updateProfile); // update profile

export default router;

