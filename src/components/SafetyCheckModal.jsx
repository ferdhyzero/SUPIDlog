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
      setWarningMsg('Leash (Tali Kaki Board) belum dicentang! Tali kaki sangat krusial untuk keselamatan.');
      return;
    }
    if (!items.pfd) {
      setWarningMsg('Pelampung (PFD) belum dicentang! Wajib disiapkan sebelum berdayung.');
      return;
    }
    onConfirmStart(items, safetyScore);
  };

  return (
    <div className="modal-sheet">
      <div 
        className="modal-sheet-content" 
        style={{ 
          background: '#FFFFFF', 
          color: '#0F172A',
          borderRadius: '24px', 
          padding: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ocean-blue)', fontFamily: 'var(--font-heading)', margin: 0 }}>
              Safety Check 
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ocean-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
              </svg>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Pastikan perlengkapan aman sebelum turun ke air</p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
          >
            ✕
          </button>
        </div>

        {/* Safety Score Meter Card */}
        <div 
          style={{
            background: safetyScore >= 80 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1.5px solid ${safetyScore >= 80 ? '#10B981' : '#EF4444'}`,
            padding: '16px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SAFETY SCORE</span>
            <h3 style={{ fontSize: '2.0rem', fontWeight: 900, color: safetyScore >= 80 ? '#10B981' : '#EF4444', margin: 0, fontFamily: 'var(--font-heading)' }}>
              {safetyScore}%
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {safetyScore >= 80 ? (
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            ) : (
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
          </div>
        </div>

        {/* Warning Alert Box */}
        {warningMsg && (
          <div 
            style={{
              background: '#FEF2F2',
              border: '1.5px solid #EF4444',
              color: '#991B1B',
              padding: '12px 14px',
              borderRadius: '14px',
              fontSize: '0.82rem',
              fontWeight: 800,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>{warningMsg}</span>
          </div>
        )}

        {/* Checklist items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {[
            { 
              key: 'pfd', 
              label: 'PFD (Pelampung Keselamatan)', 
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
                  <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
                </svg>
              )
            },
            { 
              key: 'leash', 
              label: 'Leash (Tali Kaki Board)', 
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              )
            },
            { 
              key: 'water', 
              label: 'Water (Air Minum)', 
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
              )
            },
            { 
              key: 'phone', 
              label: 'Phone Waterproof Case', 
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="5" y="2" width="14" height="20" rx="3"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              )
            },
            { 
              key: 'whistle', 
              label: 'Whistle (Peluit Darurat)', 
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )
            },
            { 
              key: 'sunscreen', 
              label: 'Sunscreen (Tabur Surya)', 
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                </svg>
              )
            },
          ].map((item) => (
            <label 
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 16px',
                background: items[item.key] ? 'rgba(0, 180, 216, 0.08)' : '#F8FAFC',
                border: `1.5px solid ${items[item.key] ? '#00B4D8' : '#E2E8F0'}`,
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{ color: items[item.key] ? '#0284C7' : '#94A3B8', display: 'flex', alignItems: 'center' }}>
                  {item.svg}
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: items[item.key] ? '#0F172A' : '#64748B' }}>
                  {item.label}
                </span>
              </div>

              <input 
                type="checkbox"
                checked={items[item.key]}
                onChange={() => toggleItem(item.key)}
                style={{ width: '20px', height: '20px', accentColor: '#0284C7', cursor: 'pointer', marginLeft: 'auto', flexShrink: 0 }}
              />
            </label>
          ))}
        </div>

        {/* START Button */}
        <button 
          type="button"
          onClick={handleStart}
          style={{ 
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
            color: 'white',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.0rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
          }}
        >
          <span>GO TO WATER (START)</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
