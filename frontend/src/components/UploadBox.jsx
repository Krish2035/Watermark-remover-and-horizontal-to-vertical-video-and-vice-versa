'use client';

import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Film, Image as ImageIcon, Sparkles, Wand2, HelpCircle, ShieldCheck, Crosshair } from 'lucide-react';
import GeminiPreviewChip from './GeminiPreviewChip';
import GalaxyWatermarkCanvas from './GalaxyWatermarkCanvas';

export default function UploadBox({
  selectedFile,
  previewUrl,
  mediaType,
  detectionData,
  onFileSelected,
  onRemoveFile,
  onProcess,
  isProcessing
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState('auto');
  const [customBox, setCustomBox] = useState(null);
  const [customMaskBase64, setCustomMaskBase64] = useState(null);

  useEffect(() => {
    if (detectionData && detectionData.detectedBox) {
      setCustomBox(detectionData.detectedBox);
    }
  }, [detectionData]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileInput(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Please upload an image (PNG, JPG, WEBP) or a video (MP4, MOV, WEBM).');
      return;
    }

    onFileSelected(file);
  };

  const handleCandidateSelect = (candId) => {
    setSelectedCandidate(candId);
    if (candId === 'auto') {
      if (detectionData?.detectedBox) {
        setCustomBox(detectionData.detectedBox);
      }
    } else if (candId === 'manual') {
      if (!customBox && detectionData?.detectedBox) {
        setCustomBox(detectionData.detectedBox);
      }
    } else if (detectionData?.candidates) {
      const found = detectionData.candidates.find((c) => c.id === candId);
      if (found) {
        setCustomBox(found.box);
      }
    }
  };

  // Helper to load sample test image
  const loadSample = async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');

      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.5, '#312e81');
      bgGrad.addColorStop(1, '#4338ca');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 800);

      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(600, 400, 220, 0, Math.PI * 2);
      ctx.fill();

      // Draw simulated sparkle watermark in bottom-right corner
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('✨ GEMINI WATERMARK', 720, 740);

      canvas.toBlob((blob) => {
        const sampleFile = new File([blob], 'sample-watermarked-photo.png', { type: 'image/png' });
        onFileSelected(sampleFile);
      }, 'image/png');
    } catch (e) {
      console.error('Error loading sample:', e);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '860px', margin: '0 auto' }}>
      {/* Big Gradient Upload Box */}
      <div
        className="gradient-upload-box"
        style={{
          boxShadow: isDragOver
            ? '0 0 80px rgba(99, 102, 241, 0.7), 0 0 100px rgba(236, 72, 153, 0.5)'
            : undefined
        }}
      >
        <div
          className="gradient-upload-inner"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!selectedFile && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          style={{
            cursor: selectedFile ? 'default' : 'pointer',
            border: isDragOver ? '2px dashed #38bdf8' : '2px dashed rgba(99, 102, 241, 0.35)',
            transition: 'border 0.2s ease',
            padding: selectedFile ? '28px 24px' : '48px 36px'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileInput(e.target.files[0]);
              }
            }}
            accept="image/*,video/*"
            style={{ display: 'none' }}
          />

          {/* WHEN FILE IS SELECTED */}
          {selectedFile ? (
            <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
              {/* Gemini-Style Preview Chip */}
              <GeminiPreviewChip
                file={selectedFile}
                previewUrl={previewUrl}
                mediaType={mediaType}
                onRemove={onRemoveFile}
              />

              {/* Interactive Visual Canvas (Galaxy AI Pinpoint Box & Magic Brush) */}
              {previewUrl && (
                <GalaxyWatermarkCanvas
                  imageUrl={previewUrl}
                  mediaType={mediaType}
                  detectedBox={customBox || detectionData?.detectedBox}
                  onBoxChange={(newBox, source) => {
                    setCustomBox(newBox);
                    if (source === 'manual') setSelectedCandidate('manual');
                  }}
                  onMaskChange={(maskB64) => setCustomMaskBase64(maskB64)}
                />
              )}

              {/* Watermark position & detection presets */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wand2 size={16} color="#38bdf8" />
                    <span style={{ fontSize: '0.92rem', fontWeight: '700', color: '#f8fafc' }}>
                      Watermark Locator Mode
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    color: '#a855f7',
                    background: 'rgba(168, 85, 247, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    border: '1px solid rgba(168, 85, 247, 0.3)'
                  }}>
                    ✨ Zero-Blur Galaxy AI Inpainting
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px'
                }}>
                  {[
                    { id: 'auto', label: 'AI Auto-Detect', sub: 'Zero-Blur Target' },
                    { id: 'manual', label: 'Manual Pinpoint', sub: 'Tap / Drag on Screen' },
                    { id: 'bottom-right', label: 'Bottom Right', sub: 'Corner Logo' },
                    { id: 'bottom-left', label: 'Bottom Left', sub: 'Date / Text' },
                    { id: 'top-right', label: 'Top Right', sub: 'Channel Watermark' }
                  ].map((cand) => (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => handleCandidateSelect(cand.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: selectedCandidate === cand.id
                          ? '1px solid #38bdf8'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        background: selectedCandidate === cand.id
                          ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.25))'
                          : 'rgba(255, 255, 255, 0.03)',
                        color: selectedCandidate === cand.id ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedCandidate === cand.id ? '0 0 15px rgba(56, 189, 248, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>{cand.label}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: '2px' }}>{cand.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Manual Target Status Banner */}
                {selectedCandidate === 'manual' && customBox && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    color: '#7dd3fc',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Crosshair size={14} color="#38bdf8" />
                      <span>
                        <strong>Manual Target Active:</strong> X={customBox.x}, Y={customBox.y} ({customBox.width}×{customBox.height}px). You can click or drag directly on the preview to adjust!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCandidateSelect('auto')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c084fc',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '11px'
                      }}
                    >
                      Reset to AI Auto
                    </button>
                  </div>
                )}
              </div>

              {/* ACTION TRIGGER: REMOVE WATERMARK BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onProcess(selectedCandidate, customBox, customMaskBase64)}
                  disabled={isProcessing}
                  className="btn-primary"
                  style={{
                    padding: '16px 36px',
                    fontSize: '1.05rem',
                    minWidth: '260px'
                  }}
                >
                  <Sparkles size={20} />
                  <span>Remove Watermark (Galaxy AI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="btn-secondary"
                  style={{ padding: '16px 24px' }}
                >
                  Change File
                </button>
              </div>
            </div>
          ) : (
            /* EMPTY STATE: DRAG & DROP PROMPT */
            <>
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(236, 72, 153, 0.25))',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 0 35px rgba(99, 102, 241, 0.35)'
              }}>
                <UploadCloud size={42} color="#818cf8" />
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                Drop your <span className="gradient-text">Image or Video</span> here
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', maxWidth: '480px', marginBottom: '24px' }}>
                Upload any photo or video. Powered by Galaxy AI Object Eraser technology for seamless, zero-blur removal.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="badge-pill" style={{ background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#7dd3fc' }}>
                  <ImageIcon size={14} /> Images (PNG, JPG, WEBP)
                </span>
                <span className="badge-pill" style={{ background: 'rgba(236, 72, 153, 0.1)', borderColor: 'rgba(236, 72, 153, 0.3)', color: '#f472b6' }}>
                  <Film size={14} /> Videos (MP4, MOV, WEBM)
                </span>
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ padding: '14px 32px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
              >
                Browse Files
              </button>

              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-subtle)' }}>
                <span>No file on hand?</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadSample();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Try Sample Watermarked Image
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
