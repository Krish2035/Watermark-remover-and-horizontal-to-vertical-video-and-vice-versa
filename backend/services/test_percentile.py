import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

box = {'x': 1208, 'y': 631, 'width': 150, 'height': 99}
bx = box["x"]
by = box["y"]
bw = box["width"]
bh = box["height"]

patch = img[by:by+bh, bx:bx+bw]
gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
med = float(np.median(gray))
max_v = float(np.max(gray))

print(f"Patch stats: med={med}, max={max_v}")

# Robust adaptive threshold for watermarks:
# Watermarks are the brightest elements in the ROI
thresh_v = med + (max_v - med) * 0.40
print("Adaptive threshold:", thresh_v)

_, star_thresh = cv2.threshold(gray, int(thresh_v), 255, cv2.THRESH_BINARY)

# Dilate slightly by 4px so the entire star and its anti-aliased border is covered
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
star_mask = cv2.dilate(star_thresh, k, iterations=1)

full_mask = np.zeros((h, w), dtype=np.uint8)
full_mask[by:by+bh, bx:bx+bw] = star_mask

# Inpaint using Telea
clean = cv2.inpaint(img, full_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)

cv2.imwrite('backend/processed/test_clean_percentile.jpg', clean)
cv2.imwrite('backend/processed/test_clean_crop_percentile.jpg', clean[550:, 1100:])
print("Saved test_clean_percentile.jpg successfully!")
