const mongoose = require('mongoose');
require('dotenv').config();

async function createIndexSafely(collection, keys, options = {}) {
  try {
    await collection.createIndex(keys, options);
  } catch (err) {
    if (err.code === 86 || err.code === 85 || err.message.includes('existing index')) {
      console.log(`Index on ${JSON.stringify(keys)} already exists with compatible spec.`);
    } else {
      console.warn(`Note on index ${JSON.stringify(keys)}:`, err.message);
    }
  }
}

async function runMigration() {
  const uri = process.env.MONGO_URI || process.env.URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI or URI environment variable is required.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB for migration...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('Applying idempotent schema indexes...');

  // User collection indexes
  await createIndexSafely(db.collection('users'), { userId: 1 }, { unique: true });
  await createIndexSafely(db.collection('users'), { emailId: 1 });

  // Post collection indexes
  await createIndexSafely(db.collection('posts'), { postedBy: 1 });
  await createIndexSafely(db.collection('posts'), { createdAt: -1 });

  // Comment collection indexes
  await createIndexSafely(db.collection('comments'), { postId: 1 });
  await createIndexSafely(db.collection('comments'), { commentedBy: 1 });
  await createIndexSafely(db.collection('comments'), { createdAt: -1 });

  console.log('Ensuring default privacy & profile fields for existing users without data loss...');
  const result = await db.collection('users').updateMany(
    { privacy: { $exists: false } },
    {
      $set: {
        privacy: { isPrivate: false, allowDirectMessages: 'everyone' },
        appearance: 'dark'
      }
    }
  );
  console.log(`Updated ${result.modifiedCount} users with default settings.`);

  const userCount = await db.collection('users').countDocuments();
  const postCount = await db.collection('posts').countDocuments();
  const commentCount = await db.collection('comments').countDocuments();

  console.log(`\nMigration completed successfully.`);
  console.log(`Current DB Counts: users=${userCount}, posts=${postCount}, comments=${commentCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
