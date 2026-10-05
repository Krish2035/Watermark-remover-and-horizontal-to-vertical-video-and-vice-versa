# ✨ ClearMark AI - Image & Video Watermark Remover

A modern, high-performance, full-stack web application designed to automatically detect and eliminate watermarks, channel logos, stamps, and timestamps from images and videos using AI contextual inpainting and FFmpeg delogo reconstruction.

---

## 🏗️ Project Architecture & Folder Structure

```
Watermark-remover/
├── backend/
│   ├── services/
│   │   ├── detector.js          # Watermark candidate detection & coordinate locator
│   │   ├── imageProcessor.js     # High-fidelity Poisson/Laplacian contextual inpainter
│   │   └── videoProcessor.js     # FFmpeg delogo filter motion inpainter & audio preservation
│   ├── uploads/                 # Staging area for user uploads
│   ├── processed/               # Clean output files ready for download
│   ├── package.json
│   └── server.js                # Express REST API (Upload, Detection, Removal, Download)
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── globals.css      # Midnight glassmorphism design tokens & animations
    │   │   ├── layout.jsx       # SEO metadata and root layout
    │   │   └── page.jsx         # Central page with reactive state workflow
    │   └── components/
    │       ├── Header.jsx       # Glowing logo & Tech Stack modal trigger
    │       ├── UploadBox.jsx    # Big center gradient drop box with preset selection
    │       ├── GeminiPreviewChip.jsx # Gemini-style floating preview chip with close button
    │       ├── ScanProgress.jsx # Futuristic radar scanner & neural pipeline progress
    │       ├── ResultViewer.jsx # Interactive before/after split comparison slider & download
    │       ├── TechStackModal.jsx # Comprehensive interactive technology breakdown
    │       ├── Features.jsx     # Key capabilities showcase
    │       └── Footer.jsx       # Platform info and quick links
    ├── next.config.mjs
    └── package.json
```

---

## ⚡ Tech Stack Breakdown

### 1. Frontend
- **Framework**: Next.js (App Router, React 18/19)
- **Styling**: Vanilla CSS Design System with dark glassmorphism tokens, custom gradients, and CSS keyframe scanner animations.
- **Micro-Interactions**: Lucide React icons & `canvas-confetti` celebration.
- **Client Features**:
  - Big centered gradient drop zone.
  - **Gemini-style preview chip** with thumbnail, file metadata, and remove button.
  - Interactive **Before / After Split Slider** for instant comparison.
  - Direct 1-click download of processed clean media.

### 2. Backend
- **Runtime & Framework**: Node.js + Express
- **File Ingestion**: Multer for high-throughput multipart streaming.
- **Image Inpainting**: Sharp (libvips) + multi-directional contextual boundary reconstruction with micro-texture dithering.
- **Video Inpainting**: Standalone cross-platform FFmpeg (`ffmpeg-static`) executing dynamic `delogo` filters with zero audio desync and fast H.264 transcoding.

### 3. Production Technologies (Required for Production Scaling)
- **Computer Vision Models**:
  - **LaMa (Large Mask Inpainting)**: Fourier convolution model for photorealistic texture hallucination.
  - **Segment Anything (SAM) / YOLOv8**: Zero-shot automated detection of transparent logos and text contours.
  - **ProPainter / E2FGVI**: State-of-the-art flow-guided deep video inpainting.
- **Asynchronous Queue**: **BullMQ + Redis** for offloading heavy video encoding jobs to background workers.
- **Cloud Storage**: **AWS S3 / Cloudflare R2** with presigned direct-upload URLs.
- **Real-Time Progress**: **WebSockets / Server-Sent Events (SSE)** for streaming transcoding percentages.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev # or node server.js
```
The backend API starts on `http://localhost:5000`.

### 2. Start Frontend Server
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.
