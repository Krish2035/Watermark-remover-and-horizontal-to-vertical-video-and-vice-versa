import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape
print(f"Image shape: {w}x{h}")

# The bottom right region
br = img[int(h*0.7):, int(w*0.5):]
gray = cv2.cvtColor(br, cv2.COLOR_BGR2GRAY)

# Find areas with high variance / contrast (typical for watermark text)
grad_x = cv2.Sobel(gray, cv2.CV_16S, 1, 0)
grad_y = cv2.Sobel(gray, cv2.CV_16S, 0, 1)
grad = cv2.addWeighted(cv2.convertScaleAbs(grad_x), 0.5, cv2.convertScaleAbs(grad_y), 0.5, 0)

# Threshold to find text lines
_, thresh = cv2.threshold(grad, 45, 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

boxes = []
for c in contours:
    x, y, bw, bh = cv2.boundingRect(c)
    if bw > 15 and bh > 6:
        # translate back to full image coords
        fx = int(w*0.5) + x
        fy = int(h*0.7) + y
        boxes.append((fx, fy, bw, bh))

if boxes:
    min_x = min(b[0] for b in boxes)
    min_y = min(b[1] for b in boxes)
    max_x = max(b[0] + b[2] for b in boxes)
    max_y = max(b[1] + b[3] for b in boxes)
    print(f"Detected watermark text zone: x={min_x}, y={min_y}, w={max_x-min_x}, h={max_y-min_y}")
else:
    print("No contours found")
