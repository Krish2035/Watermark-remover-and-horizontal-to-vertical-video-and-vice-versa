import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

/**
 * Extract comprehensive video metadata including dimensions, aspect ratio, duration, orientation.
 */
export async function getVideoDetails(videoPath) {
  return new Promise((resolve) => {
    if (!ffmpegPath) {
      return resolve({
        width: 1280,
        height: 720,
        aspectRatio: '16:9',
        orientation: 'horizontal',
        durationSec: 0
      });
    }

    execFile(ffmpegPath, ['-i', videoPath], (err, stdout, stderr) => {
      const output = stderr || '';
      const dimMatch = output.match(/Stream #0:.*Video:.* (\d{3,4})x(\d{3,4})/);
      const durMatch = output.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/);

      let width = 1280;
      let height = 720;
      let durationSec = 0;

      if (dimMatch) {
        width = parseInt(dimMatch[1], 10);
        height = parseInt(dimMatch[2], 10);
      }

      if (durMatch) {
        const hours = parseFloat(durMatch[1]);
        const mins = parseFloat(durMatch[2]);
        const secs = parseFloat(durMatch[3]);
        durationSec = hours * 3600 + mins * 60 + secs;
      }

      const ratio = width / height;
      const isHorizontal = ratio >= 1.0;
      const orientation = isHorizontal ? 'horizontal' : 'vertical';

      let ratioLabel = '16:9';
      if (Math.abs(ratio - 16 / 9) < 0.1) {
        ratioLabel = '16:9 (Landscape)';
      } else if (Math.abs(ratio - 9 / 16) < 0.1) {
        ratioLabel = '9:16 (Portrait/Vertical)';
      } else if (Math.abs(ratio - 1.0) < 0.05) {
        ratioLabel = '1:1 (Square)';
      } else if (Math.abs(ratio - 4 / 3) < 0.1) {
        ratioLabel = '4:3 (Standard)';
      } else {
        ratioLabel = `${width}:${height}`;
      }

      resolve({
        width,
        height,
        ratio,
        ratioLabel,
        orientation,
        durationSec: Math.round(durationSec * 10) / 10
      });
    });
  });
}

/**
 * Convert Video Aspect Ratio:
 * - Horizontal to Vertical (16:9 -> 9:16)
 * - Vertical to Horizontal (9:16 -> 16:9)
 *
 * Supported modes:
 * - 'blur': Blurred background with original video centered (Recommended, zero crop loss, studio look)
 * - 'pad': Fit video inside frame with clean letterbox/pillarbox padding
 * - 'crop': Center crop to fill entire frame
 */
export async function convertVideoAspectRatio({
  inputPath,
  outputPath,
  targetOrientation = 'vertical', // 'vertical' (9:16) or 'horizontal' (16:9)
  mode = 'blur', // 'blur' | 'pad' | 'crop'
  resolution = 'auto' // '1080x1920' | '720x1280' | '1920x1080' | '1280x720' | 'auto'
}) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!ffmpegPath) {
        throw new Error('ffmpeg-static binary not found');
      }

      const outDir = path.dirname(outputPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // 1. Analyze input video
      const meta = await getVideoDetails(inputPath);
      let targetW = 1080;
      let targetH = 1920;

      if (targetOrientation === 'vertical') {
        // Output is 9:16 (e.g. 1080x1920 or 720x1280)
        if (resolution === '720x1280') {
          targetW = 720;
          targetH = 1280;
        } else {
          // Default FHD vertical
          targetW = 1080;
          targetH = 1920;
        }
      } else {
        // Output is 16:9 (e.g. 1920x1080 or 1280x720)
        if (resolution === '1280x720') {
          targetW = 1280;
          targetH = 720;
        } else {
          // Default FHD horizontal
          targetW = 1920;
          targetH = 1080;
        }
      }

      // Ensure dimensions are even numbers (h264 requirement)
      if (targetW % 2 !== 0) targetW += 1;
      if (targetH % 2 !== 0) targetH += 1;

      console.log(`[AspectRatioProcessor] Converting ${meta.width}x${meta.height} (${meta.orientation}) -> ${targetW}x${targetH} (${targetOrientation}) | Mode: ${mode}`);

      let filterComplex = '';

      if (mode === 'blur') {
        // Studio Blurred Background:
        // Stream 1 (bg): Scale to fill target, crop exact bounds, apply boxblur
        // Stream 2 (fg): Scale to fit target maintaining aspect ratio
        // Overlay fg over bg centered
        filterComplex = `[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},boxblur=20:5[bg];[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`;
      } else if (mode === 'crop') {
        // Center crop to fill target aspect ratio
        filterComplex = `[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}[outv]`;
      } else {
        // 'pad' (Letterbox / Pillarbox with black bars)
        filterComplex = `[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black[outv]`;
      }

      const args = [
        '-y',
        '-i', inputPath,
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '22',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        outputPath
      ];

      console.log(`[AspectRatioProcessor] Running FFmpeg with arguments:`, args.join(' '));

      execFile(ffmpegPath, args, (err, stdout, stderr) => {
        if (err) {
          console.error('[AspectRatioProcessor] FFmpeg error:', err.message);
          console.error('[AspectRatioProcessor] FFmpeg stderr:', stderr);
          reject(new Error(`FFmpeg aspect conversion failed: ${err.message}`));
          return;
        }

        console.log('[AspectRatioProcessor] Completed successfully:', outputPath);
        resolve({
          success: true,
          outputPath,
          targetWidth: targetW,
          targetHeight: targetH,
          targetOrientation,
          mode
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}
