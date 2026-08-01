import React, { useState, useEffect } from 'react';

export default function PassportScreen({ userId = null, onRequireLogin, onTestStamp, refreshTrigger }) {
  const [passportData, setPassportData] = useState({
    visitedCount: 0,
    targetCount: 0,
    totalSpots: 8,
    completedPercent: 0,
    stamps: []
  });

  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'UNLOCKED' | 'TARGET'
  const [loading, setLoading] = useState(true);

  // Fetch real MySQL Passport Stamps whenever userId or refreshTrigger changes
  useEffect(() => {
    const effectiveUserId = userId || 1;

    async function loadPassport() {
      try {
        const res = await fetch(`/api/get_passport.php?user_id=${effectiveUserId}`);
        const data = await res.json();
        if (data.success) {
          setPassportData(data);
        }
      } catch (err) {
        console.log('Passport offline fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPassport();
  }, [userId, refreshTrigger]);

  const { visitedCount, targetCount = 0, completedPercent, stamps } = passportData;
  const isGuest = !userId;

  // Filter stamps according to active filter tab
  const filteredStamps = (stamps || []).filter(stamp => {
    if (filterMode === 'UNLOCKED') return stamp.unlocked;
    if (filterMode === 'TARGET') return stamp.isPlanned;
    return true;
  });

  return (
    <div style={{ width: '100%', padding: '12px 14px 20px 14px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
      
      {/* Passport Hero Banner with User 2nd Stand-Up Paddleboard Action Photo */}
      <div 
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #070D1B 0%, #0369a1 100%)',
          color: 'white',
          borderRadius: '20px',
          padding: '20px 16px',
          boxShadow: '0 8px 25px rgba(2, 132, 199, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Background Stand-Up Paddleboard Action Image (2nd User Photo Asset) */}
        <img 
          src="/passport-hero-bg.webp" 
          alt="Stand Up Paddleboard Action Passport"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 75%',
            opacity: 0.95,
            filter: 'brightness(1.05) contrast(1.05)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Soft Translucent Ocean Gradient Overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, rgba(7, 13, 27, 0.10) 0%, rgba(3, 105, 161, 0.25) 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.95, fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                OFFICIAL DIGITAL PASSPORT
              </span>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0 0', fontFamily: 'var(--font-heading)', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                MY PASSPORT
              </h2>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.22)', padding: '10px', borderRadius: '14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M7 16c0-2 2-3 5-3s5 1 5 3"/>
              </svg>
            </div>
          </div>

          {/* 3-Stat Metrics Grid with Ultra-Translucent Glassmorphism */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(6px)', padding: '10px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.4)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', opacity: 0.95, fontWeight: 800, display: 'block', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Dikunjungi</span>
              <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{visitedCount} Spot</strong>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(6px)', padding: '10px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.4)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', opacity: 0.95, fontWeight: 800, display: 'block', color: '#FCD34D', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Target Pinned</span>
              <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#FBBF24', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{targetCount} Trip</strong>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(6px)', padding: '10px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.4)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', opacity: 0.95, fontWeight: 800, display: 'block', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Capaian SUP</span>
              <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#90E0EF', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{completedPercent}%</strong>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ width: `${completedPercent}%`, height: '100%', background: 'linear-gradient(90deg, #00F2FE 0%, #4FACFE 100%)', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
          </div>

          {!isGuest && (
            <button
              onClick={() => {
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 400;
                const ctx = canvas.getContext('2d');

                // Draw certificate background
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(0, 0, 600, 400);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText('STAND UP PADDLELOG INDONESIA', 40, 50);

                ctx.font = '16px sans-serif';
                ctx.fillText('OFFICIAL DIGITAL PASSPORT CERTIFICATE', 40, 80);

                ctx.font = 'bold 32px sans-serif';
                ctx.fillText(`VISITED SPOTS: ${visitedCount} SPOTS`, 40, 160);

                ctx.font = '20px sans-serif';
                ctx.fillText(`COMPLETED PROGRESS: ${completedPercent}%`, 40, 210);

                ctx.font = '14px sans-serif';
                ctx.fillText('Verified by Stand Up PaddleLog Indonesia System', 40, 320);
                ctx.fillText(new Date().toLocaleDateString('id-ID'), 40, 345);

                const link = document.createElement('a');
                link.download = `Passport_SUP_Indonesia_${visitedCount}_Spots.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
              }}
              style={{ width: '100%', background: 'rgba(255,255,255,0.22)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', padding: '10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textShadow: '0 1px 3px rgba(0,0,0,0.6)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Unduh Sertifikat Paspor (PNG)</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Mode Banner */}
      {isGuest ? (
        <div className="card-clean" style={{ textAlign: 'center', padding: '24px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(2, 132, 199, 0.1)', padding: '12px', borderRadius: '50%', marginBottom: '8px', color: '#0284c7' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ocean-dark)', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
            Paspor Dalam Keadaan Terkunci
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Silakan Login atau Daftar akun untuk membuka Paspor SUP Digital Anda dan mengumpulkan stempel lokasi dari seluruh Nusantara!
          </p>
          <button className="btn-cta-jumbo" onClick={onRequireLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <span>MASUK / DAFTAR AKUN SEKARANG</span>
          </button>
        </div>
      ) : (
        <>
          {/* Filter Tab Switcher Pills */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '14px', gap: '4px', width: '100%', boxSizing: 'border-box' }}>
            <button
              onClick={() => setFilterMode('ALL')}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.72rem',
                background: filterMode === 'ALL' ? '#0284c7' : 'transparent',
                color: filterMode === 'ALL' ? 'white' : '#64748B',
                cursor: 'pointer'
              }}
            >
              Semua ({stamps.length})
            </button>
            <button
              onClick={() => setFilterMode('UNLOCKED')}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.72rem',
                background: filterMode === 'UNLOCKED' ? '#0284c7' : 'transparent',
                color: filterMode === 'UNLOCKED' ? 'white' : '#64748B',
                cursor: 'pointer'
              }}
            >
              Dikunjungi ({visitedCount})
            </button>
            <button
              onClick={() => setFilterMode('TARGET')}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.72rem',
                background: filterMode === 'TARGET' ? '#F59E0B' : 'transparent',
                color: filterMode === 'TARGET' ? 'white' : '#64748B',
                cursor: 'pointer'
              }}
            >
              Target ({targetCount})
            </button>
          </div>

          {/* Latest Stamps Section (Dynamic MySQL Data) */}
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredStamps && filteredStamps.length > 0 ? (
                filteredStamps.map((stamp, i) => (
                  <div 
                    key={i} 
                    className={`stamp-chip ${stamp.unlocked ? 'unlocked' : ''}`}
                    style={{
                      borderRadius: '16px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      boxSizing: 'border-box',
                      border: stamp.isPlanned && !stamp.unlocked ? '1.5px solid #F59E0B' : undefined,
                      background: stamp.isPlanned && !stamp.unlocked ? 'rgba(245, 158, 11, 0.06)' : undefined
                    }}
                  >
                    <div 
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: stamp.unlocked ? '#0284c7' : (stamp.isPlanned ? '#F59E0B' : '#E2E8F0'),
                        color: (stamp.unlocked || stamp.isPlanned) ? 'white' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}
                    >
                      {stamp.unlocked ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : stamp.isPlanned ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '0.95rem', color: stamp.unlocked ? 'var(--ocean-dark)' : (stamp.isPlanned ? '#B45309' : '#64748B'), display: 'block', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stamp.name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: stamp.unlocked ? '#10B981' : (stamp.isPlanned ? '#D97706' : '#94A3B8'), fontWeight: 700 }}>
                        {stamp.unlocked ? `Unlocked • ${stamp.date}` : (stamp.isPlanned ? `Target Trip • ${stamp.plannedDate}` : 'Belum Dikunjungi')}
                      </span>
                    </div>

                    {stamp.unlocked ? (
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0284c7', background: 'rgba(2,132,199,0.12)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(2,132,199,0.25)', flexShrink: 0 }}>
                        STAMPED
                      </span>
                    ) : stamp.isPlanned ? (
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#D97706', background: 'rgba(245,158,11,0.15)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(245,158,11,0.3)', flexShrink: 0 }}>
                        TARGET
                      </span>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="card-clean" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px', borderRadius: '16px', width: '100%', boxSizing: 'border-box' }}>
                  {filterMode === 'TARGET' ? 'Belum ada spot target disematkan dari layar Explore.' : 'Belum ada stempel terkumpul.'}
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
