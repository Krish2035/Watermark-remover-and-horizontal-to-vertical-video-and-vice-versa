import rateLimit from 'express-rate-limit';

/**
 * Global DDoS & General Traffic Rate Limiter
 * 200 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
    status: 429
  }
});

/**
 * Strict Authentication Rate Limiter (Brute-Force & Credential Stuffing Protection)
 * 15 login / register attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please wait 15 minutes before trying again to ensure security.',
    status: 429
  }
});

/**
 * Media Processing Rate Limiter (CPU & GPU Inpainting Abuse Protection)
 * 40 media transformation jobs per 15 minutes per IP
 */
export const mediaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Media transformation limit reached for this session. Please wait a few minutes before processing more media.',
    status: 429
  }
});
