import React, { useState, useEffect, useRef } from 'react';

export default function ActivePaddleScreen({ onStop, onStopWorkout, onTakePhoto }) {
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

  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [canvasZoomLevel, setCanvasZoomLevel] = useState(1.0);
  const [googleMapsZoom, setGoogleMapsZoom] = useState(15);

  const prevCoordsRef = useRef(null);
  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

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

          // Append to GPS path trajectory history for canvas vector drawing (Filter noise: minimum 12 meters movement)
          setPathHistory((prev) => {
            if (prev.length === 0) return [newPt];
            const last = prev[prev.length - 1];
            const distMovedKm = calculateDistance(last.lat, last.lng, newPt.lat, newPt.lng);
            if (distMovedKm >= 0.012) { // 12 meters
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

    // Calculate coordinate bounds & center of trajectory
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

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Minimum viewport span (~200 meters) so the map starts zoomed nicely around center
    const latSpan = Math.max(maxLat - minLat, 0.002);
    const lngSpan = Math.max(maxLng - minLng, 0.002);

    // Map point relative to center of canvas canvas (width/2, height/2)
    const scaleFactor = 0.65 * canvasZoomLevel;
    const getCanvasXY = (pt) => {
      const x = (width / 2) + ((pt.lng - centerLng) / lngSpan) * (width * scaleFactor);
      const y = (height / 2) - ((pt.lat - centerLat) / latSpan) * (height * scaleFactor);
      return { x, y };
    };

    // Check if user has actually moved away from starting point (> 12 meters / 0.012 km)
    const startPt = pathHistory[0];
    const endPt = pathHistory[pathHistory.length - 1];
    const totalDistMoved = calculateDistance(startPt.lat, startPt.lng, endPt.lat, endPt.lng);
    const hasMovedFar = totalDistMoved >= 0.012 || distance > 0.01;

    // Draw Smooth Bézier Vector Path Trajectory Line ONLY if user has actually paddled away
    if (hasMovedFar && pathHistory.length >= 2) {
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#00B4D8';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const pts = pathHistory.map(getCanvasXY);
      ctx.moveTo(pts[0].x, pts[0].y);

      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      }

      ctx.stroke();

      // Glow Effect Pass
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00B4D8';
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset
    }

    // Draw Start Pin (Green Centered Marker)
    const startXY = getCanvasXY(pathHistory[0]);
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(startXY.x, startXY.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('START', startXY.x - 16, startXY.y - 12);

    // Draw Live Current Position Marker (Pulsating Red Circle Centered)
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

  }, [pathHistory, viewMode, canvasZoomLevel]);

  // Calculate Average Speed in KM/H (strictly 0.0 if distance is 0)
  const calculateAvgSpeed = () => {
    if (distance <= 0 || seconds <= 5) return "0.0";
    const hours = seconds / 3600;
    return (distance / hours).toFixed(1);
  };

  // Calculate Pace (Min/KM) - Strava Rolling Pace Algorithm
  const calculatePace = () => {
    if (distance <= 0.02 || speed < 0.3) return "--:-- /km";
    const paceDecimal = 60 / speed;
    const paceMins = Math.floor(paceDecimal);
    const paceSecs = Math.round((paceDecimal - paceMins) * 60);
    const pad = (n) => String(n).padStart(2, '0');
    if (paceMins > 99 || isNaN(paceMins)) return "--:-- /km";
    return `${pad(paceMins)}:${pad(paceSecs)} /km`;
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

  // Google Maps Real-time Embed URL with dynamic unrestricted zoom level
  const mapLat = (+currentCoords.lat || -5.14378).toFixed(3);
  const mapLng = (+currentCoords.lng || 119.45851).toFixed(3);
  const googleMapsUrl = `https://maps.google.com/maps?q=${mapLat},${mapLng}&t=${mapType === 'satellite' ? 'k' : 'm'}&z=${googleMapsZoom}&output=embed`;

  const handleTriggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedPhoto(reader.result);
        if (typeof onTakePhoto === 'function') {
          onTakePhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStopClick = (e) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }

    const formattedRoute = pathHistory.map(pt => [pt.lat, pt.lng]);
    const routeJson = JSON.stringify(formattedRoute);

    const stopFn = onStop || onStopWorkout;
    if (typeof stopFn === 'function') {
      stopFn({
        distance: `${distance.toFixed(1)} km`,
        rawDistance: distance,
        timeFormatted: formatTime(seconds),
        seconds,
        avgSpeed: `${calculateAvgSpeed()} km/h`,
        maxSpeed: `${maxSpeed.toFixed(1)} km/h`,
        gpsCoords: `${currentCoords.lat}, ${currentCoords.lng}`,
        capturedPhoto: capturedPhoto,
        route_json: routeJson,
        route: formattedRoute,
        pathHistory: pathHistory,
      });
    } else {
      console.warn('onStop / onStopWorkout prop not provided');
    }
  };

  return (
    <div className="active-sports-overlay" style={{ background: 'linear-gradient(180deg, #070D1B 0%, #0F172A 100%)' }}>
      
      {/* HUD Top Bar Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.9)', padding: '5px 12px', borderRadius: '9999px', border: `1px solid ${isRealGps ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}` }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRealGps ? '#10B981' : '#F59E0B', display: 'inline-block', boxShadow: isRealGps ? '0 0 10px #10B981' : 'none' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', color: isRealGps ? '#34D399' : '#FBBF24', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {gpsStatus.replace(' 🛰️', '')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              style={{ 
                fontSize: '0.68rem', 
                fontWeight: 800, 
                padding: '5px 12px', 
                borderRadius: '9999px',
                background: isOnline ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.2)',
                color: isOnline ? '#34D399' : '#FBBF24',
                border: `1px solid ${isOnline ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {isOnline ? 'ONLINE' : 'OFFLINE GPS'}
            </span>
            <div style={{ background: isPaused ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${isPaused ? '#F59E0B' : '#EF4444'}`, padding: '5px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, color: isPaused ? '#FBBF24' : '#F87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPaused ? '#F59E0B' : '#EF4444', boxShadow: isPaused ? 'none' : '0 0 8px #EF4444', animation: isPaused ? 'none' : 'pulse 1s infinite' }} />
              {isPaused ? 'PAUSED' : 'RECORDING'}
            </div>
          </div>
        </div>

        {/* View Switcher: MAPS vs CANVAS vs METRICS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(11, 19, 43, 0.9)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(0, 180, 216, 0.35)', gap: '4px' }}>
          {isOnline && (
            <button 
              onClick={() => setViewMode('map')}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.72rem',
                background: viewMode === 'map' ? 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)' : 'transparent',
                color: viewMode === 'map' ? '#FFFFFF' : '#90E0EF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: viewMode === 'map' ? '0 4px 12px rgba(0,180,216,0.35)' : 'none'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/>
                <line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
              MAPS
            </button>
          )}

          <button 
            onClick={() => setViewMode('vector_canvas')}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.72rem',
              background: viewMode === 'vector_canvas' ? 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)' : 'transparent',
              color: viewMode === 'vector_canvas' ? '#FFFFFF' : '#90E0EF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              boxShadow: viewMode === 'vector_canvas' ? '0 4px 12px rgba(0,180,216,0.35)' : 'none'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 0-10 10c0 5.25 3.75 9.6 8.5 10.4v-3.1a7.5 7.5 0 1 1 3 0v3.1c4.75-.8 8.5-5.15 8.5-10.4A10 10 0 0 0 12 2z"/>
            </svg>
            CANVAS (OFFLINE)
          </button>

          <button 
            onClick={() => setViewMode('dashboard')}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.72rem',
              background: viewMode === 'dashboard' ? 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)' : 'transparent',
              color: viewMode === 'dashboard' ? '#FFFFFF' : '#90E0EF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              boxShadow: viewMode === 'dashboard' ? '0 4px 12px rgba(0,180,216,0.35)' : 'none'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            METRICS
          </button>
        </div>
      </div>

      {/* Main Athletic Jumbo Distance & Digital Timer Display */}
      <div style={{ textAlign: 'center', margin: '8px 0', background: 'rgba(11, 19, 43, 0.6)', padding: '12px', borderRadius: '20px', border: '1px solid rgba(0, 180, 216, 0.2)' }}>
        <div style={{ fontSize: '4.0rem', fontWeight: 900, color: '#00F2FE', textShadow: '0 0 25px rgba(0, 242, 254, 0.55)', lineHeight: 0.95, fontFamily: 'var(--font-heading)' }}>
          {distance.toFixed(2)} <span style={{ fontSize: '1.2rem', color: '#94A3B8', fontWeight: 700 }}>KM</span>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
          {formatTime(seconds)}
        </div>
      </div>

      {/* MODE 1: REAL GOOGLE MAPS EMBED (When Online) */}
      {viewMode === 'map' && isOnline && (
        <div 
          style={{
            height: '260px',
            background: '#0F172A',
            borderRadius: '20px',
            border: '2px solid rgba(0, 180, 216, 0.5)',
            position: 'relative',
            overflow: 'hidden',
            margin: '4px 0 8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}
        >
          {/* Google Maps Floating Zoom Controls (+ / - / Reset) */}
          <div 
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 10,
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 180, 216, 0.5)',
              padding: '4px 6px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
            }}
          >
            <button 
              type="button"
              onClick={() => setGoogleMapsZoom(prev => Math.min(prev + 1, 21))}
              style={{ background: '#00B4D8', color: '#0F172A', border: 'none', width: '28px', height: '28px', borderRadius: '8px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Perbesar Google Maps (Zoom In)"
            >
              +
            </button>
            <span style={{ fontSize: '0.68rem', color: 'white', fontWeight: 800, padding: '0 4px', minWidth: '28px', textAlign: 'center' }}>
              z{googleMapsZoom}
            </span>
            <button 
              type="button"
              onClick={() => setGoogleMapsZoom(prev => Math.max(prev - 1, 3))}
              style={{ background: '#00B4D8', color: '#0F172A', border: 'none', width: '28px', height: '28px', borderRadius: '8px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Perkecil Google Maps (Zoom Out)"
            >
              -
            </button>
            <button 
              type="button"
              onClick={() => setGoogleMapsZoom(15)}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Reset Zoom Google Maps (15)"
            >
              ↺
            </button>
          </div>

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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
              PETA
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
              SATELIT
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
            height: '260px',
            background: '#0B1329',
            borderRadius: '20px',
            border: '2px solid rgba(0, 180, 216, 0.6)',
            position: 'relative',
            overflow: 'hidden',
            margin: '4px 0 8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

          {/* Unrestricted Vector Canvas Floating Zoom Controls (+ / - / Reset) */}
          <div 
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 180, 216, 0.5)',
              padding: '4px 6px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
            }}
          >
            <button 
              type="button"
              onClick={() => setCanvasZoomLevel(prev => +(prev * 1.35).toFixed(2))}
              style={{ background: '#00B4D8', color: '#0F172A', border: 'none', width: '28px', height: '28px', borderRadius: '8px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Perbesar Peta Tanpa Batas (Zoom In)"
            >
              +
            </button>
            <span style={{ fontSize: '0.68rem', color: 'white', fontWeight: 800, padding: '0 4px', minWidth: '34px', textAlign: 'center' }}>
              {Math.round(canvasZoomLevel * 100)}%
            </span>
            <button 
              type="button"
              onClick={() => setCanvasZoomLevel(prev => +(prev / 1.35).toFixed(2))}
              style={{ background: '#00B4D8', color: '#0F172A', border: 'none', width: '28px', height: '28px', borderRadius: '8px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Perkecil Peta Tanpa Batas (Zoom Out)"
            >
              -
            </button>
            <button 
              type="button"
              onClick={() => setCanvasZoomLevel(1.0)}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Reset Zoom Ke Normal (100%)"
            >
              ↺
            </button>
          </div>

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
              fontSize: '0.68rem',
              fontWeight: 800
            }}
          >
            TRACK CANVAS
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

      {/* MODE 3: DASHBOARD METRICS HUD */}
      {viewMode === 'dashboard' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: '10px 0' }}>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              width: '100%',
              background: 'rgba(11, 19, 43, 0.85)',
              border: '1px solid rgba(0, 180, 216, 0.3)',
              padding: '16px',
              borderRadius: '24px',
              textAlign: 'center'
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.3)' }}>
              <span style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 800, display: 'block', marginBottom: '4px' }}>SPEED (KM/H)</span>
              <div style={{ fontSize: '2.0rem', fontWeight: 900, color: '#00F2FE' }}>
                {speed.toFixed(1)}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span style={{ fontSize: '0.72rem', color: '#F87171', fontWeight: 800, display: 'block', marginBottom: '4px' }}>MAX SPEED</span>
              <div style={{ fontSize: '2.0rem', fontWeight: 900, color: '#FF5E36' }}>
                {maxSpeed.toFixed(1)}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 800, display: 'block', marginBottom: '4px' }}>AVG SPEED</span>
              <div style={{ fontSize: '2.0rem', fontWeight: 900, color: '#10B981' }}>
                {calculateAvgSpeed()}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(0,180,216,0.3)' }}>
              <span style={{ fontSize: '0.72rem', color: '#90E0EF', fontWeight: 800, display: 'block', marginBottom: '4px' }}>PACE (MIN/KM)</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#F59E0B' }}>
                {calculatePace ? calculatePace() : '--:-- /km'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Native Camera File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        capture="environment" 
        onChange={handlePhotoFileChange} 
        style={{ display: 'none' }} 
      />

      {/* Ultra-Sporty Ergonomic Control Action Buttons (STOP, PAUSE, PHOTO) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', position: 'relative', zIndex: 100, marginTop: 'auto' }}>
        {/* STOP BUTTON */}
        <button 
          type="button"
          onClick={handleStopClick}
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '16px 0',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.95rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.5)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2"/>
          </svg>
          STOP
        </button>

        {/* PAUSE BUTTON */}
        <button 
          type="button"
          onClick={() => setIsPaused(!isPaused)}
          style={{
            background: isPaused ? 'linear-gradient(135deg, #10B981 0%, #047857 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '16px 0',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.95rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: isPaused ? '0 8px 25px rgba(16, 185, 129, 0.5)' : '0 8px 25px rgba(245, 158, 11, 0.5)'
          }}
        >
          {isPaused ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              RESUME
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
              PAUSE
            </>
          )}
        </button>

        {/* PHOTO BUTTON */}
        <button 
          type="button"
          onClick={handleTriggerCamera}
          style={{
            background: capturedPhoto ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            border: 'none',
            color: 'white',
            borderRadius: '20px',
            padding: '16px 0',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.95rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.45)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          {capturedPhoto ? 'FOTO ✓' : 'FOTO'}
        </button>
      </div>
    </div>
  );
}
