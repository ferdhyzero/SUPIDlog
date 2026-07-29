import React from 'react';

export default function StampUnlockedModal({ spotName = 'SAMALONA', onClose }) {
  return (
    <div className="stamp-modal-backdrop" onClick={onClose}>
      <div className="stamp-badge-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
          NEW PASSPORT STAMP!
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)' }}>
          STAMP UNLOCKED 🏆
        </h3>

        {/* Animated Stamp Impact Graphic */}
        <div className="stamp-visual">
          <span style={{ fontSize: '1.8rem', marginBottom: '2px' }}>✔</span>
          <strong style={{ fontSize: '0.9rem', letterSpacing: '0.05em', textAlign: 'center', lineHeight: '1.1' }}>
            {spotName.toUpperCase()}
          </strong>
          <span style={{ fontSize: '0.6rem', marginTop: '2px', opacity: 0.8 }}>SUP.ID INDONESIA</span>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Selamat! Sesi paddle Anda di <strong>{spotName}</strong> berhasil dicatat di Paspor SUP Indonesia.
        </p>

        <button 
          className="btn-cta-jumbo"
          onClick={onClose}
          style={{ width: '100%' }}
        >
          VIEW PASSPORT 🌟
        </button>
      </div>
    </div>
  );
}
