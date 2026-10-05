'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, RotateCcw, CheckCircle2, Sliders, SplitSquareVertical, Sparkles, Eye, Share2, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ResultViewer({ result, onReset }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'side-by-side'
  const containerRef = useRef(null);

  useEffect(() => {
    // Fire celebratory confetti on finish
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    setSliderPos((clamped / rect.width) * 100);
  };

  const isVideo = result.mediaType === 'video';

  return (
    <div style={{ width: '100%', maxWidth: '1020px', margin: '0 auto' }}>
      {/* Success banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 24px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)'
          }}>
            <CheckCircle2 size={22} color="#ffffff" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ecfdf5' }}>
              Watermark Removed with Galaxy AI Precision!
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#6ee7b7' }}>
              Processed in {result.processingTimeMs ? (result.processingTimeMs / 1000).toFixed(2) : '1.2'}s • Zero blur, 100% texture and detail preserved
            </p>
          </div>
        </div>

        {/* View mode toggle (for images) */}
        {!isVideo && (
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setViewMode('slider')}
              style={{
                background: viewMode === 'slider' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: viewMode === 'slider' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <SplitSquareVertical size={14} />
              Split Slider
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              style={{
                background: viewMode === 'side-by-side' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: viewMode === 'side-by-side' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layers size={14} />
              Side-by-Side
            </button>
          </div>
        )}
      </div>

      {/* Main Preview Container */}
      <div style={{ marginBottom: '28px' }}>
        {isVideo ? (
          /* VIDEO COMPARISON */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {/* Original Video */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '18px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#f87171',
                marginBottom: '10px'
              }}>
                <span>ORIGINAL (With Watermark)</span>
              </div>
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000000',
                aspectRatio: '16/9'
              }}>
                <video
                  src={result.originalUrl}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Clean Video */}
            <div className="glass-panel" style={{
              padding: '16px',
              borderRadius: '18px',
              border: '1px solid rgba(16, 185, 129, 0.4)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#34d399',
                marginBottom: '10px'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} />
                  CLEAN (Watermark Removed)
                </span>
              </div>
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000000',
                aspectRatio: '16/9'
              }}>
                <video
                  src={result.cleanUrl}
                  controls
                  autoPlay
                  loop
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        ) : viewMode === 'slider' ? (
          /* INTERACTIVE IMAGE SPLIT SLIDER */
          <div
            ref={containerRef}
            className="split-slider-container"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
            style={{ cursor: isDragging ? 'ew-resize' : 'default' }}
          >
            {/* Background: Clean Image (Watermark Removed) */}
            <div className="split-layer">
              <img src={result.cleanUrl} alt="Clean result" />
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(16, 185, 129, 0.85)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.04em',
                backdropFilter: 'blur(8px)'
              }}>
                ✨ WATERMARK REMOVED
              </div>
            </div>

            {/* Foreground: Original Image (Clipped) */}
            <div
              className="split-layer"
              style={{
                clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`
              }}
            >
              <img src={result.originalUrl} alt="Original image" />
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(239, 68, 68, 0.85)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.04em',
                backdropFilter: 'blur(8px)'
              }}>
                ORIGINAL WATERMARK
              </div>
            </div>

            {/* Divider bar */}
            <div
              className="split-divider"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="split-handle">
                <Sliders size={18} />
              </div>
            </div>

            {/* Hint */}
            <div style={{
              position: 'absolute',
              bottom: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#cbd5e1',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              Drag slider left or right to compare
            </div>
          </div>
        ) : (
          /* SIDE BY SIDE VIEW */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '18px' }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#f87171',
                marginBottom: '10px'
              }}>
                ORIGINAL (With Watermark)
              </div>
              <div style={{ height: '420px', borderRadius: '12px', overflow: 'hidden', background: '#05070c' }}>
                <img
                  src={result.originalUrl}
                  alt="Original"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>

            <div className="glass-panel" style={{
              padding: '16px',
              borderRadius: '18px',
              border: '1px solid rgba(16, 185, 129, 0.4)'
            }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#34d399',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={14} />
                CLEAN (Watermark Removed)
              </div>
              <div style={{ height: '420px', borderRadius: '12px', overflow: 'hidden', background: '#05070c' }}>
                <img
                  src={result.cleanUrl}
                  alt="Clean result"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px 24px',
        background: 'rgba(15, 23, 42, 0.7)',
        borderRadius: '18px',
        border: '1px solid var(--border-subtle)'
      }}>
        <button
          onClick={onReset}
          className="btn-secondary"
        >
          <RotateCcw size={16} />
          Remove Another Watermark
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href={result.downloadUrl || result.cleanUrl}
            download
            className="btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={18} />
            Download Clean {isVideo ? 'Video (.MP4)' : 'Image'}
          </a>
        </div>
      </div>
    </div>
  );
}
