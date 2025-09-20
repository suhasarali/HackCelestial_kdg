// // controllers/observationController.js
// import Observation from "../models/community.model.js";

// /**
//  * Helper: normalize tags in body.
//  * Accepts an array or a comma-separated string.
//  */
// const normalizeTags = (tags) => {
//   if (!tags) return [];
//   if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean);
//   if (typeof tags === "string") {
//     return tags
//       .split(",")
//       .map(t => t.trim())
//       .filter(Boolean);
//   }
//   return [];
// };

// // CREATE observation
// export const createObservation = async (req, res) => {
//   try {
//     const { title, description, tags, location, tideStatus, fishFound, dateObserved } = req.body;

//     const normalizedTags = normalizeTags(tags);

//     // Require at least one of: title | description | tags
//     if (!title && !description && normalizedTags.length === 0) {
//       return res.status(400).json({
//         message: "Please provide at least a title, description, or tags."
//       });
//     }

//     const obs = await Observation.create({
//       user: req.user._id,
//       title,
//       description,
//       tags: normalizedTags,
//       location,
//       tideStatus,
//       fishFound: typeof fishFound === "boolean" ? fishFound : null,
//       dateObserved: dateObserved ? new Date(dateObserved) : undefined,
//     });

//     const populated = await obs.populate("user", "name").execPopulate?.() ?? obs;
//     res.status(201).json(populated);
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ message: error.message });
//   }
// };

// // GET all observations (with simple filters)
// export const getObservations = async (req, res) => {
//   try {
//     const { tideStatus, fishFound, region, tags } = req.query;
//     const filter = {};

//     if (tideStatus) filter.tideStatus = tideStatus;
//     if (typeof fishFound !== "undefined") {
//       // accept "true"/"false"
//       if (fishFound === "true") filter.fishFound = true;
//       else if (fishFound === "false") filter.fishFound = false;
//     }
//     if (region) filter["location.name"] = region;
//     if (tags) {
//       // tags query can be comma separated
//       const t = normalizeTags(tags);
//       if (t.length) filter.tags = { $in: t };
//     }

//     const observations = await Observation.find(filter)
//       .populate("user", "name")
//       .populate("comments.user", "name")
//       .sort({ createdAt: -1 });

//     res.json(observations);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // GET one observation
// export const getObservation = async (req, res) => {
//   try {
//     const obs = await Observation.findById(req.params.id)
//       .populate("user", "name")
//       .populate("comments.user", "name");

//     if (!obs) return res.status(404).json({ message: "Observation not found" });
//     res.json(obs);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // UPDATE observation (only creator)
// export const updateObservation = async (req, res) => {
//   try {
//     const obs = await Observation.findById(req.params.id);
//     if (!obs) return res.status(404).json({ message: "Observation not found" });

//     if (obs.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized to edit this post" });
//     }

//     // Normalize tags if provided
//     if ("tags" in req.body) {
//       obs.tags = normalizeTags(req.body.tags);
//     }

//     // Update other allowed fields if present
//     const updatable = ["title", "description", "location", "tideStatus", "fishFound", "dateObserved"];
//     updatable.forEach((field) => {
//       if (field in req.body) {
//         if (field === "dateObserved") obs.dateObserved = req.body.dateObserved ? new Date(req.body.dateObserved) : obs.dateObserved;
//         else if (field === "fishFound") obs.fishFound = typeof req.body.fishFound === "boolean" ? req.body.fishFound : obs.fishFound;
//         else obs[field] = req.body[field];
//       }
//     });

//     // After update, ensure at least one of title|description|tags exists
//     if (!obs.title && !obs.description && (!Array.isArray(obs.tags) || obs.tags.length === 0)) {
//       return res.status(400).json({ message: "Post must have at least a title, description, or tags." });
//     }

//     const updated = await obs.save();
//     const populated = await Observation.findById(updated._id).populate("user", "name").populate("comments.user", "name");
//     res.json(populated);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // DELETE observation (only creator)
// export const deleteObservation = async (req, res) => {
//   try {
//     const obs = await Observation.findById(req.params.id);
//     if (!obs) return res.status(404).json({ message: "Observation not found" });

//     if (obs.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized to delete this post" });
//     }

//     await obs.deleteOne();
//     res.json({ message: "Observation deleted successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ADD comment to observation
// export const addComment = async (req, res) => {
//   try {
//     const { text } = req.body;
//     if (!text || !String(text).trim()) {
//       return res.status(400).json({ message: "Comment text is required" });
//     }

//     const obs = await Observation.findById(req.params.id);
//     if (!obs) return res.status(404).json({ message: "Observation not found" });

//     const comment = { user: req.user._id, text: String(text).trim() };
//     obs.comments.push(comment);
//     await obs.save();

//     const populated = await Observation.findById(obs._id).populate("comments.user", "name");
//     res.status(201).json(populated.comments);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

import Observation from "../models/community.model.js";

// CREATE observation
// controller/community.controller.js

export const createObservation = async (req, res) => {
  try {
    console.log("📥 Incoming body:", req.body);
    console.log("👤 Authenticated user:", req.user);
    // Quick debug log to see if middleware attached user
    console.log("createObservation - req.user:", !!req.user, req.user ? req.user._id : null);

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated. Missing user (protectRoute not applied or token invalid)." });
    }

    const { title, description, tags } = req.body;

    if (!title && !description) {
      return res
        .status(400)
        .json({ message: "Please provide a title or description." });
    }

    // --- NEW: Spam detection integration ---
    const text_to_check = `${title || ""} ${description || ""}`;
    const spamCheckUrl = 'http://127.0.0.1:8000/predict'; // Make sure this URL matches your FastAPI server's address
    
    try {
      const response = await fetch(spamCheckUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text_to_check }),
      });

      if (!response.ok) {
        throw new Error(`Spam check API responded with status: ${response.status}`);
      }

      const spamResult = await response.json();
      console.log("Spam check result:", spamResult);

      // Block the post if the prediction is 'high_probability_spam'
      if (spamResult.prediction === "high_probability_spam") {
        return res.status(400).json({ 
          message: "Your message was flagged as spam with a high probability and cannot be posted.",
          spam_probability: spamResult.spam_probability
        });
      }
    } catch (spamError) {
      console.error("Error during spam check:", spamError.message);
      // Decide how to handle an API error (e.g., fail open or fail closed)
      // For now, we will log the error but allow the post to go through to prevent service disruption.
    }
    // --- END NEW: Spam detection integration ---


    const observation = new Observation({
      user: req.user._id,
      title: title ? String(title).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      tags: Array.isArray(tags) ? tags : [],
    });

    await observation.save();
    // populate creator name before returning
    await observation.populate("user", "name");

    return res.status(201).json(observation);
  } catch (error) {
    console.error("createObservation error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};


// GET all observations
export const getObservations = async (req, res) => {
  try {
    const observations = await Observation.find()
      .populate("user", "name") // include creator's name only
      .sort({ createdAt: -1 }); // newest first

    res.json(observations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE observation (only owner)
export const deleteObservation = async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id);
    if (!observation) {
      return res.status(404).json({ message: "Observation not found" });
    }

    if (observation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this observation" });
    }

    await observation.deleteOne();
    res.json({ message: "Observation deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

