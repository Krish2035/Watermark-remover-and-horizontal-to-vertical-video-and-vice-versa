'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import UploadBox from '../components/UploadBox';
import ScanProgress from '../components/ScanProgress';
import ResultViewer from '../components/ResultViewer';
import TechStackModal from '../components/TechStackModal';
import VideoAspectModal from '../components/VideoAspectModal';
import AuthModal from '../components/AuthModal';
import Features from '../components/Features';
import Footer from '../components/Footer';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function Home() {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [fileId, setFileId] = useState(null);
  const [detectionData, setDetectionData] = useState(null);
  const [stage, setStage] = useState('idle'); // 'idle' | 'ready' | 'scanning' | 'completed'
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTechStackOpen, setIsTechStackOpen] = useState(false);
  const [isAspectModalOpen, setIsAspectModalOpen] = useState(false);

  // Called when component mounts/renders: Checks HttpOnly JWT cookie and retrieves user profile
  useEffect(() => {
    async function verifyUserSession() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include' // Transmits HttpOnly cookie to backend for verification
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.warn('Initial session verification:', err.message);
      }
    }
    verifyUserSession();
  }, []);

  // Logout handler: Clears HttpOnly cookie on backend and resets user state
  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  // Open Auth Modal
  const handleOpenAuth = (tab = 'signin') => {
    setAuthTab(tab);
    setIsAuthModalOpen(true);
  };

  // 1. User picks file or drops it into big gradient box
  const handleFileSelected = async (file) => {
    try {
      setErrorMsg(null);
      setSelectedFile(file);
      const isVideo = file.type.startsWith('video/');
      const detectedType = isVideo ? 'video' : 'image';
      setMediaType(detectedType);

      // Create instant local preview URL for Gemini-style chip
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setStage('ready');

      // Upload to backend to analyze coordinates
      const formData = new FormData();
      formData.append('media', file);

      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Failed to upload media to backend analysis engine.');
      }

      const data = await res.json();
      setFileId(data.fileId);
      setDetectionData(data.detection);
    } catch (err) {
      console.error('File selection/upload error:', err);
      setErrorMsg(err.message || 'Error uploading file.');
    }
  };

  // 2. Remove file (Gemini chip X button)
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileId(null);
    setDetectionData(null);
    setStage('idle');
    setResult(null);
    setErrorMsg(null);
  };

  // 3. User clicks "Remove Watermark" button
  const handleProcessWatermark = async (candidateId = 'auto', customBox = null, customMaskBase64 = null) => {
    if (!fileId && !selectedFile) {
      setErrorMsg('Please select a file first.');
      return;
    }

    try {
      setErrorMsg(null);
      setStage('scanning');

      // Determine bounding box
      let targetBox = customBox;
      if (!targetBox) {
        if (detectionData && candidateId !== 'auto') {
          const found = detectionData.candidates?.find((c) => c.id === candidateId);
          if (found) targetBox = found.box;
        } else if (detectionData && detectionData.detectedBox) {
          targetBox = detectionData.detectedBox;
        }
      }

      const res = await fetch(`${BACKEND_URL}/api/remove-watermark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileId,
          mediaType,
          box: targetBox,
          maskBase64: customMaskBase64
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove watermark.');
      }

      const data = await res.json();

      setTimeout(() => {
        setResult(data);
        setStage('completed');
      }, 1500);
    } catch (err) {
      console.error('Watermark processing error:', err);
      setErrorMsg(err.message || 'Failed to remove watermark. Ensure backend is running.');
      setStage('ready');
    }
  };

  // 4. Reset to process another file
  const handleReset = () => {
    handleRemoveFile();
  };

  return (
    <div className="app-container">
      {/* Header with Auth controls & Session badge */}
      <Header
        onOpenTechStack={() => setIsTechStackOpen(true)}
        onOpenAspectConverter={() => setIsAspectModalOpen(true)}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main style={{ flex: 1, padding: '48px 0 60px 0' }}>
        <div className="content-wrapper">
          {/* Hero Titles (shown on idle and ready stages) */}
          {stage !== 'completed' && (
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div style={{ display: 'inline-flex', marginBottom: '14px' }}>
                <span className="badge-pill">
                  <Sparkles size={14} color="#818cf8" />
                  Next-Gen Media Inpainting Engine
                </span>
              </div>
              <h1 style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                lineHeight: '1.15',
                marginBottom: '16px'
              }}>
                Remove Watermarks from <br />
                <span className="gradient-text">Images & Videos</span> in 1-Click
              </h1>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                maxWidth: '620px',
                margin: '0 auto',
                lineHeight: '1.6'
              }}>
                Our neural inpainter seamlessly detects and erases text, logos, stamps, and channel overlays without compromising resolution.
              </p>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div style={{
              maxWidth: '680px',
              margin: '0 auto 24px auto',
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {errorMsg}
            </div>
          )}

          {/* DYNAMIC CENTER DISPLAY BASED ON STAGE */}
          {stage === 'scanning' ? (
            /* SCANNING / ANALYZING STATE */
            <ScanProgress mediaType={mediaType} />
          ) : stage === 'completed' && result ? (
            /* COMPLETED / RESULT STATE */
            <ResultViewer result={result} onReset={handleReset} />
          ) : (
            /* IDLE OR READY STATE: BIG GRADIENT UPLOAD BOX */
            <UploadBox
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              mediaType={mediaType}
              detectionData={detectionData}
              onFileSelected={handleFileSelected}
              onRemoveFile={handleRemoveFile}
              onProcess={handleProcessWatermark}
              isProcessing={stage === 'scanning'}
            />
          )}

          {/* Key Features Section */}
          <Features />
        </div>
      </main>

      {/* Tech Stack Modal */}
      <TechStackModal
        isOpen={isTechStackOpen}
        onClose={() => setIsTechStackOpen(false)}
      />

      {/* Horizontal ⇄ Vertical Video Aspect Ratio Converter Studio */}
      <VideoAspectModal
        isOpen={isAspectModalOpen}
        onClose={() => setIsAspectModalOpen(false)}
        initialVideoFile={mediaType === 'video' ? selectedFile : null}
        initialFileId={mediaType === 'video' ? fileId : null}
      />

      {/* Sign In & Sign Up JWT HttpOnly Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authTab}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(userData) => setUser(userData)}
      />

      {/* Footer */}
      <Footer onOpenTechStack={() => setIsTechStackOpen(true)} />
    </div>
  );
}
