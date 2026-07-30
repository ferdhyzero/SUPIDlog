import React, { useState, useEffect } from 'react';

export default function HomeScreen({ userId = null, userName = 'Guest SUPer', onStartPaddle, onOpenAllActivities, onRequireLogin, refreshTrigger }) {
  const [dashboardData, setDashboardData] = useState({
    today: { distance: '0.0', calories: 0, time: '00:00' },
    goal: { target: 100, current: 0, percent: 0 },
    recentActivities: []
  });

  // Weather state (Defaults to Makassar SUP spot latitude & longitude)
  const [weather, setWeather] = useState({
    temp: '28°C',
    wind: 'Angin 6 Knot',
    water: 'Flat Water',
    status: 'REAL GPS WEATHER 🌤️',
  });

  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  // Catch PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setPwaInstalled(true);
      }
    } else {
      alert('📲 UNTUK INSTALL APLIKASI PWA SUPID LOG DI HP:\n\n1. Buka menu Browser (titik 3 di kanan atas Chrome / tombol Share di Safari).\n2. Pilih "Tambahkan ke Layar Utama" / "Add to Home Screen" / "Install App".\n\nAplikasi SUPID Log akan terpasang di HP Anda!');
    }
  };

  // 1. Fetch real GPS Location & Live Open-Meteo Weather API
  useEffect(() => {
    async function fetchLiveGpsWeather(lat, lon) {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code`
        );
        const data = await response.json();

        if (data && data.current) {
          const tempC = Math.round(data.current.temperature_2m);
          const windKmH = data.current.wind_speed_10m;
          const windKnots = Math.round(windKmH * 0.54);

          let waterCond = 'Flat Water 🌊';
          if (windKnots > 14) {
            waterCond = 'Rough Wave 🌊';
          } else if (windKnots > 7) {
            waterCond = 'Choppy Water 🌊';
          }

          const code = data.current.weather_code;
          let weatherEmoji = '☀';
          if (code >= 1 && code <= 3) weatherEmoji = '⛅';
          if (code >= 45) weatherEmoji = '🌫️';
          if (code >= 51) weatherEmoji = '🌧️';

          setWeather({
            temp: `${weatherEmoji} ${tempC}°C`,
            wind: `☀ Angin ${windKnots} Knot`,
            water: waterCond,
            status: 'LIVE GPS WEATHER 🛰️',
          });
        }
      } catch (e) {
        console.log('Open-Meteo weather fetch fallback:', e);
      }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchLiveGpsWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fetchLiveGpsWeather(-5.147, 119.432);
        },
        { timeout: 8000 }
      );
    } else {
      fetchLiveGpsWeather(-5.147, 119.432);
    }
  }, []);

  // 2. Fetch user dashboard data from MySQL PHP API ONLY if user is logged in
  useEffect(() => {
    if (!userId) {
      setDashboardData({
        today: { distance: '0.0', calories: 0, time: '00:00' },
        goal: { target: 100, current: 0, percent: 0 },
        recentActivities: []
      });
      setLoading(false);
      return;
    }

    async function loadDashboard() {
      try {
        const res = await fetch(`/api/get_user_dashboard.php?user_id=${userId}`);
        const data = await res.json();
        if (data.success && data.today) {
          setDashboardData(data);
        }
      } catch (err) {
        console.log('Dashboard fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [userId, refreshTrigger]);

  const { today, goal, recentActivities } = dashboardData;
  const isGuest = !userId;

  const displayDistance = isGuest ? '0.0' : (today ? today.distance : '0.0');
  const displayCalories = isGuest ? 0 : (today ? today.calories : 0);
  const displayTime = isGuest ? '00:00' : (today ? today.time : '00:00');

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Hero Greeting & Weather Card */}
      <div className="hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '0.85rem', opacity: 0.85, fontWeight: 500 }}>
              {isGuest ? 'Mode Tamu (Guest)' : 'Good Morning,'}
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{userName} 👋</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/logo.png" 
              alt="SUP.ID Logo" 
              style={{ height: '38px', width: 'auto', borderRadius: '8px', objectFit: 'contain' }} 
            />
            <button 
              onClick={handleInstallClick}
              style={{ 
                background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                color: '#000',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '20px',
                fontWeight: 800,
                fontSize: '0.75rem',
                boxShadow: '0 4px 12px rgba(0, 242, 254, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>📲</span> {pwaInstalled ? 'PWA Active' : 'Install App'}
            </button>
          </div>
        </div>

        {/* Guest Warning Banner if not logged in */}
        {isGuest && (
          <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', padding: '8px 12px', borderRadius: '12px', marginBottom: '12px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🔒 Silakan login untuk menyimpan hasil sesi paddle Anda ke database.</span>
            <button onClick={onRequireLogin} style={{ background: 'white', color: 'var(--ocean-dark)', border: 'none', padding: '4px 10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.72rem' }}>
              🔑 Login
            </button>
          </div>
        )}

        {/* Live GPS Weather Forecast Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.8rem', fontWeight: 600 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.22)', backdropFilter: 'blur(6px)', padding: '6px 12px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)' }}>
            {weather.temp}
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.22)', backdropFilter: 'blur(6px)', padding: '6px 12px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)' }}>
            {weather.wind}
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.22)', backdropFilter: 'blur(6px)', padding: '6px 12px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)' }}>
            {weather.water}
          </div>
        </div>
      </div>

      {/* Today's Activity Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Today's Paddling</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--ocean-primary)', fontWeight: 600 }}>{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span style={{ fontSize: '1.5rem' }}>📏</span>
            <div className="stat-value">{displayDistance}</div>
            <div className="stat-label">Distance (km)</div>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: '1.5rem' }}>🔥</span>
            <div className="stat-value">{displayCalories}</div>
            <div className="stat-label">Calories (kcal)</div>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: '1.5rem' }}>⏱️</span>
            <div className="stat-value">{displayTime}</div>
            <div className="stat-label">Duration (m:s)</div>
          </div>
        </div>
      </div>

      {/* Goal Progress Banner */}
      <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>🎯 Monthly Target (100 km)</span>
          <span style={{ fontWeight: 700, color: 'var(--ocean-primary)', fontSize: '0.85rem' }}>{goal.percent}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${goal.percent}%`, height: '100%', background: 'linear-gradient(90deg, #00f2fe, #4facfe)', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Recent Activity Log */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Paddles</h3>
          <button 
            onClick={onOpenAllActivities} 
            style={{ background: 'none', border: 'none', color: 'var(--ocean-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            See All
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🏄‍♂️</p>
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Belum ada aktivitas tercatat</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Tekan tombol 🏄 di bawah untuk memulai sesi paddle pertama Anda!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentActivities.map((act) => (
              <div key={act.id} className="glass-panel" style={{ padding: '12px 16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{act.spot}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{act.date} • {act.type || 'Flat Water'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: 'var(--ocean-primary)', fontSize: '1rem' }}>{act.distance}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.duration_formatted}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
