import React, { useState } from 'react';

export default function WorkoutSummaryModal({ sessionData, onSaveActivity, onClose }) {
  const [notes, setNotes] = useState('Sunrise paddle mantap bersama teman-teman SUP.ID!');
  const [spotName, setSpotName] = useState('Samalona');
  const [weather, setWeather] = useState('☀ Sunny');
  const [water, setWater] = useState('Flat');
  const [wind, setWind] = useState('6 knot');

  const stats = sessionData || {
    distance: '8.4 km',
    timeFormatted: '1h 55m',
    avgSpeed: '4.8 km/h',
    maxSpeed: '7.2 km/h',
    pace: '13:40 /km',
    strokes: '3,890',
  };

  const handleSave = () => {
    onSaveActivity({
      ...stats,
      spotName,
      notes,
      weather,
      water,
      wind,
      date: 'Hari ini',
    });
  };

  return (
    <div className="modal-sheet">
      <div className="modal-sheet-content">
        <div style={{ textCenter: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '6px' }}>🎉</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textAlign: 'center' }}>
            Great Paddle!
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Sesi paddle Anda berhasil diselesaikan dengan aman!
          </p>
        </div>

        {/* Objective GPS Stats Grid */}
        <div 
          style={{
            background: 'linear-gradient(135deg, var(--ocean-dark) 0%, var(--ocean-blue) 100%)',
            color: 'white',
            borderRadius: '20px',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distance</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{stats.distance}</div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{stats.timeFormatted}</div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pace (Min/KM)</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F59E0B' }}>{stats.pace || '13:40 /km'}</div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Speed</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#00B4D8' }}>{stats.avgSpeed}</div>
          </div>

          <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>Max Speed: <strong>{stats.maxSpeed || '7.2 km/h'}</strong></span>
            <span>Strokes: <strong>{stats.strokes || '3,890'}</strong></span>
          </div>
        </div>

        {/* Spot Location Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
            📍 Location Spot
          </label>
          <select 
            value={spotName}
            onChange={(e) => setSpotName(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.95rem', fontWeight: 600 }}
          >
            <option value="Samalona">Samalona Island</option>
            <option value="Bosowa">Bosowa Beach</option>
            <option value="Bili-Bili">Danau Bili-Bili</option>
            <option value="Wakatobi">Wakatobi Marine Park</option>
            <option value="Raja Ampat">Raja Ampat</option>
          </select>
        </div>

        {/* Add Notes */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
            📝 Add Notes
          </label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tulis kesan atau cerita sesi paddle ini..."
            rows={2}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontFamily: 'inherit' }}
          />
        </div>

        {/* Environmental Conditions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Weather</label>
            <select 
              value={weather} 
              onChange={(e) => setWeather(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
            >
              <option value="☀ Sunny">☀ Sunny</option>
              <option value="⛅ Cloudy">⛅ Cloudy</option>
              <option value="🌧 Rain">🌧 Rain</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Water</label>
            <select 
              value={water} 
              onChange={(e) => setWater(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
            >
              <option value="Flat">Flat Water</option>
              <option value="Choppy">Choppy</option>
              <option value="Wave">Wave / Surf</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Wind</label>
            <input 
              type="text" 
              value={wind} 
              onChange={(e) => setWind(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Save CTA */}
        <button 
          className="btn-cta-jumbo"
          onClick={handleSave}
        >
          <span>SAVE ACTIVITY 💾</span>
        </button>
      </div>
    </div>
  );
}
