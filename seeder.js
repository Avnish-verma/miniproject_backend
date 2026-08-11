// generateReels.js
const mongoose = require("mongoose");
const reelModel = require("./models/postModel"); // Adjust path if needed

// Official Cloudinary public sample videos (High availability & low bandwidth)
const verifiedSampleVideos = [
  "https://res.cloudinary.com/demo/video/upload/v1688582456/docs/demo_video.mp4",
  "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
  "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4",
  "https://res.cloudinary.com/demo/video/upload/dog.mp4",
  "https://res.cloudinary.com/demo/video/upload/africa.mp4"
];

// Poster image fallbacks
const samplePosters = [
  "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80"
];

const categories = ["Dance", "Fitness", "Travel", "Fashion", "Lifestyle", "Vlog"];

async function seedDatabase() {
  try {
    // 1. Connect to local MongoDB instance
    await mongoose.connect("mongodb://localhost:27017/instagram");
    console.log("Connected to MongoDB...");

    // 2. Clear old collections containing broken GCS links
    await reelModel.deleteMany({ type: "reel" });
    console.log("Flushed outdated broken reels...");

    // 3. Build 50 new reel objects
    const reelsToInsert = [];
    const dummyUserId = new mongoose.Types.ObjectId("6a6ca4ec5a2568992bbef0f2");

    for (let i = 1; i <= 50; i++) {
      const videoUrl = verifiedSampleVideos[i % verifiedSampleVideos.length];
      const posterUrl = samplePosters[i % samplePosters.length];
      const category = categories[i % categories.length];

      reelsToInsert.push({
        _id: new mongoose.Types.ObjectId(),
        postedBy: dummyUserId,
        caption: `${category} Reel #${i} 🔥 #trending #reels`,
        postUrl: videoUrl,
        thumbnailUrl: posterUrl,
        public_id: `instagram_clone/reels/verified_reel_${Date.now()}_${i}`,
        description: `Verified fast streaming reel #${i}`,
        type: "reel",
        likes: [],
        comments: [],
        createdAt: new Date(Date.now() - i * 1800000) // Staggered creation timestamps
      });
    }

    // 4. Batch insert into database
    await reelModel.insertMany(reelsToInsert);
    console.log("Successfully inserted 50 verified, fast-loading reels!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Seeding Error:", error);
  }
}

seedDatabase();