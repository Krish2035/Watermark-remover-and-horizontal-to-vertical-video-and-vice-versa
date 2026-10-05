'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Paintbrush, Move, Undo2, Crosshair, Maximize2 } from 'lucide-react';

export default function GalaxyWatermarkCanvas({
  imageUrl,
  mediaType = 'image',
  detectedBox,
  onBoxChange,
  onMaskChange
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const dragStartRef = useRef(null);

  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const wasDraggingRef = useRef(false);

  const [mode, setMode] = useState('box'); // 'box' | 'brush'
  const [box, setBox] = useState(detectedBox || { x: 0, y: 0, width: 80, height: 80 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [isResizingBox, setIsResizingBox] = useState(false);
  const [hasDrawnMask, setHasDrawnMask] = useState(false);
  const [brushSize, setBrushSize] = useState(24);
  const [naturalSize, setNaturalSize] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    if (detectedBox && detectedBox.width) {
      setBox(detectedBox);
    }
  }, [detectedBox]);

  // Global mouse/touch move and up listeners for drag & resize
  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current && !isResizingRef.current) return;
      if (!imageRef.current || !dragStartRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const scaleX = naturalSize.width / rect.width;
      const scaleY = naturalSize.height / rect.height;

      const deltaX = (e.clientX - dragStartRef.current.mouseX) * scaleX;
      const deltaY = (e.clientY - dragStartRef.current.mouseY) * scaleY;

      if (isDraggingRef.current) {
        const newX = Math.max(0, Math.min(naturalSize.width - dragStartRef.current.boxW, Math.round(dragStartRef.current.boxX + deltaX)));
        const newY = Math.max(0, Math.min(naturalSize.height - dragStartRef.current.boxH, Math.round(dragStartRef.current.boxY + deltaY)));
        const updated = { ...box, x: newX, y: newY };
        setBox(updated);
        if (onBoxChange) onBoxChange(updated, 'manual');
      } else if (isResizingRef.current) {
        const newW = Math.max(20, Math.min(naturalSize.width - dragStartRef.current.boxX, Math.round(dragStartRef.current.boxW + deltaX)));
        const newH = Math.max(20, Math.min(naturalSize.height - dragStartRef.current.boxY, Math.round(dragStartRef.current.boxH + deltaY)));
        const updated = { ...box, width: newW, height: newH };
        setBox(updated);
        if (onBoxChange) onBoxChange(updated, 'manual');
      }
    };

    const onUp = () => {
      if (isDraggingRef.current || isResizingRef.current) {
        isDraggingRef.current = false;
        isResizingRef.current = false;
        setIsDraggingBox(false);
        setIsResizingBox(false);
        wasDraggingRef.current = true;
        // Suppress any synthesized click events for 250ms after lifting finger/mouse
        setTimeout(() => {
          wasDraggingRef.current = false;
        }, 250);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [box, naturalSize, onBoxChange]);

  const handleMediaLoad = (e) => {
    let nw = 1280;
    let nh = 720;
    if (mediaType === 'video') {
      nw = e.target.videoWidth || 1280;
      nh = e.target.videoHeight || 720;
    } else {
      nw = e.target.naturalWidth || 1280;
      nh = e.target.naturalHeight || 720;
    }
    setNaturalSize({ width: nw, height: nh });

    // Sync canvas resolution if brush is enabled
    if (canvasRef.current) {
      canvasRef.current.width = nw;
      canvasRef.current.height = nh;
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, nw, nh);
    }
  };

  // Convert client click to natural media coordinates
  const getNaturalCoords = (e) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = naturalSize.width / rect.width;
    const scaleY = naturalSize.height / rect.height;

    const x = Math.max(0, Math.min(naturalSize.width, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(naturalSize.height, (e.clientY - rect.top) * scaleY));
    return { x, y };
  };

  // Click anywhere on media to center box (ignored if user just dragged)
  const handleContainerClick = (e) => {
    if (mode !== 'box' || isDrawing || isDraggingRef.current || isResizingRef.current || wasDraggingRef.current) {
      return;
    }
    const { x, y } = getNaturalCoords(e);
    const w = box.width || Math.round(naturalSize.width * 0.08);
    const h = box.height || Math.round(naturalSize.height * 0.08);
    const newBox = {
      x: Math.max(0, Math.min(naturalSize.width - w, Math.round(x - w / 2))),
      y: Math.max(0, Math.min(naturalSize.height - h, Math.round(y - h / 2))),
      width: w,
      height: h
    };
    setBox(newBox);
    if (onBoxChange) onBoxChange(newBox, 'manual');
  };

  const handleBoxMouseDown = (e) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    setIsDraggingBox(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: box.x,
      boxY: box.y,
      boxW: box.width,
      boxH: box.height
    };
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    isResizingRef.current = true;
    setIsResizingBox(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: box.x,
      boxY: box.y,
      boxW: box.width,
      boxH: box.height
    };
  };

  // Quick Size presets
  const applySizePreset = (targetSize) => {
    const newW = Math.min(naturalSize.width, targetSize);
    const newH = Math.min(naturalSize.height, targetSize);
    const newX = Math.min(box.x, naturalSize.width - newW);
    const newY = Math.min(box.y, naturalSize.height - newH);
    const updated = { ...box, x: Math.max(0, newX), y: Math.max(0, newY), width: newW, height: newH };
    setBox(updated);
    if (onBoxChange) onBoxChange(updated, 'manual');
  };

  // Magic Brush Drawing (for images)
  const startDrawing = (e) => {
    if (mode !== 'brush' || !canvasRef.current) return;
    setIsDrawing(true);
    setHasDrawnMask(true);
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getNaturalCoords(e);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.85)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e) => {
    if (!isDrawing || mode !== 'brush' || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getNaturalCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current && onMaskChange) {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = naturalSize.width;
      exportCanvas.height = naturalSize.height;
      const expCtx = exportCanvas.getContext('2d');
      expCtx.drawImage(canvasRef.current, 0, 0);
      const imgData = expCtx.getImageData(0, 0, naturalSize.width, naturalSize.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i + 3] > 20) {
          imgData.data[i] = 255;
          imgData.data[i + 1] = 255;
          imgData.data[i + 2] = 255;
          imgData.data[i + 3] = 255;
        } else {
          imgData.data[i] = 0;
          imgData.data[i + 1] = 0;
          imgData.data[i + 2] = 0;
          imgData.data[i + 3] = 255;
        }
      }
      expCtx.putImageData(imgData, 0, 0);
      onMaskChange(exportCanvas.toDataURL('image/png'));
    }
  };

  const clearBrush = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, naturalSize.width, naturalSize.height);
      setHasDrawnMask(false);
      if (onMaskChange) onMaskChange(null);
    }
  };

  // Box percentage positioning relative to media dimensions
  const boxLeftPct = (box.x / Math.max(1, naturalSize.width)) * 100;
  const boxTopPct = (box.y / Math.max(1, naturalSize.height)) * 100;
  const boxWidthPct = (box.width / Math.max(1, naturalSize.width)) * 100;
  const boxHeightPct = (box.height / Math.max(1, naturalSize.height)) * 100;

  return (
    <div style={{
      width: '100%',
      background: 'rgba(10, 14, 26, 0.85)',
      borderRadius: '16px',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      padding: '16px',
      marginBottom: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Top Controls & Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(236, 72, 153, 0.25))',
            color: '#c084fc',
            padding: '3px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '700',
            border: '1px solid rgba(192, 132, 252, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Sparkles size={12} />
            {mediaType === 'video' ? 'Interactive Video Watermark Locator' : 'Galaxy AI Watermark Pinpoint'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {mode === 'box'
              ? 'Click anywhere or drag the box to manually indicate watermark location'
              : 'Brush over the watermark to highlight strokes'}
          </span>
        </div>

        {/* Mode & Tool Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setMode('box')}
            style={{
              background: mode === 'box' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.05)',
              border: mode === 'box' ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
              color: mode === 'box' ? '#ffffff' : 'var(--text-muted)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Crosshair size={14} />
            Target Box
          </button>

          {mediaType === 'image' && (
            <button
              type="button"
              onClick={() => setMode('brush')}
              style={{
                background: mode === 'brush' ? 'rgba(236, 72, 153, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                border: mode === 'brush' ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
                color: mode === 'brush' ? '#ffffff' : 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Paintbrush size={14} />
              Magic Eraser Brush
            </button>
          )}

          {mode === 'brush' && hasDrawnMask && (
            <button
              type="button"
              onClick={clearBrush}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Undo2 size={13} />
              Clear Brush
            </button>
          )}
        </div>
      </div>

      {/* Visual Canvas Area with Tight Media Stage */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: '400px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#04060a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: mode === 'brush' ? 'crosshair' : (isDraggingBox ? 'grabbing' : 'crosshair'),
          userSelect: 'none'
        }}
      >
        {/* Inner Media Stage: Exact same dimensions as rendered image/video */}
        <div
          ref={stageRef}
          style={{
            position: 'relative',
            display: 'inline-block',
            lineHeight: 0,
            maxWidth: '100%',
            maxHeight: '400px'
          }}
        >
          {mediaType === 'video' ? (
            <video
              ref={imageRef}
              src={imageUrl}
              muted
              playsInline
              autoPlay
              loop
              onLoadedMetadata={handleMediaLoad}
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '8px'
              }}
            />
          ) : (
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Target preview"
              onLoad={handleMediaLoad}
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '8px'
              }}
            />
          )}

          {/* Pinpoint Target Box: Positioned directly on the rendered media */}
          {mode === 'box' && (
            <div
              onPointerDown={handleBoxMouseDown}
              style={{
                position: 'absolute',
                left: `${boxLeftPct}%`,
                top: `${boxTopPct}%`,
                width: `${boxWidthPct}%`,
                height: `${boxHeightPct}%`,
                border: '2px solid #38bdf8',
                background: 'rgba(56, 189, 248, 0.22)',
                boxShadow: '0 0 24px rgba(56, 189, 248, 0.7), inset 0 0 12px rgba(56, 189, 248, 0.35)',
                borderRadius: '6px',
                cursor: isDraggingBox ? 'grabbing' : 'grab',
                pointerEvents: 'auto',
                userSelect: 'none',
                zIndex: 5
              }}
            >
              {/* Top Label */}
              <div style={{
                position: 'absolute',
                top: '-22px',
                left: '0',
                background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                pointerEvents: 'none'
              }}>
                <Move size={10} />
                <span>TARGET WATERMARK</span>
              </div>

              {/* Resize Handle (Bottom-Right Corner) */}
              <div
                onPointerDown={handleResizeMouseDown}
                style={{
                  position: 'absolute',
                  right: '-7px',
                  bottom: '-7px',
                  width: '16px',
                  height: '16px',
                  background: '#38bdf8',
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 8px rgba(0, 0, 0, 0.6)',
                  cursor: 'nwse-resize',
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <Maximize2 size={8} color="#0f172a" />
              </div>
            </div>
          )}

          {/* Magic Brush Canvas (When in Brush mode on images) */}
          {mediaType === 'image' && (
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: mode === 'brush' ? 'auto' : 'none',
                touchAction: 'none',
                zIndex: 6
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom Quick Size & Coordinate Adjuster */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '8px 12px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#94a3b8' }}>
          <span style={{ color: '#38bdf8', fontWeight: '700' }}>🎯 Target Location:</span>
          <span>X: <strong style={{ color: '#ffffff' }}>{box.x}</strong>, Y: <strong style={{ color: '#ffffff' }}>{box.y}</strong></span>
          <span>•</span>
          <span>Size: <strong style={{ color: '#ffffff' }}>{box.width}×{box.height}px</strong></span>
        </div>

        {/* Quick Size Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Box Size:</span>
          {[
            { label: 'Small', size: 60 },
            { label: 'Medium', size: 85 },
            { label: 'Large', size: 130 },
            { label: 'Wide', w: 180, h: 70 }
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                if (preset.w) {
                  const updated = { ...box, width: preset.w, height: preset.h };
                  setBox(updated);
                  if (onBoxChange) onBoxChange(updated, 'manual');
                } else {
                  applySizePreset(preset.size);
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#38bdf8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
