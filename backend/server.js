import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { detectWatermarkRegion } from './services/detector.js';
import { removeImageWatermark } from './services/imageProcessor.js';
import { removeVideoWatermark, getVideoDimensions } from './services/videoProcessor.js';
import { getVideoDetails, convertVideoAspectRatio } from './services/aspectRatioProcessor.js';
import { saveJobRecord, getRecentJobs, createUser, findUserByEmail, findUserById } from './db/index.js';
import { cacheGet, cacheSet } from './services/redisClient.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  requireAuth,
  optionalAuth,
  COOKIE_OPTIONS,
  AUTH_COOKIE_NAME
} from './services/auth.js';
import { globalLimiter, authLimiter, mediaLimiter } from './services/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Trust reverse proxies (Render, Vercel, Cloudflare, etc.) for HTTPS detection
app.set('trust proxy', 1);

/**
 * Determine the public base server URL.
 * Automatically adapts to Render (RENDER_EXTERNAL_URL), custom BACKEND_URL, or x-forwarded-proto.
 */
function getServerUrl(req) {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  }
  const host = req.get('host') || `localhost:${PORT}`;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = (forwardedProto ? forwardedProto.split(',')[0].trim() : null) || req.protocol || 'http';
  const safeProto = isLocal ? proto : 'https';
  return `${safeProto}://${host}`;
}

// Setup Socket.io for real-time progress updates
const io = new SocketIOServer(server, {
  cors: { origin: true, credentials: true, methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  socket.on('join_job', (fileId) => {
    socket.join(fileId);
  });
});

// Middleware with Credentials & Cookies support and exposed headers for file downloads
app.use(cors({
  origin: true, // Allow frontend origin dynamically
  credentials: true, // Allow HttpOnly cookies to pass through
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type']
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply Global DDoS Rate Limiter
app.use(globalLimiter);

// Storage directories
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PROCESSED_DIR = path.join(__dirname, 'processed');

[UPLOADS_DIR, PROCESSED_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static uploads and processed files with cross-origin playback headers
const staticOptions = {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Accept-Ranges', 'bytes');
  }
};
app.use('/uploads', express.static(UPLOADS_DIR, staticOptions));
app.use('/processed', express.static(PROCESSED_DIR, staticOptions));

// Health check endpoint (used by UptimeRobot & Render to prevent spin-down)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.status(200).send('Watermark Remover API Server is awake and running.');
});

// Interactive Swagger UI documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

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

/**
 * ====================================================================
 * AUTHENTICATION ENDPOINTS (JWT + HttpOnly Secure Cookies)
 * ====================================================================
 */

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: User Registration
 *     description: Creates a new user account, hashes password, and issues an HttpOnly JWT cookie.
 */
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword
    });

    const token = generateToken(newUser);

    // Set JWT in protected HttpOnly cookie (inaccessible to JavaScript)
    res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || 'user'
      }
    });
  } catch (err) {
    console.error('Sign up error:', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

/**
 * @openapi
 * /api/auth/signin:
 *   post:
 *     summary: User Login
 *     description: Authenticates user credentials, sets protected HttpOnly JWT cookie.
 */
app.post('/api/auth/signin', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    // Set JWT in protected HttpOnly cookie
    res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      }
    });
  } catch (err) {
    console.error('Sign in error:', err);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get Current Logged-in User Profile
 *     description: Reads and verifies the HttpOnly JWT cookie from the client request.
 */
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: User Sign Out
 *     description: Clears the HttpOnly JWT cookie.
 */
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...COOKIE_OPTIONS,
    maxAge: 0
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * Root Route: Service Info & Documentation Directory
 */
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'ClearMark AI Backend API Engine',
    version: '2.0.0',
    documentation: '/api/docs',
    health: '/api/health',
    security: {
      auth: 'JWT HttpOnly Cookie',
      protection: 'DDoS Rate-Limited'
    }
  });
});

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: System Health & Architecture Check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'ClearMark AI Inpainting & Aspect Ratio Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    supportedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'],
    features: [
      'jwt_httponly_auth',
      'ddos_rate_limiting',
      'ai_watermark_removal',
      'horizontal_vertical_converter',
      'redis_cache',
      'neon_postgresql_drizzle',
      'socket_io',
      'swagger_ui'
    ]
  });
});

/**
 * @openapi
 * /api/jobs:
 *   get:
 *     summary: List Recent Processing Jobs
 */
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await getRecentJobs(20);
    if (jobs && jobs.length > 0) {
      return res.json({ success: true, count: jobs.length, jobs });
    }
    const memoryJobs = Array.from(fileRegistry.values()).slice(-20);
    return res.json({ success: true, count: memoryJobs.length, jobs: memoryJobs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: Upload Media & Auto-Detect Watermark
 */
app.post('/api/upload', optionalAuth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const isVideo = file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    const fileId = path.parse(file.filename).name;
    const serverUrl = getServerUrl(req);
    const fileUrl = `${serverUrl}/uploads/${file.filename}`;

    let detectionData = null;

    try {
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
          }
        ]
      };
    }

    const fileRecord = {
      fileId,
      userId: req.user?.id || null,
      filename: file.filename,
      originalName: file.originalname,
      mediaType,
      mimeType: file.mimetype,
      size: file.size,
      filePath: file.path,
      fileUrl,
      detectionData,
      status: 'uploaded',
      createdAt: Date.now()
    };

    fileRegistry.set(fileId, fileRecord);

    await cacheSet(`file:${fileId}`, fileRecord, 7200);
    await saveJobRecord({
      fileId,
      userId: req.user?.id || null,
      originalName: file.originalname,
      mediaType,
      mimeType: file.mimetype,
      fileSize: file.size,
      originalUrl: fileUrl,
      status: 'uploaded',
      metadata: { detection: detectionData }
    });

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
 * @openapi
 * /api/remove-watermark:
 *   post:
 *     summary: Remove Watermark from Image or Video
 */
app.post('/api/remove-watermark', mediaLimiter, optionalAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { fileId, box, mediaType, maskBase64 } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    io.to(fileId).emit('job_progress', { fileId, stage: 'analyzing', percent: 25, message: 'Analyzing watermark coordinates...' });

    let fileRecord = fileRegistry.get(fileId);
    if (!fileRecord) {
      fileRecord = await cacheGet(`file:${fileId}`);
    }

    if (!fileRecord) {
      const files = fs.readdirSync(UPLOADS_DIR);
      const matched = files.find((f) => f.startsWith(fileId));
      if (matched) {
        const filePath = path.join(UPLOADS_DIR, matched);
        const ext = path.extname(matched).toLowerCase();
        const isVideo = ['.mp4', '.mov', '.webm', '.avi', '.mkv'].includes(ext);
        const serverUrl = getServerUrl(req);
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

    let targetBox = box;
    if (!targetBox || !targetBox.width || !targetBox.height) {
      if (fileRecord.detectionData && fileRecord.detectionData.detectedBox) {
        targetBox = fileRecord.detectionData.detectedBox;
      } else {
        const { width: vidW, height: vidH } = fileRecord.mediaType === 'video'
          ? await getVideoDimensions(fileRecord.filePath)
          : { width: 1280, height: 720 };
        targetBox = {
          x: Math.round(vidW * 0.84),
          y: Math.round(vidH * 0.76),
          width: Math.round(vidW * 0.14),
          height: Math.round(vidH * 0.16)
        };
      }
    }

    const ext = path.extname(fileRecord.filename);
    const cleanFilename = `${fileId}-clean${mediaType === 'video' ? '.mp4' : ext}`;
    const cleanFilePath = path.join(PROCESSED_DIR, cleanFilename);
    const serverUrl = getServerUrl(req);
    const cleanUrl = `${serverUrl}/processed/${cleanFilename}`;

    let maskPath = null;
    if (maskBase64) {
      const base64Data = maskBase64.replace(/^data:image\/\w+;base64,/, '');
      const maskFilename = `${fileId}-mask.png`;
      maskPath = path.join(PROCESSED_DIR, maskFilename);
      fs.writeFileSync(maskPath, Buffer.from(base64Data, 'base64'));
    }

    io.to(fileId).emit('job_progress', { fileId, stage: 'processing', percent: 65, message: 'Reconstructing media pixels...' });

    let result = null;
    if (fileRecord.mediaType === 'video') {
      result = await removeVideoWatermark(fileRecord.filePath, cleanFilePath, targetBox);
    } else {
      result = await removeImageWatermark(fileRecord.filePath, cleanFilePath, targetBox, maskPath);
    }

    const processingTimeMs = Date.now() - startTime;
    const downloadUrl = `${serverUrl}/api/download/${fileRecord.mediaType}/${cleanFilename}?name=${encodeURIComponent(
      'clean-' + fileRecord.originalName
    )}`;

    const responsePayload = {
      success: true,
      fileId,
      mediaType: fileRecord.mediaType,
      originalUrl: fileRecord.fileUrl,
      cleanUrl,
      downloadUrl,
      appliedBox: result.processedBox,
      processingTimeMs
    };

    await cacheSet(`job:${fileId}`, responsePayload, 7200);
    await saveJobRecord({
      fileId,
      userId: req.user?.id || fileRecord.userId || null,
      originalName: fileRecord.originalName,
      mediaType: fileRecord.mediaType,
      operation: 'watermark_removal',
      status: 'completed',
      resultUrl: cleanUrl,
      downloadUrl,
      metadata: { appliedBox: result.processedBox },
      processingTimeMs
    });

    io.to(fileId).emit('job_complete', responsePayload);

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Watermark removal error:', error);
    io.to(req.body?.fileId).emit('job_error', { error: error.message });
    return res.status(500).json({ error: error.message || 'Watermark removal failed' });
  }
});

/**
 * @openapi
 * /api/video-details:
 *   post:
 *     summary: Inspect Video Metadata & Aspect Ratio
 */
app.post('/api/video-details', upload.single('video'), async (req, res) => {
  try {
    let filePath = null;
    let fileId = req.body?.fileId;
    let originalName = 'video.mp4';
    let fileUrl = null;
    const serverUrl = getServerUrl(req);

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
      let record = fileRegistry.get(fileId) || (await cacheGet(`file:${fileId}`));
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
 * @openapi
 * /api/convert-aspect-ratio:
 *   post:
 *     summary: Video Aspect Ratio Converter (Horizontal ⇄ Vertical)
 */
app.post('/api/convert-aspect-ratio', mediaLimiter, optionalAuth, upload.single('video'), async (req, res) => {
  const startTime = Date.now();
  try {
    let filePath = null;
    let fileId = req.body?.fileId;
    let originalName = 'video.mp4';
    let fileUrl = null;
    const serverUrl = getServerUrl(req);

    const targetOrientation = req.body?.targetOrientation || 'vertical';
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
      let record = fileRegistry.get(fileId) || (await cacheGet(`file:${fileId}`));
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

    io.to(fileId).emit('job_progress', { fileId, stage: 'transforming', percent: 40, message: 'Executing aspect ratio filters...' });

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
    const downloadUrl = `${serverUrl}/api/download/video/${convertedFilename}?name=${encodeURIComponent(downloadName)}`;

    const responsePayload = {
      success: true,
      fileId,
      originalUrl: fileUrl,
      convertedUrl,
      downloadUrl,
      inputDetails,
      targetOrientation,
      targetWidth: convertResult.targetWidth,
      targetHeight: convertResult.targetHeight,
      mode,
      processingTimeMs
    };

    await cacheSet(`aspect:${fileId}`, responsePayload, 7200);
    await saveJobRecord({
      fileId,
      userId: req.user?.id || null,
      originalName,
      mediaType: 'video',
      operation: 'aspect_conversion',
      status: 'completed',
      resultUrl: convertedUrl,
      downloadUrl,
      metadata: { targetOrientation, mode, width: convertResult.targetWidth, height: convertResult.targetHeight },
      processingTimeMs
    });

    io.to(fileId).emit('job_complete', responsePayload);

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Aspect ratio conversion error:', error);
    io.to(req.body?.fileId).emit('job_error', { error: error.message });
    return res.status(500).json({ error: error.message || 'Aspect ratio conversion failed' });
  }
});

/**
 * @openapi
 * /api/download/{type}/{filename}:
 *   get:
 *     summary: Download Clean or Converted Media
 */
app.get('/api/download/:type/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  let filePath = path.join(PROCESSED_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(UPLOADS_DIR, safeFilename);
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Processed media file not found or expired.' });
  }

  const customName = req.query.name || safeFilename;
  const ext = path.extname(filePath).toLowerCase();

  // Expose headers for cross-origin browser downloads
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');

  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  };
  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }

  res.download(filePath, customName, (err) => {
    if (err && !res.headersSent) {
      console.error('Download error:', err);
      res.status(500).json({ error: 'Failed to download file' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 ClearMark AI Backend Engine running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ Health: http://localhost:${PORT}/api/health`);
  console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🛡️ Rate Limiting & DDoS Shield: Active`);
  console.log(`🔒 JWT HttpOnly Cookie Auth: Active`);
  console.log(`⚡ WebSocket / Socket.io: Active`);
  console.log(`===============================================`);
});
