'use client';

import React from 'react';
import { Sparkles, Code2, Layers, Cpu, ShieldCheck } from 'lucide-react';

export default function Header({ onOpenTechStack, onOpenAspectConverter }) {
  return (
    <header style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(7, 9, 14, 0.8)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%'
    }}>
      <div className="content-wrapper" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.location.reload()}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Clear<span className="gradient-text">Mark</span>
              </span>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.4)'
              }}>
                AI 2.0
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Image & Video Watermark Eliminator
            </div>
          </div>
        </div>

        {/* Navigation / Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Horizontal ⇄ Vertical Video Converter Button (Placed exactly in red square) */}
          <button
            onClick={onOpenAspectConverter}
            className="btn-aspect-toggle"
            id="aspect-ratio-converter-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: '0 0 18px rgba(139, 92, 246, 0.25)'
            }}
            title="Convert between Horizontal (16:9) and Vertical (9:16) video formats"
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)'
            }}>
              <Layers size={14} color="#ffffff" />
            </span>
            <span>Horizontal to Vertical / Vertical to Horizontal Video</span>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              background: 'rgba(168, 85, 247, 0.35)',
              color: '#e9d5ff',
              padding: '2px 7px',
              borderRadius: '6px',
              border: '1px solid rgba(168, 85, 247, 0.5)'
            }}>
              16:9 ⇄ 9:16
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: '600' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }}></span>
            AI Engine Online
          </div>

          <button
            onClick={onOpenTechStack}
            className="btn-secondary"
            style={{ fontSize: '0.88rem', padding: '9px 16px' }}
            title="View full required tech stack, ML models and production architecture"
          >
            <Code2 size={16} color="#818cf8" />
            <span>Tech Stack & Architecture</span>
          </button>
        </div>
      </div>
    </header>
  );
}
