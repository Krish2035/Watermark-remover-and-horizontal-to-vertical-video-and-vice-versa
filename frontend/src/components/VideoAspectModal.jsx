'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ArrowLeftRight,
  Smartphone,
  Tv,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Film,
  Download,
  RotateCcw,
  Sliders,
  Layers,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function VideoAspectModal({ isOpen, onClose, initialVideoFile = null, initialFileId = null }) {
  const [videoFile, setVideoFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);

  // Conversion options
  const [targetOrientation, setTargetOrientation] = useState('vertical'); // 'vertical' (9:16) | 'horizontal' (16:9)
  const [conversionMode, setConversionMode] = useState('blur'); // 'blur' | 'pad' | 'crop'
  const [resolution, setResolution] = useState('auto'); // 'auto' | '1080x1920' | '720x1280' | '1920x1080' | '1280x720'

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

  const handleLoadFile = async (file, existingId = null) => {
    if (!file || !file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file (MP4, MOV, WEBM, MKV).');
      return;
    }

    setErrorMsg(null);
    setResult(null);
    setVideoFile(file);
    if (existingId) setFileId(existingId);

    const localUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(localUrl);

    // Extract client-side dimensions immediately
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = localUrl;
    tempVideo.onloadedmetadata = () => {
      const w = tempVideo.videoWidth || 1280;
      const h = tempVideo.videoHeight || 720;
      const isHoriz = w >= h;

      const clientMeta = {
        width: w,
        height: h,
        orientation: isHoriz ? 'horizontal' : 'vertical',
        ratioLabel: isHoriz ? '16:9 (Landscape / Horizontal)' : '9:16 (Portrait / Vertical)',
        duration: Math.round(tempVideo.duration || 0)
      };

      setVideoMeta(clientMeta);

      // Smart auto-select target:
      // If uploaded video is horizontal (16:9), auto-target vertical (9:16).
      // If uploaded video is vertical (9:16), auto-target horizontal (16:9).
      if (isHoriz) {
        setTargetOrientation('vertical');
      } else {
        setTargetOrientation('horizontal');
      }
    };

    // Also send to backend to inspect server-side video details
    try {
      const formData = new FormData();
      formData.append('video', file);
      if (existingId) formData.append('fileId', existingId);

      const res = await fetch(`${BACKEND_URL}/api/video-details`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.fileId) setFileId(data.fileId);
        if (data.details) {
          setVideoMeta((prev) => ({
            ...prev,
            width: data.details.width,
            height: data.details.height,
            orientation: data.details.orientation,
            ratioLabel: data.details.ratioLabel,
            duration: data.details.durationSec
          }));
          if (data.details.orientation === 'horizontal') {
            setTargetOrientation('vertical');
          } else {
            setTargetOrientation('horizontal');
          }
        }
      }
    } catch (err) {
      console.warn('Backend video inspection warning:', err);
    }
  };

  // Handle initial video if passed from parent
  useEffect(() => {
    if (initialVideoFile && !videoFile && isOpen) {
      handleLoadFile(initialVideoFile, initialFileId);
    }
  }, [initialVideoFile, initialFileId, isOpen]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLoadFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartConversion = async () => {
    if (!videoFile && !fileId) {
      setErrorMsg('Please select or upload a video first.');
      return;
    }

    try {
      setErrorMsg(null);
      setIsProcessing(true);
      setProgressStep(1);

      const stepTimer1 = setTimeout(() => setProgressStep(2), 1200);
      const stepTimer2 = setTimeout(() => setProgressStep(3), 3200);

      const formData = new FormData();
      if (fileId) {
        formData.append('fileId', fileId);
      } else if (videoFile) {
        formData.append('video', videoFile);
      }
      formData.append('targetOrientation', targetOrientation);
      formData.append('mode', conversionMode);
      formData.append('resolution', resolution);

      const res = await fetch(`${BACKEND_URL}/api/convert-aspect-ratio`, {
        method: 'POST',
        body: formData
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to convert video aspect ratio.');
      }

      const data = await res.json();
      setProgressStep(4);

      setTimeout(() => {
        setResult(data);
        setIsProcessing(false);
        try {
          confetti({
            particleCount: 55,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore
        }
      }, 700);
    } catch (err) {
      console.error('Aspect ratio conversion error:', err);
      setErrorMsg(err.message || 'Video conversion failed. Please verify the backend service is running.');
      setIsProcessing(false);
      setProgressStep(0);
    }
  };

  const handleReset = () => {
    setVideoFile(null);
    setFileId(null);
    setVideoPreviewUrl(null);
    setVideoMeta(null);
    setResult(null);
    setErrorMsg(null);
    setProgressStep(0);
  };

  return (
    <div
      className="modal-backdrop"
      id="aspect-converter-modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1100,
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="modal-content"
        id="aspect-converter-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '94%',
          maxHeight: '92vh',
          padding: '28px',
          background: 'linear-gradient(180deg, #0e1424 0%, #07090e 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.85), 0 0 50px rgba(99, 102, 241, 0.25)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.45)'
              }}
            >
              <ArrowLeftRight size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                  Horizontal <span className="gradient-text">⇄</span> Vertical Video Converter
                </h2>
                <span
                  style={{
                    background: 'rgba(139, 92, 246, 0.25)',
                    color: '#c084fc',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(139, 92, 246, 0.4)'
                  }}
                >
                  16:9 ⇄ 9:16
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Seamlessly transfer 16:9 landscape videos into 9:16 vertical reels, or vertical videos into 16:9 widescreen format
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="close-aspect-modal-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#fca5a5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* COMPLETED RESULT VIEW */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6ee7b7', fontWeight: '600' }}>
                <CheckCircle2 size={20} color="#10b981" />
                <span>
                  Video successfully converted to{' '}
                  <strong style={{ color: '#ffffff' }}>
                    {result.targetOrientation === 'vertical' ? 'Vertical 9:16 (Phone/Reels)' : 'Horizontal 16:9 (Widescreen)'}
                  </strong>{' '}
                  ({result.targetWidth} × {result.targetHeight})
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Time: {(result.processingTimeMs / 1000).toFixed(1)}s
              </span>
            </div>

            {/* Video Player Comparison */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '18px',
                alignItems: 'start'
              }}
            >
              {/* Original Preview */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Original Source Video
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {videoMeta?.width} × {videoMeta?.height} ({videoMeta?.orientation})
                  </span>
                </div>
                <div
                  style={{
                    height: '320px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <video
                    src={videoPreviewUrl || result.originalUrl}
                    controls
                    playsInline
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>

              {/* Converted Preview */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
                  border: '1px solid rgba(139, 92, 246, 0.45)',
                  boxShadow: '0 0 25px rgba(139, 92, 246, 0.25)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#c084fc', textTransform: 'uppercase' }}>
                    ✓ Converted {result.targetOrientation === 'vertical' ? '9:16 Vertical' : '16:9 Horizontal'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>
                    {result.targetWidth} × {result.targetHeight} • {result.mode.toUpperCase()}
                  </span>
                </div>
                <div
                  style={{
                    height: '320px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <video
                    src={result.convertedUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={handleReset} className="btn-secondary" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
                <RotateCcw size={16} />
                <span>Convert Another Video</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={result.downloadUrl}
                  download
                  className="btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={18} />
                  <span>Download Converted Video (.MP4)</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* CONVERTER CONFIGURATION & PREVIEW VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1: Upload or Pre-loaded video */}
            {!videoFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed rgba(139, 92, 246, 0.45)',
                  borderRadius: '16px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '40px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#a855f7';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.45)';
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleLoadFile(e.target.files[0]);
                    }
                  }}
                />
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: '#c084fc'
                  }}
                >
                  <UploadCloud size={30} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
                  Select or Drop your Video to Convert
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 12px auto' }}>
                  Supports 16:9 landscape videos (e.g. 1920x1080) and 9:16 vertical videos (e.g. 1080x1920)
                </p>
                <div style={{ display: 'inline-flex', gap: '8px' }}>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px', color: '#94a3b8' }}>
                    MP4, MOV, WEBM
                  </span>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px', color: '#94a3b8' }}>
                    Up to 100MB
                  </span>
                </div>
              </div>
            ) : (
              /* Loaded Video Bar */
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8'
                    }}
                  >
                    <Film size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.92rem', color: '#f1f5f9' }}>
                      {videoFile.name || 'Selected Video'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                      <span>Size: {(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                      {videoMeta && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#38bdf8', fontWeight: '600' }}>
                            {videoMeta.width} × {videoMeta.height} ({videoMeta.ratioLabel})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <RotateCcw size={14} />
                  <span>Change Video</span>
                </button>
              </div>
            )}

            {/* Step 2: Target Orientation Selection (16:9 ➔ 9:16 or 9:16 ➔ 16:9) */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                Select Conversion Direction:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {/* Option 1: Horizontal to Vertical */}
                <div
                  id="target-orientation-vertical-card"
                  onClick={() => setTargetOrientation('vertical')}
                  style={{
                    border: targetOrientation === 'vertical' ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: targetOrientation === 'vertical' ? 'rgba(139, 92, 246, 0.16)' : 'rgba(15, 23, 42, 0.5)',
                    boxShadow: targetOrientation === 'vertical' ? '0 0 20px rgba(139, 92, 246, 0.3)' : 'none',
                    borderRadius: '14px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: targetOrientation === 'vertical' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}
                  >
                    <Smartphone size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#f8fafc' }}>
                        Horizontal to Vertical
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          background: '#8b5cf6',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        16:9 ➔ 9:16
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Transform landscape video for Instagram Reels, TikTok, YouTube Shorts & Mobile Stories
                    </p>
                  </div>
                </div>

                {/* Option 2: Vertical to Horizontal */}
                <div
                  id="target-orientation-horizontal-card"
                  onClick={() => setTargetOrientation('horizontal')}
                  style={{
                    border: targetOrientation === 'horizontal' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: targetOrientation === 'horizontal' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.5)',
                    boxShadow: targetOrientation === 'horizontal' ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
                    borderRadius: '14px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: targetOrientation === 'horizontal' ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}
                  >
                    <Tv size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#f8fafc' }}>
                        Vertical to Horizontal
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          background: '#0284c7',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        9:16 ➔ 16:9
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Expand vertical phone videos into widescreen 16:9 for YouTube videos, TV & Desktop monitors
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Background Styling & Padding Modes */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Background Styling Mode:
                </label>
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                  {conversionMode === 'blur'
                    ? '✨ Studio Blurred Background (Recommended)'
                    : conversionMode === 'pad'
                    ? 'Cinema Black Bars (Pillarbox/Letterbox)'
                    : 'Center Crop to Full Screen'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* 1. Blur Mode */}
                <div
                  id="mode-blur-btn"
                  onClick={() => setConversionMode('blur')}
                  style={{
                    border: conversionMode === 'blur' ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: conversionMode === 'blur' ? 'rgba(168, 85, 247, 0.16)' : 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#f1f5f9', marginBottom: '2px' }}>
                    Blurred Background
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: '600' }}>
                    ★ Most Popular
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Zero content cropped. Aesthetic ambient blur backdrop.
                  </p>
                </div>

                {/* 2. Pad Mode */}
                <div
                  id="mode-pad-btn"
                  onClick={() => setConversionMode('pad')}
                  style={{
                    border: conversionMode === 'pad' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: conversionMode === 'pad' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#f1f5f9', marginBottom: '2px' }}>
                    Fit with Black Bars
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '600' }}>
                    Letterbox / Pillarbox
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Original aspect framed cleanly with black padding.
                  </p>
                </div>

                {/* 3. Crop Mode */}
                <div
                  id="mode-crop-btn"
                  onClick={() => setConversionMode('crop')}
                  style={{
                    border: conversionMode === 'crop' ? '2px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: conversionMode === 'crop' ? 'rgba(236, 72, 153, 0.14)' : 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#f1f5f9', marginBottom: '2px' }}>
                    Center Crop & Fill
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#f472b6', fontWeight: '600' }}>
                    Full Edge-to-Edge
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Fills entire frame by cropping excess edges.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Visual Simulation Mockup */}
            {videoPreviewUrl && (
              <div
                style={{
                  background: 'rgba(10, 15, 28, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                    Output Simulation Preview
                  </span>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '2px' }}>
                    Target:{' '}
                    <strong>{targetOrientation === 'vertical' ? 'Vertical 9:16 (1080×1920)' : 'Horizontal 16:9 (1920×1080)'}</strong>
                  </div>
                </div>

                {/* Visual Ratio Box */}
                <div
                  style={{
                    position: 'relative',
                    width: targetOrientation === 'vertical' ? '70px' : '124px',
                    height: targetOrientation === 'vertical' ? '124px' : '70px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: conversionMode === 'blur' ? '#1e1b4b' : '#000000',
                    border: '2px solid rgba(139, 92, 246, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* If blur mode: background simulation */}
                  {conversionMode === 'blur' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${videoPreviewUrl})`,
                        backgroundSize: 'cover',
                        filter: 'blur(8px)',
                        opacity: 0.6
                      }}
                    />
                  )}

                  {/* Foreground simulation */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      width:
                        conversionMode === 'crop'
                          ? '100%'
                          : targetOrientation === 'vertical'
                          ? '100%'
                          : '42%',
                      height:
                        conversionMode === 'crop'
                          ? '100%'
                          : targetOrientation === 'vertical'
                          ? '42%'
                          : '100%',
                      background: 'rgba(99, 102, 241, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: '700',
                      color: '#ffffff'
                    }}
                  >
                    Video
                  </div>
                </div>
              </div>
            )}

            {/* Processing State Animation */}
            {isProcessing && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '12px',
                  padding: '18px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: '600' }}>
                    <Sparkles size={16} />
                    <span>
                      {progressStep === 1 && 'Analyzing video dimensions and keyframe streams...'}
                      {progressStep === 2 && 'Executing FFmpeg aspect-ratio filter graph...'}
                      {progressStep === 3 && 'Re-encoding H.264 high-efficiency video & AAC audio...'}
                      {progressStep === 4 && 'Finalizing MP4 container for web streaming...'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>
                    {progressStep * 25}%
                  </span>
                </div>

                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressStep * 25}%`,
                      background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
              <button onClick={onClose} className="btn-secondary" style={{ padding: '12px 20px' }}>
                Cancel
              </button>

              <button
                onClick={handleStartConversion}
                disabled={!videoFile || isProcessing}
                id="submit-aspect-conversion-btn"
                className="btn-primary"
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  boxShadow: '0 8px 25px rgba(139, 92, 246, 0.45)'
                }}
              >
                <ArrowLeftRight size={18} />
                <span>
                  {isProcessing
                    ? 'Processing Video...'
                    : targetOrientation === 'vertical'
                    ? 'Convert to Vertical (9:16)'
                    : 'Convert to Horizontal (16:9)'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
