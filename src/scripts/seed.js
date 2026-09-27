const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const env = require('../config/env');

async function seedDatabase() {
  console.log('--- NOVA Development Seed Script ---');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.MONGO_URI);

  const hashedPassword = await bcrypt.hash('NovaPass123!', 10);

  // 1. Create or ensure demo users
  const demoUsers = [
    {
      fullname: 'Alice Chen',
      userId: 'alice_chen',
      emailId: 'alice@nova.dev',
      password: hashedPassword,
      bio: 'Digital nomad, photographer, and open-source enthusiast 📸✨',
      gender: 'Female',
      isEmailVerified: true,
      profilePic: {
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
        public_id: 'seed_alice',
      },
    },
    {
      fullname: 'Bob Vance',
      userId: 'bob_vance',
      emailId: 'bob@nova.dev',
      password: hashedPassword,
      bio: 'Full-stack software architect & WebRTC explorer 💻🚀',
      gender: 'Male',
      isEmailVerified: true,
      profilePic: {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        public_id: 'seed_bob',
      },
    },
    {
      fullname: 'Clara Oswald',
      userId: 'clara_o',
      emailId: 'clara@nova.dev',
      password: hashedPassword,
      bio: 'Traveling across time and space. Exploring new frontiers! 🌌',
      gender: 'Female',
      isEmailVerified: true,
      profilePic: {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
        public_id: 'seed_clara',
      },
    },
  ];

  const createdUsers = [];
  for (const userData of demoUsers) {
    let u = await User.findOne({ userId: userData.userId });
    if (!u) {
      u = await User.create(userData);
      console.log(`Created demo user: ${u.userId}`);
    } else {
      console.log(`Demo user already exists: ${u.userId}`);
    }
    createdUsers.push(u);
  }

  const [alice, bob, clara] = createdUsers;

  // Mutual follow between Alice and Bob
  await User.findByIdAndUpdate(alice._id, { $addToSet: { following: bob._id } });
  await User.findByIdAndUpdate(bob._id, { $addToSet: { follower: alice._id } });

  // 2. Sample posts
  const demoPosts = [
    {
      postedBy: alice._id,
      caption: 'Sunset over the alpine mountain ridge. Nature is completely unmatched. 🏔️✨ #outdoors #nature #photography',
      description: 'Captured on a 35mm equivalent lens during an evening hike.',
      postUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&fit=crop',
      public_id: 'seed_post_1',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&fit=crop',
          public_id: 'seed_post_1',
          mediaType: 'image',
        },
      ],
      hashtags: ['outdoors', 'nature', 'photography'],
      likes: [bob._id, clara._id],
    },
    {
      postedBy: bob._id,
      caption: 'Exploring real-time media streams and WebRTC peer negotiation today. Building low-latency systems is thrilling! 📡⚡ #coding #webrtc #tech',
      description: 'Architecture diagram coming soon.',
      postUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&fit=crop',
      public_id: 'seed_post_2',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&fit=crop',
          public_id: 'seed_post_2',
          mediaType: 'image',
        },
      ],
      hashtags: ['coding', 'webrtc', 'tech'],
      likes: [alice._id],
    },
  ];

  for (const postData of demoPosts) {
    const existing = await Post.findOne({ public_id: postData.public_id });
    if (!existing) {
      const p = await Post.create(postData);
      console.log(`Created demo post: ${p.caption.slice(0, 30)}...`);

      // Add demo comment
      await Comment.create({
        postId: p._id,
        commentedBy: clara._id,
        text: 'Incredible shot! Where was this taken?',
      });
    }
  }

  // 3. Sample Conversation between Alice and Bob
  let conv = await Conversation.findOne({
    isGroup: false,
    members: { $all: [alice._id, bob._id] },
  });

  if (!conv) {
    conv = await Conversation.create({
      members: [alice._id, bob._id],
      isGroup: false,
    });

    const msg1 = await Message.create({
      conversationId: conv._id,
      sender: alice._id,
      text: 'Hey Bob! Ready to test the WebRTC video calling pipeline?',
      status: 'READ',
    });

    const msg2 = await Message.create({
      conversationId: conv._id,
      sender: bob._id,
      text: 'Hey Alice! Absolutely. Signaling and STUN configs are connected. Call me anytime!',
      status: 'READ',
    });

    conv.lastMessage = msg2._id;
    conv.lastMessageAt = new Date();
    await conv.save();
    console.log('Created sample conversation and messages between Alice and Bob.');
  }

  console.log('\nSeed process finished successfully!');
  console.log('Demo Credentials:');
  console.log('  Alice  -> username: alice_chen | password: NovaPass123!');
  console.log('  Bob    -> username: bob_vance  | password: NovaPass123!');
  console.log('  Clara  -> username: clara_o    | password: NovaPass123!');

  await mongoose.disconnect();
  process.exit(0);
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
  });
}

module.exports = seedDatabase;
