import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

box = {'x': 1210, 'y': 633, 'width': 146, 'height': 95}
bx, by, bw, bh = box['x'], box['y'], box['width'], box['height']

patch = img[by:by+bh, bx:bx+bw]
gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)

med = np.median(gray)
print("Median brightness:", med)

# Find translucent star
_, star_thresh = cv2.threshold(gray, int(min(240, med + 16)), 255, cv2.THRESH_BINARY)

# Dilate slightly
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
star_mask = cv2.dilate(star_thresh, k, iterations=1)

full_mask = np.zeros((h, w), dtype=np.uint8)
full_mask[by:by+bh, bx:bx+bw] = star_mask

clean = cv2.inpaint(img, full_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)

cv2.imwrite('backend/processed/test_clean_from_auto_detect.jpg', clean)
cv2.imwrite('backend/processed/test_crop_from_auto.jpg', clean[550:, 1100:])
print("Saved test_clean_from_auto_detect.jpg")
