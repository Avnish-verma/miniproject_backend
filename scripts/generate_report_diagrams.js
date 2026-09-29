const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.join(__dirname, '../report_assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

async function renderDiagram(browser, filename, width, height, htmlContent) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: #FFFFFF; width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `, { waitUntil: 'networkidle0' });

  const buffer = await page.screenshot({ type: 'png' });
  fs.writeFileSync(path.join(ASSETS_DIR, filename), buffer);
  console.log(`Rendered ${filename}`);
  await page.close();
}

async function main() {
  console.log('Rendering publication-grade report diagrams...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // 1. System Architecture Diagram
    await renderDiagram(browser, 'fig_architecture.png', 800, 480, `
      <div style="width: 780px; height: 460px; border: 1.5px solid #CBD5E1; border-radius: 8px; background: #F8FAFC; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="text-align: center; border-bottom: 2px solid #2563EB; padding-bottom: 8px;">
          <h2 style="color: #0F172A; font-size: 18px; font-weight: 700;">ShiftAura 3-Tier Multi-Layer Application Architecture</h2>
          <p style="color: #64748B; font-size: 11px;">Client PWA Layer • Application & Signaling Layer • Persistent Data & Cloud Services Layer</p>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 15px; margin-top: 10px; height: 350px;">
          <!-- Tier 1: Client -->
          <div style="flex: 1; background: #FFFFFF; border: 1.5px solid #93C5FD; border-radius: 6px; padding: 12px; display: flex; flex-direction: column;">
            <div style="background: #EFF6FF; color: #1D4ED8; font-weight: 700; font-size: 12px; padding: 6px; text-align: center; border-radius: 4px; margin-bottom: 10px;">
              CLIENT TIER (PWA)
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #334155;">
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #3B82F6;"><strong>React 19 Single Page App</strong><br/><span style="color:#64748B; font-size:9.5px;">Component-driven UI, Tailwind CSS</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #3B82F6;"><strong>Vite 6 Build System</strong><br/><span style="color:#64748B; font-size:9.5px;">HMR, Rollup production bundle</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #3B82F6;"><strong>Service Worker (sw.js)</strong><br/><span style="color:#64748B; font-size:9.5px;">Offline cache, Web Push, Actions</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #3B82F6;"><strong>WebRTC Client Engine</strong><br/><span style="color:#64748B; font-size:9.5px;">RTCPeerConnection, MediaStreams</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #3B82F6;"><strong>Socket.IO Client</strong><br/><span style="color:#64748B; font-size:9.5px;">Duplex WS fallback, typing, receipts</span></div>
            </div>
          </div>

          <!-- Tier 2: Server -->
          <div style="flex: 1; background: #FFFFFF; border: 1.5px solid #86EFAC; border-radius: 6px; padding: 12px; display: flex; flex-direction: column;">
            <div style="background: #F0FDF4; color: #15803D; font-weight: 700; font-size: 12px; padding: 6px; text-align: center; border-radius: 4px; margin-bottom: 10px;">
              APPLICATION & SIGNALING TIER
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #334155;">
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #22C55E;"><strong>Node.js & Express 5 API</strong><br/><span style="color:#64748B; font-size:9.5px;">REST routing, MVC Controllers</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #22C55E;"><strong>Socket.IO Realtime Server</strong><br/><span style="color:#64748B; font-size:9.5px;">Presence, messaging, call dispatch</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #22C55E;"><strong>JWT Security Pipeline</strong><br/><span style="color:#64748B; font-size:9.5px;">Access & refresh tokens, bcrypt</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #22C55E;"><strong>Web Push VAPID Service</strong><br/><span style="color:#64748B; font-size:9.5px;">FCM/APNs endpoint encryption</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #22C55E;"><strong>Media & Mailer Dispatcher</strong><br/><span style="color:#64748B; font-size:9.5px;">Cloudinary uploader, Resend client</span></div>
            </div>
          </div>

          <!-- Tier 3: Data & Cloud -->
          <div style="flex: 1; background: #FFFFFF; border: 1.5px solid #FDE047; border-radius: 6px; padding: 12px; display: flex; flex-direction: column;">
            <div style="background: #FEFCE8; color: #A16207; font-weight: 700; font-size: 12px; padding: 6px; text-align: center; border-radius: 4px; margin-bottom: 10px;">
              DATA & EXTERNAL CLOUD TIER
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #334155;">
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #EAB308;"><strong>MongoDB Atlas Database</strong><br/><span style="color:#64748B; font-size:9.5px;">Document store, compound indexing</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #EAB308;"><strong>Cloudinary Media CDN</strong><br/><span style="color:#64748B; font-size:9.5px;">HLS streaming, auto-webp conversion</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #EAB308;"><strong>Resend Email API</strong><br/><span style="color:#64748B; font-size:9.5px;">DKIM verified transactional emails</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #EAB308;"><strong>Google STUN Infrastructure</strong><br/><span style="color:#64748B; font-size:9.5px;">NAT traversal, reflexive ICE candidate</span></div>
              <div style="background: #F1F5F9; padding: 6px; border-radius: 4px; border-left: 3px solid #EAB308;"><strong>Web Push Services (FCM/Mozilla)</strong><br/><span style="color:#64748B; font-size:9.5px;">OS notification delivery hub</span></div>
            </div>
          </div>
        </div>
      </div>
    `);

    // 2. DFD Level 0 (Context Diagram)
    await renderDiagram(browser, 'fig_dfd_level0.png', 800, 360, `
      <div style="width: 780px; height: 340px; border: 1.5px solid #CBD5E1; border-radius: 8px; background: #FFFFFF; padding: 25px; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="text-align: center; border-bottom: 2px solid #0284C7; padding-bottom: 6px;">
          <h2 style="color: #0F172A; font-size: 16px; font-weight: 700;">Data Flow Diagram (Level 0 — Context Diagram)</h2>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-around; height: 250px;">
          <!-- Entity: User -->
          <div style="width: 140px; height: 100px; border: 2px solid #1E293B; background: #F8FAFC; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8px;">
            <strong style="font-size: 13px; color: #0F172A;">User / Client Browser</strong>
            <span style="font-size: 10px; color: #64748B; margin-top: 4px;">(Authenticated Client)</span>
          </div>

          <!-- Arrows Left -->
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 10px; color: #334155; text-align: center;">
            <div style="background: #E0F2FE; padding: 4px 8px; border-radius: 4px;">Credentials, Posts, Messages, Call Requests &rarr;</div>
            <div style="background: #DCFCE7; padding: 4px 8px; border-radius: 4px;">&larr; JWT Tokens, Realtime Feeds, P2P Streams, Push</div>
          </div>

          <!-- Central Process: ShiftAura System -->
          <div style="width: 170px; height: 120px; border: 2px solid #2563EB; background: #EFF6FF; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10px;">
            <span style="font-size: 11px; font-weight: 700; color: #1D4ED8;">Process 0.0</span>
            <strong style="font-size: 13px; color: #0F172A; margin-top: 2px;">ShiftAura Platform</strong>
            <span style="font-size: 9px; color: #64748B;">Core Server & Engine</span>
          </div>

          <!-- Arrows Right -->
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 10px; color: #334155; text-align: center;">
            <div style="background: #FEF3C7; padding: 4px 8px; border-radius: 4px;">Queries, Media Uploads, Push Notifications &rarr;</div>
            <div style="background: #F1F5F9; padding: 4px 8px; border-radius: 4px;">&larr; Persisted Data, Media URLs, VAPID ACKs</div>
          </div>

          <!-- Entity: External Cloud Services -->
          <div style="width: 150px; height: 110px; border: 2px solid #1E293B; background: #F8FAFC; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8px;">
            <strong style="font-size: 12px; color: #0F172A;">External Cloud Providers</strong>
            <span style="font-size: 9.5px; color: #64748B; margin-top: 4px;">MongoDB Atlas<br/>Cloudinary CDN<br/>Resend / WebPush FCM</span>
          </div>
        </div>
      </div>
    `);

    // 3. DFD Level 1 (Subsystem Decomposition)
    await renderDiagram(browser, 'fig_dfd_level1.png', 800, 480, `
      <div style="width: 780px; height: 460px; border: 1.5px solid #CBD5E1; border-radius: 8px; background: #FFFFFF; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="text-align: center; border-bottom: 2px solid #0284C7; padding-bottom: 4px;">
          <h2 style="color: #0F172A; font-size: 16px; font-weight: 700;">Data Flow Diagram (Level 1 — Subsystem Decomposition)</h2>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 10px;">
          <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px; background: #F8FAFC;">
            <div style="color: #2563EB; font-weight: 700; font-size: 12px;">Process 1.0: Auth & Identity Management</div>
            <p style="font-size: 10px; color: #475569; margin-top: 4px;">Validates user registration, password hashing (bcrypt), JWT generation, OTP password resets via Resend, and session validation.</p>
          </div>
          <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px; background: #F8FAFC;">
            <div style="color: #16A34A; font-weight: 700; font-size: 12px;">Process 2.0: Real-Time Chat & Messaging</div>
            <p style="font-size: 10px; color: #475569; margin-top: 4px;">Socket.IO events (<code style="background:#E2E8F0; padding:1px 3px;">chat:send</code>, <code style="background:#E2E8F0; padding:1px 3px;">chat:typing</code>, <code style="background:#E2E8F0; padding:1px 3px;">chat:read</code>). Stores messages in MongoDB and triggers background push alerts.</p>
          </div>
          <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px; background: #F8FAFC;">
            <div style="color: #9333EA; font-weight: 700; font-size: 12px;">Process 3.0: WebRTC Audio/Video Signaling</div>
            <p style="font-size: 10px; color: #475569; margin-top: 4px;">Exchanges SDP Offers, Answers, and ICE candidates. Tracks call status (ringing, accepted, missed, ended) and guards against duplicate sessions.</p>
          </div>
          <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px; background: #F8FAFC;">
            <div style="color: #EA580C; font-weight: 700; font-size: 12px;">Process 4.0: Social Feed & Stories Engine</div>
            <p style="font-size: 10px; color: #475569; margin-top: 4px;">Handles media uploads to Cloudinary CDN, 24h TTL story expirations, post creation, like/comment graph updates, and tag discovery.</p>
          </div>
        </div>

        <div style="border-top: 1px solid #CBD5E1; padding-top: 8px; display: flex; justify-content: space-around; font-size: 10px; color: #64748B;">
          <span><strong>Data Stores:</strong> Users Collection • Posts Collection • Messages Collection • Calls Collection • PushSubs Collection</span>
        </div>
      </div>
    `);

    // 4. ER Diagram
    await renderDiagram(browser, 'fig_er_diagram.png', 800, 480, `
      <div style="width: 780px; height: 460px; border: 1.5px solid #CBD5E1; border-radius: 8px; background: #FFFFFF; padding: 15px; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="text-align: center; border-bottom: 2px solid #7C3AED; padding-bottom: 4px;">
          <h2 style="color: #0F172A; font-size: 16px; font-weight: 700;">Entity-Relationship (ER) Schema Model</h2>
          <p style="color: #64748B; font-size: 10.5px;">MongoDB Document Schemas, Inter-Collection References, and Relational Cardinalities</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px;">
          <!-- User Entity -->
          <div style="border: 1.5px solid #2563EB; border-radius: 4px; overflow: hidden; font-size: 9.5px;">
            <div style="background: #2563EB; color: white; font-weight: bold; padding: 4px 6px; text-align: center;">USER (Entity)</div>
            <div style="padding: 6px; background: #F8FAFC; line-height: 1.4;">
              <div><strong>_id:</strong> ObjectId (PK)</div>
              <div><strong>userId / username:</strong> String (Unique)</div>
              <div><strong>email:</strong> String (Unique)</div>
              <div><strong>password:</strong> String (bcrypt hash)</div>
              <div><strong>followers:</strong> Array [ObjectId &rarr; User]</div>
              <div><strong>following:</strong> Array [ObjectId &rarr; User]</div>
              <div><strong>isVerified:</strong> Boolean</div>
            </div>
          </div>

          <!-- Post Entity -->
          <div style="border: 1.5px solid #16A34A; border-radius: 4px; overflow: hidden; font-size: 9.5px;">
            <div style="background: #16A34A; color: white; font-weight: bold; padding: 4px 6px; text-align: center;">POST (Entity)</div>
            <div style="padding: 6px; background: #F8FAFC; line-height: 1.4;">
              <div><strong>_id:</strong> ObjectId (PK)</div>
              <div><strong>postedBy:</strong> ObjectId (FK &rarr; User)</div>
              <div><strong>caption:</strong> String</div>
              <div><strong>media:</strong> Array [URL, type]</div>
              <div><strong>likes:</strong> Array [ObjectId &rarr; User]</div>
              <div><strong>comments:</strong> Array [text, user, date]</div>
              <div><strong>createdAt:</strong> Date (Indexed)</div>
            </div>
          </div>

          <!-- Message Entity -->
          <div style="border: 1.5px solid #D97706; border-radius: 4px; overflow: hidden; font-size: 9.5px;">
            <div style="background: #D97706; color: white; font-weight: bold; padding: 4px 6px; text-align: center;">MESSAGE (Entity)</div>
            <div style="padding: 6px; background: #F8FAFC; line-height: 1.4;">
              <div><strong>_id:</strong> ObjectId (PK)</div>
              <div><strong>conversation:</strong> ObjectId (FK &rarr; Conv)</div>
              <div><strong>sender:</strong> ObjectId (FK &rarr; User)</div>
              <div><strong>recipient:</strong> ObjectId (FK &rarr; User)</div>
              <div><strong>text:</strong> String</div>
              <div><strong>status:</strong> sent | delivered | read</div>
              <div><strong>readAt:</strong> Date</div>
            </div>
          </div>

          <!-- Call Entity -->
          <div style="border: 1.5px solid #DC2626; border-radius: 4px; overflow: hidden; font-size: 9.5px;">
            <div style="background: #DC2626; color: white; font-weight: bold; padding: 4px 6px; text-align: center;">CALL (Entity)</div>
            <div style="padding: 6px; background: #F8FAFC; line-height: 1.4;">
              <div><strong>_id:</strong> ObjectId (PK)</div>
              <div><strong>caller:</strong> ObjectId (FK &rarr; User)</div>
              <div><strong>callee:</strong> ObjectId (FK &rarr; User)</div>
              <div><strong>callType:</strong> audio | video</div>
              <div><strong>status:</strong> ringing | accepted | missed...</div>
              <div><strong>duration:</strong> Number (seconds)</div>
              <div><strong>startedAt / endedAt:</strong> Date</div>
            </div>
          </div>

          <!-- Story Entity -->
          <div style="border: 1.5px solid #0891B2; border-radius: 4px; overflow: hidden; font-size: 9.5px;">
            <div style="background: #0891B2; color: white; font-weight: bold; padding: 4px 6px; text-align: center;">STORY (Entity)</div>
            <div style="padding: 6px; background: #F8FAFC; line-height: 1.4;">
              <div><strong>_id:</strong> ObjectId (PK)</div>
              <div><strong>user:</strong> ObjectId (FK &rarr; User)</div>
              <div><strong>mediaUrl:</strong> String</div>
              <div><strong>mediaType:</strong> image | video</div>
              <div><strong>duration:</strong> Number (sec)</div>
              <div><strong>viewers:</strong> Array [ObjectId &rarr; User]</div>
              <div><strong>createdAt:</strong> Date (TTL 24h index)</div>
            </div>
          </div>

          <!-- Push Subscription Entity -->
          <div style="border: 1.5px solid #4F46E5; border-radius: 4px; overflow: hidden; font-size: 9.5px;">
            <div style="background: #4F46E5; color: white; font-weight: bold; padding: 4px 6px; text-align: center;">PUSH SUBSCRIPTION</div>
            <div style="padding: 6px; background: #F8FAFC; line-height: 1.4;">
              <div><strong>_id:</strong> ObjectId (PK)</div>
              <div><strong>user:</strong> ObjectId (FK &rarr; User)</div>
              <div><strong>endpoint:</strong> String (Unique)</div>
              <div><strong>keys.p256dh:</strong> String</div>
              <div><strong>keys.auth:</strong> String</div>
              <div><strong>userAgent:</strong> String</div>
              <div><strong>updatedAt:</strong> Date</div>
            </div>
          </div>
        </div>

        <div style="text-align: center; font-size: 9.5px; color: #475569; margin-top: 6px;">
          Cardinalities: User 1:N Post • User 1:N Story • User 1:N Call (as Caller/Callee) • User 1:N PushSubscription • User N:M User (Following/Followers)
        </div>
      </div>
    `);

    // 5. High-Fidelity UI Screens Snapshot
    await renderDiagram(browser, 'fig_ui_screens.png', 800, 480, `
      <div style="width: 780px; height: 460px; border: 1.5px solid #CBD5E1; border-radius: 8px; background: #0F172A; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; color: white;">
        <div style="text-align: center; border-bottom: 1px solid #334155; padding-bottom: 6px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #38BDF8;">ShiftAura Progressive Web App — Production User Interface Highlights</h2>
          <p style="font-size: 10px; color: #94A3B8;">Real-Time Social Feed • P2P WebRTC Video Call Mini-Dock • Chat & Read Receipts • PWA Native Install</p>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 10px; height: 350px;">
          <!-- Screen 1: Feed & Stories -->
          <div style="flex: 1; background: #1E293B; border-radius: 6px; border: 1px solid #334155; padding: 10px; display: flex; flex-direction: column; font-size: 10px;">
            <div style="color: #38BDF8; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #334155; padding-bottom: 4px;">1. Social Feed & Ephemeral Stories</div>
            <div style="display: flex; gap: 6px; margin-bottom: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #38BDF8; background: #334155; display: flex; align-items: center; justify-content: center; font-size: 9px;">You</div>
              <div style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #EC4899; background: #334155; display: flex; align-items: center; justify-content: center; font-size: 9px;">Alex</div>
              <div style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #10B981; background: #334155; display: flex; align-items: center; justify-content: center; font-size: 9px;">Dev</div>
            </div>
            <div style="background: #0F172A; border-radius: 4px; padding: 8px; flex: 1;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-weight: bold; color: #E2E8F0;">@avnish_verma</span>
                <span style="color: #64748B; font-size: 8px;">Just now</span>
              </div>
              <div style="background: #334155; height: 110px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 10px;">
                [High-Res Video Post Stream - 1080p]
              </div>
              <div style="display: flex; gap: 10px; margin-top: 6px; color: #94A3B8; font-size: 9px;">
                <span>❤️ 248 Likes</span>
                <span>💬 32 Comments</span>
                <span>🔖 Saved</span>
              </div>
            </div>
          </div>

          <!-- Screen 2: Realtime Chat & Video Call Dock -->
          <div style="flex: 1; background: #1E293B; border-radius: 6px; border: 1px solid #334155; padding: 10px; display: flex; flex-direction: column; font-size: 10px; position: relative;">
            <div style="color: #34D399; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #334155; padding-bottom: 4px;">2. Real-Time Chat & WebRTC Dock</div>
            <div style="background: #0F172A; border-radius: 4px; padding: 8px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="align-self: flex-start; background: #334155; padding: 5px 8px; border-radius: 6px; max-width: 80%;">
                  Hey, did the Web Push notification arrive?
                </div>
                <div style="align-self: flex-end; background: #2563EB; color: white; padding: 5px 8px; border-radius: 6px; max-width: 80%;">
                  Yes! Answer/Decline actions work in background ✓✓
                </div>
                <div style="color: #38BDF8; font-size: 8px; font-style: italic;">
                  Alex is typing...
                </div>
              </div>

              <!-- Floating Mini-Dock -->
              <div style="margin-top: 10px; background: #1E293B; border: 1.5px solid #22C55E; border-radius: 6px; padding: 8px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #22C55E; animation: pulse 1s infinite;"></div>
                  <span style="font-weight: bold; font-size: 9px;">Active Video Call (02:14)</span>
                </div>
                <div style="display: flex; gap: 4px;">
                  <span style="background: #3B82F6; padding: 2px 6px; border-radius: 3px; font-size: 8px;">Maximize</span>
                  <span style="background: #EF4444; padding: 2px 6px; border-radius: 3px; font-size: 8px;">End</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Screen 3: PWA Install & Settings -->
          <div style="flex: 1; background: #1E293B; border-radius: 6px; border: 1px solid #334155; padding: 10px; display: flex; flex-direction: column; font-size: 10px;">
            <div style="color: #FBBF24; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #334155; padding-bottom: 4px;">3. Installed PWA & Web Push Settings</div>
            <div style="background: #0F172A; border-radius: 4px; padding: 8px; flex: 1; display: flex; flex-direction: column; gap: 8px;">
              <div style="border: 1px solid #38BDF8; border-radius: 4px; padding: 6px; background: rgba(56,189,248,0.1);">
                <div style="font-weight: bold; color: #38BDF8; font-size: 9.5px;">Install ShiftAura App</div>
                <div style="color: #94A3B8; font-size: 8.5px; margin: 3px 0;">Install for instant messaging, full-screen calling, and home screen icon.</div>
                <span style="background: #2563EB; color: white; padding: 2px 8px; border-radius: 3px; font-size: 8.5px; font-weight: bold;">[Install Now]</span>
              </div>
              <div style="font-size: 9px; color: #E2E8F0; display: flex; flex-direction: column; gap: 5px;">
                <div style="display: flex; justify-content: space-between;"><span>Push Notifications:</span><span style="color:#22C55E; font-weight:bold;">● Enabled</span></div>
                <div style="display: flex; justify-content: space-between;"><span>Incoming Call Alerts:</span><span style="color:#22C55E;">ON</span></div>
                <div style="display: flex; justify-content: space-between;"><span>Message Grouping:</span><span style="color:#22C55E;">Active</span></div>
                <div style="display: flex; justify-content: space-between;"><span>Sound & Vibration:</span><span style="color:#22C55E;">ON</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    console.log('All diagrams successfully generated in report_assets/ !');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
