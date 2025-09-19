// routes/data.route.js
import express from "express";
import { getData } from "../controller/whether.controller.js";

const router = express.Router();

router.get("/", getData);

export default router;