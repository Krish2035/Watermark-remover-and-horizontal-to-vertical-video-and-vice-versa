import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

/**
 * Get video dimensions (width, height) using FFmpeg.
 */
export async function getVideoDimensions(videoPath) {
  return new Promise((resolve) => {
    if (!ffmpegPath) return resolve({ width: 1280, height: 720 });

    execFile(ffmpegPath, ['-i', videoPath], (err, stdout, stderr) => {
      // FFmpeg prints stream information to stderr
      const output = stderr || '';
      const match = output.match(/Stream #0:.*Video:.* (\d{3,4})x(\d{3,4})/);
      if (match) {
        resolve({
          width: parseInt(match[1], 10),
          height: parseInt(match[2], 10)
        });
      } else {
        resolve({ width: 1280, height: 720 });
      }
    });
  });
}

/**
 * Remove watermark from video using modern FFmpeg delogo filter.
 * Preserves high video resolution and audio synchronization without errors.
 */
export async function removeVideoWatermark(inputPath, outputPath, box, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!ffmpegPath) {
        throw new Error('ffmpeg-static binary not found');
      }

      const outDir = path.dirname(outputPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // 1. Get real video dimensions to enforce bounds
      const { width: vidW, height: vidH } = await getVideoDimensions(inputPath);

      // 2. Safe clamping for delogo filter
      // FFmpeg delogo requires:
      // x >= 1, y >= 1, x + w <= vidW - 2, y + h <= vidH - 2
      let targetBox = box || {};
      let w = Math.max(10, Math.round(targetBox.width || vidW * 0.08));
      let h = Math.max(10, Math.round(targetBox.height || vidH * 0.08));
      
      // Keep width and height safely inside frame
      w = Math.min(w, vidW - 8);
      h = Math.min(h, vidH - 8);
      if (w % 2 !== 0) w -= 1;
      if (h % 2 !== 0) h -= 1;

      let x = Math.max(2, Math.round(targetBox.x !== undefined ? targetBox.x : vidW * 0.88));
      let y = Math.max(2, Math.round(targetBox.y !== undefined ? targetBox.y : vidH * 0.82));

      // Clamp within frame with at least 2px margin from all sides
      x = Math.max(2, Math.min(x, vidW - w - 4));
      y = Math.max(2, Math.min(y, vidH - h - 4));

      // Modern delogo filter string (no deprecated :band=1)
      const filterString = `delogo=x=${x}:y=${y}:w=${w}:h=${h}:show=0`;

      console.log(`Executing FFmpeg video delogo: ${filterString} on ${vidW}x${vidH} video`);

      // Modern FFmpeg command with separate option flags
      // -map 0:v -map 0:a? safely handles videos with or without audio tracks
      const args = [
        '-y',
        '-i', inputPath,
        '-vf', filterString,
        '-map', '0:v',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '22',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        outputPath
      ];

      execFile(ffmpegPath, args, (err, stdout, stderr) => {
        if (err) {
          console.error('FFmpeg execution error:', err.message);
          console.error('FFmpeg stderr output:', stderr);
          reject(new Error(`FFmpeg processing failed: ${err.message}`));
          return;
        }

        console.log('Video watermark removal finished successfully:', outputPath);
        resolve({
          success: true,
          outputPath,
          processedBox: { x, y, width: w, height: h }
        });
      });
    } catch (err) {
      console.error('Error in removeVideoWatermark:', err);
      reject(err);
    }
  });
}
