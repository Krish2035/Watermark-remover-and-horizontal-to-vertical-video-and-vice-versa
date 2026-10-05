import cv2
import numpy as np

def detect_corner_watermark(img):
    h, w = img.shape[:2]
    
    # 1. Search in bottom-right extreme corner margin:
    # Outer 18% width, outer 20% height
    x0 = int(w * 0.82)
    y0 = int(h * 0.78)
    corner = img[y0:, x0:]
    
    gray = cv2.cvtColor(corner, cv2.COLOR_BGR2GRAY)
    
    # Find the brightest point or highest contrast point in the corner
    # Watermarks (sparkles, text, logos) stand out from their immediate background
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    med = np.median(gray)
    
    # Check for bright star/logo
    diff = gray.astype(np.float32) - med
    
    # Also Top-Hat morphology (isolates shapes with radius ~10-30 px)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, k)
    
    # Combined response
    response = cv2.addWeighted(np.clip(diff, 0, 255).astype(np.uint8), 0.6, tophat, 0.4, 0)
    
    # Find contours above threshold
    _, thresh = cv2.threshold(response, 18, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    best_box = None
    best_dist = 999999
    
    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        area = cv2.contourArea(c)
        # Sparkles and corner logos are compact (area > 30, size between 15 and 150)
        if area > 30 and 10 < bw < 140 and 10 < bh < 140:
            cx = x + bw / 2
            cy = y + bh / 2
            # Distance to the absolute corner
            dist = np.sqrt((corner.shape[1] - cx)**2 + (corner.shape[0] - cy)**2)
            if dist < best_dist:
                best_dist = dist
                pad = 12
                fx = max(0, x0 + x - pad)
                fy = max(0, y0 + y - pad)
                fw = min(w - fx, bw + pad * 2)
                fh = min(h - fy, bh + pad * 2)
                best_box = {
                    "x": int(fx),
                    "y": int(fy),
                    "width": int(fw),
                    "height": int(fh),
                    "confidence": 0.98
                }
                
    if best_box:
        return best_box
        
    # If no contour passed, pick the local maximum in the corner
    y_max, x_max = np.unravel_index(np.argmax(gray), gray.shape)
    fx = max(0, x0 + x_max - 40)
    fy = max(0, y0 + y_max - 40)
    return {
        "x": int(fx),
        "y": int(fy),
        "width": 80,
        "height": 80,
        "confidence": 0.9
    }

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
res = detect_corner_watermark(img)
print("Detected Box:", res)
