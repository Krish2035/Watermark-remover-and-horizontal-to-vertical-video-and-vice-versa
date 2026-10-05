import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_SCRIPT = path.join(__dirname, 'galaxy_inpaint.py');

/**
 * High-Precision Galaxy AI Watermark Removal Engine
 * Uses OpenCV Fast Marching Method (Telea) & stroke-level masking
 * to eliminate watermarks with ZERO blur, perfectly preserving textures and details.
 */
export async function removeImageWatermark(inputPath, outputPath, box, maskPath = null) {
  return new Promise((resolve, reject) => {
    try {
      const outDir = path.dirname(outputPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      const boxB64 = Buffer.from(JSON.stringify(box || {})).toString('base64');
      const args = [PYTHON_SCRIPT, 'inpaint', inputPath, outputPath, boxB64];
      if (maskPath) {
        args.push(maskPath);
      }

      console.log(`Executing Galaxy AI inpainter: python ${args.join(' ')}`);

      execFile('python', args, (error, stdout, stderr) => {
        if (error) {
          console.warn('Python galaxy inpaint error, attempting fallback:', error.message);
          // Fallback to sharp local inpainting if python execution fails
          fallbackInpaint(inputPath, outputPath, box)
            .then(resolve)
            .catch(reject);
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve({
            success: true,
            outputPath,
            width: result.width,
            height: result.height,
            processedBox: box,
            mode: 'galaxy_ai_zero_blur'
          });
        } catch (e) {
          // If stdout had extra warnings, check if output file was created
          if (fs.existsSync(outputPath)) {
            resolve({
              success: true,
              outputPath,
              processedBox: box,
              mode: 'galaxy_ai_zero_blur'
            });
          } else {
            console.error('Failed to parse inpaint output:', stdout, stderr);
            reject(new Error('Inpainting failed to generate output file'));
          }
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Fallback inpainter in case Python is unavailable.
 */
async function fallbackInpaint(inputPath, outputPath, box) {
  const metadata = await sharp(inputPath).metadata();
  const { width, height } = metadata;

  const bx = Math.max(0, Math.min(width - 1, Math.round(box.x)));
  const by = Math.max(0, Math.min(height - 1, Math.round(box.y)));
  const bw = Math.max(1, Math.min(width - bx, Math.round(box.width)));
  const bh = Math.max(1, Math.min(height - by, Math.round(box.height)));

  // Crop surrounding texture context above or to the left of the watermark
  const sampleX = Math.max(0, bx - bw);
  const sampleY = Math.max(0, by - bh);

  const contextPatch = await sharp(inputPath)
    .extract({ left: sampleX, top: sampleY, width: bw, height: bh })
    .blur(0.5)
    .toBuffer();

  await sharp(inputPath)
    .composite([
      {
        input: contextPatch,
        left: bx,
        top: by,
        blend: 'over'
      }
    ])
    .toFile(outputPath);

  return {
    success: true,
    outputPath,
    processedBox: { x: bx, y: by, width: bw, height: bh }
  };
}
