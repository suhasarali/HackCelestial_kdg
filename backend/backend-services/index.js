const express = require('express');
const cors = require('cors');
const axios = require('axios');

// === API KEYS ===
// Use environment variables for sensitive data on Render.
// Go to Render dashboard > Your Service > Environment > Add Environment Variable
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;

// === API Endpoints ===
const USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
const WEATHERAPI_URL = "http://api.weatherapi.com/v1/forecast.json";

// === Express Web Server Setup ===
const app = express();
app.use(cors());

// --- Your original threat detection functions (unchanged) ---
async function getEarthquakeAlerts(latitude, longitude, radiusKm) {
    /**
     * Fetches earthquake alerts from the USGS API.
     */
    const params = {
        "format": "geojson",
        "latitude": latitude,
        "longitude": longitude,
        "maxradiuskm": radiusKm,
        "orderby": "magnitude",
        "limit": 5
    };

    try {
        const response = await axios.get(USGS_API_URL, { params });
        const data = response.data;
        const alerts = [];

        if (data.features) {
            for (const feature of data.features) {
                const properties = feature.properties;
                const alertInfo = {
                    magnitude: properties.mag,
                    place: properties.place,
                    time: new Date(properties.time).toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    type: "Earthquake",
                    url: properties.url
                };
                alerts.push(alertInfo);
            }
        }
        return alerts;
    } catch (error) {
        console.error(`❌ Error fetching earthquake data: ${error.message}`);
        return [];
    }
}

async function getWeatherAPIAlerts(latitude, longitude) {
    /**
     * Fetches weather alerts from WeatherAPI.com.
     */
    const params = {
        "key": WEATHERAPI_KEY,
        "q": `${latitude},${longitude}`,
        "alerts": "yes"
    };

    try {
        const response = await axios.get(WEATHERAPI_URL, { params });
        const data = response.data;
        const alerts = [];

        if (data.alerts && data.alerts.alert) {
            for (const alert of data.alerts.alert) {
                const alertInfo = {
                    headline: alert.headline,
                    msg_type: alert.msgtype,
                    severity: alert.severity,
                    area: alert.areaDesc,
                    description: alert.desc,
                    type: "Weather Threat"
                };
                alerts.push(alertInfo);
            }
        }
        return alerts;
    } catch (error) {
        console.error(`❌ Error fetching weather data: ${error.message}`);
        return [];
    }
}

// === API Endpoint for the Web Server ===
// This route runs your threat detection logic when a user visits your app's URL.
app.get('/', async (req, res) => {
    // Example User Location (Mumbai, India)
    const userLatitude = 22.5726;
    const userLongitude = 88.3639;

    console.log("🌊 Starting threat detection web request...");

    try {
        // 1. Check for Earthquakes
        const earthquakeAlerts = await getEarthquakeAlerts(userLatitude, userLongitude, 500);
        // 2. Check for Coastal/Weather Threats
        const coastalAlerts = await getWeatherAPIAlerts(userLatitude, userLongitude);

        // Build a JSON response with the threat data
        const threatSummary = {
            status: (earthquakeAlerts.length > 0 || coastalAlerts.length > 0) ? "Active Threats Detected" : "No significant threats detected",
            threats: {
                earthquakes: earthquakeAlerts,
                weatherAlerts: coastalAlerts
            }
        };

        // Send the JSON response to the client
        res.json(threatSummary);
        
    } catch (error) {
        console.error("❌ Error running threat detection:", error);
        res.status(500).json({ error: "Failed to fetch threat data." });
    }
});

// === Start the Web Server ===
// The server must listen on the port provided by Render.
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`✅ Web server is running and listening on http://${HOST}:${PORT}`);
});