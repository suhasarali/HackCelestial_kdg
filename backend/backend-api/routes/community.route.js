import express from "express";
import {
  createObservation,
  getObservations,
  getObservation,
  updateObservation,
  deleteObservation,
  addComment,
} from "../controller/community.controller.js";
import protectRoute  from "../middleware/protectRoute.js";

const router = express.Router();

// Public read
router.get("/", getObservations);
router.get("/:id", getObservation);

// Protected create / update / delete / comment
router.post("/", protectRoute, createObservation);
router.put("/:id", protectRoute, updateObservation);
router.delete("/:id", protectRoute, deleteObservation);
router.post("/:id/comments", protectRoute, addComment);

export default router;