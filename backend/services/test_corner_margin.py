import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

# Corner margin: outer 18% width and outer 20% height
x0 = int(w * 0.82)
y0 = int(h * 0.78)
roi = img[y0:, x0:]

gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
med = np.median(gray)
print(f"Corner ROI: {x0}..{w}, {y0}..{h}, median brightness={med}")

# High-luminance threshold in corner
_, thresh = cv2.threshold(gray, int(min(240, med + 18)), 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

print(f"Contours in corner margin: {len(contours)}")
for i, c in enumerate(contours):
    x, y, bw, bh = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    if area > 100:
        fx = x0 + x
        fy = y0 + y
        print(f"Candidate #{i}: box=({fx}, {fy}, {bw}, {bh}), area={area}")
