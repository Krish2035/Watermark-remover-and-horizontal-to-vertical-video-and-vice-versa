import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

# Candidate 20: box=(1216, 645, 132, 79)
roi = img[645:645+79, 1216:1216+132]
cv2.imwrite('backend/processed/cand20.jpg', roi)

# Isolate the star inside candidate 20
gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
# Find max brightness (star center)
y, x = np.unravel_index(np.argmax(gray), gray.shape)
print(f"Brightest point inside Candidate 20: x={x}, y={y}, val={gray[y, x]}")

# Crop 60x60 around the brightest point:
star_x = 1216 + x
star_y = 645 + y
print(f"Exact star center in full image: ({star_x}, {star_y})")

star_crop = img[max(0, star_y-40):min(h, star_y+40), max(0, star_x-40):min(w, star_x+40)]
cv2.imwrite('backend/processed/cand20_star.jpg', star_crop)
