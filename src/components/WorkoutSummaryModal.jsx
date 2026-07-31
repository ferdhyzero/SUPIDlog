import React, { useState, useEffect } from 'react';

// Haversine Formula: Calculate Distance in KM between 2 GPS Points
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function WorkoutSummaryModal({ session, sessionData, onSave, onSaveActivity, onClose }) {
  const stats = sessionData || session || {
    distance: '0.0 km',
    timeFormatted: '00:00',
    avgSpeed: '0.0 km/h',
    maxSpeed: '0.0 km/h',
    pace: '00:00 /km',
    strokes: '0',
  };

  const [dbSpots, setDbSpots] = useState([]);
  const [spotName, setSpotName] = useState(stats.spotName || '');
  const [nearestDistanceInfo, setNearestDistanceInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [weather, setWeather] = useState('Cerah 30°C');
  const [water, setWater] = useState('Flat Water');
  const [wind, setWind] = useState('6 Knot');
  const [sharedToCommunity, setSharedToCommunity] = useState(true);

  // Extract starting GPS coordinates from recorded track
  const getStartCoordinates = () => {
    let lat = null;
    let lng = null;

    if (stats.gpsCoords) {
      const parts = String(stats.gpsCoords).split(',');
      if (parts.length >= 2) {
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      }
    }

    if ((lat === null || isNaN(lat)) && Array.isArray(stats.pathHistory) && stats.pathHistory.length > 0) {
      const firstPt = stats.pathHistory[0];
      if (firstPt && firstPt.lat) {
        lat = parseFloat(firstPt.lat);
        lng = parseFloat(firstPt.lng);
      }
    }

    if ((lat === null || isNaN(lat)) && Array.isArray(stats.route) && stats.route.length > 0) {
      const firstPt = stats.route[0];
      if (Array.isArray(firstPt) && firstPt.length >= 2) {
        lat = parseFloat(firstPt[0]);
        lng = parseFloat(firstPt[1]);
      }
    }

    return (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
  };

  // 1. 100% Real GPS Auto-Detection & Reverse Geocoding
  useEffect(() => {
    async function detectRealGpsSpotAndLoadDb() {
      const coords = getStartCoordinates();
      let detectedLocationName = '';

      // A. Perform OpenStreetMap Reverse Geocoding for real track coordinates
      if (coords) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
          const geoData = await geoRes.json();
          if (geoData && geoData.address) {
            const addr = geoData.address;
            const place = addr.beach || addr.tourism || addr.leisure || addr.suburb || addr.city_district || addr.city || addr.town || 'Spot Dayung';
            detectedLocationName = `${place} (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`;
          }
        } catch (e) {
          console.log('Reverse geocoding fallback to coords string:', e);
        }

        if (!detectedLocationName) {
          detectedLocationName = `Spot Dayung (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`;
        }

        setNearestDistanceInfo(`Deteksi GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        setSpotName(detectedLocationName);
      }

      // B. Fetch MySQL DB Spots and match via Haversine distance
      try {
        const res = await fetch('/api/get_spots.php');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDbSpots(data);

          if (coords) {
            let closestSpot = null;
            let minDistance = Infinity;

            data.forEach((spot) => {
              const sLat = parseFloat(spot.lat);
              const sLng = parseFloat(spot.lng);
              if (!isNaN(sLat) && !isNaN(sLng)) {
                const dist = calculateDistanceKm(coords.lat, coords.lng, sLat, sLng);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestSpot = spot;
                }
              }
            });

            if (closestSpot && minDistance <= 15) {
              setSpotName(closestSpot.name);
              const distStr = minDistance < 1 ? `${Math.round(minDistance * 1000)}m` : `${minDistance.toFixed(1)}km`;
              setNearestDistanceInfo(`${closestSpot.name} (${distStr} dari titik start)`);
            }
          }
        }
      } catch (err) {
        console.log('MySQL spots fetch:', err);
      }
    }

    detectRealGpsSpotAndLoadDb();
  }, [stats.gpsCoords, stats.pathHistory, stats.route]);

  // 2. Fetch Real-time Open-Meteo Weather for exact workout GPS Coords
  useEffect(() => {
    async function fetchLiveWeather() {
      if (!stats.gpsCoords) return;
      const coordsParts = String(stats.gpsCoords).split(',');
      if (coordsParts.length < 2) return;

      const lat = parseFloat(coordsParts[0].trim());
      const lng = parseFloat(coordsParts[1].trim());

      if (isNaN(lat) || isNaN(lng)) return;

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.current_weather) {
          const cw = data.current_weather;
          const windKnot = Math.round(cw.windspeed / 1.852);
          setWeather(`${cw.is_day ? 'Cerah' : 'Malam'} ${Math.round(cw.temperature)}°C`);
          setWind(`${windKnot} Knot`);
        }
      } catch (err) {
        console.log('Open-Meteo fetch error:', err);
      }
    }
    fetchLiveWeather();
  }, [stats.gpsCoords]);

  const handleSave = (shareFlag = sharedToCommunity) => {
    const saveFn = onSaveActivity || onSave;
    if (typeof saveFn === 'function') {
      const finalRouteJson = stats.route_json || (stats.route ? JSON.stringify(stats.route) : (stats.pathHistory ? JSON.stringify(stats.pathHistory.map(p => [p.lat, p.lng])) : null));
      saveFn({
        ...stats,
        spotName: spotName || 'Spot Dayung',
        notes: notes || 'Sesi paddle selesai!',
        weather,
        water,
        wind,
        shared_to_community: shareFlag ? 1 : 0,
        route_json: finalRouteJson,
        date: 'Hari ini',
      });
    }
  };

  return (
    <div className="modal-sheet">
      <div className="modal-sheet-content" style={{ borderRadius: '24px', padding: '20px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '10px', borderRadius: '50%', marginBottom: '6px', color: '#10B981' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ocean-blue)', textAlign: 'center', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
            Great Paddle!
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            Sesi paddle berhasil diselesaikan!
          </p>
        </div>

        {/* Sporty Athletic Telemetry Grid with Real SUP Action Photo */}
        <div 
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #070D1B 0%, #0F172A 100%)',
            color: 'white',
            borderRadius: '22px',
            padding: '18px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '16px',
            border: '1.5px solid rgba(0, 242, 254, 0.4)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)'
          }}
        >
          {/* Background Stand-Up Paddleboard Action Image */}
          <img 
            src="https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop" 
            alt="Stand Up Paddle Boarding"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop';
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.45,
              zIndex: 0,
              pointerEvents: 'none'
            }}
          />
          {/* Dark Gradient Overlay */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, rgba(7, 13, 27, 0.35) 0%, rgba(15, 23, 42, 0.85) 100%)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>Distance</span>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#00F2FE', fontFamily: 'var(--font-heading)' }}>{stats.distance}</div>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>Duration</span>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'monospace' }}>{stats.timeFormatted}</div>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>Avg Speed</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>{stats.avgSpeed}</div>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800 }}>Pace</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>{stats.pace || '--:-- /km'}</div>
          </div>

          <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', position: 'relative', zIndex: 2 }}>
            <span>Max Speed: <strong style={{ color: '#FF5E36' }}>{stats.maxSpeed || '0.0 km/h'}</strong></span>
            
            {/* Safety Compliance Badge */}
            <span style={{ background: (stats.safetyScore === undefined || stats.safetyScore >= 80) ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)', border: `1px solid ${(stats.safetyScore === undefined || stats.safetyScore >= 80) ? '#34D399' : '#FBBF24'}`, padding: '2px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Safety {stats.safetyScore !== undefined ? `${stats.safetyScore}%` : '100%'}
            </span>
          </div>
        </div>

        {/* Spot Location Selector */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ocean-blue)" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Lokasi Spot
            </label>
            {nearestDistanceInfo && (
              <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 800 }}>
                📍 {nearestDistanceInfo}
              </span>
            )}
          </div>

          {dbSpots.length > 0 ? (
            <select 
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, background: 'white' }}
            >
              {spotName && !dbSpots.some(s => s.name === spotName) && (
                <option value={spotName}>📍 {spotName}</option>
              )}
              {dbSpots.map((spot) => (
                <option key={spot.id || spot.name} value={spot.name}>
                  {spot.name}
                </option>
              ))}
            </select>
          ) : (
            <input 
              type="text" 
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              placeholder="Deteksi lokasi spot..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700, background: 'white' }}
            />
          )}
        </div>

        {/* Add Notes */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ocean-blue)" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Catatan Sesi
          </label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tulis cerita atau catatan sesi paddle..."
            rows={2}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontFamily: 'inherit' }}
          />
        </div>

        {/* Weather & Water Environment Pill Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Cuaca</span>
            <select 
              value={weather} 
              onChange={(e) => setWeather(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', fontWeight: 700 }}
            >
              <option value="Cerah 30°C">Cerah 30°C</option>
              <option value="Berawan 28°C">Berawan 28°C</option>
              <option value="Hujan 26°C">Hujan 26°C</option>
            </select>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Perairan</span>
            <select 
              value={water} 
              onChange={(e) => setWater(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', fontWeight: 700 }}
            >
              <option value="Flat Water">Flat Water</option>
              <option value="Choppy">Choppy</option>
              <option value="Wave / Surf">Wave / Surf</option>
            </select>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Angin</span>
            <input 
              type="text" 
              value={wind} 
              onChange={(e) => setWind(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem', fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Save & Discard Buttons Horizontal Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
          <button 
            className="btn-cta-jumbo"
            onClick={() => handleSave(true)}
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px 4px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 900 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Bagikan
          </button>

          <button 
            onClick={() => handleSave(false)}
            style={{ width: '100%', padding: '12px 4px', borderRadius: '12px', background: '#F1F5F9', color: '#0F172A', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.82rem' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            </svg>
            Simpan
          </button>

          <button 
            type="button"
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin membatalkan & menghapus sesi ini?')) {
                const cancelFn = onClose || onSave;
                if (typeof cancelFn === 'function') {
                  cancelFn(null);
                }
              }
            }}
            style={{ width: '100%', padding: '12px 4px', borderRadius: '12px', background: 'transparent', color: '#EF4444', fontWeight: 800, border: '1.5px solid rgba(239,68,68,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.78rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}
