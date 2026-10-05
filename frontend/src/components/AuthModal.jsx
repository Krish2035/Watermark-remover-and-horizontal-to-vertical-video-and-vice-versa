'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogIn,
  UserPlus
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function AuthModal({ isOpen, onClose, initialTab = 'signin', onAuthSuccess }) {
  const [tab, setTab] = useState(initialTab); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setTab(initialTab);
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const endpoint = tab === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const payload = tab === 'signup' 
        ? { name: name.trim(), email: email.trim().toLowerCase(), password }
        : { email: email.trim().toLowerCase(), password };

      // CRITICAL: credentials: 'include' ensures browser saves and transmits HttpOnly cookie
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('DDoS Protection: Too many attempts. Please wait 15 minutes before trying again.');
        }
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      setSuccessMsg(tab === 'signup' ? 'Account created! Authenticated via HttpOnly Cookie.' : 'Signed in successfully!');
      
      setTimeout(() => {
        if (onAuthSuccess && data.user) {
          onAuthSuccess(data.user);
        }
        onClose();
      }, 700);

    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 7, 12, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      fontFamily: 'Calibri, "Segoe UI", Candara, Arial, sans-serif'
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Top Header Glow Bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)'
        }} />

        {/* Modal Header */}
        <div style={{
          padding: '24px 28px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
            }}>
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                margin: 0,
                color: '#f8fafc',
                letterSpacing: '-0.01em'
              }}>
                {tab === 'signin' ? 'Sign In to ClearMark' : 'Create ClearMark Account'}
              </h2>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Secure JWT Authentication in HttpOnly Cookie
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          padding: '16px 28px 0',
          gap: '8px'
        }}>
          <button
            type="button"
            onClick={() => { setTab('signin'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: tab === 'signin' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
              background: tab === 'signin' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)',
              color: tab === 'signin' ? '#ffffff' : '#94a3b8',
              fontWeight: tab === 'signin' ? '700' : '500',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={15} color={tab === 'signin' ? '#818cf8' : '#94a3b8'} />
            Sign In
          </button>

          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: tab === 'signup' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
              background: tab === 'signup' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.02)',
              color: tab === 'signup' ? '#ffffff' : '#94a3b8',
              fontWeight: tab === 'signup' ? '700' : '500',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={15} color={tab === 'signup' ? '#c084fc' : '#94a3b8'} />
            Sign Up
          </button>
        </div>

        {/* Messages */}
        <div style={{ padding: '0 28px' }}>
          {errorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 28px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tab === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '0 12px',
                gap: '8px',
                transition: 'border-color 0.2s'
              }}>
                <User size={16} color="#94a3b8" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    padding: '12px 0',
                    fontSize: '0.92rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '0 12px',
              gap: '8px',
              transition: 'border-color 0.2s'
            }}>
              <Mail size={16} color="#94a3b8" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  padding: '12px 0',
                  fontSize: '0.92rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '0 12px',
              gap: '8px',
              transition: 'border-color 0.2s'
            }}>
              <Lock size={16} color="#94a3b8" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  padding: '12px 0',
                  fontSize: '0.92rem',
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {tab === 'signup' && (
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Must be at least 6 characters long
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '13px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.2s, opacity 0.2s',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : tab === 'signin' ? (
              <>
                <LogIn size={18} />
                <span>Sign In to Account</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Security & DDoS Guarantee Footer */}
        <div style={{
          padding: '14px 28px',
          background: 'rgba(10, 15, 29, 0.7)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span><strong>HttpOnly Cookie:</strong> JWT stored exclusively in secure browser cookie (Protected from XSS).</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
            <span><strong>DDoS & Brute-Force Shield:</strong> Protected by rate-limiting (15 auth attempts / 15 min).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
