// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import profileRoutes from "./routes/profile.route.js";
import whetherRouter from "./routes/whether.route.js"; 
import observationRoutes from "./routes/community.route.js";

dotenv.config();
// import weatherRoutes from "./routes/weatherRoutes.js";
// import fishRoutes from "./routes/fishRoutes.js";
// import mapRoutes from "./routes/mapRoutes.js";
// import alertRoutes from "./routes/alertRoutes.js";
// import mentorshipRoutes from "./routes/mentorshipRoutes.js";
// import communityRoutes from "./routes/communityRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

app.use("/api/observations", observationRoutes);
app.use("/api/auth", authRouter);
app.use("/api/data", whetherRouter); 
app.use("/api/profile", profileRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("Hackathon Project API is running ");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  connectDB();
});
