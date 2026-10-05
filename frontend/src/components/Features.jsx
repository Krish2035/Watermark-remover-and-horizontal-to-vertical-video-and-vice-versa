'use client';

import React from 'react';
import { Sparkles, Zap, Shield, EyeOff, Film, Image as ImageIcon } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Sparkles size={24} color="#818cf8" />,
      title: 'AI Intelligent Inpainting',
      desc: 'Blends surrounding texture, lighting, and gradients smoothly across erased watermark zones.'
    },
    {
      icon: <Film size={24} color="#ec4899" />,
      title: 'Lossless Video Delogo',
      desc: 'Seamlessly removes TV channel logos, TikTok handles, and subtitles while preserving audio track sync.'
    },
    {
      icon: <Zap size={24} color="#38bdf8" />,
      title: 'Real-Time Auto Detection',
      desc: 'Automatically pinpoints watermark coordinates in image corners and video margins with 99% accuracy.'
    },
    {
      icon: <Shield size={24} color="#10b981" />,
      title: 'Private & Secure',
      desc: 'Processed directly on your local system with instant cleanup and zero data persistence to third parties.'
    }
  ];

  return (
    <section style={{ padding: '60px 0 40px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
          Engineered for <span className="gradient-text">Flawless Media Cleanup</span>
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          High-performance image and video processing pipeline
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        {features.map((feat, idx) => (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '28px 24px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}>
              {feat.icon}
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>
              {feat.title}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: '1.5' }}>
              {feat.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
