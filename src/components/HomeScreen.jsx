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
      // Guest Mode: Reset metrics to 0
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
          if (parseFloat(data.today.distance) === 0) {
            data.today.calories = 0;
            data.today.time = '00:00';
          }
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
  const displayCalories = isGuest ? 0 : ((today && parseFloat(displayDistance) > 0) ? today.calories : 0);
  const displayTime = isGuest ? '00:00' : ((today && parseFloat(displayDistance) > 0) ? today.time : '00:00');

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Hero Greeting & Weather Card */}
      <div className="hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '0.85rem', opacity: 0.85, fontWeight: 500 }}>
              {isGuest ? 'Mode Tamu (Guest)' : 'Good Morning,'}
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{userName} 👋</h2>
          </div>
          <span style={{ fontSize: '1.75rem', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '14px' }}>
            🏄‍♂️
          </span>
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

      {/* TODAY Metrics Box (0.0 KM -> 0 kcal -> 00:00 for Guests) */}
      <div className="card-clean" style={{ borderLeft: '4px solid var(--ocean-blue)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            HARI INI (TODAY)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--ocean-blue)', fontWeight: 600 }}>
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Distance</span>
            <strong style={{ fontSize: '1.35rem', fontFamily: 'var(--font-heading)', color: 'var(--ocean-blue)' }}>
              {displayDistance} <span style={{ fontSize: '0.75rem' }}>km</span>
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Calories</span>
            <strong style={{ fontSize: '1.35rem', fontFamily: 'var(--font-heading)', color: 'var(--emergency-orange)' }}>
              {displayCalories} <span style={{ fontSize: '0.75rem' }}>kcal</span>
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Time</span>
            <strong style={{ fontSize: '1.35rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
              {displayTime}
            </strong>
          </div>
        </div>
      </div>

      {/* Jumbo Start Paddling Action Button */}
      <button className="btn-cta-jumbo" onClick={onStartPaddle}>
        <span style={{ fontSize: '1.5rem' }}>🏄‍♂️</span>
        <span>START PADDLING</span>
      </button>

      {/* Your Next Goal Progress Box */}
      <div className="card-clean">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🎯</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Your Next Goal</h3>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ocean-blue)', fontFamily: 'var(--font-heading)' }}>
            {isGuest ? 0 : (goal ? goal.current : 0)} / 100 km
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          □ Paddle 100 km Target Indonesia SUP
        </p>

        <div style={{ height: '10px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${isGuest ? 0 : (goal ? goal.percent : 0)}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--ocean-blue) 0%, var(--aqua) 100%)', 
              borderRadius: '9999px',
              transition: 'width 0.5s ease'
            }} 
          />
        </div>
      </div>

      {/* Recent Activity List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Recent Activity</h3>
          {!isGuest && (
            <span 
              onClick={onOpenAllActivities}
              style={{ fontSize: '0.8rem', color: 'var(--ocean-blue)', fontWeight: 700, cursor: 'pointer' }}
            >
              Lihat Semua ➔
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!isGuest && recentActivities && recentActivities.length > 0 ? (
            recentActivities.map((act, i) => (
              <div key={act.id || i} className="card-clean" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--aqua-light)', color: 'var(--ocean-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                    📍
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{act.spot}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{act.type || 'Paddle Session'} • {act.date || 'Terbaru'}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'var(--ocean-blue)', display: 'block' }}>
                    {act.distance}
                  </strong>
                </div>
              </div>
            ))
          ) : (
            <div className="card-clean" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px' }}>
              {isGuest ? '🔒 Anda sedang menggunakan Mode Guest. Silakan Login untuk menyimpan & melihat riwayat aktivitas paddle Anda!' : 'Belum ada aktivitas terdaftar hari ini. Tekan START PADDLING untuk memulai!'}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
