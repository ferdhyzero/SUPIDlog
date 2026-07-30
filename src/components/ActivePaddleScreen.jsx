import React, { useState, useEffect, useRef } from 'react';

export default function ActivePaddleScreen({ onStop, onTakePhoto }) {
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [distance, setDistance] = useState(0.0);
  const [speed, setSpeed] = useState(0.0);
  const [maxSpeed, setMaxSpeed] = useState(0.0);
  const [gpsStatus, setGpsStatus] = useState('SEARCHING GPS...');
  const [isRealGps, setIsRealGps] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentCoords, setCurrentCoords] = useState({ lat: -5.14378, lng: 119.45851 });
  const [pathHistory, setPathHistory] = useState([
    { lat: -5.14378, lng: 119.45851 }
  ]);
  
  // 'map' (Google Maps), 'vector_canvas' (Offline Vector Map), or 'dashboard'
  const [viewMode, setViewMode] = useState(navigator.onLine ? 'map' : 'vector_canvas');
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' or 'satellite'

  const prevCoordsRef = useRef(null);
  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const canvasRef = useRef(null);

  // Haversine formula to calculate distance between two GPS coordinates in KM
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

  // Monitor online/offline network status (Auto fallback to Vector Canvas if offline at sea)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setViewMode('vector_canvas'); // Auto switch to offline vector canvas map
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enable Web Geolocation API for Real GPS Tracking (Works 100% Offline using Satellite Hardware)
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed: gpsSpeed } = position.coords;
          setIsRealGps(true);
          setGpsStatus('GPS LOCKED 🛰️');
          const newPt = { lat: +latitude.toFixed(5), lng: +longitude.toFixed(5) };
          setCurrentCoords(newPt);

          // Append to GPS path trajectory history for canvas vector drawing
          setPathHistory((prev) => {
            if (prev.length === 0) return [newPt];
            const last = prev[prev.length - 1];
            if (Math.abs(last.lat - newPt.lat) > 0.00005 || Math.abs(last.lng - newPt.lng) > 0.00005) {
              return [...prev, newPt];
            }
            return prev;
          });

          // Speed calculation & GPS Jitter Filter (Ignore noise under 10 meters and under 0.8 km/h)
          const currentSpeedKmH = (gpsSpeed !== null && gpsSpeed !== undefined && gpsSpeed > 0.2) ? +(gpsSpeed * 3.6).toFixed(1) : 0.0;

          if (prevCoordsRef.current) {
            const distDelta = calculateDistance(
              prevCoordsRef.current.latitude,
              prevCoordsRef.current.longitude,
              latitude,
              longitude
            );

            // Strict Filter: Only add distance if movement is > 10 meters AND speed > 0.8 km/h
            if (distDelta >= 0.010 && distDelta < 0.5 && currentSpeedKmH >= 0.8) {
              setDistance((prev) => +(prev + distDelta).toFixed(2));
              prevCoordsRef.current = { latitude, longitude };
            }
          } else {
            prevCoordsRef.current = { latitude, longitude };
          }

          if (currentSpeedKmH >= 0.8) {
            setSpeed(currentSpeedKmH);
            setMaxSpeed((prev) => Math.max(prev, currentSpeedKmH));
          } else {
            setSpeed(0.0);
          }
        },
        (error) => {
          console.log('GPS Error / Waiting for real movement:', error.message);
          setGpsStatus('GPS READY 🛰️');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000,
        }
      );
    } else {
      setGpsStatus('GPS READY');
    }

    // Keep screen awake while paddling (Wake Lock API)
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLockRef.current = lock;
      }).catch((e) => console.log('WakeLock error:', e));
    }

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  // Timer Tick
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Draw Offline HTML5 Canvas GPS Vector Track Map
  useEffect(() => {
    if (viewMode !== 'vector_canvas' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth || 340;
    const height = canvas.height = canvas.parentElement.clientHeight || 340;

    // Clear background with dark ocean theme
    ctx.fillStyle = '#0B1329';
    ctx.fillRect(0, 0, width, height);

    // Draw ocean grid lines
    ctx.strokeStyle = 'rgba(0, 180, 216, 0.15)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (pathHistory.length === 0) return;

    // Calculate coordinate bounds to scale canvas points
    let minLat = pathHistory[0].lat;
    let maxLat = pathHistory[0].lat;
    let minLng = pathHistory[0].lng;
    let maxLng = pathHistory[0].lng;

    pathHistory.forEach(pt => {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lng < minLng) minLng = pt.lng;
      if (pt.lng > maxLng) maxLng = pt.lng;
    });

    const latSpan = (maxLat - minLat) || 0.001;
    const lngSpan = (maxLng - minLng) || 0.001;
    const padding = 50;

    const getCanvasXY = (pt) => {
      const x = padding + ((pt.lng - minLng) / lngSpan) * (width - padding * 2);
      // Invert Y axis for latitude
      const y = height - (padding + ((pt.lat - minLat) / latSpan) * (height - padding * 2));
      return { x, y };
    };

    // Draw Vector Path Trajectory Line
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00B4D8';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    pathHistory.forEach((pt, i) => {
      const { x, y } = getCanvasXY(pt);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Glow Effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00B4D8';
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset

    // Draw Start Pin (Green)
    const startXY = getCanvasXY(pathHistory[0]);
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(startXY.x, startXY.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('START', startXY.x - 16, startXY.y - 12);

    // Draw Live Current Position Marker (Pulsating Red Circle)
    const currentXY = getCanvasXY(pathHistory[pathHistory.length - 1]);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(currentXY.x, currentXY.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('POSISI TERKINI', currentXY.x - 36, currentXY.y + 24);

  }, [pathHistory, viewMode]);

  // Calculate Average Speed in KM/H (strictly 0.0 if distance is 0)
  const calculateAvgSpeed = () => {
    if (distance <= 0 || seconds <= 5) return "0.0";
    const hours = seconds / 3600;
    return (distance / hours).toFixed(1);
  };

  // Format timer
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    
    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Google Maps Real-time Embed URL (rounded to 3 decimals ~100m to prevent iframe flickering on micro GPS drift)
  const mapLat = (+currentCoords.lat || -5.14378).toFixed(3);
  const mapLng = (+currentCoords.lng || 119.45851).toFixed(3);
  const googleMapsUrl = `https://maps.google.com/maps?q=${mapLat},${mapLng}&t=${mapType === 'satellite' ? 'k' : 'm'}&z=15&output=embed`;

  const handleStopClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    onStop({
      distance: `${distance.toFixed(1)} km`,
      rawDistance: distance,
      timeFormatted: formatTime(seconds),
      seconds,
      avgSpeed: `${calculateAvgSpeed()} km/h`,
      maxSpeed: `${maxSpeed.toFixed(1)} km/h`,
      gpsCoords: `${currentCoords.lat}, ${currentCoords.lng}`,
    });
  };

  return (
    <div className="active-sports-overlay">
      
      {/* Top Bar Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isRealGps ? '#10B981' : '#F59E0B', display: 'inline-block' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94A3B8' }}>
              {gpsStatus}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              style={{ 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                padding: '4px 10px', 
                borderRadius: '9999px',
                background: isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.2)',
                color: isOnline ? '#34D399' : '#FBBF24',
                border: `1px solid ${isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
              }}
            >
              {isOnline ? '🌐 ONLINE' : '📡 OFFLINE GPS'}
            </span>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
              {isPaused ? '⏸️ PAUSED' : '🔴 RECORDING'}
            </div>
          </div>
        </div>

        {/* View Switcher: GOOGLE MAPS vs OFFLINE GPS CANVAS vs DASHBOARD METRICS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(0, 180, 216, 0.3)', gap: '4px' }}>
          {isOnline && (
            <button 
              onClick={() => setViewMode('map')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.72rem',
                background: viewMode === 'map' ? '#00B4D8' : 'transparent',
                color: viewMode === 'map' ? '#0F172A' : '#90E0EF',
                cursor: 'pointer'
              }}
            >
              🗺️ GOOGLE MAPS
            </button>
          )}

          <button 
            onClick={() => setViewMode('vector_canvas')}
            style={{
              flex: 1,
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.72rem',
              background: viewMode === 'vector_canvas' ? '#00B4D8' : 'transparent',
              color: viewMode === 'vector_canvas' ? '#0F172A' : '#90E0EF',
              cursor: 'pointer'
            }}
          >
            📡 TRACK CANVAS (OFFLINE)
          </button>

          <button 
            onClick={() => setViewMode('dashboard')}
            style={{
              flex: 1,
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.72rem',
              background: viewMode === 'dashboard' ? '#00B4D8' : 'transparent',
              color: viewMode === 'dashboard' ? '#0F172A' : '#90E0EF',
              cursor: 'pointer'
            }}
          >
            📊 DASHBOARD
          </button>
        </div>
      </div>

      {/* Main Distance & Timer Header */}
      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <div className="metric-jumbo" style={{ fontSize: '3.4rem', color: '#00B4D8', textShadow: '0 0 20px rgba(0, 180, 216, 0.4)', lineHeight: 1 }}>
          {distance.toFixed(1)} <span style={{ fontSize: '1.2rem', color: '#94A3B8' }}>KM</span>
        </div>
        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
          {formatTime(seconds)}
        </div>
      </div>

      {/* MODE 1: REAL GOOGLE MAPS EMBED (When Online) */}
      {viewMode === 'map' && isOnline && (
        <div 
          style={{
            flex: 1,
            background: '#0F172A',
            borderRadius: '24px',
            border: '2px solid rgba(0, 180, 216, 0.5)',
            position: 'relative',
            overflow: 'hidden',
            margin: '4px 0 12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}
        >
          {/* Map Layer Switcher Floating Pill */}
          <div 
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '4px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              gap: '4px'
            }}
          >
            <button
              onClick={() => setMapType('roadmap')}
              style={{
                background: mapType === 'roadmap' ? '#00B4D8' : 'transparent',
                color: mapType === 'roadmap' ? '#0F172A' : 'white',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🗺️ Peta
            </button>
            <button
              onClick={() => setMapType('satellite')}
              style={{
                background: mapType === 'satellite' ? '#00B4D8' : 'transparent',
                color: mapType === 'satellite' ? '#0F172A' : 'white',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🛰️ Satelit
            </button>
          </div>

          <iframe 
            title="Real-time Google Maps Live GPS Tracker"
            src={googleMapsUrl}
            width="100%"
            height="100%"
            style={{ border: 0, width: '100%', height: '100%' }}
            loading="lazy"
            allowFullScreen
          />

          <div 
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 180, 216, 0.4)',
              borderRadius: '14px',
              padding: '8px 14px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              fontSize: '0.78rem',
              color: '#90E0EF',
              fontWeight: 700,
              zIndex: 10
            }}
          >
            <span>📍 GOOGLE MAPS GPS: {currentCoords.lat}, {currentCoords.lng}</span>
            <span style={{ color: '#34D399' }}>LIVE GPS ✔</span>
          </div>
        </div>
      )}

      {/* MODE 2: OFFLINE GPS VECTOR CANVAS MAP (Works 100% Offline at Sea without Internet!) */}
      {viewMode === 'vector_canvas' && (
        <div 
          style={{
            flex: 1,
            background: '#0B1329',
            borderRadius: '24px',
            border: '2px solid rgba(0, 180, 216, 0.6)',
            position: 'relative',
            overflow: 'hidden',
            margin: '4px 0 12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

          {/* Offline Status Badge */}
          <div 
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(245, 158, 11, 0.25)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #F59E0B',
              color: '#FBBF24',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}
          >
            📡 OFFLINE VECTOR MAP (TANPA KONEKSI SERVER/INTERNET)
          </div>

          {/* Offline GPS Coords Bar */}
          <div 
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 180, 216, 0.4)',
              borderRadius: '14px',
              padding: '8px 14px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              fontSize: '0.78rem',
              color: '#90E0EF',
              fontWeight: 700
            }}
          >
            <span>📍 GPS SATELIT HP: {currentCoords.lat}, {currentCoords.lng}</span>
            <span style={{ color: '#34D399' }}>TRACK RECORDING ✔</span>
          </div>
        </div>
      )}

      {/* MODE 3: DASHBOARD METRICS */}
      {viewMode === 'dashboard' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              width: '100%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '24px 12px',
              borderRadius: '24px',
              textAlign: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00B4D8' }}>
                {speed.toFixed(1)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>SPEED (KM/H)</span>
            </div>

            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F59E0B' }}>
                {maxSpeed.toFixed(1)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>MAX (KM/H)</span>
            </div>

            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981' }}>
                {calculateAvgSpeed()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>AVG (KM/H)</span>
            </div>
          </div>
        </div>
      )}

      {/* Control Action Buttons (STOP, PAUSE, PHOTO) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', position: 'relative', zIndex: 100 }}>
        {/* STOP BUTTON */}
        <button 
          onClick={handleStopClick}
          onTouchEnd={handleStopClick}
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '16px 0',
            fontFamily: 'var(--font-heading)',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)'
          }}
        >
          ⏹ STOP
        </button>

        {/* PAUSE BUTTON */}
        <button 
          onClick={() => setIsPaused(!isPaused)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsPaused(!isPaused);
          }}
          style={{
            background: isPaused ? 'linear-gradient(135deg, #10B981 0%, #047857 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '16px 0',
            fontFamily: 'var(--font-heading)',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)'
          }}
        >
          {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>

        {/* PHOTO BUTTON */}
        <button 
          onClick={onTakePhoto}
          onTouchEnd={(e) => {
            e.preventDefault();
            onTakePhoto();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            borderRadius: '20px',
            padding: '16px 0',
            fontFamily: 'var(--font-heading)',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          📷 PHOTO
        </button>
      </div>
    </div>
  );
}
