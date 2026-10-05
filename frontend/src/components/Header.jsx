'use client';

import React from 'react';
import { Sparkles, Code2, Layers, Cpu, ShieldCheck, LogIn, UserPlus, LogOut, User as UserIcon } from 'lucide-react';

export default function Header({
  onOpenTechStack,
  onOpenAspectConverter,
  user = null,
  onOpenAuth = () => {},
  onLogout = () => {}
}) {
  return (
    <header style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(7, 9, 14, 0.85)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Horizontal ⇄ Vertical Video Converter Button */}
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

          {/* AI Engine Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: '600' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }}></span>
            AI Engine Online
          </div>

          {/* Tech Stack & Architecture Modal */}
          <button
            onClick={onOpenTechStack}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            title="View full required tech stack, ML models and production architecture"
          >
            <Code2 size={15} color="#818cf8" />
            <span>Tech Stack</span>
          </button>

          {/* User Authentication Status / Buttons */}
          {user ? (
            /* Logged In User Profile Chip */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 12px',
              borderRadius: '12px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.82rem'
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', lineHeight: '1.2' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <ShieldCheck size={11} /> HttpOnly Session
                </span>
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  padding: '5px 9px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '4px',
                  transition: 'all 0.2s'
                }}
                title="Sign Out (Clears secure HttpOnly Cookie)"
                id="sign-out-btn"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Guest / Unauthenticated Buttons */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onOpenAuth('signin')}
                id="header-signin-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogIn size={15} color="#818cf8" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => onOpenAuth('signup')}
                id="header-signup-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 15px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserPlus size={15} color="#ffffff" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
