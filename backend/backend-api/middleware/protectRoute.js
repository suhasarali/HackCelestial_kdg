import jwt from "jsonwebtoken";
import User from "../models/fisherman.model.js";
import dotenv from "dotenv";
// dotenv.config();

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    console.log("🔐 Incoming auth header:", req.headers['authorization']);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized - No token" });
    }
                                                                                                                                                                                                                                                                                                           
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute:", error.message);
    return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
  }
};

export default protectRoute;