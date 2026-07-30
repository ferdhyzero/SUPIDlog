import React from 'react';

export default function SplashModal({ onClose }) {
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        maxWidth: '480px',
        margin: '0 auto',
        zIndex: 200,
        background: 'linear-gradient(180deg, rgba(3,4,94,0.95) 0%, rgba(0,119,182,0.98) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        color: 'white',
        textAlign: 'center',
        cursor: 'pointer',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      {/* Background sea drone pattern overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none'
        }} 
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Official PADDLE ID Logo with Crisp White Border Outline */}
        <div 
          style={{
            width: '136px',
            height: '136px',
            borderRadius: '30px',
            overflow: 'hidden',
            marginBottom: '24px',
            border: '4px solid #ffffff',
            boxShadow: '0 0 0 3px rgba(255,255,255,0.4), 0 16px 36px rgba(0,0,0,0.4), 0 0 30px rgba(0,180,216,0.6)',
            animation: 'bounce 2.5s infinite ease-in-out',
            background: 'white'
          }}
        >
          <img 
            src="/logo.png" 
            alt="Paddle ID Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Stand Up PaddleLog
        </h1>
        
        <p style={{ fontSize: '1rem', opacity: 0.9, fontWeight: 500, fontStyle: 'italic', marginBottom: '28px' }}>
          Every Stroke Has A Story
        </p>

        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            marginBottom: '44px'
          }}
        >
          by SUP.ID Indonesia
        </div>

        <div style={{ fontSize: '0.85rem', opacity: 0.85, fontWeight: 600, animation: 'pulseGlow 1.5s infinite' }}>
          Ketuk layar untuk memulai 🌊
        </div>
      </div>
    </div>
  );
}
