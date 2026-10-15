# CutPulse

> **High-Performance, Privacy-First, Client-Side Video Splitter**  
> Split long videos into WhatsApp Status, Instagram Reels, YouTube Shorts, or custom chapters directly in your browser with **zero server uploads**, **original stream quality (no re-encoding)**, and **zero watermarks**.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-FFmpeg-654FF0.svg?logo=webassembly)](https://webassembly.org/)
[![PWA](https://img.shields.io/badge/PWA-100%25%20Offline-5A0FC8.svg)](https://web.dev/explore/progressive-web-apps)

---

## 🌟 Why CutPulse?

Most online video splitters upload your personal videos to remote servers, compress the quality, add unsightly watermarks, or make you wait in an upload queue.

**CutPulse runs 100% inside your browser using WebAssembly.**
- 🔒 **Zero Server Uploads**: Your media never leaves your device. Works completely offline.
- ⚡ **Ultra-Fast Stream-Copying**: Slices videos at raw memory speed without re-encoding (`-c copy`).
- 💎 **Original Quality**: Preserves 100% bitstream clarity and color space with zero generation loss.
- 🏷️ **Zero Watermarks**: 100% free for personal and commercial content creators.

---

## 🚀 Key Features

### 1. Smart Social Presets & Flexible Modes
- **WhatsApp Status (30s)**: Continuous 30-second segments sequentially labeled for one-tap WhatsApp Status posting.
- **Instagram Stories & Snapchat (15s)**: Perfectly timed 15-second clips.
- **YouTube Shorts & TikTok (60s / 180s)**: Standard short-form video intervals.
- **Instagram Reels (90s)**: Long-format Reels chapters.
- **Equal Divisions**: Split evenly into 2 halves or specify *N* equal parts.
- **Custom Intervals**: Define exact segment length in seconds or minutes.
- **Custom Chapter Timestamps / Cue Points**: Split at custom moments (e.g. `0:30, 1:15, 2:40`).

### 2. 🟢 WhatsApp Status Safe (<16MB) Indicator
- Displays estimated file sizes per clip in real-time before processing.
- Shows a green **WhatsApp Safe (<16MB)** badge so you know your clips won't be rejected by WhatsApp.

### 3. 🔔 Audio Chime & Dynamic Tab Notifications
- Plays a gentle 2-tone synthesizer chime via Web Audio API when splitting completes (0 extra network download).
- Changes the inactive browser tab title: `🔔 (N Clips Ready) CutPulse Splitter` so you never miss a finished split.
- Optional native Web Notification support.

### 4. 📴 100% Offline Progressive Web App (PWA)
- Full Service Worker (`sw.js`) caching for instant load times and offline execution.
- Install CutPulse as a standalone app on Windows, macOS, Android, and iOS.

### 5. ⌨️ Desktop Keyboard Shortcuts
- <kbd>Space</kbd> : Play / Pause video preview.
- <kbd>←</kbd> / <kbd>→</kbd> : Seek 5 seconds backward or forward.
- <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (<kbd>Cmd</kbd> + <kbd>Enter</kbd> on Mac) : Start splitting immediately.
- <kbd>Escape</kbd> : Close open modals.

### 6. 📱 Responsive UI/UX for All Screens
- Tested across iPhone (with safe area insets), iPad, Android, and desktop monitors.
- Sticky mobile quick-action bar with dynamic clearance so no button or footer item is ever obscured.

### 7. 📦 Batch Export & Individual Downloads
- One-click **Download All (ZIP)** with a structured manifest (`README_splits.txt`).
- Sequential individual clip downloads with progress feedback.
- Inline clip renaming and exclusion controls.

### 8. 🔍 SEO, AI Search & Compliance
- Schema.org `WebApplication` and `FAQPage` JSON-LD structured data.
- AI Search Engine documentation (`public/llms.txt`) for ChatGPT, Perplexity, Gemini, Claude, and Copilot.
- Integrated `LegalAndInfoModal` covering About, Contact & Feedback, GDPR-compliant Privacy Policy, and Terms of Service.
- Google AdSense ready (`public/ads.txt`, responsive `AdBanner.tsx`).

---

## 🛠️ Supported Formats & Codecs

| Container | Codecs Supported | Output Container |
|-----------|------------------|------------------|
| **MP4**   | H.264 / AVC, H.265 / HEVC, AAC, MP3 | `.mp4` (with `+faststart` MOOV atom) |
| **WebM**  | VP8, VP9, Opus, Vorbis | `.webm` |
| **MOV**   | H.264, ProRes, AAC | `.mov` |
| **MKV**   | H.264, H.265, VP9, AAC, Opus | Preserved / `.mp4` stream-mapped |

---

## 💻 Getting Started

### Prerequisites
- Node.js 18+
- Modern browser with WebAssembly and SharedArrayBuffer support (Chrome, Edge, Safari, Firefox, Brave)

### Installation
```bash
# Clone the repository
git clone https://github.com/Prince3636/CutPulse.git
cd CutPulse

# Install dependencies
npm install
```

### Development
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Run Tests
```bash
npm run test
```
Runs 29 automated tests verifying segment calculations, real media stream-copying, ZIP generation, and analytics.

### Production Build
```bash
npm run build
```
Creates an optimized static bundle in `dist/` ready for zero-server deployment.

---

## 🌐 Free 1-Click Deployment

CutPulse is 100% static and requires zero backend servers. You can deploy it completely free on any static host:

### Deploy to Vercel
1. Push this repository to GitHub (`https://github.com/Prince3636/CutPulse`).
2. Import the project into [Vercel](https://vercel.com).
3. The included `vercel.json` automatically configures required Cross-Origin Isolation headers (`COOP`/`COEP`) and 1-year immutable caching.
4. Click **Deploy**.

### Deploy to Netlify
1. Import the repository into [Netlify](https://netlify.com).
2. Build command: `npm run build` | Publish directory: `dist`.
3. The included `netlify.toml` and `public/_headers` configure headers automatically.

---

## 🔒 Security & Privacy

CutPulse operates entirely inside an isolated WebAssembly virtual filesystem (`MEMFS`):
1. **Zero External Requests**: Video streams and frames are processed in local memory and freed after slicing.
2. **Fast-Start MOOV Atoms**: Video files are finalized with `-movflags +faststart` for instant playback.
3. **No PII Tracking**: Analytics only track tool usage and errors with 0 personally identifiable information.

---

## 📄 License

Distributed under the Apache-2.0 License. Free for personal and commercial video production.
