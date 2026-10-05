import cv2
import numpy as np

crop = cv2.imread('backend/processed/debug_crop.jpg')
ch, cw, _ = crop.shape
print(f"Crop shape: {cw}x{ch}")

# Let's inspect the rightmost 25% of the crop
right_crop = crop[:, int(cw*0.7):]
cv2.imwrite('backend/processed/right_crop.jpg', right_crop)

# Locate the star in this right_crop
gray = cv2.cvtColor(right_crop, cv2.COLOR_BGR2GRAY)
# Find the brightest region in the sky
# Let's print the maximum brightness coordinates
y, x = np.unravel_index(np.argmax(gray), gray.shape)
print(f"Max pixel in right_crop at: x={x}, y={y}, val={gray[y, x]}")

# Crop a 120x120 box around that point
x1 = max(0, x - 60)
x2 = min(right_crop.shape[1], x + 60)
y1 = max(0, y - 60)
y2 = min(right_crop.shape[0], y + 60)

star_box = right_crop[y1:y2, x1:x2]
cv2.imwrite('backend/processed/star_exact.jpg', star_box)
print("Saved star_exact.jpg")
