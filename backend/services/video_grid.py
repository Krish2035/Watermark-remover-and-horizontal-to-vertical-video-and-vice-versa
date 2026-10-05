import cv2

img = cv2.imread('backend/processed/video_frame.jpg')
h, w, _ = img.shape
print(f"Video frame size: {w}x{h}")

# Mark 50px grid
for y in range(0, h, 50):
    cv2.line(img, (0, y), (w, y), (0, 255, 0), 1)
    cv2.putText(img, str(y), (10, y+15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

for x in range(0, w, 50):
    cv2.line(img, (x, 0), (x, h), (0, 255, 0), 1)
    cv2.putText(img, str(x), (x+5, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

# Crop bottom right corner with grid
corner = img[500:, 1050:]
cv2.imwrite('backend/processed/video_grid.jpg', corner)
print("Saved video_grid.jpg")
