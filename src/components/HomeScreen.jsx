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
    status: 'REAL GPS WEATHER',
  });

  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const modalItemsPerPage = 5;

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
      alert('UNTUK INSTALL APLIKASI PWA SUPID LOG DI HP:\n\n1. Buka menu Browser (titik 3 di kanan atas Chrome / tombol Share di Safari).\n2. Pilih "Tambahkan ke Layar Utama" / "Add to Home Screen" / "Install App".\n\nAplikasi SUPID Log akan terpasang di HP Anda!');
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

          let waterCond = 'Flat Water';
          if (windKnots > 14) {
            waterCond = 'Rough Wave';
          } else if (windKnots > 7) {
            waterCond = 'Choppy Water';
          }

          setWeather({
            temp: `${tempC}°C`,
            wind: `Angin ${windKnots} Knot`,
            water: waterCond,
            status: 'LIVE GPS WEATHER',
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
    <div style={{ width: '100%', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Hero Greeting & Weather Card with Real Stand-Up Paddleboard (SUP) Action Photo API */}
      <div 
        className="hero-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #070D1B 0%, #0369a1 100%)',
          padding: '16px 14px'
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
            opacity: 0.38,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Ocean Gradient Overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, rgba(2, 132, 199, 0.45) 0%, rgba(3, 105, 161, 0.85) 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '0.65rem', opacity: 0.9, fontWeight: 500 }}>
                {isGuest ? 'Mode Tamu' : 'Good Morning,'}
              </p>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userName}</h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={handleInstallClick}
                style={{ 
                  background: '#ffffff',
                  color: '#0284c7',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="SUP.ID Logo" 
                  style={{ height: '20px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} 
                />
                <span>{pwaInstalled ? 'Active' : 'Install PWA'}</span>
              </button>
            </div>
          </div>

          {/* Guest Warning Banner if not logged in */}
          {isGuest && (
            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', padding: '8px 12px', borderRadius: '10px', marginBottom: '12px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Silakan login untuk menyimpan hasil sesi paddle.
              </span>
              <button 
                onClick={onRequireLogin} 
                style={{ 
                  background: 'white', 
                  color: '#0284c7', 
                  border: 'none', 
                  padding: '4px 10px', 
                  borderRadius: '8px', 
                  fontWeight: 800, 
                  cursor: 'pointer', 
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Login
              </button>
            </div>
          )}

          {/* Live GPS Weather Forecast Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: 600 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
              </svg>
              {weather.temp}
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
              </svg>
              {weather.wind}
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              </svg>
              {weather.water}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Activity Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Today's Paddling</h3>
          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="stat-value">{displayDistance}</div>
            <div className="stat-label">Distance (km)</div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-value">{displayTime}</div>
            <div className="stat-label">Duration (m:s)</div>
          </div>
        </div>
      </div>

      {/* Goal Progress Banner */}
      <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            Monthly Target (100 km)
          </span>
          <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '0.8rem' }}>{goal.percent}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${goal.percent}%`, height: '100%', background: '#0284c7', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Recent Activity Log */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Paddles</h3>
          <button 
            onClick={() => setShowAllActivitiesModal(true)} 
            style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
          >
            See All ➔
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)' }}>
            <img src="/start-paddle-bold-blue.png" alt="SUP Paddle" style={{ width: '42px', height: '42px', margin: '0 auto 8px', display: 'block', objectFit: 'contain' }} />
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Belum ada aktivitas tercatat</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Tekan tombol paddle di bawah untuk memulai sesi paddle pertama Anda!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentActivities.slice(0, 5).map((act) => (
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

      {/* POPUP MODAL SEMUA AKTIVITAS (SEE ALL POPUP OVERLAY) */}
      {showAllActivitiesModal && (
        <div 
          className="modal-backdrop"
          onClick={() => setShowAllActivitiesModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              width: '100%', 
              maxWidth: '420px', 
              maxHeight: '80vh', 
              background: 'white', 
              borderRadius: '20px', 
              padding: '20px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  Semua Sesi Dayung Saya
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total {recentActivities.length} Aktivitas Tercatat</span>
              </div>
              <button 
                onClick={() => setShowAllActivitiesModal(false)}
                style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities
                  .slice((modalPage - 1) * modalItemsPerPage, modalPage * modalItemsPerPage)
                  .map((act, index) => (
                    <div key={act.id || index} className="card-clean" style={{ padding: '12px 14px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #00B4D8 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong style={{ fontSize: '0.92rem', color: '#0F172A', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {act.spot}
                          </strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              {act.date}
                            </span>
                            <span>• {act.type || 'Flat Water'}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <strong style={{ fontSize: '0.95rem', color: '#0284c7', display: 'block', fontWeight: 800 }}>{act.distance}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginTop: '2px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {act.duration_formatted}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                  Belum ada riwayat aktivitas.
                </div>
              )}
            </div>

            {/* Pagination Controls Bar for All Paddle Sessions Modal */}
            {recentActivities && recentActivities.length > modalItemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Hal <strong>{modalPage}</strong> dari <strong>{Math.ceil(recentActivities.length / modalItemsPerPage)}</strong>
                </span>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    disabled={modalPage === 1}
                    onClick={() => setModalPage(p => Math.max(p - 1, 1))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: modalPage === 1 ? '#E2E8F0' : 'white',
                      color: modalPage === 1 ? '#94A3B8' : '#0284c7',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: modalPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Prev
                  </button>

                  {Array.from({ length: Math.ceil(recentActivities.length / modalItemsPerPage) }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setModalPage(pg)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: 'none',
                        background: modalPage === pg ? '#0284c7' : '#E2E8F0',
                        color: modalPage === pg ? 'white' : '#475569',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    disabled={modalPage === Math.ceil(recentActivities.length / modalItemsPerPage)}
                    onClick={() => setModalPage(p => Math.min(p + 1, Math.ceil(recentActivities.length / modalItemsPerPage)))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: modalPage === Math.ceil(recentActivities.length / modalItemsPerPage) ? '#E2E8F0' : 'white',
                      color: modalPage === Math.ceil(recentActivities.length / modalItemsPerPage) ? '#94A3B8' : '#0284c7',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: modalPage === Math.ceil(recentActivities.length / modalItemsPerPage) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowAllActivitiesModal(false)}
              style={{ width: '100%', marginTop: '14px', padding: '12px', borderRadius: '12px', background: '#0284c7', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.88rem' }}
            >
              TUTUP POP-UP
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
