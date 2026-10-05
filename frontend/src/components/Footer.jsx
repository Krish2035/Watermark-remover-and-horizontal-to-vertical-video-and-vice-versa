'use client';

import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer({ onOpenTechStack }) {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '36px 0',
      marginTop: 'auto',
      background: 'rgba(7, 9, 14, 0.95)'
    }}>
      <div className="content-wrapper" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#818cf8" />
          <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>ClearMark AI</span>
          <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
            • Next.js + Express Watermark Remover
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onOpenTechStack}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Required Tech Stack Guide
          </button>
          <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
            Built for Image & Video AI Cleanup
          </span>
        </div>
      </div>
    </footer>
  );
}
