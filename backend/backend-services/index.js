const axios = require('axios');

// === API KEYS ===
// Replace this with your actual, activated WeatherAPI.com key
const WEATHERAPI_KEY = "5c5b3ba3072e4c77a77133351251909";

// === API Endpoints ===
const USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
const WEATHERAPI_URL = "http://api.weatherapi.com/v1/forecast.json";

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

  console.log("Checking USGS for earthquake alerts...");

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

  console.log("Checking WeatherAPI.com for coastal alerts...");

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

async function main() {
  // Example User Location (Mumbai, India)
  const userLatitude = 22.5726;
  const userLongitude = 88.3639;

  console.log("🌊 Starting threat detection service...");

  // 1. Check for Earthquakes
  const earthquakeAlerts = await getEarthquakeAlerts(userLatitude, userLongitude, 500);

  // 2. Check for Coastal/Weather Threats
  const coastalAlerts = await getWeatherAPIAlerts(userLatitude, userLongitude);

  console.log("\n--- Summary of Threats ---");

  // Report findings
  if (earthquakeAlerts.length > 0 || coastalAlerts.length > 0) {
    console.log("⚠️ ACTIVE THREATS DETECTED:");

    if (earthquakeAlerts.length > 0) {
      console.log("\n- Earthquakes:");
      for (const alert of earthquakeAlerts) {
        console.log(` > A magnitude ${alert.magnitude} event has occurred near ${alert.place}`);
        console.log(`   Time: ${alert.time}`);
        console.log(`   More Info: ${alert.url}`);
      }
    }

    if (coastalAlerts.length > 0) {
      console.log("\n- Coastal/Weather Warnings:");
      for (const alert of coastalAlerts) {
        console.log(` > Event: ${alert.headline} (${alert.severity})`);
        console.log(`   Area: ${alert.area}`);
        console.log(`   Description: ${alert.description}`);
      }
    }
  } else {
    console.log("✅ No significant threats detected in your area.");
  }
}

// Entry point of the script
main();