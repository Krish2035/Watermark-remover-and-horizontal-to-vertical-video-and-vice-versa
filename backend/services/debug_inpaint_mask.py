import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

box = {"x": 1208, "y": 631, "width": 150, "height": 99}
bx = box["x"]
by = box["y"]
bw = box["width"]
bh = box["height"]

patch = img[by:by+bh, bx:bx+bw]
gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
med = np.median(gray)
print("Median brightness inside patch:", med)
print("Max brightness inside patch:", np.max(gray))

# Check what bright_thresh gave:
_, bright_thresh = cv2.threshold(gray, int(min(245, med + 16)), 255, cv2.THRESH_BINARY)
print("Nonzero pixels in bright_thresh:", cv2.countNonZero(bright_thresh))

# Let's save the patch and bright_thresh:
cv2.imwrite('backend/processed/debug_patch.jpg', patch)
cv2.imwrite('backend/processed/debug_thresh.jpg', bright_thresh)

# Check what inpaint_zero_blur actually did:
from galaxy_inpaint import inpaint_zero_blur
clean_img, used_mask = inpaint_zero_blur(img, box)
print("Nonzero pixels in used_mask:", cv2.countNonZero(used_mask))

cv2.imwrite('backend/processed/debug_used_mask.jpg', used_mask)
print("Saved debug masks!")
