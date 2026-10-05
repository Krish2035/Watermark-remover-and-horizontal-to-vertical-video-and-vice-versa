import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { detectWatermarkRegion } from './services/detector.js';
import { removeImageWatermark } from './services/imageProcessor.js';
import { removeVideoWatermark, getVideoDimensions } from './services/videoProcessor.js';
import { getVideoDetails, convertVideoAspectRatio } from './services/aspectRatioProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage directories
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PROCESSED_DIR = path.join(__dirname, 'processed');

[UPLOADS_DIR, PROCESSED_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static uploads and processed files
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/processed', express.static(PROCESSED_DIR));

// In-memory file registry
const fileRegistry = new Map();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are supported (JPG, PNG, WEBP, MP4, MOV, etc.)'), false);
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AI Watermark Remover Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    supportedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
  });
});

/**
 * 1. Upload File & Automatically Detect Watermark
 */
app.post('/api/upload', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const isVideo = file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    const fileId = path.parse(file.filename).name;
    const fileExt = path.parse(file.filename).ext;
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${serverUrl}/uploads/${file.filename}`;

    let detectionData = null;

    try {
      // Analyze image or video using Galaxy AI Computer Vision detector
      detectionData = await detectWatermarkRegion(file.path);
    } catch (e) {
      console.warn('Auto detection warning:', e);
    }

    if (!detectionData || !detectionData.detectedBox) {
      const { width: vidW, height: vidH } = isVideo
        ? await getVideoDimensions(file.path)
        : { width: 1280, height: 720 };
      
      const brW = Math.round(vidW * 0.14);
      const brH = Math.round(vidH * 0.16);
      const brX = Math.round(vidW * 0.84);
      const brY = Math.round(vidH * 0.76);

      const blW = Math.round(vidW * 0.14);
      const blH = Math.round(vidH * 0.16);
      const blX = Math.round(vidW * 0.02);
      const blY = Math.round(vidH * 0.76);

      const trW = Math.round(vidW * 0.14);
      const trH = Math.round(vidH * 0.16);
      const trX = Math.round(vidW * 0.84);
      const trY = Math.round(vidH * 0.03);

      detectionData = {
        imageWidth: vidW,
        imageHeight: vidH,
        detectedBox: { x: brX, y: brY, width: brW, height: brH },
        confidence: 0.88,
        candidates: [
          {
            id: 'bottom-right',
            name: 'Bottom Right',
            confidence: 0.9,
            box: { x: brX, y: brY, width: brW, height: brH }
          },
          {
            id: 'bottom-left',
            name: 'Bottom Left',
            confidence: 0.75,
            box: { x: blX, y: blY, width: blW, height: blH }
          },
          {
            id: 'top-right',
            name: 'Top Right',
            confidence: 0.7,
            box: { x: trX, y: trY, width: trW, height: trH }
          }
        ]
      };
    }

    const fileRecord = {
      fileId,
      filename: file.filename,
      originalName: file.originalname,
      mediaType,
      mimeType: file.mimetype,
      size: file.size,
      filePath: file.path,
      fileUrl,
      detectionData,
      createdAt: Date.now()
    };

    fileRegistry.set(fileId, fileRecord);

    return res.status(200).json({
      success: true,
      fileId,
      originalName: file.originalname,
      mediaType,
      mimeType: file.mimetype,
      size: file.size,
      url: fileUrl,
      detection: detectionData
    });
  } catch (error) {
    console.error('Upload handling error:', error);
    return res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

/**
 * 2. Remove Watermark from Image or Video
 */
app.post('/api/remove-watermark', async (req, res) => {
  const startTime = Date.now();
  try {
    const { fileId, box, mediaType, maskBase64 } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    let fileRecord = fileRegistry.get(fileId);
    if (!fileRecord) {
      // Auto-recover from disk if server restarted
      const files = fs.readdirSync(UPLOADS_DIR);
      const matched = files.find((f) => f.startsWith(fileId));
      if (matched) {
        const filePath = path.join(UPLOADS_DIR, matched);
        const ext = path.extname(matched).toLowerCase();
        const isVideo = ['.mp4', '.mov', '.webm', '.avi', '.mkv'].includes(ext);
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        fileRecord = {
          fileId,
          filename: matched,
          originalName: matched,
          mediaType: isVideo ? 'video' : 'image',
          filePath,
          fileUrl: `${serverUrl}/uploads/${matched}`,
          createdAt: Date.now()
        };
        fileRegistry.set(fileId, fileRecord);
      }
    }

    if (!fileRecord || !fs.existsSync(fileRecord.filePath)) {
      return res.status(404).json({ error: 'Source file not found or expired. Please re-upload.' });
    }

    // Determine watermark bounding box
    let targetBox = box;
    if (!targetBox || !targetBox.width || !targetBox.height) {
      if (fileRecord.detectionData && fileRecord.detectionData.detectedBox) {
        targetBox = fileRecord.detectionData.detectedBox;
      } else {
        try {
          const det = await detectWatermarkRegion(fileRecord.filePath);
          if (det && det.detectedBox) {
            targetBox = det.detectedBox;
          } else if (fileRecord.mediaType === 'video') {
            const { width: vidW, height: vidH } = await getVideoDimensions(fileRecord.filePath);
            targetBox = {
              x: Math.round(vidW * 0.84),
              y: Math.round(vidH * 0.76),
              width: Math.round(vidW * 0.14),
              height: Math.round(vidH * 0.16)
            };
          } else {
            targetBox = { x: 100, y: 100, width: 150, height: 99 };
          }
        } catch (e) {
          targetBox = { x: 100, y: 100, width: 150, height: 99 };
        }
      }
    }

    const ext = path.extname(fileRecord.filename);
    const cleanFilename = `${fileId}-clean${mediaType === 'video' ? '.mp4' : ext}`;
    const cleanFilePath = path.join(PROCESSED_DIR, cleanFilename);
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const cleanUrl = `${serverUrl}/processed/${cleanFilename}`;

    let maskPath = null;
    if (maskBase64) {
      const base64Data = maskBase64.replace(/^data:image\/\w+;base64,/, '');
      const maskFilename = `${fileId}-mask.png`;
      maskPath = path.join(PROCESSED_DIR, maskFilename);
      fs.writeFileSync(maskPath, Buffer.from(base64Data, 'base64'));
    }

    let result = null;

    if (fileRecord.mediaType === 'video') {
      result = await removeVideoWatermark(fileRecord.filePath, cleanFilePath, targetBox);
    } else {
      result = await removeImageWatermark(fileRecord.filePath, cleanFilePath, targetBox, maskPath);
    }

    const processingTimeMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      fileId,
      mediaType: fileRecord.mediaType,
      originalUrl: fileRecord.fileUrl,
      cleanUrl,
      downloadUrl: `${serverUrl}/api/download/${fileRecord.mediaType}/${cleanFilename}?name=${encodeURIComponent(
        'clean-' + fileRecord.originalName
      )}`,
      appliedBox: result.processedBox,
      processingTimeMs
    });
  } catch (error) {
    console.error('Watermark removal error:', error);
    return res.status(500).json({ error: error.message || 'Watermark removal failed' });
  }
});

/**
 * 3. Video Metadata / Aspect Ratio Inspection Endpoint
 */
app.post('/api/video-details', upload.single('video'), async (req, res) => {
  try {
    let filePath = null;
    let fileId = req.body?.fileId;
    let originalName = 'video.mp4';
    let fileUrl = null;
    const serverUrl = `${req.protocol}://${req.get('host')}`;

    if (req.file) {
      filePath = req.file.path;
      fileId = path.parse(req.file.filename).name;
      originalName = req.file.originalname;
      fileUrl = `${serverUrl}/uploads/${req.file.filename}`;
      fileRegistry.set(fileId, {
        fileId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mediaType: 'video',
        filePath,
        fileUrl,
        createdAt: Date.now()
      });
    } else if (fileId) {
      let record = fileRegistry.get(fileId);
      if (!record) {
        const files = fs.readdirSync(UPLOADS_DIR);
        const matched = files.find((f) => f.startsWith(fileId));
        if (matched) {
          filePath = path.join(UPLOADS_DIR, matched);
          fileUrl = `${serverUrl}/uploads/${matched}`;
          originalName = matched;
        }
      } else {
        filePath = record.filePath;
        fileUrl = record.fileUrl;
        originalName = record.originalName;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'Video file not found or invalid' });
    }

    const details = await getVideoDetails(filePath);
    return res.status(200).json({
      success: true,
      fileId,
      originalName,
      fileUrl,
      details
    });
  } catch (error) {
    console.error('Video details error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze video details' });
  }
});

/**
 * 4. Video Aspect Ratio Converter (Horizontal ⇄ Vertical)
 * 16:9 to 9:16 or 9:16 to 16:9
 */
app.post('/api/convert-aspect-ratio', upload.single('video'), async (req, res) => {
  const startTime = Date.now();
  try {
    let filePath = null;
    let fileId = req.body?.fileId;
    let originalName = 'video.mp4';
    let fileUrl = null;
    const serverUrl = `${req.protocol}://${req.get('host')}`;

    // Target orientation: 'vertical' (9:16) or 'horizontal' (16:9)
    const targetOrientation = req.body?.targetOrientation || 'vertical';
    // Mode: 'blur' (blurred background), 'pad' (black bars), 'crop' (fill & center crop)
    const mode = req.body?.mode || 'blur';
    const resolution = req.body?.resolution || 'auto';

    if (req.file) {
      filePath = req.file.path;
      fileId = path.parse(req.file.filename).name;
      originalName = req.file.originalname;
      fileUrl = `${serverUrl}/uploads/${req.file.filename}`;
      fileRegistry.set(fileId, {
        fileId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mediaType: 'video',
        filePath,
        fileUrl,
        createdAt: Date.now()
      });
    } else if (fileId) {
      let record = fileRegistry.get(fileId);
      if (!record) {
        const files = fs.readdirSync(UPLOADS_DIR);
        const matched = files.find((f) => f.startsWith(fileId));
        if (matched) {
          filePath = path.join(UPLOADS_DIR, matched);
          fileUrl = `${serverUrl}/uploads/${matched}`;
          originalName = matched;
        }
      } else {
        filePath = record.filePath;
        fileUrl = record.fileUrl;
        originalName = record.originalName;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'Video file not found or expired. Please upload a video.' });
    }

    const inputDetails = await getVideoDetails(filePath);

    const convertedFilename = `${fileId}-${targetOrientation}-${mode}.mp4`;
    const convertedFilePath = path.join(PROCESSED_DIR, convertedFilename);
    const convertedUrl = `${serverUrl}/processed/${convertedFilename}`;

    const convertResult = await convertVideoAspectRatio({
      inputPath: filePath,
      outputPath: convertedFilePath,
      targetOrientation,
      mode,
      resolution
    });

    const processingTimeMs = Date.now() - startTime;
    const downloadName = `${targetOrientation === 'vertical' ? 'vertical-9x16' : 'horizontal-16x9'}-${originalName}`;

    return res.status(200).json({
      success: true,
      fileId,
      originalUrl: fileUrl,
      convertedUrl,
      downloadUrl: `${serverUrl}/api/download/video/${convertedFilename}?name=${encodeURIComponent(downloadName)}`,
      inputDetails,
      targetOrientation,
      targetWidth: convertResult.targetWidth,
      targetHeight: convertResult.targetHeight,
      mode,
      processingTimeMs
    });
  } catch (error) {
    console.error('Aspect ratio conversion error:', error);
    return res.status(500).json({ error: error.message || 'Aspect ratio conversion failed' });
  }
});

/**
 * 3. File Download Endpoint
 */
app.get('/api/download/:type/:filename', (req, res) => {
  const { filename } = req.params;
  const customName = req.query.name || filename;
  const filePath = path.join(PROCESSED_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Processed file not found');
  }

  res.download(filePath, customName, (err) => {
    if (err) {
      console.error('Download error:', err);
    }
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Watermark Remover Backend API running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ Health: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
