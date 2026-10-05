import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

# The sparkle is in the bottom-right sky area:
# X: ~1120 to 1230, Y: ~630 to 740
sparkle_roi = img[630:740, 1120:1230]

# Convert to HSV or LAB to isolate the light translucent white star against the darker cloud
gray = cv2.cvtColor(sparkle_roi, cv2.COLOR_BGR2GRAY)

# Find the star by thresholding the highest luminance pixels in this local window
# The star is significantly brighter than the surrounding cloud
local_median = np.median(gray)
print(f"Local median brightness: {local_median}")
_, star_thresh = cv2.threshold(gray, int(local_median + 22), 255, cv2.THRESH_BINARY)

# Dilate slightly so edges are smooth
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
star_mask = cv2.dilate(star_thresh, kernel, iterations=1)

# Full mask
full_mask = np.zeros((h, w), dtype=np.uint8)
full_mask[630:740, 1120:1230] = star_mask

# Inpaint
clean = cv2.inpaint(img, full_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

# Save result
cv2.imwrite('backend/processed/clean_hanuman_perfect.jpg', clean)

# Also save crop to verify
crop = clean[int(h*0.75):, int(w*0.55):]
cv2.imwrite('backend/processed/clean_hanuman_crop.jpg', crop)
print("Saved clean_hanuman_crop.jpg successfully!")
