import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape
print(f"Full image dimensions: {w}x{h}")

# The user's image is 1376 x 768.
# Let's save marked images with a grid so we know exact coordinates:
marked = img.copy()
for y in range(0, h, 50):
    cv2.line(marked, (0, y), (w, y), (0, 255, 0), 1)
    cv2.putText(marked, str(y), (10, y+15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

for x in range(0, w, 50):
    cv2.line(marked, (x, 0), (x, h), (0, 255, 0), 1)
    cv2.putText(marked, str(x), (x+5, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

# Crop the bottom right corner with grid:
br_grid = marked[550:, 1100:]
cv2.imwrite('backend/processed/br_grid.jpg', br_grid)
print("Saved br_grid.jpg with coordinate grid")
