import React, { useState, useEffect } from 'react';

export default function PassportScreen({ userId = null, onRequireLogin, onTestStamp, refreshTrigger }) {
  const [passportData, setPassportData] = useState({
    visitedCount: 0,
    totalSpots: 8,
    completedPercent: 0,
    stamps: []
  });

  const [loading, setLoading] = useState(true);

  // Fetch real MySQL Passport Stamps whenever userId or refreshTrigger changes
  useEffect(() => {
    if (!userId) {
      setPassportData({
        visitedCount: 0,
        totalSpots: 8,
        completedPercent: 0,
        stamps: []
      });
      setLoading(false);
      return;
    }

    async function loadPassport() {
      try {
        const res = await fetch(`/api/get_passport.php?user_id=${userId}`);
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

  const { visitedCount, completedPercent, stamps } = passportData;
  const isGuest = !userId;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Passport Hero Banner */}
      <div 
        style={{
          background: '#0284c7',
          color: 'white',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, fontWeight: 700 }}>
              OFFICIAL PASSPORT
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>MY PASSPORT 🏆</h2>
          </div>
          <span style={{ fontSize: '2.5rem' }}>🛂</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '12px 16px', borderRadius: '16px' }}>
            <span style={{ fontSize: '0.72rem', opacity: 0.8, display: 'block' }}>Visited Spots</span>
            <strong style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>{visitedCount} Spots</strong>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '12px 16px', borderRadius: '16px' }}>
            <span style={{ fontSize: '0.72rem', opacity: 0.8, display: 'block' }}>Indonesia SUP</span>
            <strong style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: '#90E0EF' }}>{completedPercent}% Done</strong>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ width: `${completedPercent}%`, height: '100%', background: '#00B4D8', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Guest Mode Banner */}
      {isGuest ? (
        <div className="card-clean" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🔒</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ocean-dark)', marginBottom: '4px' }}>
            Paspor Dalam Keadaan Terkunci
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Silakan Login atau Daftar akun untuk membuka Paspor SUP Digital Anda dan mengumpulkan stempel lokasi dari seluruh Nusantara!
          </p>
          <button className="btn-cta-jumbo" onClick={onRequireLogin}>
            🔑 MASUK / DAFTAR AKUN SEKARANG
          </button>
        </div>
      ) : (
        <>
          {/* Stamp Animation Test Action */}
          <button 
            className="btn-cta-jumbo"
            onClick={() => onTestStamp('Samalona')}
            style={{ background: 'linear-gradient(135deg, #0077B6 0%, #03045E 100%)', fontSize: '0.95rem', padding: '14px' }}
          >
            <span>✨ TEST STAMP ANIMATION</span>
          </button>

          {/* Latest Stamps Section (Dynamic MySQL Data) */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
              Latest Stamps & Collection
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stamps && stamps.length > 0 ? (
                stamps.map((stamp, i) => (
                  <div 
                    key={i} 
                    className={`stamp-chip ${stamp.unlocked ? 'unlocked' : ''}`}
                  >
                    <div 
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: stamp.unlocked ? 'var(--ocean-blue)' : '#E2E8F0',
                        color: stamp.unlocked ? 'white' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem'
                      }}
                    >
                      {stamp.unlocked ? '✔' : '🔒'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.95rem', color: stamp.unlocked ? 'var(--ocean-dark)' : '#64748B', display: 'block' }}>
                        {stamp.name}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: stamp.unlocked ? 'var(--safe-green)' : '#94A3B8', fontWeight: 600 }}>
                        {stamp.unlocked ? `Unlocked • ${stamp.date}` : 'Belum Dikunjungi'}
                      </span>
                    </div>

                    {stamp.unlocked && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', background: 'rgba(0,180,216,0.15)', padding: '4px 10px', borderRadius: '9999px' }}>
                        STAMPED
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="card-clean" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Belum ada stempel terkumpul. Mulai sesi mendayung untuk mengumpulkan stempel!
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
