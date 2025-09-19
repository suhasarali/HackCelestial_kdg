// models/catchModel.js

const mongoose = require('mongoose');

const catchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This should reference your User model
        required: true,
    },
    fish_species: {
        type: String,
        required: [true, 'Fish species is required.'],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity of fish is required.'],
        min: 1,
    },
    weight_kg: {
        type: Number,
        required: [true, 'Total weight is required.'],
    },
    total_price: {
        type: Number,
        required: [true, 'Total price is required.'],
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
    },
}, {
    // This adds `createdAt` and `updatedAt` fields automatically
    timestamps: true,
});

const Catch = mongoose.model('Catch', catchSchema);

module.exports = Catch;