// add_timestamps.js

const mongoose = require('mongoose');
const Analysis = require('./model/analysisModel');
require('dotenv').config();

const addMissingTimestamps = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected.');

    // Find all documents where the 'createdAt' field does NOT exist
    const docsToUpdate = await Analysis.find({ "createdAt": { "$exists": false } });

    if (docsToUpdate.length === 0) {
      console.log('✅ All documents already have timestamps. Nothing to do.');
      return;
    }

    console.log(`Found ${docsToUpdate.length} documents missing timestamps. Preparing direct update...`);

    // --- THE FIX IS HERE ---
    // We will build a list of update operations to send directly to the database,
    // bypassing the Mongoose schema rules that protect 'createdAt'.
    const operations = docsToUpdate.map(doc => {
      const creationTime = doc._id.getTimestamp();
      return {
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              createdAt: creationTime,
              updatedAt: creationTime,
            },
          },
        },
      };
    });

    // Use .collection.bulkWrite to execute the operations directly
    const result = await Analysis.collection.bulkWrite(operations);

    console.log(`✅ Successfully updated ${result.modifiedCount} documents.`);

  } catch (error)
  {
    console.error('❌ Error during update:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

addMissingTimestamps();