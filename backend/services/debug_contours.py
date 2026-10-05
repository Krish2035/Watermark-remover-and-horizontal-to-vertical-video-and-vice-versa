import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

x_start = int(w * 0.7)
y_start = int(h * 0.7)
br_roi = img[y_start:, x_start:]
gray_br = cv2.cvtColor(br_roi, cv2.COLOR_BGR2GRAY)

med = np.median(gray_br)
_, bright_thresh = cv2.threshold(gray_br, int(min(250, med + 20)), 255, cv2.THRESH_BINARY)

k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
tophat = cv2.morphologyEx(gray_br, cv2.MORPH_TOPHAT, k)
_, tophat_thresh = cv2.threshold(tophat, 16, 255, cv2.THRESH_BINARY)

combined = cv2.bitwise_or(bright_thresh, tophat_thresh)
contours, _ = cv2.findContours(combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

print(f"Total contours found: {len(contours)}")
for i, c in enumerate(contours):
    x, y, bw, bh = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    fx = x_start + x
    fy = y_start + y
    aspect = bw / float(bh)
    dist = np.sqrt((br_roi.shape[1] - (x + bw/2))**2 + (br_roi.shape[0] - (y + bh/2))**2)
    print(f"Contour #{i}: full coords=({fx}, {fy}), size=({bw}x{bh}), area={area:.1f}, aspect={aspect:.2f}, dist_to_corner={dist:.1f}")
