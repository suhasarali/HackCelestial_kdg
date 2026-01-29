
// index.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// --- Import your database-related routes ---
const catchRoutes = require("./router/catchRoutes.js");

// === API KEYS & SERVER CONFIG ===
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

// === API Endpoints ===
const USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
const WEATHERAPI_URL = "http://api.weatherapi.com/v1/forecast.json";

// === Express Web Server Setup ===
const app = express();
app.use(cors());
app.use(express.json());

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB.'))
    .catch(err => console.error('❌ MongoDB connection error:', err));


// --- API ROUTES ---
// Use the catch routes for any request starting with /api/catches
app.use("/api/catches", catchRoutes);

// The alert notification route
app.get('/notifications', async (req, res) => {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required." });
    }
    
    try {
        const earthquakeAlerts = await getEarthquakeAlerts(latitude, longitude, 500);
        const coastalAlerts = await getWeatherAPIAlerts(latitude, longitude);
        res.json({
            status: (earthquakeAlerts.length > 0 || coastalAlerts.length > 0) ? "Active Threats Detected" : "No significant threats detected",
            threats: { earthquakes: earthquakeAlerts, weatherAlerts: coastalAlerts }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch threat data." });
    }
});

// A simple root endpoint to confirm the server is running
app.get('/', (req, res) => {
    res.send("🌊 Main Backend is running.");
});

// === Start the Web Server ===
app.listen(PORT, HOST, () => {
    console.log(`✅ Web server is running and listening on http://${HOST}:${PORT}`);
});


// --- Helper Functions for Threat Detection ---
async function getEarthquakeAlerts(latitude, longitude, radiusKm) {
    const params = { "format": "geojson", "latitude": latitude, "longitude": longitude, "maxradiuskm": radiusKm, "orderby": "magnitude", "limit": 5 };
    try {
        const response = await axios.get(USGS_API_URL, { params });
        const alerts = [];
        if (response.data.features) {
            for (const feature of response.data.features) {
                const p = feature.properties;
                alerts.push({ magnitude: p.mag, place: p.place, time: new Date(p.time).toISOString().replace('T', ' ').substring(0, 19), type: "Earthquake", url: p.url });
            }
        }
        return alerts;
    } catch (error) { 
        console.error("Error fetching earthquake data:", error.message);
        return []; 
    }
}

async function getWeatherAPIAlerts(latitude, longitude) {
    const params = { "key": WEATHERAPI_KEY, "q": `${latitude},${longitude}`, "alerts": "yes" };
    try {
        const response = await axios.get(WEATHERAPI_URL, { params });
        const alerts = [];
        if (response.data.alerts && response.data.alerts.alert) {
            for (const alert of response.data.alerts.alert) {
                alerts.push({ headline: alert.headline, msg_type: alert.msgtype, severity: alert.severity, area: alert.areaDesc, description: alert.desc, type: "Weather Threat" });
            }
        }
        return alerts;
    } catch (error) { 
        console.error("Error fetching weather data:", error.message);
        return []; 
    }
}