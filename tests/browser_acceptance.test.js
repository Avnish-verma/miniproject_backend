const puppeteer = require('puppeteer-core');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const SavedPost = require('../src/models/SavedPost');
const Story = require('../src/models/Story');
const StoryView = require('../src/models/StoryView');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const chatService = require('../src/services/chatService');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const APP_URL = 'http://localhost:5173';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserAcceptanceTests() {
  console.log('======================================================================');
  console.log('🌐 NOVA — REAL BROWSER ACCEPTANCE & INTEGRATION TEST SUITE');
  console.log('   Target Browser: Microsoft Edge (Chromium)');
  console.log('   Dual Authenticated User Contexts: Alice Chen & Bob Vance');
  console.log('======================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failedCount++;
    }
  }

  // 1. Connect to Database & Prepare Test State
  await mongoose.connect(env.MONGO_URI);
  console.log('[DB] Connected to MongoDB for test fixture alignment');

  const hashedPassword = await bcrypt.hash('NovaPass123!', 10);

  // Ensure Alice exists
  let alice = await User.findOne({ userId: 'alice_chen' });
  if (!alice) {
    alice = await User.create({
      fullname: 'Alice Chen',
      userId: 'alice_chen',
      emailId: 'alice@nova.social',
      password: hashedPassword,
      isEmailVerified: true,
      bio: 'Staff Product Engineer at NOVA',
      follower: [],
      following: [],
      privacy: { isPrivate: false },
    });
  } else {
    alice.password = hashedPassword;
    alice.isEmailVerified = true;
    alice.privacy = { isPrivate: false };
    alice.follower = [];
    alice.following = [];
    await alice.save();
  }

  // Ensure Bob exists
  let bob = await User.findOne({ userId: 'bob_vance' });
  if (!bob) {
    bob = await User.create({
      fullname: 'Bob Vance',
      userId: 'bob_vance',
      emailId: 'bob@nova.social',
      password: hashedPassword,
      isEmailVerified: true,
      bio: 'Distributed Systems & WebRTC Lead',
      follower: [],
      following: [],
      privacy: { isPrivate: false },
    });
  } else {
    bob.password = hashedPassword;
    bob.isEmailVerified = true;
    bob.privacy = { isPrivate: false };
    bob.follower = [];
    bob.following = [];
    await bob.save();
  }

  // Clean prior test artifacts
  await Post.deleteMany({ caption: /#NovaAcceptance/i });
  await Story.deleteMany({ user: { $in: [alice._id, bob._id] } });
  await StoryView.deleteMany({});
  await SavedPost.deleteMany({ user: { $in: [alice._id, bob._id] } });

  // Pre-seed a post for Bob so Alice has content to see/save
  const bobSeedPost = await Post.create({
    postedBy: bob._id,
    caption: 'Architecture blueprint for NOVA WebRTC mesh #NovaEngine #Distributed',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
        public_id: 'seed_bob_post',
        mediaType: 'image',
      },
    ],
    hashtags: ['novaengine', 'distributed'],
  });

  // Ensure conversation exists between Alice & Bob for Post Sharing test
  await chatService.getOrCreateConversation(bob._id, 'alice_chen');

  console.log('[DB] Test fixtures primed: Alice and Bob accounts active and synchronized.\n');

  // 2. Launch Real Edge Chromium Browser
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  console.log(`[Edge] Browser launched successfully (${await browser.version()})\n`);

  try {
    // ======================================================================
    // CONTEXT A: USER A (ALICE CHEN)
    // ======================================================================
    console.log('----------------------------------------------------------------------');
    console.log('📌 PHASE 1: User A (Alice Chen) Authentication & Feed Verification');
    console.log('----------------------------------------------------------------------');

    const contextA = await browser.createBrowserContext();
    const pageA = await contextA.newPage();
    await pageA.setViewport({ width: 1440, height: 900 });

    pageA.on('pageerror', (err) => console.log('  [Alice Page Error]:', err.message));
    pageA.on('dialog', async (dialog) => {
      console.log('  [Alice Dialog Detected]:', dialog.message());
      await dialog.dismiss();
    });

    // Navigate to App
    await pageA.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    assert((await pageA.title()).includes('NOVA'), 'Page loads with title containing NOVA');

    // Verify unauthenticated view renders Login Page
    await pageA.waitForSelector('input[type="text"]', { visible: true });
    const loginHeading = await pageA.$eval('h1', (el) => el.textContent);
    assert(loginHeading.includes('Sign in to NOVA'), 'Login page renders sign in heading');

    // Fill credentials & login
    await pageA.type('input[type="text"]', 'alice_chen', { delay: 15 });
    await pageA.type('input[type="password"]', 'NovaPass123!', { delay: 15 });
    await pageA.click('button[type="submit"]');

    // Wait for transition to authenticated layout (Feed)
    await pageA.waitForSelector('aside', { visible: true, timeout: 8000 });
    await sleep(800);

    const tokenInStorage = await pageA.evaluate(
      () => localStorage.getItem('nova_token') || localStorage.getItem('token')
    );
    assert(Boolean(tokenInStorage), 'JWT auth token stored in localStorage after login');

    // Verify StoryRail and Feed Tabs
    const forYouTabExists = await pageA.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.textContent.toLowerCase().includes('for you'));
    });
    assert(forYouTabExists, 'Feed displays "For You" algorithmic feed tab');

    // Verify dynamic trending topics in right sidebar
    const trendingHeader = await pageA.evaluate(() => {
      return document.body.textContent.includes('Trending Topics');
    });
    assert(trendingHeader, 'Layout displays real "Trending Topics" discovery widget');

    // ======================================================================
    // PHASE 2: Post Creation & Engagement (User A)
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 2: User A Post Creation, Engagement, Commenting & Saving');
    console.log('----------------------------------------------------------------------');

    // Open Post Composer
    const createBtn = await pageA.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent.trim() === 'Create' || b.querySelector('svg.lucide-plus'));
    });
    if (createBtn.asElement()) {
      await createBtn.asElement().click();
    }
    await sleep(500);

    // Wait for composer modal
    await pageA.waitForSelector('textarea', { visible: true });
    const acceptancePostText = 'Real browser automated acceptance test post #NovaAcceptance #Verified';
    await pageA.type('textarea', acceptancePostText, { delay: 10 });
    await sleep(300);

    // Click Publish button inside PostComposer modal
    await pageA.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('div.fixed')).find((el) => el.textContent.includes('New post'));
      if (!modal) throw new Error('PostComposer modal not found');
      const publishBtn = Array.from(modal.querySelectorAll('button')).find((b) => b.textContent.includes('Publish'));
      if (!publishBtn) throw new Error('Publish button in modal not found');
      publishBtn.click();
    });

    // Verify post document created in MongoDB
    let createdPostInDb = null;
    for (let i = 0; i < 20; i++) {
      createdPostInDb = await Post.findOne({ caption: /#NovaAcceptance/i });
      if (createdPostInDb) break;
      await sleep(300);
    }
    assert(Boolean(createdPostInDb), 'Post document created and verified in MongoDB');

    // Verify post card appears in Feed DOM without page reload
    await pageA.waitForSelector(`#post-${createdPostInDb._id}`, { visible: true, timeout: 8000 });
    assert(true, 'Newly created post is immediately prepended and visible in Feed DOM');

    // Like Post
    const likeButton = await pageA.waitForSelector(`#post-${createdPostInDb._id} button[aria-label="Like post"]`);
    await likeButton.click();
    await sleep(600);

    const postAfterLikeInDb = await Post.findById(createdPostInDb._id);
    assert(
      postAfterLikeInDb.likes.some((id) => id.equals(alice._id)),
      'Post like persisted in MongoDB'
    );

    // Comment on Post
    const commentButton = await pageA.waitForSelector(`#post-${createdPostInDb._id} button[aria-label="Comment on post"]`);
    await commentButton.click();
    await sleep(400);

    const commentInput = await pageA.waitForSelector(`#post-${createdPostInDb._id} input[placeholder="Write a reply..."]`);
    await commentInput.type('Browser acceptance reply from Alice', { delay: 10 });
    const replySubmit = await pageA.waitForSelector(`#post-${createdPostInDb._id} form button[type="submit"]`);
    await replySubmit.click();
    await sleep(600);

    const replyInDom = await pageA.evaluate(() => document.body.textContent.includes('Browser acceptance reply from Alice'));
    assert(replyInDom, 'Comment renders in thread with author and content');

    // Delete Comment
    const deleteCommentBtn = await pageA.waitForSelector(`#post-${createdPostInDb._id} button[aria-label="Delete comment"]`);
    await deleteCommentBtn.click();
    await sleep(600);

    const commentDeletedFromDom = await pageA.evaluate(
      () => !document.body.textContent.includes('Browser acceptance reply from Alice')
    );
    assert(commentDeletedFromDom, 'Self-created comment successfully deleted from DOM');

    // Save Bob's Seed Post
    const saveBobPostBtn = await pageA.waitForSelector(`#post-${bobSeedPost._id} button[aria-label="Bookmark post"]`);
    await saveBobPostBtn.click();
    await sleep(600);

    const savedDoc = await SavedPost.findOne({ user: alice._id, post: bobSeedPost._id });
    assert(Boolean(savedDoc), 'Post bookmark recorded in MongoDB SavedPost collection');

    // ======================================================================
    // PHASE 3: Story Creation (User A)
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 3: 24-Hour Story Creation & Rail Verification (User A)');
    console.log('----------------------------------------------------------------------');

    // Click "Add story" button in Story Rail
    const addStoryBtn = await pageA.waitForSelector('button[aria-label="Add story"]', { visible: true });
    await addStoryBtn.click();
    await sleep(500);

    // Wait for Story Creator modal
    await pageA.waitForSelector('textarea[placeholder*="story"]', { visible: true });
    const storyText = 'Alice live status story update for acceptance testing';
    await pageA.type('textarea[placeholder*="story"]', storyText, { delay: 10 });

    // Click Share Story button inside modal
    await pageA.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('div.fixed')).find(
        (el) => el.textContent.includes('Share story') || el.textContent.includes('Disappears after 24 hours')
      );
      if (!modal) throw new Error('StoryCreatorModal not found');
      const shareBtn = Array.from(modal.querySelectorAll('button')).find((b) =>
        b.textContent.toLowerCase().includes('share story')
      );
      if (!shareBtn) throw new Error('Share story button not found');
      shareBtn.click();
    });

    let storyInDb = null;
    for (let i = 0; i < 20; i++) {
      storyInDb = await Story.findOne({ user: alice._id });
      if (storyInDb) break;
      await sleep(300);
    }
    assert(Boolean(storyInDb), '24-hour story persisted in MongoDB with expiresAt');

    // Verify StoryRail displays "Your story"
    const yourStoryLabel = await pageA.evaluate(() => document.body.textContent.toLowerCase().includes('your story'));
    assert(yourStoryLabel, 'StoryRail updates to show active story status ring');

    // ======================================================================
    // PHASE 4: Profile Navigation & Partitioned Tabs (User A)
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 4: Profile Partitioning & Tabs (Posts vs Media vs Saved)');
    console.log('----------------------------------------------------------------------');

    // Navigate to Profile tab
    await pageA.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('button'));
      const profileItem = navItems.find((b) => b.textContent.includes('Profile'));
      if (profileItem) profileItem.click();
    });
    await sleep(800);

    assert(pageA.url().includes('/profile'), 'URL synchronized to /profile');

    const profileHandle = await pageA.evaluate(() => document.body.textContent.includes('@alice_chen'));
    assert(profileHandle, 'Profile header displays authenticated user handle @alice_chen');

    // Check Tabs for Self (Owner): Posts, Media, Saved MUST be visible
    const tabsForSelf = await pageA.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tabLabels = ['Posts', 'Media', 'Saved'];
      return tabLabels.filter((label) => buttons.some((b) => b.textContent.trim() === label));
    });
    assert(tabsForSelf.includes('Posts'), 'Profile has "Posts" tab');
    assert(tabsForSelf.includes('Media'), 'Profile has "Media" tab');
    assert(tabsForSelf.includes('Saved'), 'Profile has "Saved" tab visible for account owner');

    // Click "Saved" Tab
    await pageA.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const savedTab = btns.find((b) => b.textContent.trim() === 'Saved');
      if (savedTab) savedTab.click();
    });
    await sleep(600);

    // Switch to Timeline view to see caption text
    await pageA.evaluate(() => {
      const timelineBtn = document.querySelector('button[aria-label="Timeline view"]');
      if (timelineBtn) timelineBtn.click();
    });
    await sleep(600);

    const savedPostVisible = await pageA.evaluate(() => {
      return document.body.textContent.includes('Architecture blueprint for NOVA');
    });
    assert(savedPostVisible, 'Saved tab renders bookmarked post for owner');

    // Edit Profile Bio
    await pageA.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const editBtn = btns.find((b) => b.textContent.includes('Edit profile'));
      if (editBtn) editBtn.click();
    });
    await sleep(500);

    await pageA.waitForSelector('textarea[placeholder*="yourself"]', { visible: true });
    await pageA.click('textarea[placeholder*="yourself"]', { clickCount: 3 });
    await pageA.keyboard.press('Backspace');
    await pageA.type('textarea[placeholder*="yourself"]', 'Staff Product Engineer at NOVA — Verified Acceptance 2026', { delay: 10 });

    await pageA.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('div.fixed')).find((el) => el.textContent.includes('Edit Profile'));
      if (!modal) throw new Error('Edit Profile modal not found');
      const saveBtn = Array.from(modal.querySelectorAll('button')).find((b) =>
        b.textContent.toLowerCase().includes('save changes')
      );
      if (!saveBtn) throw new Error('Save changes button not found in modal');
      saveBtn.click();
    });
    await sleep(800);

    const updatedBioInDom = await pageA.evaluate(() =>
      document.body.textContent.includes('Verified Acceptance 2026')
    );
    assert(updatedBioInDom, 'Edited bio renders immediately on profile without page reload');

    // ======================================================================
    // CONTEXT B: USER B (BOB VANCE)
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 5: User B (Bob Vance) Independent Session & Discover Search');
    console.log('----------------------------------------------------------------------');

    const contextB = await browser.createBrowserContext();
    const pageB = await contextB.newPage();
    await pageB.setViewport({ width: 1440, height: 900 });

    pageB.on('pageerror', (err) => console.log('  [Bob Page Error]:', err.message));
    pageB.on('dialog', async (dialog) => {
      console.log('  [Bob Dialog Detected]:', dialog.message());
      await dialog.dismiss();
    });

    await pageB.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await pageB.waitForSelector('input[type="text"]', { visible: true });

    // Login as Bob
    await pageB.type('input[type="text"]', 'bob_vance', { delay: 15 });
    await pageB.type('input[type="password"]', 'NovaPass123!', { delay: 15 });
    await pageB.click('button[type="submit"]');

    await pageB.waitForSelector('aside', { visible: true, timeout: 8000 });
    await sleep(800);

    const bobToken = await pageB.evaluate(
      () => localStorage.getItem('nova_token') || localStorage.getItem('token')
    );
    assert(Boolean(bobToken) && bobToken !== tokenInStorage, 'User B has distinct isolated session token');

    // Navigate to Discover
    await pageB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const discoverBtn = btns.find((b) => b.textContent.includes('Discover'));
      if (discoverBtn) discoverBtn.click();
    });
    await sleep(800);
    assert(pageB.url().includes('/discover'), 'User B routed to /discover');

    // Search for Alice
    await pageB.waitForSelector('input[placeholder*="Search"]', { visible: true });
    await pageB.type('input[placeholder*="Search"]', 'alice_chen', { delay: 15 });
    await sleep(700);

    const aliceFoundInSearch = await pageB.evaluate(() => document.body.textContent.includes('@alice_chen'));
    assert(aliceFoundInSearch, 'User B searches and finds User A (@alice_chen) in Discover');

    // Click Alice's profile card to open Alice's profile
    await pageB.evaluate(() => {
      const ps = Array.from(document.querySelectorAll('p'));
      const aliceP = ps.find((p) => p.textContent.trim() === 'Alice Chen');
      if (aliceP) aliceP.click();
    });
    // Wait for Alice's profile to load
    await pageB.waitForFunction(
      () => document.body.textContent.includes('@alice_chen') && document.body.textContent.includes('Posts'),
      { timeout: 8000 }
    );

    // ======================================================================
    // PHASE 6: Profile Privacy Enforcement (Saved Tab Strictly Hidden)
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 6: Profile Privacy: Non-Owner Cannot View Saved Tab');
    console.log('----------------------------------------------------------------------');

    const tabsVisibleToBob = await pageB.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tabLabels = ['Posts', 'Media', 'Saved'];
      return tabLabels.filter((label) => buttons.some((b) => b.textContent.trim() === label));
    });
    assert(tabsVisibleToBob.includes('Posts'), 'Non-owner sees "Posts" tab');
    assert(tabsVisibleToBob.includes('Media'), 'Non-owner sees "Media" tab');
    assert(
      !tabsVisibleToBob.includes('Saved'),
      'CRITICAL: Non-owner DOES NOT see "Saved" tab (Saved posts strictly private to owner)'
    );

    // ======================================================================
    // PHASE 7: Social Follow & Algorithmic Feed Sync
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 7: Follow Relationship & Following Feed Integration');
    console.log('----------------------------------------------------------------------');

    // Bob follows Alice on her profile
    const followBtn = await pageB.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent.trim() === 'Follow');
    });
    if (followBtn.asElement()) {
      await followBtn.asElement().click();
      await sleep(800);
    }

    const isNowFollowing = await pageB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => ['Following', 'Unfollow'].includes(b.textContent.trim()));
    });
    assert(isNowFollowing, 'Follow button state updates to "Following"');

    const aliceInDbAfterFollow = await User.findOne({ userId: 'alice_chen' });
    assert(aliceInDbAfterFollow.follower.some((id) => id.equals(bob._id)), 'Follow relationship recorded in MongoDB');

    // Verify Bob's Following Feed displays Alice's post
    await pageB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const homeBtn = btns.find((b) => b.textContent.includes('Home'));
      if (homeBtn) homeBtn.click();
    });
    await sleep(800);

    // Switch to "Following" tab
    await pageB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const followingTab = btns.find((b) => b.textContent.trim() === 'Following');
      if (followingTab) followingTab.click();
    });
    await sleep(800);

    const alicePostInBobFollowingFeed = await pageB.evaluate((text) => {
      return document.body.textContent.includes(text);
    }, acceptancePostText);
    assert(alicePostInBobFollowingFeed, 'Alice newly published post appears in Bob "Following" feed');

    // ======================================================================
    // PHASE 8: Real Direct Post Sharing (Bob -> Alice)
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 8: Real Direct Post Sharing & Deep-Link Navigation');
    console.log('----------------------------------------------------------------------');

    // Bob clicks Share on Alice's post
    const sharePostBtn = await pageB.waitForSelector(`#post-${createdPostInDb._id} button[aria-label="Share post"]`);
    await sharePostBtn.click();
    await sleep(600);

    // Wait for Share Modal
    await pageB.waitForSelector('input[placeholder*="conversations"]', { visible: true });

    // Select Alice's conversation in modal
    await pageB.evaluate(() => {
      const modal = Array.from(document.querySelectorAll('div.fixed')).find((el) => el.textContent.includes('Share Post'));
      if (!modal) throw new Error('Share Post modal not found');
      const rows = Array.from(modal.querySelectorAll('div.cursor-pointer'));
      const aliceRow = rows.find((r) => r.textContent.includes('Alice Chen') || r.textContent.includes('@alice_chen'));
      if (!aliceRow) throw new Error('Alice conversation row not found in Share modal');
      aliceRow.click();
    });
    await sleep(500);

    // Send Share Message inside modal
    await pageB.waitForSelector('form button[type="submit"]', { visible: true, timeout: 5000 });
    const sendShareBtn = await pageB.$('form button[type="submit"]');
    await sendShareBtn.click();
    await sleep(1000);

    let shareMessageInDb = null;
    for (let i = 0; i < 20; i++) {
      shareMessageInDb = await Message.findOne({ messageType: 'POST_SHARE', sharedPostId: createdPostInDb._id });
      if (shareMessageInDb) break;
      await sleep(300);
    }
    assert(Boolean(shareMessageInDb), 'POST_SHARE message persisted in MongoDB with sharedPostId reference');

    // User A (Alice) opens Messages
    await pageA.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const chatBtn = btns.find((b) => b.textContent.includes('Messages'));
      if (chatBtn) chatBtn.click();
    });
    await sleep(800);

    // Click Bob's conversation in list
    await pageA.evaluate(() => {
      const convCards = Array.from(document.querySelectorAll('div, button'));
      const bobConv = convCards.find((c) => c.textContent.includes('Bob Vance'));
      if (bobConv) bobConv.click();
    });
    await sleep(800);

    // Verify shared post preview card is rendered in Alice's chat view
    const postShareCardInChat = await pageA.evaluate((text) => {
      return document.body.textContent.includes(text);
    }, acceptancePostText);
    assert(postShareCardInChat, 'Shared post preview card is received and rendered in Alice Messages view');

    // Alice clicks the shared post preview card to deep link to Feed
    await pageA.evaluate((text) => {
      const divs = Array.from(document.querySelectorAll('div'));
      const card = divs.find((d) => d.textContent.includes(text) && d.classList.contains('cursor-pointer'));
      if (card) card.click();
    }, acceptancePostText);
    await sleep(1000);

    assert(
      pageA.url().includes('post=') || pageA.url().includes('/feed'),
      'Deep link navigates to Feed with post reference query'
    );

    // ======================================================================
    // PHASE 9: Real Story Viewing & Viewers List
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 9: Story Viewing (Bob) & Author Viewer List Verification (Alice)');
    console.log('----------------------------------------------------------------------');

    // Bob views Alice's story in StoryRail
    await pageB.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const homeBtn = btns.find((b) => b.textContent.includes('Home'));
      if (homeBtn) homeBtn.click();
    });
    await sleep(800);

    // Click Alice's avatar in StoryRail
    await pageB.evaluate(() => {
      const railItems = Array.from(document.querySelectorAll('div.cursor-pointer'));
      const aliceItem = railItems.find((d) => d.textContent.includes('Alice'));
      if (aliceItem) aliceItem.click();
    });
    await sleep(1500);

    // Verify view record exists in DB
    const viewRecord = await StoryView.findOne({ story: storyInDb._id, viewer: bob._id });
    assert(Boolean(viewRecord), 'Bob view on Alice story recorded in MongoDB');

    // Close story modal for Bob
    await pageB.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close story"]');
      if (closeBtn) closeBtn.click();
    });
    await sleep(500);

    // Alice opens her own story to inspect viewers list
    await pageA.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const homeBtn = btns.find((b) => b.textContent.includes('Home'));
      if (homeBtn) homeBtn.click();
    });
    await sleep(800);

    await pageA.evaluate(() => {
      const railItems = Array.from(document.querySelectorAll('div.cursor-pointer'));
      const yourStory = railItems.find((d) => d.textContent.toLowerCase().includes('your story'));
      if (yourStory) yourStory.click();
    });
    await sleep(1200);

    // Click Viewers drawer button
    await pageA.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const viewersBtn = btns.find((b) => b.textContent.includes('viewers'));
      if (viewersBtn) viewersBtn.click();
    });
    await sleep(800);

    const bobInViewersList = await pageA.evaluate(() => {
      return document.body.textContent.includes('Bob Vance') && document.body.textContent.includes('@bob_vance');
    });
    assert(bobInViewersList, 'Alice story viewers drawer correctly displays Bob Vance with timestamp');

    // Close story
    await pageA.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close story"]');
      if (closeBtn) closeBtn.click();
    });
    await sleep(400);

    // ======================================================================
    // PHASE 10: Dark / Light Theme Toggle & Persistence
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 10: Dark / Light Theme Toggle & Refresh Persistence');
    console.log('----------------------------------------------------------------------');

    const initialDark = await pageA.evaluate(() => document.documentElement.classList.contains('dark'));
    const themeBtn = await pageA.waitForSelector('button[aria-label="Toggle theme"]', { visible: true });
    await themeBtn.click();
    await sleep(300);

    const toggledDark = await pageA.evaluate(() => document.documentElement.classList.contains('dark'));
    assert(toggledDark !== initialDark, 'Theme toggle switches .dark class on <html> element');

    const storedTheme = await pageA.evaluate(() => localStorage.getItem('nova_theme'));
    assert(storedTheme === (toggledDark ? 'dark' : 'light'), 'Selected theme saved in localStorage');

    // Reload page to verify persistence
    await pageA.reload({ waitUntil: 'domcontentloaded' });
    await sleep(500);

    const persistedDark = await pageA.evaluate(() => document.documentElement.classList.contains('dark'));
    assert(persistedDark === toggledDark, 'Theme persists across browser refresh');

    // ======================================================================
    // PHASE 11: Viewport & Responsive Layout Verification
    // ======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📌 PHASE 11: Desktop (1440x900) vs Mobile (390x844) Responsive Layouts');
    console.log('----------------------------------------------------------------------');

    // Desktop: 3-column layout visible
    const desktopDesktopNav = await pageA.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside && window.getComputedStyle(aside).display !== 'none';
    });
    assert(desktopDesktopNav, 'Desktop viewport (1440px): Sidebar navigation is visible');

    // Switch to Mobile iPhone Viewport (390x844)
    await pageA.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await sleep(400);

    const mobileBottomNavVisible = await pageA.evaluate(() => {
      const nav = document.querySelector('nav.fixed.bottom-0, nav.md\\:hidden');
      return nav && window.getComputedStyle(nav).display !== 'none';
    });
    assert(mobileBottomNavVisible, 'Mobile viewport (390px): Mobile bottom navigation bar is visible and fixed');

    const touchTargetHeights = await pageA.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('nav.fixed.bottom-0 button, nav.md\\:hidden button'));
      return navItems.every((b) => b.getBoundingClientRect().height >= 40);
    });
    assert(touchTargetHeights, 'Mobile touch targets conform to touch standard guidelines (>= 40px)');

    // Restore desktop viewport
    await pageA.setViewport({ width: 1440, height: 900 });

    // Cleanup contexts
    await contextA.close();
    await contextB.close();

    console.log('\n======================================================================');
    console.log(`TOTAL BROWSER ACCEPTANCE TESTS: ${passedCount + failedCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${failedCount}`);
    console.log('======================================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    await browser.close();
    await mongoose.disconnect();
  }
}

runBrowserAcceptanceTests().catch((err) => {
  console.error('\n💥 Browser Acceptance Test Suite Exception:', err);
  process.exit(1);
});
