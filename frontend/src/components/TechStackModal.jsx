'use client';

import React from 'react';
import { X, Layers, Cpu, Video, Image as ImageIcon, Database, Server, Sparkles, CheckCircle2 } from 'lucide-react';

export default function TechStackModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const stackCategories = [
    {
      title: '1. Frontend & Edge Hosting',
      icon: <Layers size={20} color="#38bdf8" />,
      color: '#38bdf8',
      desc: 'High-performance interactive web interface',
      techs: [
        { name: 'Vercel Edge Hosting', role: 'Global edge deployment with automated CI/CD and CDN asset distribution' },
        { name: 'Next.js 14 & React 18', role: 'Server and client components, SSR/SSG, fast routing & optimization' },
        { name: 'Socket.io Client', role: 'Real-time WebSocket streaming for 0-100% video transformation progress' },
        { name: 'Calibri Design System', role: 'Glassmorphism, cosmic dark mode, interactive bounding box canvas' }
      ]
    },
    {
      title: '2. Backend, API & Interactive Docs',
      icon: <Server size={20} color="#818cf8" />,
      color: '#818cf8',
      desc: 'Multipart ingestion and enterprise orchestration',
      techs: [
        { name: 'Node.js & Express (Render)', role: 'Microservice container hosted on Render cloud infrastructure' },
        { name: 'Swagger UI & OpenAPI 3.0', role: 'Interactive API playground and documentation at /api/docs' },
        { name: 'Socket.io WebSocket Engine', role: 'Bidirectional job event streaming (analyzing, processing, completed)' },
        { name: 'Multer & File Registry', role: 'Multi-part streaming ingestion with auto disk recovery' }
      ]
    },
    {
      title: '3. Database & Caching Layer',
      icon: <Database size={20} color="#10b981" />,
      color: '#10b981',
      desc: 'Persistent job history and microsecond cache performance',
      techs: [
        { name: 'Neon Tech (Serverless PostgreSQL)', role: 'Auto-scaling relational database with instant branching' },
        { name: 'Drizzle ORM & Drizzle Kit', role: 'Type-safe SQL schema definitions, migrations and high-speed queries' },
        { name: 'Redis Cache & Queue', role: 'Sub-millisecond job state cache and distributed rate limiting' }
      ]
    },
    {
      title: '4. Video Delogo & Frame Processing',
      icon: <Video size={20} color="#f59e0b" />,
      color: '#f59e0b',
      desc: 'Motion frame interpolation and audio sync preservation',
      techs: [
        { name: 'FFmpeg & Docker Container', role: 'Production containerized FFmpeg filter graph transformations' },
        { name: 'Aspect Ratio Studio (16:9 ⇄ 9:16)', role: 'Studio Blurred Background, Cinema Black Bars, Center Crop & Fill' },
        { name: 'FFmpeg delogo filter', role: 'Contextual spatial inpainting erasing logos and channel stamps' },
        { name: 'H.264 (libx264) + AAC', role: 'Fast-start streaming container encoding' }
      ]
    },
    {
      title: '5. Containerization & DevOps',
      icon: <Cpu size={20} color="#ec4899" />,
      color: '#ec4899',
      desc: 'Multi-cloud scalable infrastructure',
      techs: [
        { name: 'Docker & Dockerfile', role: 'Containerized Linux runtime bundling Node 20, Python 3, and FFmpeg' },
        { name: 'Docker Compose', role: 'Local full-stack orchestration: Backend + Redis + PostgreSQL' },
        { name: 'Render Blueprint (render.yaml)', role: 'Declarative Infrastructure as Code for automatic cloud builds' }
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
