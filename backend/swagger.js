import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ClearMark AI - Media Inpainting & Video Aspect Ratio API',
      version: '2.0.0',
      description:
        'Scalable RESTful API for AI watermark elimination, video delogo inpainting, and Horizontal ⇄ Vertical aspect ratio conversion (16:9 ↔ 9:16). Powered by Node.js, Drizzle ORM, Neon PostgreSQL, Redis, and FFmpeg.',
      contact: {
        name: 'ClearMark AI Engineering'
      }
    },
    servers: [
      {
        url: '/',
        description: 'Current Environment Server'
      }
    ],
    components: {
      schemas: {
        UploadResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            fileId: { type: 'string' },
            originalName: { type: 'string' },
            mediaType: { type: 'string', enum: ['image', 'video'] },
            mimeType: { type: 'string' },
            size: { type: 'integer' },
            url: { type: 'string' },
            detection: {
              type: 'object',
              properties: {
                imageWidth: { type: 'integer' },
                imageHeight: { type: 'integer' },
                detectedBox: {
                  type: 'object',
                  properties: {
                    x: { type: 'integer' },
                    y: { type: 'integer' },
                    width: { type: 'integer' },
                    height: { type: 'integer' }
                  }
                }
              }
            }
          }
        },
        ConvertAspectRequest: {
          type: 'object',
          properties: {
            fileId: { type: 'string' },
            targetOrientation: { type: 'string', enum: ['vertical', 'horizontal'] },
            mode: { type: 'string', enum: ['blur', 'pad', 'crop'] },
            resolution: { type: 'string', enum: ['auto', '1080x1920', '720x1280', '1920x1080', '1280x720'] }
          }
        }
      }
    }
  },
  apis: ['./server.js']
};

export const swaggerSpec = swaggerJsdoc(options);
