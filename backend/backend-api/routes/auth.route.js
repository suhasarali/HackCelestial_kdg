import express from "express";
import { login, logout, signup , checkAuth, verifyOtp , forgotPassword , resetPassword} from "../controller/auth.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/logout", logout);
router.get("/authUser" ,protectRoute,  checkAuth);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;