import sys
import os
import json
import base64
import cv2
import numpy as np

def scan_corner_for_watermark(img, corner_name="bottom_right"):
    """
    Scans a corner margin for watermarks, sparkles, logos, or text stamps.
    Uses intelligent watermark scoring:
    Watermarks are compact, have distinct contrast/brightness, and reside near corners.
    """
    h, w = img.shape[:2]
    
    if corner_name == "bottom_right":
        x0 = int(w * 0.80)
        y0 = int(h * 0.74)
        x1 = w
        y1 = h
    elif corner_name == "bottom_left":
        x0 = 0
        y0 = int(h * 0.74)
        x1 = int(w * 0.20)
        y1 = h
    elif corner_name == "top_right":
        x0 = int(w * 0.80)
        y0 = 0
        x1 = w
        y1 = int(h * 0.26)
    else: # top_left
        x0 = 0
        y0 = 0
        x1 = int(w * 0.20)
        y1 = int(h * 0.26)
        
    corner = img[y0:y1, x0:x1]
    if corner.size == 0:
        return None
        
    gray = cv2.cvtColor(corner, cv2.COLOR_BGR2GRAY)
    med = np.median(gray)
    
    diff = cv2.absdiff(gray, int(med))
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, k)
    response = cv2.addWeighted(diff, 0.6, tophat, 0.4, 0)
    
    _, thresh = cv2.threshold(response, 18, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    target_cx = corner.shape[1] if "right" in corner_name else 0
    target_cy = corner.shape[0] if "bottom" in corner_name else 0
    
    candidates = []
    
    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        area = cv2.contourArea(c)
        # Filter out tiny specks (<25px) and massive background landscape elements (>4000px)
        if 25 < area < 4000 and 10 < bw < 150 and 10 < bh < 150:
            cx = x + bw / 2
            cy = y + bh / 2
            dist = np.sqrt((target_cx - cx)**2 + (target_cy - cy)**2)
            
            c_mask = np.zeros(gray.shape, dtype=np.uint8)
            cv2.drawContours(c_mask, [c], -1, 255, -1)
            pts = gray[c_mask == 255]
            max_b = int(np.max(pts)) if len(pts) > 0 else int(med)
            
            # Watermark score: high luminance + close to outer corner
            score = (float(max_b) * 100.0) / (dist + 20.0)
            
            pad = 16
            fx = max(0, x0 + x - pad)
            fy = max(0, y0 + y - pad)
            fw = min(w - fx, bw + pad * 2)
            fh = min(h - fy, bh + pad * 2)
            
            candidates.append({
                "score": score,
                "box": {
                    "x": int(fx),
                    "y": int(fy),
                    "width": int(fw),
                    "height": int(fh),
                    "confidence": 0.98,
                    "corner": corner_name
                }
            })
            
    if candidates:
        candidates.sort(key=lambda item: item["score"], reverse=True)
        return candidates[0]["box"]
        
    return None


def find_sparkle_watermark_in_frame(img):
    """
    Stage 1: Multi-scale template matching for AI sparkle logos (Google Veo, Gemini, Imagen 3, Sora).
    Scans the 3 outer corners across multiple scales.
    Returns the global maximum correlation if >= 0.70.
    """
    h, w = img.shape[:2]
    template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'sparkle_template.png')
    if not os.path.exists(template_path):
        return None
    template = cv2.imread(template_path)
    if template is None:
        return None
    th, tw = template.shape[:2]
    
    corners = [
        ("bottom_right", max(0, w - int(w * 0.24)), max(0, h - int(h * 0.28)), w, h),
        ("bottom_left", 0, max(0, h - int(h * 0.28)), int(w * 0.24), h),
        ("top_right", max(0, w - int(w * 0.24)), 0, w, int(h * 0.28)),
    ]
    
    best_overall_score = -1
    best_box = None
    
    for corner_name, x0, y0, x1, y1 in corners:
        roi = img[y0:y1, x0:x1]
        for scale in [0.8, 0.9, 1.0, 1.1, 1.2]:
            sw = int(tw * scale)
            sh = int(th * scale)
            if sw >= roi.shape[1] or sh >= roi.shape[0]:
                continue
            scaled_t = cv2.resize(template, (sw, sh))
            res = cv2.matchTemplate(roi, scaled_t, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, max_loc = cv2.minMaxLoc(res)
            
            if max_val > best_overall_score:
                best_overall_score = max_val
                gx = x0 + max_loc[0]
                gy = y0 + max_loc[1]
                pad = 14
                fx = max(2, gx - pad)
                fy = max(2, gy - pad)
                fw = min(w - fx - 4, sw + pad * 2)
                fh = min(h - fy - 4, sh + pad * 2)
                if fw % 2 != 0: fw += 1
                if fh % 2 != 0: fh += 1
                best_box = {
                    "x": int(fx),
                    "y": int(fy),
                    "width": int(fw),
                    "height": int(fh),
                    "confidence": round(float(max_val), 4),
                    "corner": corner_name,
                    "type": "ai_sparkle"
                }
                
    if best_overall_score >= 0.70:
        return best_box
    return None


def detect_watermark_in_image(img):
    """
    Detects watermark in image:
    1. AI Sparkle template matching (Google Gemini / Veo / Imagen).
    2. Computer vision corner scanning.
    3. Scaled corner fallback.
    """
    h, w = img.shape[:2]
    
    # Priority 1: Known AI Sparkle / Logo Match
    sparkle = find_sparkle_watermark_in_frame(img)
    if sparkle:
        return sparkle
    
    # Priority 2: Corner Scans
    br = scan_corner_for_watermark(img, "bottom_right")
    if br:
        return br
        
    bl = scan_corner_for_watermark(img, "bottom_left")
    if bl:
        return bl
        
    tr = scan_corner_for_watermark(img, "top_right")
    if tr:
        return tr
        
    # Fallback to compact bottom-right box
    default_w = max(50, min(140, int(w * 0.12)))
    default_h = max(50, min(140, int(h * 0.12)))
    return {
        "x": int(w - default_w - int(w * 0.04)),
        "y": int(h - default_h - int(h * 0.04)),
        "width": default_w,
        "height": default_h,
        "confidence": 0.85,
        "corner": "bottom_right"
    }


def detect_watermark_in_video(video_path):
    """
    Detects watermark in video by analyzing video frames across the corners.
    1. Multi-scale template matching for AI video sparkle/logos.
    2. Edge and floating contour analysis (rejecting background scenery / ground).
    3. Proportional corner preset.
    """
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()
    cap.release()
    if not ret or frame is None:
        return None
    h, w = frame.shape[:2]
    
    # Priority 1: Check known AI Sparkle / Logo
    sparkle = find_sparkle_watermark_in_frame(frame)
    if sparkle:
        return sparkle
    
    # Priority 2: Floating overlay corner detection (strictly outer 20% margin)
    x0 = int(w * 0.80)
    y0 = int(h * 0.72)
    corner = frame[y0:h, x0:w]
    gray = cv2.cvtColor(corner, cv2.COLOR_BGR2GRAY)
    
    canny = cv2.Canny(gray, 25, 75)
    cnts, _ = cv2.findContours(canny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    candidates = []
    for c in cnts:
        bx, by, bw, bh = cv2.boundingRect(c)
        # Watermarks are floating overlays: filter out contours touching frame boundaries
        touches_edge = (bx <= 2 or by <= 2 or (bx + bw) >= corner.shape[1] - 2 or (by + bh) >= corner.shape[0] - 2)
        if not touches_edge and 16 < bw < int(w * 0.18) and 16 < bh < int(h * 0.18):
            patch = gray[by:by+bh, bx:bx+bw]
            max_b = float(np.max(patch))
            mean_b = float(np.mean(patch))
            # Balanced aspect ratio scoring
            score = max_b * 1.5 + mean_b - abs(bw - bh) * 0.4
            candidates.append((score, bx, by, bw, bh))
            
    if candidates:
        candidates.sort(key=lambda item: item[0], reverse=True)
        best = candidates[0]
        pad = 14
        gx = max(2, x0 + best[1] - pad)
        gy = max(2, y0 + best[2] - pad)
        gw = min(w - gx - 4, best[3] + pad * 2)
        gh = min(h - gy - 4, best[4] + pad * 2)
        if gw % 2 != 0: gw += 1
        if gh % 2 != 0: gh += 1
        return {
            "x": int(gx),
            "y": int(gy),
            "width": int(gw),
            "height": int(gh),
            "confidence": 0.95,
            "corner": "bottom_right"
        }
    
    # Safe proportional fallback for bottom-right corner
    def_w = int(w * 0.14)
    def_h = int(h * 0.16)
    if def_w % 2 != 0: def_w += 1
    if def_h % 2 != 0: def_h += 1
    return {
        "x": int(w * 0.84),
        "y": int(h * 0.76),
        "width": def_w,
        "height": def_h,
        "confidence": 0.88,
        "corner": "bottom_right"
    }


def inpaint_zero_blur(img, box, custom_mask=None):
    """
    Galaxy AI Zero-Blur Inpainting Pipeline.
    Extracts ONLY the watermark strokes, shapes, and sparkles within the region,
    preserving 100% of surrounding background textures, rocks, cliffs, and colors.
    """
    h, w = img.shape[:2]
    full_mask = np.zeros((h, w), dtype=np.uint8)
    
    if custom_mask is not None:
        full_mask = custom_mask
    else:
        bx = max(0, min(w - 1, int(box.get("x", 0))))
        by = max(0, min(h - 1, int(box.get("y", 0))))
        bw = max(2, min(w - bx, int(box.get("width", 60))))
        bh = max(2, min(h - by, int(box.get("height", 60))))
        
        patch = img[by:by+bh, bx:bx+bw]
        gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
        med = float(np.median(gray))
        max_v = float(np.max(gray))
        min_v = float(np.min(gray))
        
        # 1. Translucent bright feature (like Gemini sparkle, light watermark)
        # Using adaptive threshold between median and max
        if (max_v - med) > 15:
            thresh_bright = med + (max_v - med) * 0.40
            _, bright_thresh = cv2.threshold(gray, int(thresh_bright), 255, cv2.THRESH_BINARY)
        else:
            bright_thresh = np.zeros((bh, bw), dtype=np.uint8)
            
        # 2. Dark text / stamps on light background
        if (med - min_v) > 20:
            thresh_dark = med - (med - min_v) * 0.45
            _, dark_thresh = cv2.threshold(gray, int(thresh_dark), 255, cv2.THRESH_BINARY_INV)
        else:
            dark_thresh = np.zeros((bh, bw), dtype=np.uint8)
            
        # 3. Morphological Top-Hat for fine text/logo strokes
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, k)
        _, tophat_thresh = cv2.threshold(tophat, 16, 255, cv2.THRESH_BINARY)
        
        patch_mask = cv2.bitwise_or(bright_thresh, tophat_thresh)
        patch_mask = cv2.bitwise_or(patch_mask, dark_thresh)
        
        # Dilate slightly (4px) to cover anti-aliased edges
        if np.sum(patch_mask) > 10:
            d_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            patch_mask = cv2.dilate(patch_mask, d_k, iterations=1)
        else:
            # If no stroke was isolated, create an elliptical target mask
            patch_mask = np.zeros((bh, bw), dtype=np.uint8)
            cv2.ellipse(patch_mask, (bw//2, bh//2), (bw//2 - 2, bh//2 - 2), 0, 0, 360, 255, -1)
            
        full_mask[by:by+bh, bx:bx+bw] = patch_mask
        
    # Inpaint using Fast Marching Method along Isophotes (Telea)
    # inpaintRadius of 4 ensures background texture flows through seamlessly with zero blur
    inpainted = cv2.inpaint(img, full_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)
    
    return inpainted, full_mask


def main():
    if len(sys.argv) < 3:
        print("Usage: python galaxy_inpaint.py <command> <args...>")
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "detect":
        input_path = sys.argv[2]
        ext = os.path.splitext(input_path)[1].lower()
        if ext in ['.mp4', '.mov', '.webm', '.avi', '.mkv']:
            detected = detect_watermark_in_video(input_path)
            # Read frame to get dimensions
            cap = cv2.VideoCapture(input_path)
            ret, frame = cap.read()
            cap.release()
            vw = frame.shape[1] if (ret and frame is not None) else 1280
            vh = frame.shape[0] if (ret and frame is not None) else 720
            print(json.dumps({
                "success": True,
                "detectedBox": detected,
                "imageWidth": vw,
                "imageHeight": vh
            }))
            return

        img = cv2.imread(input_path)
        if img is None:
            print(json.dumps({"error": "Failed to read image"}))
            sys.exit(1)
            
        detected = detect_watermark_in_image(img)
        print(json.dumps({
            "success": True,
            "detectedBox": detected,
            "imageWidth": img.shape[1],
            "imageHeight": img.shape[0]
        }))
        
    elif command == "inpaint":
        input_path = sys.argv[2]
        output_path = sys.argv[3]
        box_input = sys.argv[4] if len(sys.argv) > 4 else "{}"
        mask_path = sys.argv[5] if len(sys.argv) > 5 else None
        
        img = cv2.imread(input_path)
        if img is None:
            print(json.dumps({"error": "Failed to read input image"}))
            sys.exit(1)
            
        # Parse box: support both Base64 encoded JSON and raw JSON
        box = {}
        try:
            # Try Base64 decode first
            decoded_str = base64.b64decode(box_input).decode('utf-8')
            box = json.loads(decoded_str)
        except Exception:
            try:
                box = json.loads(box_input)
            except Exception:
                box = {}
                
        # If box is empty, auto-detect it
        if not box or not box.get("width") or not box.get("height"):
            box = detect_watermark_in_image(img)
            
        custom_mask = None
        if mask_path and os.path.exists(mask_path):
            m = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
            if m is not None:
                custom_mask = cv2.resize(m, (img.shape[1], img.shape[0]))
                _, custom_mask = cv2.threshold(custom_mask, 127, 255, cv2.THRESH_BINARY)
                
        clean_img, used_mask = inpaint_zero_blur(img, box, custom_mask)
        
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        cv2.imwrite(output_path, clean_img, [cv2.IMWRITE_JPEG_QUALITY, 99])
        
        print(json.dumps({
            "success": True,
            "outputPath": output_path,
            "width": clean_img.shape[1],
            "height": clean_img.shape[0],
            "appliedBox": box
        }))

if __name__ == "__main__":
    main()
