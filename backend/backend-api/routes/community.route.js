import express from "express";
import {
  createObservation,
  getObservations,
  deleteObservation,
} from "../controller/community.controller.js";
import protectRoute  from "../middleware/protectRoute.js";

const router = express.Router();

// Public read
router.get("/", getObservations);

// Protected create / update / delete / comment
router.post("/", protectRoute , createObservation);
router.delete("/:id",protectRoute, deleteObservation);

export default router;