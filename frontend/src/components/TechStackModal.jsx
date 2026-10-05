'use client';

import React from 'react';
import { X, Layers, Cpu, Video, Image as ImageIcon, Database, Server, Sparkles, CheckCircle2 } from 'lucide-react';

export default function TechStackModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const stackCategories = [
    {
      title: '1. Frontend Layer',
      icon: <Layers size={20} color="#38bdf8" />,
      color: '#38bdf8',
      desc: 'High-performance interactive web interface',
      techs: [
        { name: 'Next.js 14/15', role: 'React Framework, SSR/SSG, fast routing & asset optimization' },
        { name: 'HTML5 Canvas API', role: 'Interactive watermark bounding box selection & client brush' },
        { name: 'Vanilla CSS Design System', role: 'Glassmorphism, glow effects, responsive split slider' },
        { name: 'Lucide React & Confetti', role: 'Modern UI icons and celebratory completion animations' }
      ]
    },
    {
      title: '2. Backend & API Layer',
      icon: <Server size={20} color="#818cf8" />,
      color: '#818cf8',
      desc: 'Multipart media ingestion and orchestration',
      techs: [
        { name: 'Node.js & Express', role: 'RESTful API routing, file lifecycle management' },
        { name: 'Multer', role: 'Multipart streaming file upload with size/type verification' },
        { name: 'UUID & File Registry', role: 'Isolated session tracking and secure media access' }
      ]
    },
    {
      title: '3. Image Inpainting & Vision Engine',
      icon: <ImageIcon size={20} color="#ec4899" />,
      color: '#ec4899',
      desc: 'Eliminating static watermarks with texture reconstruction',
      techs: [
        { name: 'Sharp (libvips)', role: 'High-speed image decoding, buffer manipulation & lossless export' },
        { name: 'Contextual Inpainter (Telea / FMM)', role: 'Fast Marching & Poisson boundary reconstruction' },
        { name: 'LaMa (Large Mask Inpainting)', role: 'Recommended AI Model: Fourier convolutions for photorealistic fill' },
        { name: 'YOLOv8 / SAM (Segment Anything)', role: 'Recommended AI: Auto-detection of logos and text contours' }
      ]
    },
    {
      title: '4. Video Delogo & Frame Processing',
      icon: <Video size={20} color="#f59e0b" />,
      color: '#f59e0b',
      desc: 'Motion frame interpolation and audio sync preservation',
      techs: [
        { name: 'FFmpeg (ffmpeg-static)', role: 'Cross-platform bundled standalone media transcoding engine' },
        { name: 'FFmpeg delogo filter', role: 'Interpolates surround pixels across bounding box seamlessly' },
        { name: 'H.264 (libx264) + AAC', role: 'Ultra-fast web-compatible streaming MP4 encoding' },
        { name: 'ProPainter / E2FGVI (Optional AI)', role: 'State-of-the-art flow-guided deep video inpainting' }
      ]
    },
    {
      title: '5. Production Scale Infrastructure',
      icon: <Database size={20} color="#10b981" />,
      color: '#10b981',
      desc: 'What you need to scale to millions of users',
      techs: [
        { name: 'BullMQ + Redis', role: 'Background worker queue so long videos never timeout HTTP calls' },
        { name: 'AWS S3 / Cloudflare R2', role: 'Presigned direct-to-cloud uploads to keep server bandwidth light' },
        { name: 'Serverless GPU (RunPod / Replicate)', role: 'Runs heavy PyTorch AI inpainting models on-demand' },
        { name: 'WebSockets / SSE', role: 'Real-time 0-100% progress streaming for long video renders' }
      ]
    }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '20px',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#818cf8" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                Complete Watermark Remover <span className="gradient-text">Tech Stack</span>
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Comprehensive blueprint of frontend, backend, AI models, and production scaling tools
            </p>
          </div>
          <button
            onClick={onClose}
            className="gemini-chip-remove"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {stackCategories.map((cat, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {cat.icon}
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: cat.color }}>
                  {cat.title}
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {cat.desc}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {cat.techs.map((t, tIdx) => (
                  <div
                    key={tIdx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      padding: '10px 14px'
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#10b981" />
                      {t.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                      {t.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal footer */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '10px 24px' }}>
            Got It! Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
