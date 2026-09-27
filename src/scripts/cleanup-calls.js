const { connectDB } = require('../config/db');
const Call = require('../models/Call');

async function run() {
  await connectDB();
  const result = await Call.updateMany(
    { status: { $in: ['ringing', 'accepted'] }, endedAt: null },
    { $set: { status: 'completed', endedAt: new Date() } }
  );
  console.log('Cleaned orphaned calls in DB:', result);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
