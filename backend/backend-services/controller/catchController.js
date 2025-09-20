// controllers/catchController.js

// Use the new Analysis model
const Analysis = require('../model/analysisModel'); 

const getCatchSummary = async (req, res) => {
    try {
        const { userId } = req.params; // This is a string from the URL

        const summary = await Analysis.aggregate([
            {
                // CRITICAL CHANGE: Match the string directly, no ObjectId conversion
                $match: {
                    user_id: userId 
                }
            },
            {
                $group: {
                    _id: null,
                    totalWeight: { $sum: '$weight_kg' },
                    totalValue: { $sum: '$total_price' },
                }
            },
            {
                $project: {
                    _id: 0,
                    totalWeight: 1,
                    totalValue: 1,
                    averagePricePerKg: {
                        $cond: [{ $eq: ['$totalWeight', 0] }, 0, { $divide: ['$totalValue', '$totalWeight'] }]
                    }
                }
            }
        ]);

        if (summary.length === 0) {
            return res.status(200).json({ totalWeight: 0, totalValue: 0, averagePricePerKg: 0 });
        }
        res.status(200).json(summary[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch catch summary.' });
    }
};

const getWeeklyCatches = async (req, res) => {
    try {
        const { userId } = req.params; // This is a string from the URL

        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const weeklyData = await Analysis.aggregate([
            {
                $match: {
                    // CRITICAL CHANGE: Match the string directly
                    user_id: userId,
                    // IMPORTANT: This requires a `createdAt` field in your documents
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek },
                },
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    totalQuantity: { $sum: '$qty_captured' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let formattedData = days.map((day, index) => {
            const dayData = weeklyData.find(d => d._id === index + 1);
            return { day, quantity: dayData ? dayData.totalQuantity : 0 };
        });
        
        formattedData = [...formattedData.slice(1), formattedData[0]];
        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch weekly data.' });
    }
};

const getSpeciesDistribution = async (req, res) => {
    try {
        const { userId } = req.params;

        const speciesData = await Analysis.aggregate([
            // Stage 1: Find all documents for the specified user
            {
                $match: {
                    user_id: userId
                }
            },
            // Stage 2: Group by the fish species and sum their quantities
            {
                $group: {
                    _id: '$fish_class', // Group by the species name
                    totalQuantity: { $sum: '$qty_captured' } // Sum the quantity for each species
                }
            },
            // Stage 3: Format the output for the pie chart
            {
                $project: {
                    _id: 0, // Remove the default _id field
                    species: '$_id', // Rename _id to 'species'
                    quantity: '$totalQuantity' // Rename totalQuantity to 'quantity'
                }
            }
        ]);

        if (speciesData.length === 0) {
            return res.status(200).json([]); // Return an empty array if no data
        }

        res.status(200).json(speciesData);

    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch species data.' });
    }
};

module.exports = {
    getCatchSummary,
    getWeeklyCatches,
    getSpeciesDistribution
};