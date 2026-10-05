import cv2

clean = cv2.imread('backend/processed/test_sparkle_removed.jpg')
h, w, _ = clean.shape
clean_crop = clean[int(h*0.75):, int(w*0.55):]
cv2.imwrite('backend/processed/debug_clean_crop.jpg', clean_crop)
print("Saved debug_clean_crop.jpg")
