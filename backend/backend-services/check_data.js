// check_data.js

const mongoose = require('mongoose');
const Analysis = require('./model/analysisModel'); // Using the correct model name
require('dotenv').config();

const runCheck = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected.');

    // Find the most recently created document in the 'analysis' collection.
    const oneCatch = await Analysis.findOne().sort({ createdAt: -1 });

    if (oneCatch) {
      console.log("\n--- Found Most Recent Document ---");
      console.log(oneCatch);
      console.log("\n---------- Timestamp Analysis ----------");
      console.log(`VALUE of createdAt:     ${oneCatch.createdAt}`);
      console.log(`DATA TYPE of createdAt: ${typeof oneCatch.createdAt}`);
      console.log(`Is it a Date object?:   ${oneCatch.createdAt instanceof Date}`);
      console.log("--------------------------------------");

    } else {
      console.log("\n❌ Could not find ANY documents in the 'analysis' collection.");
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

runCheck();