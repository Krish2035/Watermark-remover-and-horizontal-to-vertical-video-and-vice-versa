import './globals.css';

export const metadata = {
  title: 'ClearMark AI - Instant Image & Video Watermark Remover',
  description:
    'Remove watermarks, logos, subtitles, and timestamps from videos and photos in seconds with intelligent AI inpainting and FFmpeg delogo reconstruction.',
  keywords: [
    'watermark remover',
    'remove watermark from video',
    'remove watermark from image',
    'AI inpainting',
    'delogo',
    'clean media tool'
  ],
  viewport: 'width=device-width, initial-scale=1'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✨</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
