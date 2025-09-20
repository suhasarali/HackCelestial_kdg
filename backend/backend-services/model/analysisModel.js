// models/analysisModel.js

const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    user_id: {
        type: String, // Changed to String to match your database
        required: true,
    },
    fish_class: {
        type: String,
        required: true,
    },
    qty_captured: {
        type: Number,
        required: true,
    },
    weight_kg: {
        type: Number,
        required: true,
    },
    total_price: {
        type: Number,
        required: true,
    },
    location: {
        lat: { type: Number },
        lon: { type: Number },
    },
}, {
    // This tells Mongoose to add `createdAt` and `updatedAt` fields.
    // This is required for the `getWeeklyCatches` function to work.
    timestamps: true,
});

// The third argument tells Mongoose to use the 'analysis' collection
const Analysis = mongoose.model('Analysis', analysisSchema, 'analysis');

module.exports = Analysis;