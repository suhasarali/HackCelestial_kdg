// routes/catchRoutes.js

const express = require('express');
const router = express.Router();
const { getCatchSummary, getWeeklyCatches,  getSpeciesDistribution  } = require('../controller/catchController');

// GET /api/catches/summary/:userId - Fetches the summary for a specific user
router.get('/summary/:userId', getCatchSummary);

// GET /api/catches/weekly/:userId - Gets the weekly graph data for a specific user
router.get('/weekly/:userId', getWeeklyCatches);

// --- NEW ROUTE FOR PIE CHART DATA ---
router.get('/species/:userId', getSpeciesDistribution);

module.exports = router;