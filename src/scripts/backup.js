const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runBackup() {
  const uri = process.env.MONGO_URI || process.env.URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI or URI environment variable is required.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB for backup...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const collections = ['users', 'posts', 'comments'];
  const snapshot = {
    timestamp: new Date().toISOString(),
    counts: {},
    data: {}
  };

  const backupDir = path.join(__dirname, '../../backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  for (const colName of collections) {
    try {
      const docs = await db.collection(colName).find({}).toArray();
      snapshot.counts[colName] = docs.length;
      snapshot.data[colName] = docs;
      console.log(`Backed up collection "${colName}": ${docs.length} documents.`);
    } catch (err) {
      console.warn(`Collection "${colName}" not found or empty: ${err.message}`);
      snapshot.counts[colName] = 0;
      snapshot.data[colName] = [];
    }
  }

  const filename = `db-snapshot-${Date.now()}.json`;
  const targetPath = path.join(backupDir, filename);
  fs.writeFileSync(targetPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`\nSUCCESS: Backup snapshot written to: ${targetPath}`);

  await mongoose.disconnect();
  process.exit(0);
}

runBackup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
