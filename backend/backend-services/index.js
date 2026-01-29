
// index.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const xml2js = require('xml2js'); 
const cheerio = require('cheerio'); 
const mongoose = require('mongoose');
const Tesseract = require('tesseract.js');
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
app.post('/notifications', async (req, res) => {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required." });
    }
    
    try {
        const earthquakeAlerts = await getEarthquakeAlerts(latitude, longitude, 500);
        const coastalAlerts = await getWeatherAPIAlerts(latitude, longitude);
        const fishingAlerts = await getIndianFishingAlerts(latitude, longitude);
        res.json({
            status: (earthquakeAlerts.length > 0 || coastalAlerts.length > 0 || fishingAlerts.length > 0) ? "Active Threats Detected" : "No significant threats detected",
            threats: { earthquakes: earthquakeAlerts, weatherAlerts: coastalAlerts, fishingAlerts: fishingAlerts }
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


async function getIndianFishingAlerts() {
    const alerts = [];

    try {
        // ================= 1️⃣ PHP SEA BULLETINS =================
        const seaAreas = [
            { name: "Arabian Sea", url: "https://mausam.imd.gov.in/Forecast/seaarea_bulletin_new.php?id=4" },
            { name: "Bay of Bengal", url: "https://mausam.imd.gov.in/Forecast/seaarea_bulletin_new.php?id=1" }
        ];

        for (const area of seaAreas) {
            const page = await axios.get(area.url).catch(() => null);
            if (!page?.data) continue;

            const $ = cheerio.load(page.data);
            const rawText = $("body").text().replace(/\s+/g, " ").trim();

            const cleaned = await aiCleanText(rawText, "IMD Sea Bulletin");

            alerts.push({
                source: "IMD India",
                type: "Sea Bulletin Cleaned",
                region: area.name,
                link: area.url,
                cleaned_text: cleaned,
                date: new Date().toISOString()
            });
        }

        // ================= 2️⃣ TWO MAP URLS =================
        const mapUrls = [
            "https://rsmcnewdelhi.imd.gov.in/uploads/archive/65/65_9f1a32_probability.png", // new map
            "https://rsmcnewdelhi.imd.gov.in/uploads/archive/51/51_dfbda3_graphics.png" // your old map
        ];

        for (const mapUrl of mapUrls) {
            try {
                const imageResponse = await axios.get(mapUrl, { responseType: "arraybuffer" });
                const imageBuffer = Buffer.from(imageResponse.data);

                const ocrResult = await Tesseract.recognize(imageBuffer, "eng");
                const rawOCR = ocrResult.data.text.trim();
                console.log("Raw OCR Text:", rawOCR);

                const cleanedOCR = await aiCleanText(rawOCR, "IMD Weather Map");

                alerts.push({
                    source: "IMD India",
                    type: "IMD Map OCR Cleaned",
                    image: mapUrl,
                    confidence: ocrResult.data.confidence,
                    cleaned_text: cleanedOCR,
                    date: new Date().toISOString()
                });

            } catch (err) {
                console.error("OCR failed:", mapUrl, err.message);
            }
        }

        return alerts;
    } 
    catch (err) {
        console.error("IMD Pipeline Error:", err.message);
        return [];
    }
}

async function aiCleanText(rawText, context) {
    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;

        const prompt = `
You are cleaning official IMD weather alerts.
Extract ONLY meaningful warning text.
Remove junk, repeated words, UI text, HTML artifacts.
For  marked areas tell the location as well as it is important for them to know. For portions that are not warnings, discard them.

Context: ${context}

Text:
${rawText}

Return clean fisherman-friendly warning text.
`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;

        const res = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || rawText;

    } catch {
        return rawText;
    }
}