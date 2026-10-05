import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

# Let's inspect the entire bottom-right 30% width and 35% height
crop_x1 = int(w * 0.7)
crop_y1 = int(h * 0.6)
roi = img[crop_y1:, crop_x1:]

gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
max_val = np.max(gray)
print(f"Max brightness in bottom-right corner: {max_val}")

ys, xs = np.where(gray > 160)
if len(xs) > 0:
    min_x, max_x = np.min(xs), np.max(xs)
    min_y, max_y = np.min(ys), np.max(ys)
    print(f"Bright pixels range in ROI: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")
    full_min_x = crop_x1 + min_x
    full_max_x = crop_x1 + max_x
    full_min_y = crop_y1 + min_y
    full_max_y = crop_y1 + max_y
    print(f"Full image coords of the star: x=[{full_min_x}, {full_max_x}], y=[{full_min_y}, {full_max_y}]")
    print(f"Star center: ({ (full_min_x+full_max_x)//2 }, { (full_min_y+full_max_y)//2 }), width={full_max_x - full_min_x}, height={full_max_y - full_min_y}")
else:
    print("No pixels > 160, checking lower thresholds")
    for thresh_val in [130, 110, 90]:
        ys, xs = np.where(gray > thresh_val)
        print(f"Threshold {thresh_val}: {len(xs)} pixels")
