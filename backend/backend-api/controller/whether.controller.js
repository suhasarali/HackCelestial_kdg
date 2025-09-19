// controllers/fishingController.js
export const getData = async (req, res) => {
  try {
    const { lat, lon } = req.body;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    // --- Weather API (current conditions) ---
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

    // --- Marine API (wave height, tide proxy) ---
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height&timezone=auto`;

    const [weatherRes, marineRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(marineUrl),
    ]);

    if (!weatherRes.ok || !marineRes.ok) {
      throw new Error("Failed to fetch data from Open-Meteo APIs");
    }

    const weatherData = await weatherRes.json();
    const marineData = await marineRes.json();

    // Extract current weather
    const current = weatherData.current_weather;

    // Extract tide/wave height (nearest hour)
    const now = new Date().toISOString().slice(0, 13) + ":00"; // e.g., 2025-09-19T11:00
    let tideLevel = null;

    if (marineData.hourly) {
      const idx = marineData.hourly.time.indexOf(now);
      if (idx !== -1) {
        tideLevel = marineData.hourly.wave_height[idx];
      } else {
        // fallback: take first available
        tideLevel = marineData.hourly.wave_height[0];
      }
    }

    res.json({
      success: true,
      weather: {
        temperature: current.temperature,
        wind_speed: current.windspeed,
        wind_direction: current.winddirection,
      },
      tide_level: tideLevel,
    });
  } catch (err) {
    console.error("Fishing Data Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
