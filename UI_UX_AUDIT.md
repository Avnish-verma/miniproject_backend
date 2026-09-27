# NOVA UI/UX Redesign Audit

**Date:** September 2026  
**Auditor:** Senior Product Designer & Frontend Visual-System Engineer  
**Objective:** Transform NOVA from an AI-generated/template aesthetic into a distinctive, human-designed consumer social product adhering to the core design personality: **Editorial + Minimal + Premium + Social + Human + Confident**.

---

## 1. High-Level Findings & Anti-Patterns Identified

| Issue Category | Current State & Flaws | Why It Looks AI-Generated / Generic | Target State in New Design System |
| :--- | :--- | :--- | :--- |
| **Color Language** | Mixed electric blue (`#0095F6`) and generic monochrome stark black/white with leftover remnants. | Electric blue is the standard Twitter/Instagram clone default; stark black/white lacks editorial warmth. | Warm editorial neutral base (Light `#FAFAF8`/`#FFFFFF`, Dark `#0D0D0D`/`#151515`) with signature coral accent (`#FF5C35` light / `#FF6845` dark). |
| **Typography** | Default system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI"`). | Inconsistent font rendering across platforms; lacks custom editorial voice. | **Plus Jakarta Sans** uniformly applied with strict hierarchy (Display 32–40px, Page 24–30px, Section 18–20px, Body 14–16px, Meta 12–14px, Button 14px/600). |
| **Border Radii** | Mix of `rounded-full` capsules for buttons and `rounded-2xl` / `rounded-3xl` cards. | Everything as a pill or oversized round card screams "template UI". | Restrained radius hierarchy: Controls 8px, Buttons/Inputs 9–10px, Cards 12–14px, Large surfaces 16px. Pills only for semantic badges. |
| **Navigation & Shell** | Sidebar width jumps from 64px (`w-16`) to 256px (`xl:w-64`). Fixed right sidebar forced into feed. | Feels like a dashboard rail rather than a breathing social navigation column. | Dedicated 230–250px quiet, elegant rail with structured sections and dividers. Right rail optional and excluded from Messages, Calls, and Settings. |
| **Messages (Chat)** | Rounded capsule composer and heavy blue bubble fills. | Looks like an iMessage/WhatsApp copycat rather than an editorial social messenger. | Natural message bubbles with restrained 14px radius (4px sender corner), warm editorial surfaces, high-contrast typography, and 18px icons. |
| **Call UI** | Full-screen black background with high border contrast and generic bounce indicators. | Looks like a video-conferencing tool rather than a consumer 1-to-1 social call. | Dedicated cinematic communication space with warm ambient backdrop, audio-focused avatar cards, and minimal 18px tactile controls. |
| **Post Composer** | Modal with standard form inputs and oversized full-width buttons. | AI dashboard modal pattern. | Compact, content-first composer ("What's happening?"), 9–10px buttons, clean media preview with subtle dismiss. |

---

## 2. Detailed Component Audit & Priority Matrix

### A. Core Architecture & Navigation (`AppLayout.jsx`, `App.jsx`)
- **Current Problem**: Navigation links use full capsule pills (`rounded-full`) with active background `bg-neutral-100 dark:bg-neutral-900`. Right rail is displayed rigidly.
- **Why It Looks Generic**: AI templates overuse capsules for every interactive list item.
- **Recommended Change**:
  - Restructure navigation into 3 clean groups:
    1. NOVA Brand + Home, Discover, Create (with composer trigger)
    2. Hairline divider + Messages, Calls, Notifications
    3. Hairline divider + Profile, Settings
  - Subtle active state: stronger font weight (650), small coral accent indicator (`#FF5C35` / `#FF6845`), delicate background tint.
  - Rail width locked to `240px` with breathing room.
  - Right rail rendered conditionally: Home (optional suggestions & trends), Discover (optional), Profile (optional); **disabled** on Messages, Calls, and Settings.
- **Priority**: **P0 (Critical)**

### B. Messaging & Real-Time Chat (`ChatView.jsx`)
- **Current Problem**: Highest user priority screen. Blue bubbles (`#0095F6`), pill inputs, and cramped conversation items.
- **Why It Looks Generic**: Typical template chat widget.
- **Recommended Change**:
  - Dual-pane layout with clean conversation list (avatar, online indicator, unread counter badge, timestamp, snippet).
  - Active conversation highlighted with warm background and delicate accent line.
  - Message bubbles styled with editorial typography, restrained radius (`rounded-[14px] rounded-br-[4px]` for sender, `rounded-[14px] rounded-bl-[4px]` for recipient).
  - Real-time typing indicators with subtle pulse, online status emerald dot, and clean 18px call trigger buttons.
  - Composer input with 9–10px radius, subtle border, and tactile send trigger.
- **Priority**: **P0 (Highest UI Priority)**

### C. Design Tokens & Styling (`tokens.js`, `index.css`, `index.html`)
- **Current Problem**: CSS variables in `index.css` still declare old blue accent (`#0095F6`) and default system fonts. Plus Jakarta Sans is missing.
- **Why It Looks Generic**: Lacks a distinct typographic and color identity.
- **Recommended Change**:
  - Load Plus Jakarta Sans in `index.html` (400, 500, 600, 700 weights).
  - Update `tokens.js` and `index.css` with warm neutral palette:
    - Light: Background `#FAFAF8`, Surface `#FFFFFF`, Primary `#111111`, Secondary `#6B6B6B`, Border `#E7E5E2`, Accent `#FF5C35`, Success `#16845B`, Danger `#D64545`.
    - Dark: Background `#0D0D0D`, Surface `#151515`, Primary `#F5F5F5`, Secondary `#A0A0A0`, Border `#292929`, Accent `#FF6845`, Success `#38A878`, Danger `#E05252`.
  - Create `typography.js`, `spacing.js`, `motion.js`, and `README.md` under `client/src/design/`.
- **Priority**: **P0 (Critical Foundation)**

### D. Button & Input Primitives (`Button.jsx`, `Input.jsx`)
- **Current Problem**: Buttons use capsules or generic radii with electric blue accents.
- **Why It Looks Generic**: Capsule buttons are an overused SaaS trope.
- **Recommended Change**:
  - Standardize radius to 9–10px (`rounded-[9px]`).
  - Standardize primary button height: 40–44px, 14px font, weight 600.
  - Add signature coral accent variant (`#FF5C35` / `#FF6845`) alongside high-contrast primary neutral.
  - Interactive Follow button with smooth state transitions.
  - Create dedicated `Input.jsx` primitive with 9–10px radius, subtle focus border, and no glowing ring.
- **Priority**: **P1 (High)**

### E. Social Feed & Post Cards (`FeedPage.jsx`, `PostCard.jsx`, `PostComposer.jsx`)
- **Current Problem**: Tab underlines and composer prompt use old blue accents; post actions need editorial polish.
- **Why It Looks Generic**: Standard card-in-card elements and electric blue indicators.
- **Recommended Change**:
  - Continuous stream timeline with hairline dividers (`border-b border-[#E7E5E2] dark:border-[#292929]`).
  - Sticky tabs with subtle accent underline (`#FF5C35` / `#FF6845`).
  - Editorial post card layout: author avatar, bold name, handle, relative timestamp, media aspect ratio, clean action bar with 18px icons, inline comments drawer.
  - Quick inline composer and modal composer with clean 9–10px buttons and warm surfaces.
- **Priority**: **P1 (High)**

### F. Profile Page (`ProfilePage.jsx`)
- **Current Problem**: Stat cards look like SaaS metrics boxes; edit modal has generic styling.
- **Why It Looks Generic**: Resembles an admin user overview.
- **Recommended Change**:
  - True consumer social profile header: clean cover area, prominent avatar with hairline ring, bold name, `@handle`, bio with link highlighting.
  - Horizontal stats row with strong typography (`1.2K` bold, `Followers` muted).
  - Editorial segmented tabs: Posts, Media, Saved.
  - View switcher (3-column grid vs continuous timeline).
- **Priority**: **P1 (High)**

### G. Discover Page (`DiscoverPage.jsx`)
- **Current Problem**: Search and filter pills look like SaaS search filters.
- **Why It Looks Generic**: Overuse of pill badges and card grids.
- **Recommended Change**:
  - Compact search header with 9–10px input.
  - Editorial exploration layout: Trending topics with post volume, suggested people with 1-click follow, asymmetric media grid with hover metrics.
- **Priority**: **P1 (High)**

### H. Calls Experience (`CallOverlay.jsx`, `CallDebugPanel.jsx`)
- **Current Problem**: Overly high-contrast dark box with bouncing badges.
- **Why It Looks Generic**: AI-generated call mockups.
- **Recommended Change**:
  - Incoming call toast: warm dark surface, avatar pulse, clear call type, circular green accept and red decline buttons.
  - In-call stage: cinematic dark canvas, remote video full stage, local PIP thumbnail with 12px radius, minimal floating pill dock with 18px icons (Mic, Video, End).
  - Voice call mode: centered avatar card with subtle audio waves, no empty black void.
  - Telemetry HUD: clean, collapsible developer panel in neutral dark tone.
- **Priority**: **P1 (High)**

### I. Notifications Stream (`NotificationDrawer.jsx`)
- **Current Problem**: Drawer with generic list styling.
- **Why It Looks Generic**: Template activity stream.
- **Recommended Change**:
  - Continuous hairline list with category badges (Heart for likes, Bubble for comments, UserPlus for follows, Phone for calls).
  - Coral accent unread dot indicator.
  - 1-click Follow button on follower alerts.
- **Priority**: **P2 (Medium)**

### J. Settings & Authentication (`SettingsPage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`)
- **Current Problem**: Settings has dashboard widgets; auth cards lack warm editorial feel.
- **Why It Looks Generic**: Standard authentication template.
- **Recommended Change**:
  - Single-column focused settings page with clean hairline sections, smooth coral/warm toggle switch, and theme selector.
  - Auth pages with warm canvas, 14px radius card, monochrome brand glyph with subtle coral dot, clean 9–10px inputs, and one-click demo chips.
- **Priority**: **P2 (Medium)**

---

## 3. Execution Plan

1. **Tokens & System Setup**: Load Plus Jakarta Sans, update `tokens.js`, create `typography.js`, `spacing.js`, `motion.js`, `README.md`, update `index.css`.
2. **Primitives**: Standardize `Button.jsx`, create `Input.jsx`, refine `Avatar.jsx`.
3. **App Shell & Navigation**: Rebuild `AppLayout.jsx` with 240px rail, structured sections, dividers, subtle active state, optional right rail, and mobile bar.
4. **Messages Redesign**: Elevate `ChatView.jsx` as the flagship communication experience.
5. **Feed & Posts Redesign**: Update `FeedPage.jsx`, `PostCard.jsx`, `PostComposer.jsx`.
6. **Profile Redesign**: Update `ProfilePage.jsx`.
7. **Discover Redesign**: Update `DiscoverPage.jsx`.
8. **Calls Redesign**: Update `CallOverlay.jsx`.
9. **Notifications Redesign**: Update `NotificationDrawer.jsx`.
10. **Settings & Auth Redesign**: Update `SettingsPage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`.
11. **Verification**: Full client build, automated security tests (11/11), realtime/calling tests (29/29).
12. **Documentation**: Create `DESIGN_SYSTEM.md` and complete final visual QA report.
