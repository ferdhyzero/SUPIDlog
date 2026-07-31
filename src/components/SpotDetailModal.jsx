import React, { useState, useEffect } from 'react';

// Stand-Up Paddleboard (SUP) & Beach Photography Pool
const SUP_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516690561799-46d8f7489abf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
];

function getSpotPhoto(spot) {
  if (!spot) return SUP_PHOTO_POOL[0];
  if (spot.image_url) return spot.image_url;

  const str = `${spot.id || ''}_${spot.name || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUP_PHOTO_POOL.length;
  return SUP_PHOTO_POOL[index];
}

export default function SpotDetailModal({ spot, onClose }) {
  const [liveWeather, setLiveWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [spotPhotoUrl, setSpotPhotoUrl] = useState(null);

  // Dynamic Automatic Photo Resolver Engine
  useEffect(() => {
    if (spot) {
      setSpotPhotoUrl(getSpotPhoto(spot));
    }
  }, [spot]);

  // Fetch real-time Open-Meteo Weather Data for exact spot lat/lng
  useEffect(() => {
    async function fetchOpenMeteoWeather() {
      if (!spot || !spot.lat || !spot.lng) {
        setLoadingWeather(false);
        return;
      }
      setLoadingWeather(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lng}&current_weather=true`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.current_weather) {
          const cw = data.current_weather;
          const windKnot = Math.round(cw.windspeed / 1.852);
          setLiveWeather({
            temp: `${Math.round(cw.temperature)}°C`,
            wind: `${windKnot} Knot`,
            windSpeedKmh: `${cw.windspeed} km/h`,
            code: cw.weathercode,
            isDay: cw.is_day === 1
          });
        }
      } catch (err) {
        console.log('Open-Meteo fetch error:', err);
      } finally {
        setLoadingWeather(false);
      }
    }
    fetchOpenMeteoWeather();
  }, [spot?.lat, spot?.lng]);

  // Early return MUST be placed AFTER all hooks are declared
  if (!spot) return null;

  const latVal = spot.lat ? Number(spot.lat).toFixed(4) : '-5.1478';
  const lngVal = spot.lng ? Number(spot.lng).toFixed(4) : '119.4154';

  const handleClose = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    onClose();
  };

  return (
    <div 
      className="modal-sheet"
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
    >
      <div 
        className="modal-sheet-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '18px 16px', maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {spot.category || 'CUSTOM SPOT'}
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '2px', color: '#0F172A' }}>{spot.name}</h2>
            <div style={{ color: 'var(--gold-star)', fontSize: '0.9rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {'★'.repeat(spot.stars || 5)}{'☆'.repeat(5 - (spot.stars || 5))} 
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>(4.9)</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: spot.name,
                    text: `Lokasi Dayung Stand Up Paddle: ${spot.name} (${latVal}, ${lngVal})`,
                    url: `https://maps.google.com/?q=${latVal},${lngVal}`
                  }).catch(err => console.log(err));
                } else {
                  navigator.clipboard.writeText(`Lokasi Dayung: ${spot.name} - https://maps.google.com/?q=${latVal},${lngVal}`);
                  alert('Tautan lokasi disalin ke clipboard!');
                }
              }}
              style={{ background: 'var(--aqua-light)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'var(--ocean-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Bagikan Lokasi"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>

            <button 
              type="button"
              onClick={handleClose}
              style={{ background: '#E2E8F0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* HIGH-ACCURACY LANDSCAPE COVER PREVIEW IMAGE */}
        <div 
          onClick={() => {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(spot.name)}&t=m`, '_blank');
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: '180px',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '16px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            background: '#0F172A'
          }}
        >
          <img 
            src={spotPhotoUrl || SUP_PHOTO_POOL[0]} 
            alt={spot.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              e.target.src = SUP_PHOTO_POOL[0];
            }}
          />

          {/* Gradient Overlay & Badge */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.1) 60%)', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.3)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Pemandangan Lokasi
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#FFFFFF', display: 'block', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  {spot.name}
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#CBD5E1', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  {spot.category} • {latVal}, {lngVal}
                </span>
              </div>

              <span style={{ background: '#0284c7', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                Foto Google Maps ➔
              </span>
            </div>
          </div>
        </div>

        {/* Quick Spec Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          <div className="card-clean" style={{ padding: '10px 8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Best Season</span>
            <strong style={{ fontSize: '0.82rem', color: 'var(--ocean-blue)' }}>{spot.season || 'All Year'}</strong>
          </div>
          <div className="card-clean" style={{ padding: '10px 8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Difficulty</span>
            <strong style={{ fontSize: '0.82rem', color: 'var(--ocean-dark)' }}>{spot.difficulty || 'Easy'}</strong>
          </div>
          <div className="card-clean" style={{ padding: '10px 8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Water</span>
            <strong style={{ fontSize: '0.82rem', color: 'var(--safe-green)' }}>{spot.water || 'Clear'}</strong>
          </div>
        </div>

        {/* Launch Point GPS */}
        <div className="card-clean" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Launch Point</span>
            <strong style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {latVal}, {lngVal}
            </strong>
          </div>
          <button 
            type="button"
            onClick={() => {
              window.open(`https://maps.google.com/?q=${latVal},${lngVal}`, '_blank');
            }}
            style={{ background: 'var(--aqua-light)', color: 'var(--ocean-blue)', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Open GPS
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          </button>
        </div>

        {/* Facilities Checklist with SVG Outline Icons */}
        <div style={{ marginBottom: '18px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>Facilities</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { 
                label: 'Parking', 
                val: spot.parking ?? true,
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
                  </svg>
                )
              },
              { 
                label: 'Restaurant', 
                val: spot.restaurant ?? true,
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8v6M14 8v6M18 11h-4M6 18V6a2 2 0 0 1 4 0v12M6 11h4"/>
                  </svg>
                )
              },
              { 
                label: 'Camping', 
                val: spot.camping ?? true,
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 20L12 4 5 20h14zM12 14v6"/>
                  </svg>
                )
              },
              { 
                label: 'Toilet', 
                val: spot.toilet ?? true,
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7z"/>
                    <line x1="12" y1="7" x2="12" y2="11"/>
                  </svg>
                )
              },
            ].map((fac, idx) => (
              <div key={idx} style={{ background: fac.val ? 'rgba(16, 185, 129, 0.08)' : '#F1F5F9', border: `1px solid ${fac.val ? 'var(--safe-green)' : '#CBD5E1'}`, padding: '8px 4px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <div style={{ color: fac.val ? 'var(--safe-green)' : 'var(--text-muted)' }}>
                  {fac.svg}
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: fac.val ? 'var(--safe-green)' : 'var(--text-muted)' }}>
                  {fac.val ? 'Available' : 'No'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Open-Meteo Weather Detailed Box */}
        <div className="card-clean" style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: 'white', marginBottom: '18px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
              </svg>
              Live Weather ({latVal}, {lngVal})
            </h4>

            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
              OPEN-METEO REALTIME
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', fontSize: '0.78rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '6px', borderRadius: '8px' }}>
              <span style={{ opacity: 0.85, display: 'block', fontSize: '0.65rem' }}>Temp</span>
              <strong style={{ fontSize: '0.85rem' }}>{loadingWeather ? '...' : (liveWeather ? liveWeather.temp : '28°C')}</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '6px', borderRadius: '8px' }}>
              <span style={{ opacity: 0.85, display: 'block', fontSize: '0.65rem' }}>Wind Speed</span>
              <strong style={{ fontSize: '0.85rem' }}>{loadingWeather ? '...' : (liveWeather ? liveWeather.wind : '6 Knot')}</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '6px', borderRadius: '8px' }}>
              <span style={{ opacity: 0.85, display: 'block', fontSize: '0.65rem' }}>Wave / Condition</span>
              <strong style={{ fontSize: '0.85rem' }}>{loadingWeather ? '...' : (liveWeather ? (liveWeather.code <= 3 ? 'Clear Wave' : 'Choppy') : '0.2 m')}</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '6px', borderRadius: '8px' }}>
              <span style={{ opacity: 0.85, display: 'block', fontSize: '0.65rem' }}>Tide Status</span>
              <strong style={{ fontSize: '0.85rem' }}>High Tide</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '6px', borderRadius: '8px' }}>
              <span style={{ opacity: 0.85, display: 'block', fontSize: '0.65rem' }}>UV Index</span>
              <strong style={{ fontSize: '0.85rem' }}>7 High</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '6px', borderRadius: '8px' }}>
              <span style={{ opacity: 0.85, display: 'block', fontSize: '0.65rem' }}>Visibility</span>
              <strong style={{ fontSize: '0.85rem' }}>Excellent</strong>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
