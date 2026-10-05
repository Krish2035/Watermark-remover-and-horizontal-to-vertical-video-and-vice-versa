import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

# Exact box: x=1245, y=645, w=60, h=60
bx, by, bw, bh = 1240, 640, 70, 70

# Extract patch
patch = img[by:by+bh, bx:bx+bw]
gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)

# Find the star by thresholding:
# The star is light silvery white on top of the darker purple-gray clouds
# Background median in this 70x70 window:
med = np.median(gray)
print(f"Window median brightness: {med}")

# High-luminance threshold
_, star_mask_tight = cv2.threshold(gray, int(med + 18), 255, cv2.THRESH_BINARY)

# Dilate by 3 pixels so the entire star including anti-aliased tips is covered
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
star_mask = cv2.dilate(star_mask_tight, k, iterations=1)

full_mask = np.zeros((h, w), dtype=np.uint8)
full_mask[by:by+bh, bx:bx+bw] = star_mask

# Inpaint using Telea with radius 4
clean = cv2.inpaint(img, full_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)

# Save output
cv2.imwrite('backend/processed/1514e501-be15-4017-a166-14de90212589-clean.jpg', clean)
cv2.imwrite('backend/processed/clean_star_final.jpg', clean[600:750, 1200:1350])
print("Saved clean image successfully!")
