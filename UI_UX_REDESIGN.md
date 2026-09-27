# NOVA UI/UX Redesign Specification & Architecture

**Document Version**: 2.0  
**Status**: Implemented & Verified in Client Build  
**Design System**: NOVA Precision Editorial System

---

## 1. The Transformation: From "AI Template Slop" to Bespoke Standalone Platform

### What Was Wrong With the Previous UI:
1. **Generic AI Aesthetic**:
   - Pervasive multi-stop purple/indigo gradients (`bg-gradient-to-tr from-indigo-600 to-indigo-400`, `bg-gradient-to-r from-indigo-500 to-indigo-300`).
   - Saturated, heavy drop shadows with colored glows (`shadow-indigo-500/30`).
   - Bubbly `rounded-3xl` containers resembling generic mobile app mockups.
   - Saturated solid purple blocks for sidebar active states that looked like generic SaaS dashboards.
2. **Instagram Clone Remnants**:
   - Centered feed relying on generic photo-card patterns rather than a general-purpose real-time communication platform.
3. **Typography & Information Hierarchy**:
   - System default fonts with unstructured tracking.
   - Missing monospaced micro-labels and protocol indicators.

### The New NOVA Design Direction:
1. **Architectural & Editorial Typography**:
   - Monospaced protocol indicators (`font-mono text-[10px] tracking-wider uppercase`).
   - High-contrast typography with font smoothing (`-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`).
2. **Precision Surfaces & Hairline Borders**:
   - Replaced floating pillowy bubbles with structured, architectural panels.
   - Hairline borders (`rgba(255, 255, 255, 0.08)` in dark mode, `#E1E4E8` in light mode).
   - Deep ink canvas background (`#090A0F`), surface (`#0F1218`), and elevated workspace (`#151921`).
3. **Intentional, Restrained Color Palette**:
   - **Canvas / Surface**: Deep Ink / Slate (`#090A0F`, `#0F1218`).
   - **Primary Action**: Precision Cobalt Blue (`#2563EB` / `#3B82F6`), replacing gaudy purple gradients.
   - **Presence / Signal**: Live Emerald (`#10B981`) with pulse animations.
   - **Destructive / Alert**: Crimson Rose (`#F43F5E`).
4. **Communication-First Information Architecture**:
   - Left Navigation: High-density rail featuring the **N** geometric brand glyph, live status badges, and refined active pills.
   - Top Header: Command-palette search (`⌘K`), network telemetry pill (`● SIGNAL ACTIVE`).
   - Center Workspace: Dedicated stream/feed, real-time dual-pane messaging, or directory.
   - Right Context Rail: "ACTIVE PEER NODES" showing real-time presence, quick calling triggers, and DTLS-SRTP transport security status.

---

## 2. Design Tokens (`client/src/design/tokens.js`)

```javascript
export const TOKENS = {
  colors: {
    dark: {
      canvas: '#090A0F',
      surface: '#0F1218',
      surfaceElevated: '#151921',
      surfaceHover: '#1B212C',
      border: 'rgba(255, 255, 255, 0.08)',
      textPrimary: '#F0F3F8',
      textSecondary: '#8B949E',
      textMuted: '#525B68',
      accent: '#3B82F6',
      accentSubtle: 'rgba(59, 130, 246, 0.12)',
      success: '#10B981',
      danger: '#F43F5E',
    },
    light: {
      canvas: '#F4F5F7',
      surface: '#FFFFFF',
      surfaceHover: '#F8F9FA',
      border: '#E1E4E8',
      textPrimary: '#111827',
      textSecondary: '#4B5563',
      textMuted: '#9CA3AF',
      accent: '#2563EB',
      accentSubtle: 'rgba(37, 99, 235, 0.08)',
      success: '#059669',
      danger: '#E11D48',
    },
  },
  typography: {
    fontSans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
  },
};
```

---

## 3. Redesigned Components

### 3.1 AppLayout (`client/src/components/layout/AppLayout.jsx`)
* **Left Rail**:
  * Clean monochrome glyph: `N` in high-contrast tile.
  * Active link: subtle border + tinted background (`bg-blue-500/10 text-blue-400 border border-blue-500/20`), replacing solid saturated buttons.
  * Monospace notification badges.
  * "Publish Transmission" action button with keyboard focus states.
* **Header**:
  * Live network indicator: `SIGNAL ACTIVE` green beacon.
  * Command palette input with `⌘K` keyboard badge.
  * Clean profile chip with avatar and hairline divider.
* **Right Context Rail**:
  * Live peer nodes with online status pips and 1-click direct message triggers.
  * Transport security status card documenting DTLS-SRTP encryption.

### 3.2 Dual-Pane Chat (`client/src/components/chat/ChatView.jsx`)
* **Left Channel List**:
  * Channel count indicator (`N ACTIVE`).
  * Direct channels with avatar, online indicator, unread pill, and last transmission timestamp.
* **Right Conversation Pane**:
  * Header with instant WebRTC Voice & Video call buttons.
  * Distinct message bubbles:
    * Sender: Precision blue (`bg-blue-600 text-white rounded-xl shadow-sm`).
    * Peer: Neutral surface (`bg-gray-100 dark:bg-[#151921] border border-gray-200/70 dark:border-white/[0.06] text-gray-900 dark:text-gray-100 rounded-xl`).
  * Authentic status checkmarks:
    * Single gray check: `SENT`
    * Double gray check: `DELIVERED`
    * Double blue check: `READ`
  * Real-time typing bubble with subtle harmonic bouncing dots.
  * Clean command-style message input.

### 3.3 Stream & Publications (`PostCard.jsx` & `FeedPage.jsx`)
* **Publications Card**:
  * Crisp header with author, handle, and formatted monospace timestamp (`Sep 26, 06:45 PM`).
  * Content area with hashtag highlighting (`#tech` in blue).
  * Framed media viewport with dark letterbox background.
  * Minimal reaction bar with count indicators for likes and replies.
  * Threaded reply section with inline response form.

### 3.4 WebRTC Telemetry HUD (`CallDebugPanel.jsx`)
* Floating dev HUD positioned at bottom-right.
* Collapsible panel displaying live WebRTC states:
  * Signaling State (`stable`, `have-local-offer`, `have-remote-offer`)
  * ICE Connection State (`new`, `checking`, `connected`, `completed`)
  * Peer Connection State (`new`, `connecting`, `connected`)
  * Local & Remote Track Diagnostics (audio/video readyState and enable state)
  * Session duration and Call ID.
