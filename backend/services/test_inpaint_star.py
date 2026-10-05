import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

# Let's crop around the star:
# x: 1100 to 1250, y: 440 to 620
star_roi = img[440:620, 1100:1250]
cv2.imwrite('backend/processed/star_roi.jpg', star_roi)

gray_roi = cv2.cvtColor(star_roi, cv2.COLOR_BGR2GRAY)

# Find the star by thresholding:
# The star is light silvery white on top of brown/dark mountains and clouds
# Let's find contours of the star:
_, thresh = cv2.threshold(gray_roi, 140, 255, cv2.THRESH_BINARY)

# Dilate slightly to encompass the soft edges of the star
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
mask_roi = cv2.dilate(thresh, kernel, iterations=1)

# Full mask
full_mask = np.zeros((h, w), dtype=np.uint8)
full_mask[440:620, 1100:1250] = mask_roi

# Inpaint using Telea with radius 5
clean = cv2.inpaint(img, full_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

cv2.imwrite('backend/processed/clean_star_isolated.jpg', clean)

# Also crop the exact same region to verify that it's 100% clean and zero blur!
clean_roi = clean[440:620, 1100:1250]
cv2.imwrite('backend/processed/clean_roi.jpg', clean_roi)

print("Saved clean_roi.jpg successfully!")
