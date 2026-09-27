# NOVA Design System & Visual Specification

**Version:** 2.0 (Editorial Social Communication)  
**Status:** Implemented & Verified  
**Aesthetic:** Editorial + Minimal + Premium + Social + Human + Confident

---

## 1. Design Personality & Principles

NOVA is a distinctive consumer social communication platform. It deliberately avoids AI-generated SaaS dashboard tropes:
* **No purple/blue gradients or glowing neon buttons.**
* **No card-inside-card nesting**; feeds use continuous streams with hairline dividers.
* **No oversized capsules**; buttons, inputs, and controls use a disciplined 8–10px radius.
* **Content-first & communication-first**: UI chrome is minimal, allowing words, photos, and live conversations to dominate.
* **Warm neutral canvas** with a signature coral accent (`#FF5C35` light / `#FF6845` dark) applied with intention and restraint.

---

## 2. Color System

### Light Mode
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `background` | `#FAFAF8` | Page canvas, soft warm background |
| `surface` | `#FFFFFF` | Cards, modals, chat container, inputs |
| `surfaceSubtle` | `#F4F3F0` | Hover states, pill containers, muted rows |
| `primaryText` | `#111111` | Primary headings, body copy, bold accents |
| `secondaryText` | `#6B6B6B` | Post handles, metadata, descriptions |
| `mutedText` | `#929292` | Timestamps, placeholders, inactive icons |
| `border` | `#E7E5E2` | Hairline dividers, subtle card borders |
| `accent` | `#FF5C35` | NOVA signature coral; primary CTAs, active dots |
| `accentHover` | `#E84A23` | Pressed & hover states on accent buttons |
| `success` | `#16845B` | Online presence, verification badges |
| `danger` | `#D64545` | Call decline, post deletion, unfollow warnings |

### Dark Mode
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `background` | `#0D0D0D` | Deep editorial dark canvas |
| `surface` | `#151515` | Container surfaces, chat panes, cards |
| `surfaceSubtle` | `#1C1C1C` | Hover states, active conversation item |
| `primaryText` | `#F5F5F5` | Headings, active conversation text |
| `secondaryText` | `#A0A0A0` | Meta labels, post subtitles |
| `mutedText` | `#707070` | Timestamps, placeholders |
| `border` | `#292929` | Hairline dividers, dark borders |
| `accent` | `#FF6845` | NOVA signature coral (dark mode) |
| `accentHover` | `#FF7D5D` | Hover on dark mode coral CTAs |
| `success` | `#38A878` | Online indicator, verified status |
| `danger` | `#E05252` | Error alerts, destructive actions |

---

## 3. Typography Scale (Plus Jakarta Sans)

| Level | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 32–36px | 700 (Bold) | 1.2 | Splash & landing headers |
| **Page Heading** | 22–26px | 700 (Bold) | 1.25 | Profile names, Settings title |
| **Section Heading** | 18–19px | 650 (Semibold) | 1.3 | Messages title, Calls title, Discover topics |
| **Subheading** | 15–16px | 600 (Semibold) | 1.4 | Post author names, conversation partners |
| **Body** | 14–15px | 400 (Regular) | 1.5 | Post caption text, message bubbles |
| **Meta / Secondary** | 12–13px | 450 (Medium) | 1.4 | Handles, timestamps, comment snippets |
| **Caption / Badge** | 10–11px | 600 (Semibold) | 1.0 | Unread counters, call status |
| **Button Text** | 13–14px | 600 (Semibold) | 1.0 | Button actions, modal triggers |

---

## 4. Disciplined Border Radius Scale

* **Small Controls**: `8px` (`rounded-[8px]`)
* **Buttons**: `9–10px` (`rounded-[9px]` or `rounded-[10px]`)
* **Inputs**: `9–10px` (`rounded-[9px]`)
* **Cards & Containers**: `12–14px` (`rounded-[12px]` or `rounded-[14px]`)
* **Large Surfaces & Modals**: `16px` (`rounded-[16px]`)
* **Pills**: `rounded-full` strictly reserved for badges (e.g. unread counts, status dots, online indicators).

---

## 5. Standardized Component System

### 1. Button System (`Button.jsx`)
* **Variants**:
  * `primary`: High-contrast solid (`#111111` in light, `#F5F5F5` in dark).
  * `accent`: NOVA coral (`#FF5C35` light / `#FF6845` dark) for signature conversion points.
  * `secondary`: Subtle surface background with hairline border.
  * `outline`: Transparent background with `#E7E5E2` / `#292929` border.
  * `ghost`: Minimalist transparent control for icons and text links.
  * `destructive`: Soft red background with red text and hover fill.
  * `follow`: Interactive state ("Following" with subtle border; on hover transitions to red "Unfollow"; "Follow" when inactive).
* **Heights**:
  * `lg`: 44px
  * `md`: 40px
  * `sm`: 34px
  * `xs`: 28px
  * `icon`: 36x36px

### 2. Input Primitive (`Input.jsx`)
* 40px height, 9px radius, subtle border with `#FF5C35` / `#FF6845` focus ring.
* Built-in accessible label, helper/error text, and icon slots.

### 3. Avatar Component (`Avatar.jsx`)
* Neutral initials background (`#EFEFEA` light / `#202020` dark) with hairline ring.
* Online emerald dot (`#16845B` / `#38A878`) with canvas ring.

### 4. Navigation Rail & Shell (`AppLayout.jsx`)
* **Width**: 240px quiet, elegant sidebar.
* **Organization**:
  1. NOVA Wordmark with coral dot
  2. Home, Discover, Create (with composer trigger)
  3. Hairline divider
  4. Messages, Calls, Notifications (with unread badge)
  5. Hairline divider
  6. Profile, Settings
* **Active State**: Strong font weight, subtle `#F4F3F0` / `#1C1C1C` background, small coral dot indicator.
* **Contextual Right Rail**: Rendered only on Home and Discover. Disabled on Messages (dual-pane takes full width), Calls (full stage), and Settings (single column).

### 5. Flagship Messaging (`ChatView.jsx`)
* Dual-pane responsive layout: conversation list on left, active thread on right.
* Natural message bubbles:
  * Outgoing (mine): High-contrast charcoal/black bubble (`rounded-[14px] rounded-br-[4px]`).
  * Incoming (partner): Warm neutral bubble (`rounded-[14px] rounded-bl-[4px]`) with subtle hairline border.
* Read receipts (single check, double check, coral double check for read).
* Real-time typing indicators with 3 pulsing dots.
* One-click WebRTC voice & video call initiation in header.

### 6. Calls Stage (`CallOverlay.jsx` & `CallsPage.jsx`)
* Incoming call toast: Floating dark pill with caller info, pulsing ring, green accept, and red decline buttons.
* Video call stage: Cinematic viewport with full remote stage, 12px PIP thumbnail, and floating bottom dock with 18px icons.
* Voice call stage: Dedicated centered avatar card with ambient soundwaves (NO giant empty video canvas).
* Calls history page: Real call records with direction, duration, timestamp, and 1-click call back.

### 7. Continuous Feed & Post Cards (`FeedPage.jsx` & `PostCard.jsx`)
* Hairline continuous stream dividers (`border-b`).
* Double-tap like animation on media.
* Inline expandable comments drawer with reply composer.
* Simple, clean "What's happening?" composer.

---

## 6. Verification Results

| Suite | Scope | Status |
| :--- | :--- | :--- |
| **Vite Production Build** | `client/` | **PASSED** (0 errors, 459kB JS, 45.9kB CSS) |
| **Security Test Suite** | `tests/security.test.js` | **11 / 11 PASSED** (0 failed) |
| **Realtime & Calling Suite** | `tests/realtime.test.js` | **29 / 29 PASSED** (0 failed) |
