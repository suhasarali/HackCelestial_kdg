
// // index.js

// const express = require('express');
// const cors = require('cors');
// const axios = require('axios');
// const xml2js = require('xml2js'); 
// const cheerio = require('cheerio'); 
// const mongoose = require('mongoose');
// const Tesseract = require('tesseract.js');
// require('dotenv').config();

// // --- Import your database-related routes ---
// const catchRoutes = require("./router/catchRoutes.js");

// // === API KEYS & SERVER CONFIG ===
// const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;
// const PORT = process.env.PORT || 10000;
// const HOST = '0.0.0.0';

// // === API Endpoints ===
// const USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
// const WEATHERAPI_URL = "http://api.weatherapi.com/v1/forecast.json";

// // === Express Web Server Setup ===
// const app = express();
// app.use(cors());
// app.use(express.json());

// // --- Connect to MongoDB ---
// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log('✅ Successfully connected to MongoDB.'))
//     .catch(err => console.error('❌ MongoDB connection error:', err));


// // --- API ROUTES ---
// // Use the catch routes for any request starting with /api/catches
// app.use("/api/catches", catchRoutes);

// // The alert notification route
// app.post('/notifications', async (req, res) => {
//     const { latitude, longitude } = req.body;
//     if (!latitude || !longitude) {
//         return res.status(400).json({ error: "Latitude and longitude are required." });
//     }
    
//     try {
//         const earthquakeAlerts = await getEarthquakeAlerts(latitude, longitude, 500);
//         const coastalAlerts = await getWeatherAPIAlerts(latitude, longitude);
//         const fishingAlerts = await getIndianFishingAlerts(latitude, longitude);
//         res.json({
//             status: (earthquakeAlerts.length > 0 || coastalAlerts.length > 0 || fishingAlerts.length > 0) ? "Active Threats Detected" : "No significant threats detected",
//             threats: { earthquakes: earthquakeAlerts, weatherAlerts: coastalAlerts, fishingAlerts: fishingAlerts }
//         });
//     } catch (error) {
//         res.status(500).json({ error: "Failed to fetch threat data." });
//     }
// });

// // A simple root endpoint to confirm the server is running
// app.get('/', (req, res) => {
//     res.send("🌊 Main Backend is running.");
// });

// // === Start the Web Server ===
// app.listen(PORT, HOST, () => {
//     console.log(`✅ Web server is running and listening on http://${HOST}:${PORT}`);
// });


// // --- Helper Functions for Threat Detection ---
// async function getEarthquakeAlerts(latitude, longitude, radiusKm) {
//     const params = { "format": "geojson", "latitude": latitude, "longitude": longitude, "maxradiuskm": radiusKm, "orderby": "magnitude", "limit": 5 };
//     try {
//         const response = await axios.get(USGS_API_URL, { params });
//         const alerts = [];
//         if (response.data.features) {
//             for (const feature of response.data.features) {
//                 const p = feature.properties;
//                 alerts.push({ magnitude: p.mag, place: p.place, time: new Date(p.time).toISOString().replace('T', ' ').substring(0, 19), type: "Earthquake", url: p.url });
//             }
//         }
//         return alerts;
//     } catch (error) { 
//         console.error("Error fetching earthquake data:", error.message);
//         return []; 
//     }
// }

// async function getWeatherAPIAlerts(latitude, longitude) {
//     const params = { "key": WEATHERAPI_KEY, "q": `${latitude},${longitude}`, "alerts": "yes" };
//     try {
//         const response = await axios.get(WEATHERAPI_URL, { params });
//         const alerts = [];
//         if (response.data.alerts && response.data.alerts.alert) {
//             for (const alert of response.data.alerts.alert) {
//                 alerts.push({ headline: alert.headline, msg_type: alert.msgtype, severity: alert.severity, area: alert.areaDesc, description: alert.desc, type: "Weather Threat" });
//             }
//         }
//         return alerts;
//     } catch (error) { 
//         console.error("Error fetching weather data:", error.message);
//         return []; 
//     }
// }


// async function getIndianFishingAlerts() {
//     let allStructuredAlerts = [];

//     try {
//         // 1. Process Sea Bulletins
//         const seaAreas = [
//             { name: "Arabian Sea", url: "https://mausam.imd.gov.in/Forecast/seaarea_bulletin_new.php?id=4" },
//             { name: "Bay of Bengal", url: "https://mausam.imd.gov.in/Forecast/seaarea_bulletin_new.php?id=1" }
//         ];

//         for (const area of seaAreas) {
//             const page = await axios.get(area.url).catch(() => null);
//             if (!page?.data) continue;

//             const $ = cheerio.load(page.data);
//             const rawText = $("body").text().replace(/\s+/g, " ").trim();

//             const structuredData = await aiStructureData(rawText, `IMD Bulletin for ${area.name}`);
            
//             // Map the structured data into our global list
//             structuredData.forEach(item => {
//                 allStructuredAlerts.push({
//                     ...item,
//                     source: "IMD Bulletin",
//                     region: area.name,
//                     date: new Date().toISOString()
//                 });
//             });
//         }

//         // 2. Process Map OCR
//         const mapUrl = "https://rsmcnewdelhi.imd.gov.in/uploads/archive/65/65_9f1a32_probability.png";
//         const imageResponse = await axios.get(mapUrl, { responseType: "arraybuffer" });
//         const ocrResult = await Tesseract.recognize(Buffer.from(imageResponse.data), "eng");
        
//         const mapData = await aiStructureData(ocrResult.data.text, "IMD Probability Map OCR");
        
//         mapData.forEach(item => {
//             allStructuredAlerts.push({
//                 ...item,
//                 source: "IMD Map OCR",
//                 image: mapUrl,
//                 date: new Date().toISOString()
//             });
//         });

//         return allStructuredAlerts;
//     } catch (err) {
//         console.error("Pipeline Error:", err.message);
//         return [];
//     }
// }

// async function aiStructureData(rawText, context) {
//   try {
//     const geminiApiKey = process.env.GEMINI_API_KEY;
//     const prompt = `
//       You are an expert maritime weather analyst for the India Meteorological Department (IMD).
//       Task: Convert the following unstructured weather text/OCR into a structured JSON array for fishermen.

//       Context: ${context}
//       Text: ${rawText}

//       Rules:
//       1. Extract every specific location mentioned (e.g., "Gulf of Mannar", "North Gujarat Coast", "Thane").
//       2. For each location, identify:
//          - "location": Name of the area.
//          - "intensity": Wind speed (e.g., "45-55 kmph") or weather severity.
//          - "status": "Safe", "Warning", or "Danger" based on the advisory.
//          - "meaning": A 1-sentence simple explanation in layman's terms.
//       3. If no specific warning is found for a region, do not invent one.
//       4. RETURN ONLY VALID JSON. No markdown, no backticks, no preamble.

//       JSON Format Example:
//       [
//         {"location": "Gulf of Mannar", "intensity": "45-55 kmph", "status": "Danger", "meaning": "Very strong winds; stay away from the sea."},
//         {"location": "Maharashtra Coast", "intensity": "Normal", "status": "Safe", "meaning": "Weather is clear; safe for fishing."}
//       ]
//     `;

//     const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;

//     const res = await axios.post(geminiUrl, {
//       contents: [{ parts: [{ text: prompt }] }]
//     });

//     // Clean any potential markdown formatting if Gemini adds it
//     let jsonString = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
//     jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    
//     return JSON.parse(jsonString);

//   } catch (error) {
//     console.error(`❌ [AI FAILED] Time: ${Date.now() - startTime}ms`);
    
//     if (error.response) {
//         // THIS IS THE KEY PART FOR VERIFICATION
//         console.error("👉 STATUS CODE:", error.response.status); 
//         console.error("👉 ERROR MESSAGE:", JSON.stringify(error.response.data, null, 2));
//     } else {
//         console.error("👉 ERROR:", error.message);
//     }
//     return [];
//   }
// }







// index.js - PRODUCTION READY VERSION

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio'); 
const mongoose = require('mongoose');
const Tesseract = require('tesseract.js');
require('dotenv').config();

// --- Import your database-related routes ---
// Ensure this file actually exists!
const catchRoutes = require("./router/catchRoutes.js");

// === API KEYS & SERVER CONFIG ===
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

// === Global Cache Variables ===
let cachedFishingAlerts = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

// === API Endpoints ===
const USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
const WEATHERAPI_URL = "http://api.weatherapi.com/v1/forecast.json";

// === Express Setup ===
const app = express();
app.use(cors());
app.use(express.json());

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB.'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.use("/api/catches", catchRoutes);

// --- NOTIFICATION ROUTE ---
app.post('/notifications', async (req, res) => {
    // 1. Debug Input
    console.log("🔔 Notification Route Hit!");
    
    const { latitude, longitude } = req.body;
    // Default coords if missing
    const lat = latitude || 19.0760; 
    const lon = longitude || 72.8777;
    console.log(`📍 Coordinates: ${lat}, ${lon}`);

    try {
        console.log("🚀 Starting parallel threat checks...");

        // 2. Run Checks
        const [earthquakeAlerts, coastalAlerts, fishingAlerts] = await Promise.all([
            getEarthquakeAlerts(lat, lon, 500),
            getWeatherAPIAlerts(lat, lon),
            getIndianFishingAlerts() 
        ]);

        console.log("✅ Threat checks complete.");

        const hasThreats = (earthquakeAlerts.length > 0 || coastalAlerts.length > 0 || fishingAlerts.length > 0);

        res.json({
            status: hasThreats ? "Active Threats Detected" : "No significant threats detected",
            threats: { 
                earthquakes: earthquakeAlerts, 
                weatherAlerts: coastalAlerts, 
                fishingAlerts: fishingAlerts 
            }
        });
    } catch (error) {
        // 3. Catch & Log ACTUAL Error
        console.error("❌ CRITICAL ERROR in /notifications:");
        console.error(error); // This prints the full error stack
        res.status(500).json({ error: "Failed to fetch threat data.", details: error.message });
    }
});

app.get('/', (req, res) => res.send("🌊 Main Backend is running."));

app.listen(PORT, HOST, () => {
    console.log(`✅ Web server is running on http://${HOST}:${PORT}`);
});


// --- HELPER FUNCTIONS ---

async function getEarthquakeAlerts(latitude, longitude, radiusKm) {
    try {
        const params = { "format": "geojson", "latitude": latitude, "longitude": longitude, "maxradiuskm": radiusKm, "orderby": "magnitude", "limit": 5 };
        const response = await axios.get(USGS_API_URL, { params });
        return response.data.features ? response.data.features.map(f => ({
            magnitude: f.properties.mag,
            place: f.properties.place,
            time: new Date(f.properties.time).toISOString(),
            type: "Earthquake"
        })) : [];
    } catch (error) { 
        console.error("⚠️ Earthquake API Error:", error.message);
        return []; 
    }
}

async function getWeatherAPIAlerts(latitude, longitude) {
    if (!WEATHERAPI_KEY) {
        console.warn("⚠️ WeatherAPI Key missing in .env");
        return [];
    }
    try {
        const response = await axios.get(WEATHERAPI_URL, { params: { "key": WEATHERAPI_KEY, "q": `${latitude},${longitude}`, "alerts": "yes" }});
        return response.data.alerts?.alert?.map(a => ({
            headline: a.headline, severity: a.severity, type: "Weather Threat"
        })) || [];
    } catch (error) { 
        console.error("⚠️ Weather API Error:", error.message);
        return []; 
    }
}

async function getIndianFishingAlerts() {
    const now = Date.now();
    
    // CACHE CHECK
    if (cachedFishingAlerts.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
        console.log("⚡ Serving Fishing Alerts from Cache");
        return cachedFishingAlerts;
    }

    console.log("🔄 Fetching fresh IMD data (This takes 3-5 seconds)...");
    let allStructuredAlerts = [];

    try {
        // Sea Bulletins
        const seaAreas = [
            { name: "Arabian Sea", url: "https://mausam.imd.gov.in/Forecast/seaarea_bulletin_new.php?id=4" },
            { name: "Bay of Bengal", url: "https://mausam.imd.gov.in/Forecast/seaarea_bulletin_new.php?id=1" }
        ];

        for (const area of seaAreas) {
            try {
                const page = await axios.get(area.url).catch(() => null);
                if (page?.data) {
                    const $ = cheerio.load(page.data);
                    const rawText = $("body").text().replace(/\s+/g, " ").trim();
                    
                    await new Promise(r => setTimeout(r, 1500)); // Delay
                    const data = await aiStructureData(rawText, area.name);
                    allStructuredAlerts.push(...data);
                }
            } catch (e) { console.error(`⚠️ Failed to scrape ${area.name}`); }
        }

        // Cache Update
        if (allStructuredAlerts.length > 0) {
            cachedFishingAlerts = allStructuredAlerts;
            lastFetchTime = now;
        }
        return allStructuredAlerts;
    } catch (err) {
        console.error("⚠️ Fishing Pipeline Error:", err.message);
        return [];
    }
}

async function aiStructureData(rawText, context) {
  if (!rawText || rawText.length < 50) return [];
  
  // Keep the safety timer
  const startTime = Date.now(); 

  try {
    console.log(`🤖 AI Processing: ${context}`);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    // --- RESTORED DETAILED PROMPT ---
    const prompt = `
      You are an expert maritime weather analyst for the India Meteorological Department (IMD).
      Task: Convert the following unstructured weather text into a structured JSON array for fishermen.

      Context: ${context}
      Text: ${rawText}

      Rules:
      1. Extract EVERY specific location mentioned (e.g., "Gulf of Mannar", "North Gujarat Coast", "South West Arabian Sea", "Somalia Coast", etc.).
      2. For each location, identify:
         - "location": Name of the area.
         - "intensity": Wind speed (e.g., "45-55 kmph", "15-20 knots") or weather severity.
         - "status": "Safe", "Warning", or "Danger" based on the advisory.
         - "meaning": A 1-sentence simple explanation in layman's terms.
      3. If the text says "NIL" or "No Warning", mark status as "Safe".
      4. RETURN ONLY VALID JSON. No markdown, no backticks.

      JSON Format Example:
      [
        {"location": "Gulf of Mannar", "intensity": "45-55 kmph", "status": "Danger", "meaning": "Very strong winds; stay away."},
        {"location": "Maharashtra Coast", "intensity": "Normal", "status": "Safe", "meaning": "Safe for fishing."}
      ]
    `;
    
    const res = await axios.post(geminiUrl, { contents: [{ parts: [{ text: prompt }] }] });

    let jsonString = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(jsonString);

  } catch (error) {
    // Keep the detailed error logging
    console.error(`❌ AI Error (${context}):`, error.response?.data?.error?.message || error.message);
    return []; 
  }
}