# Base image with modern Node.js 20 on Debian 12 (Bookworm)
FROM node:20-bookworm-slim

# Install system dependencies: FFmpeg, Python3, OpenCV, NumPy, python symlink, and CA certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python-is-python3 \
    python3-numpy \
    python3-opencv \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend dependencies and install
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source files
COPY backend/ ./

# Create necessary storage directories
RUN mkdir -p uploads processed

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
