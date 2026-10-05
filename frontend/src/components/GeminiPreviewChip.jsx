'use client';

import React from 'react';
import { X, CheckCircle2, Film, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function GeminiPreviewChip({ file, previewUrl, mediaType, onRemove }) {
  if (!file && !previewUrl) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="gemini-preview-chip"
      style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto 20px auto',
        border: '1px solid rgba(99, 102, 241, 0.45)',
        background: 'linear-gradient(135deg, rgba(24, 33, 53, 0.95), rgba(15, 23, 42, 0.95))',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px -5px rgba(99, 102, 241, 0.35)'
      }}
    >
      {/* Thumbnail */}
      <div className="gemini-thumb-wrapper">
        {mediaType === 'video' ? (
          <>
            <video
              src={previewUrl}
              className="gemini-thumb-video"
              muted
              playsInline
              preload="metadata"
            />
            <span className="gemini-thumb-icon">
              <Film size={10} style={{ display: 'inline', marginRight: '2px' }} />
              VID
            </span>
          </>
        ) : (
          <>
            <img src={previewUrl} alt="Upload preview" className="gemini-thumb-img" />
            <span className="gemini-thumb-icon">
              <ImageIcon size={10} style={{ display: 'inline', marginRight: '2px' }} />
              IMG
            </span>
          </>
        )}
      </div>

      {/* Details (Gemini style) */}
      <div className="gemini-chip-details">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="gemini-chip-name">{file ? file.name : 'Uploaded Media'}</span>
          <CheckCircle2 size={14} color="#10b981" title="Ready for processing" />
        </div>
        <div className="gemini-chip-meta">
          <span>{formatFileSize(file?.size)}</span>
          <span>•</span>
          <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Sparkles size={11} />
            {mediaType === 'video' ? 'Video Analysis Ready' : 'AI Inpaint Ready'}
          </span>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="gemini-chip-remove"
        title="Remove file"
        aria-label="Remove uploaded file"
      >
        <X size={15} />
      </button>
    </div>
  );
}
