import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

# Star center: (1286, 662)
# Box around star:
bx = 1286 - 45
by = 662 - 45
bw = 90
bh = 90

star_patch = img[by:by+bh, bx:bx+bw]
gray_patch = cv2.cvtColor(star_patch, cv2.COLOR_BGR2GRAY)

# The star is translucent white (luminance > 115)
# Find background median
bg_median = np.median(gray_patch)
_, star_mask_tight = cv2.threshold(gray_patch, int(bg_median + 25), 255, cv2.THRESH_BINARY)

# Dilate by 3 pixels to cover smooth anti-aliased edges
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
star_mask = cv2.dilate(star_mask_tight, kernel, iterations=1)

# Save mask visualization
cv2.imwrite('backend/processed/star_mask_vis.jpg', star_mask)

# Create full image mask
full_mask = np.zeros((h, w), dtype=np.uint8)
full_mask[by:by+bh, bx:bx+bw] = star_mask

# Inpaint using Telea with inpaintRadius=4
clean = cv2.inpaint(img, full_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)

# Save the full clean image
cv2.imwrite('backend/processed/clean_hanuman_galaxy_ai.jpg', clean)

# Save the crop around the former star
clean_star_patch = clean[by-20:by+bh+20, bx-20:bx+bw+20]
cv2.imwrite('backend/processed/clean_star_patch.jpg', clean_star_patch)

# Save the wider crop showing the mountain and rock
wide_crop = clean[int(h*0.75):, int(w*0.55):]
cv2.imwrite('backend/processed/clean_wide_crop.jpg', wide_crop)

print("Saved clean_star_patch.jpg and clean_wide_crop.jpg successfully!")
