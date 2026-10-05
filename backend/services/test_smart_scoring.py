import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

x0 = int(w * 0.80)
y0 = int(h * 0.75)
corner = img[y0:, x0:]
gray = cv2.cvtColor(corner, cv2.COLOR_BGR2GRAY)
med = np.median(gray)

diff = cv2.absdiff(gray, int(med))
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, k)
response = cv2.addWeighted(diff, 0.6, tophat, 0.4, 0)

_, thresh = cv2.threshold(response, 18, 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

target_cx = corner.shape[1]
target_cy = corner.shape[0]

candidates = []

for c in contours:
    x, y, bw, bh = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    # Filter out single noise pixels and massive landscape mountains
    if 25 < area < 4000 and bw < 140 and bh < 140:
        cx = x + bw / 2
        cy = y + bh / 2
        dist = np.sqrt((target_cx - cx)**2 + (target_cy - cy)**2)
        
        # Max brightness in contour
        c_mask = np.zeros(gray.shape, dtype=np.uint8)
        cv2.drawContours(c_mask, [c], -1, 255, -1)
        max_b = np.max(gray[c_mask == 255])
        
        # Watermarks: closer to corner + higher brightness + compact size
        score = (float(max_b) * 100.0) / (dist + 20.0)
        
        fx = x0 + x
        fy = y0 + y
        contains_star = (fx <= 1286 <= fx + bw) and (fy <= 662 <= fy + bh)
        candidates.append((score, fx, fy, bw, bh, area, dist, max_b, contains_star))

candidates.sort(key=lambda item: item[0], reverse=True)
print(f"Top 5 candidates by intelligent watermark score:")
for i, item in enumerate(candidates[:5]):
    score, fx, fy, bw, bh, area, dist, max_b, contains_star = item
    print(f"#{i+1}: score={score:.1f}, full=({fx},{fy},{bw}x{bh}), dist={dist:.1f}, max_b={max_b}, has_star={contains_star}")
