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

print(f"Target corner point: ({target_cx}, {target_cy})")

for i, c in enumerate(contours):
    x, y, bw, bh = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    if area > 25:
        cx = x + bw / 2
        cy = y + bh / 2
        dist = np.sqrt((target_cx - cx)**2 + (target_cy - cy)**2)
        score = area / (dist + 5.0)
        fx = x0 + x
        fy = y0 + y
        # Also check if star center (1286, 662) is inside:
        contains_star = (fx <= 1286 <= fx + bw) and (fy <= 662 <= fy + bh)
        print(f"Contour #{i}: full=({fx},{fy},{bw}x{bh}), area={area:.0f}, dist={dist:.1f}, score={score:.2f}, has_star={contains_star}")
