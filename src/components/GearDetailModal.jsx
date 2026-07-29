import React from 'react';

export default function GearDetailModal({ gear, onClose }) {
  if (!gear) return null;

  return (
    <div className="modal-sheet">
      <div className="modal-sheet-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚙️ {gear.type}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{gear.name}</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{gear.spec}</span>
          </div>

          <button 
            onClick={onClose}
            style={{ background: '#E2E8F0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {/* Salt Water Wash Reminder Alert Box */}
        <div 
          style={{
            background: 'rgba(0, 180, 216, 0.1)',
            border: '1.5px solid var(--aqua)',
            padding: '14px 16px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>🚿</span>
          <div>
            <strong style={{ fontSize: '0.85rem', color: 'var(--ocean-dark)', display: 'block' }}>Maintenance Reminder</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              {gear.reminder || 'Wash with fresh water immediately after paddling in salt water.'}
            </p>
          </div>
        </div>

        {/* Specs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div className="card-clean">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Purchase Date</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{gear.purchaseDate || 'Jan 2026'}</strong>
          </div>

          <div className="card-clean">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Price</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--ocean-blue)' }}>{gear.price || 'Rp12.500.000'}</strong>
          </div>

          <div className="card-clean">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Sessions</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{gear.sessions || 68} Sessions</strong>
          </div>

          <div className="card-clean">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Distance</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{gear.distance || '530 km'}</strong>
          </div>

          <div className="card-clean" style={{ gridColumn: 'span 2' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Condition</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--safe-green)' }}>{gear.condition || 'Excellent ✨'}</strong>
          </div>
        </div>

        <button className="btn-cta-jumbo" onClick={onClose}>
          CLOSE LOCKER
        </button>
      </div>
    </div>
  );
}
