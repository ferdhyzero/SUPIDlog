import React from 'react';

export default function SpotDetailModal({ spot, onClose }) {
  if (!spot) return null;

  return (
    <div className="modal-sheet">
      <div className="modal-sheet-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📍 {spot.category || 'SUP SPOT'}
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px' }}>{spot.name}</h2>
            <div style={{ color: 'var(--gold-star)', fontSize: '1rem', marginTop: '2px' }}>
              {'★'.repeat(spot.stars)}{'☆'.repeat(5 - spot.stars)} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(4.9)</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: '#E2E8F0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {/* Quick Spec Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <div className="card-clean" style={{ padding: '12px 10px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Best Season</span>
            <strong style={{ fontSize: '0.85rem', color: 'var(--ocean-blue)' }}>{spot.season || 'May-Oct'}</strong>
          </div>
          <div className="card-clean" style={{ padding: '12px 10px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Difficulty</span>
            <strong style={{ fontSize: '0.85rem', color: 'var(--ocean-dark)' }}>{spot.difficulty || 'Medium'}</strong>
          </div>
          <div className="card-clean" style={{ padding: '12px 10px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Water</span>
            <strong style={{ fontSize: '0.85rem', color: 'var(--safe-green)' }}>{spot.water || 'Clear'}</strong>
          </div>
        </div>

        {/* Launch Point GPS */}
        <div className="card-clean" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Launch Point</span>
            <strong style={{ fontSize: '0.9rem' }}>📍 {spot.gps || '-5.1234, 119.3456'}</strong>
          </div>
          <button style={{ background: 'var(--aqua-light)', color: 'var(--ocean-blue)', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
            Open GPS 🧭
          </button>
        </div>

        {/* Facilities Checklist */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>Facilities</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textCenter: 'center' }}>
            {[
              { label: 'Parking', icon: '🅿️', val: spot.parking ?? true },
              { label: 'Restaurant', icon: '🍽️', val: spot.restaurant ?? true },
              { label: 'Camping', icon: '⛺', val: spot.camping ?? true },
              { label: 'Toilet', icon: '🚻', val: spot.toilet ?? true },
            ].map((fac, idx) => (
              <div key={idx} style={{ background: fac.val ? 'rgba(16, 185, 129, 0.08)' : '#F1F5F9', border: `1px solid ${fac.val ? 'var(--safe-green)' : '#CBD5E1'}`, padding: '10px 4px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{fac.icon}</div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: fac.val ? 'var(--safe-green)' : 'var(--text-muted)' }}>
                  {fac.val ? '✔ Available' : '✕ No'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Forecast Detailed Box */}
        <div className="card-clean" style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: 'white', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, marginBottom: '12px' }}>
            🌊 Today's Forecast
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
            <div>
              <span style={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>Temp</span>
              <strong>28°C</strong>
            </div>
            <div>
              <span style={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>Wind</span>
              <strong>6 Knot</strong>
            </div>
            <div>
              <span style={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>Wave</span>
              <strong>0.2 m</strong>
            </div>
            <div>
              <span style={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>Tide</span>
              <strong>High</strong>
            </div>
            <div>
              <span style={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>UV Index</span>
              <strong>7 High</strong>
            </div>
            <div>
              <span style={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>Visibility</span>
              <strong>Excellent</strong>
            </div>
          </div>
        </div>

        {/* Visited by SUPer counter & Community photos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Community Photos</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Visited by <strong>{spot.visitedCount || 420} SUPer</strong></span>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--ocean-blue)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>+ Add Photo</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
          {['🏄‍♂️', '🌊', '🏝️'].map((emoji, i) => (
            <div key={i} style={{ height: '80px', background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white' }}>
              {emoji}
            </div>
          ))}
        </div>

        <button className="btn-cta-jumbo" onClick={onClose}>
          CLOSE DETAILS
        </button>
      </div>
    </div>
  );
}
