// routes/catchRoutes.js

const express = require('express');
const router = express.Router();
const { getAllCatches, getWeeklyCatches } = require('../controllers/catchController');

// GET /api/catches/summary/:userId - Fetches the summary for a specific user
router.get('/summary/:userId', getAllCatches);

// GET /api/catches/weekly/:userId - Gets the weekly graph data for a specific user
router.get('/weekly/:userId', getWeeklyCatches);

module.exports = router;