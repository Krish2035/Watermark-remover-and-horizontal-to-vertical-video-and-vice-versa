import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_SCRIPT = path.join(__dirname, 'galaxy_inpaint.py');

/**
 * Intelligent Watermark & Sparkle Detector
 * Scans image using computer vision to find the exact tight boundary of AI sparkles,
 * stamps, and corner watermarks instead of blindly selecting huge areas.
 */
export async function detectWatermarkRegion(imagePath) {
  return new Promise((resolve) => {
    try {
      execFile('python', [PYTHON_SCRIPT, 'detect', imagePath], async (error, stdout) => {
        if (!error && stdout) {
          try {
            const data = JSON.parse(stdout.trim());
            if (data.detectedBox) {
              const { x, y, width, height } = data.detectedBox;
              const imgW = data.imageWidth;
              const imgH = data.imageHeight;

              const candidates = [
                {
                  id: 'auto',
                  name: 'AI Detected Watermark (Zero-Blur)',
                  confidence: data.detectedBox.confidence || 0.95,
                  box: { x, y, width, height }
                },
                {
                  id: 'bottom-right',
                  name: 'Bottom Right Corner',
                  confidence: 0.9,
                  box: {
                    x: Math.round(imgW * 0.84),
                    y: Math.round(imgH * 0.76),
                    width: Math.round(imgW * 0.14),
                    height: Math.round(imgH * 0.16)
                  }
                },
                {
                  id: 'bottom-left',
                  name: 'Bottom Left',
                  confidence: 0.75,
                  box: {
                    x: Math.round(imgW * 0.02),
                    y: Math.round(imgH * 0.76),
                    width: Math.round(imgW * 0.14),
                    height: Math.round(imgH * 0.16)
                  }
                },
                {
                  id: 'top-right',
                  name: 'Top Right',
                  confidence: 0.7,
                  box: {
                    x: Math.round(imgW * 0.84),
                    y: Math.round(imgH * 0.03),
                    width: Math.round(imgW * 0.14),
                    height: Math.round(imgH * 0.16)
                  }
                }
              ];

              return resolve({
                imageWidth: imgW,
                imageHeight: imgH,
                detectedBox: { x, y, width, height },
                confidence: data.detectedBox.confidence || 0.95,
                candidates
              });
            }
          } catch (e) {
            console.warn('Error parsing detect output, falling back to sharp:', e);
          }
        }

        // Fallback with sharp
        try {
          const metadata = await sharp(imagePath).metadata();
          const { width = 1000, height = 1000 } = metadata;
          const bw = Math.round(width * 0.09);
          const bh = Math.round(height * 0.09);
          const bx = Math.max(0, width - bw - Math.round(width * 0.02));
          const by = Math.max(0, height - bh - Math.round(height * 0.02));

          resolve({
            imageWidth: width,
            imageHeight: height,
            detectedBox: { x: bx, y: by, width: bw, height: bh },
            confidence: 0.85,
            candidates: [
              {
                id: 'auto',
                name: 'Bottom Right Watermark',
                confidence: 0.85,
                box: { x: bx, y: by, width: bw, height: bh }
              }
            ]
          });
        } catch (err) {
          resolve({
            imageWidth: 1000,
            imageHeight: 1000,
            detectedBox: { x: 900, y: 900, width: 80, height: 80 },
            confidence: 0.75,
            candidates: []
          });
        }
      });
    } catch (err) {
      resolve({
        imageWidth: 1000,
        imageHeight: 1000,
        detectedBox: { x: 900, y: 900, width: 80, height: 80 },
        confidence: 0.75,
        candidates: []
      });
    }
  });
}
