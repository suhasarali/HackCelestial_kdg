// controllers/catchController.js

const Catch = require('../models/catchModel');
const mongoose = require('mongoose');

/**
 * @desc    Get a summary of all catches for a specific user
 * @route   GET /api/catches/summary/:userId
 * @access  Private
 */
const getAllCatches = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate the userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        const summary = await Catch.aggregate([
            // Stage 1: Match only the documents for the specified user
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId)
                }
            },
            // Stage 2: Group the matched documents to calculate sums
            {
                $group: {
                    _id: null, // Group all matched documents into a single result
                    totalWeight: { $sum: '$weight_kg' },
                    totalValue: { $sum: '$total_price' },
                }
            },
            // Stage 3: Reshape the output and calculate the average price
            {
                $project: {
                    _id: 0,
                    totalWeight: '$totalWeight',
                    totalValue: '$totalValue',
                    averagePricePerKg: {
                        $cond: {
                            if: { $eq: ['$totalWeight', 0] },
                            then: 0,
                            else: { $divide: ['$totalValue', '$totalWeight'] }
                        }
                    }
                }
            }
        ]);

        // If the user has no catches, return a default object with zero values.
        if (summary.length === 0) {
            return res.status(200).json({
                totalWeight: 0,
                totalValue: 0,
                averagePricePerKg: 0,
            });
        }

        res.status(200).json(summary[0]);

    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch catch summary.', error: error.message });
    }
};

/**
 * @desc    Get weekly catch data for a user, formatted for a graph
 * @route   GET /api/catches/weekly/:userId
 * @access  Private
 */
const getWeeklyCatches = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const weeklyData = await Catch.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek },
                },
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    totalQuantity: { $sum: '$quantity' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const formattedData = days.map((day, index) => {
            const dayData = weeklyData.find(item => item._id === index + 1);
            return { day, quantity: dayData ? dayData.totalQuantity : 0 };
        });
        
        const weekStartOnMonday = [...formattedData.slice(1), formattedData[0]];
        res.status(200).json(weekStartOnMonday);

    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch weekly data.', error: error.message });
    }
};

module.exports = {
    getAllCatches,
    getWeeklyCatches,
};