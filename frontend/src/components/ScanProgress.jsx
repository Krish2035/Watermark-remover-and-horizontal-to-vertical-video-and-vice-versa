'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, Sparkles, Check, Scan, Film } from 'lucide-react';

export default function ScanProgress({ mediaType, onDone }) {
  const [percent, setPercent] = useState(12);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Analyzing Media Geometry',
      desc: 'Decoding pixel aspect ratios and color histogram'
    },
    {
      title: 'Identifying Watermark Coordinates',
      desc: 'Neural edge detection and corner watermark localization'
    },
    {
      title: mediaType === 'video' ? 'Applying FFmpeg Delogo Inpainting' : 'Neural Contextual Inpainting',
      desc: 'Interpolating boundary pixels and matching surface texture'
    },
    {
      title: 'Finalizing Clean Lossless Output',
      desc: 'Color grading stabilization and container encoding'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        const inc = Math.floor(Math.random() * 8) + 4;
        const next = Math.min(prev + inc, 95);
        if (next > 75) setCurrentStep(3);
        else if (next > 45) setCurrentStep(2);
        else if (next > 20) setCurrentStep(1);
        return next;
      });
    }, 280);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      width: '100%',
      maxWidth: '640px',
      margin: '0 auto',
      padding: '36px 32px',
      background: 'rgba(15, 23, 42, 0.85)',
      borderRadius: '24px',
      border: '1px solid rgba(99, 102, 241, 0.35)',
      boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 40px -10px rgba(99, 102, 241, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Scanner Beam Animation across card */}
      <div className="scanner-beam"></div>

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          position: 'relative'
        }}>
          <Scan size={30} color="#38bdf8" style={{ animation: 'spin 4s linear infinite' }} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '6px' }}>
          Removing Watermark with <span className="gradient-text">AI Precision</span>
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {mediaType === 'video'
            ? 'Scanning video frames and applying seamless delogo inpainting...'
            : 'Analyzing image texture and eliminating watermark artifacts...'}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#cbd5e1'
        }}>
          <span>Processing Pipeline</span>
          <span style={{ color: '#38bdf8' }}>{percent}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '10px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          overflow: 'hidden',
          padding: '2px'
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #38bdf8)',
            borderRadius: '8px',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.7)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {steps.map((s, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isCurrent ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: isCurrent ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: isDone
                  ? '#10b981'
                  : isCurrent
                  ? '#6366f1'
                  : 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {isDone ? (
                  <Check size={14} color="#ffffff" />
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff' }}>
                    {idx + 1}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.92rem',
                  fontWeight: isCurrent ? '700' : '600',
                  color: isCurrent ? '#f8fafc' : isDone ? '#94a3b8' : '#64748b'
                }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  {s.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
