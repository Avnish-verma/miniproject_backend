const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runRollback() {
  const uri = process.env.MONGO_URI || process.env.URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI or URI environment variable is required.');
    process.exit(1);
  }

  const backupDir = path.join(__dirname, '../../backup');
  if (!fs.existsSync(backupDir)) {
    console.error('No backup directory found.');
    process.exit(1);
  }

  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('db-snapshot-') && f.endsWith('.json')).sort().reverse();
  if (files.length === 0) {
    console.error('No snapshot files found in backup directory.');
    process.exit(1);
  }

  const latestSnapshot = path.join(backupDir, files[0]);
  console.log(`Loading latest backup snapshot: ${latestSnapshot}`);
  const content = JSON.parse(fs.readFileSync(latestSnapshot, 'utf-8'));

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  for (const [colName, docs] of Object.entries(content.data)) {
    if (!docs || docs.length === 0) continue;
    console.log(`Restoring collection "${colName}" (${docs.length} documents)...`);
    await db.collection(colName).deleteMany({});
    // Re-insert documents converting _id strings back to ObjectId if necessary
    const mappedDocs = docs.map(doc => {
      const copy = { ...doc };
      if (copy._id && typeof copy._id === 'string' && /^[0-9a-fA-F]{24}$/.test(copy._id)) {
        copy._id = new mongoose.Types.ObjectId(copy._id);
      }
      return copy;
    });
    await db.collection(colName).insertMany(mappedDocs);
    console.log(`Restored "${colName}".`);
  }

  console.log('\nSUCCESS: Database rollback complete.');
  await mongoose.disconnect();
  process.exit(0);
}

runRollback().catch((err) => {
  console.error('Rollback failed:', err);
  process.exit(1);
});
