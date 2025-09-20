// models/Observation.js
import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const ObservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Fisherman", required: true }, // creator
    title: { type: String },      // optional short heading
    description: { type: String },// optional long text
    tags: { type: [String], default: [] }, // array of tag strings
    // location: {
    //   lat: { type: Number },
    //   lng: { type: Number },
    //   name: { type: String },
    // },
    // tideStatus: {
    //   type: String,
    //   enum: ["High Tide", "Low Tide", "Unknown"],
    //   default: "Unknown",
    // },
    // fishFound: { type: Boolean, default: null }, // optional: true/false/null
    // dateObserved: { type: Date, default: Date.now },
    // comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Observation", ObservationSchema);
