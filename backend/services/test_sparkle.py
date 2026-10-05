import cv2
import numpy as np

img = cv2.imread('backend/uploads/1514e501-be15-4017-a166-14de90212589.jpg')
h, w, _ = img.shape

# Let's inspect the exact crop around the sparkle
# In our previous crop (from h*0.75=576, w*0.55=756):
# Sparkle was in the right half of that crop:
crop_y1 = int(h * 0.75)
crop_x1 = int(w * 0.55)

# Find bright/translucent star in the sky/cloud area
# Let's locate the sparkle in full coordinates:
roi = img[crop_y1:, crop_x1:]
gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

# The sparkle is distinctly brighter than the surrounding purple/gray clouds
# TopHat morphology isolates the star
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (35, 35))
tophat = cv2.morphologyEx(gray_roi, cv2.MORPH_TOPHAT, kernel)
_, thresh = cv2.threshold(tophat, 20, 255, cv2.THRESH_BINARY)

contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
for c in contours:
    x, y, bw, bh = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    if 200 < area < 15000:
        full_x = crop_x1 + x
        full_y = crop_y1 + y
        print(f"Found sparkle watermark candidate at full coords: x={full_x}, y={full_y}, w={bw}, h={bh}, area={area}")
        
        # Test inpainting ONLY this exact mask!
        mask = np.zeros((h, w), dtype=np.uint8)
        # Create tight mask with dilation
        mask_roi = np.zeros(gray_roi.shape, dtype=np.uint8)
        cv2.drawContours(mask_roi, [c], -1, 255, -1)
        dilate_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        mask_roi = cv2.dilate(mask_roi, dilate_k)
        mask[crop_y1:, crop_x1:] = mask_roi
        
        # Run inpainting
        clean = cv2.inpaint(img, mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)
        cv2.imwrite('backend/processed/test_sparkle_removed.jpg', clean)
        print("Successfully generated test_sparkle_removed.jpg")
