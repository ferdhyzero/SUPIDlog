import React, { useState } from 'react';

export default function SafetyCheckModal({ onClose, onConfirmStart }) {
  const [items, setItems] = useState({
    pfd: true,
    leash: true,
    water: true,
    phone: true,
    whistle: false,
    sunscreen: true,
  });

  const [warningMsg, setWarningMsg] = useState('');

  const toggleItem = (key) => {
    setItems((prev) => ({ ...prev, [key]: !prev[key] }));
    setWarningMsg('');
  };

  const checkedCount = Object.values(items).filter(Boolean).length;
  const totalCount = Object.keys(items).length;
  const safetyScore = Math.round((checkedCount / totalCount) * 100);

  const handleStart = () => {
    if (!items.leash) {
      setWarningMsg('⚠ Leash belum dicentang! Tali kaki (Leash) sangat penting untuk keselamatan di atas air.');
      return;
    }
    if (!items.pfd) {
      setWarningMsg('⚠ Pelampung (PFD) belum dicentang! Disarankan selalu memakai PFD saat mendayung.');
      return;
    }
    onConfirmStart(items);
  };

  return (
    <div className="modal-sheet">
      <div className="modal-sheet-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Safety Check 🛟</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pastikan perlengkapan aman sebelum turun ke air</p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: '#E2E8F0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {/* Safety Score Meter */}
        <div 
          style={{
            background: safetyScore >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 107, 0, 0.1)',
            border: `1px solid ${safetyScore >= 80 ? 'var(--safe-green)' : 'var(--emergency-orange)'}`,
            padding: '16px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}
        >
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Safety Score</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: safetyScore >= 80 ? 'var(--safe-green)' : 'var(--emergency-orange)' }}>
              {safetyScore}%
            </h3>
          </div>

          <div style={{ fontSize: '2.5rem' }}>
            {safetyScore >= 80 ? '🛡️' : '⚠️'}
          </div>
        </div>

        {/* Warning Alert Box if Leash/PFD missing */}
        {warningMsg && (
          <div 
            style={{
              background: '#FEF2F2',
              border: '2px solid #EF4444',
              color: '#991B1B',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '16px',
              animation: 'pulseGlow 1s infinite'
            }}
          >
            {warningMsg}
          </div>
        )}

        {/* Checklist items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {[
            { key: 'pfd', label: 'PFD (Pelampung Keselamatan)', icon: '🛟' },
            { key: 'leash', label: 'Leash (Tali Kaki Board)', icon: '➰' },
            { key: 'water', label: 'Water (Air Minum)', icon: '💧' },
            { key: 'phone', label: 'Phone Waterproof Case', icon: '📱' },
            { key: 'whistle', label: 'Whistle (Peluit Darurat)', icon: '🔊' },
            { key: 'sunscreen', label: 'Sunscreen (Tabur Surya)', icon: '🧴' },
          ].map((item) => (
            <label 
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: items[item.key] ? 'rgba(0, 180, 216, 0.08)' : '#F8FAFC',
                border: `1.5px solid ${items[item.key] ? 'var(--aqua)' : '#E2E8F0'}`,
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: items[item.key] ? 'var(--ocean-dark)' : 'var(--text-main)' }}>
                  {item.label}
                </span>
              </div>

              <input 
                type="checkbox"
                checked={items[item.key]}
                onChange={() => toggleItem(item.key)}
                style={{ width: '22px', height: '22px', accentColor: 'var(--ocean-blue)', cursor: 'pointer' }}
              />
            </label>
          ))}
        </div>

        {/* START Button */}
        <button 
          className="btn-cta-jumbo"
          onClick={handleStart}
          style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
        >
          <span>GO TO WATER (START)</span>
          <span style={{ fontSize: '1.3rem' }}>➔</span>
        </button>
      </div>
    </div>
  );
}
