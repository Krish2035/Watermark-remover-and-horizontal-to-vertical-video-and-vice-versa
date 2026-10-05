import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

# Let's crop the bottom right quarter
br_crop = img[int(h*0.75):, int(w*0.55):]
cv2.imwrite('backend/processed/debug_crop.jpg', br_crop)
print("Saved debug_crop.jpg")
