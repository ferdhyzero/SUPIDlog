import React, { useState, useEffect } from 'react';

export default function StatisticsScreen({ userId = 2 }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all_time');
  const [userRankInfo, setUserRankInfo] = useState({ rank: 1, totalKm: '0.0' });

  const [stats, setStats] = useState({
    totalKm: 1842,
    totalSessions: 324,
    maxSpeed: '8.4 km/h',
    longestDistance: '24.5 km',
    badgesUnlocked: 18,
    totalBadges: 46
  });

  const badges = [
    { id: 1, name: 'First Paddle', desc: 'Selesaikan sesi paddle pertama', unlocked: true },
    { id: 2, name: '50 KM Club', desc: 'Capai total jarak 50 KM', unlocked: true },
    { id: 3, name: 'Century SUPer', desc: 'Capai total jarak 100 KM Target Indonesia', unlocked: true },
    { id: 4, name: 'Island Hopper', desc: 'Kunjungi minimal 3 pulau SUP Indonesia', unlocked: true },
    { id: 5, name: 'Ocean Master', desc: 'Dayung di perairan laut gelombang tinggi', unlocked: true },
    { id: 6, name: 'Speed Demon', desc: 'Tembus kecepatan dayung > 7.0 KM/H', unlocked: true },
    { id: 7, name: 'Sunrise Paddler', desc: 'Mulai sesi paddle sebelum jam 6 pagi', unlocked: false },
    { id: 8, name: 'Marathon Paddler', desc: 'Selesaikan 20 KM dalam satu kali sesi', unlocked: false },
  ];

  // Fetch National Leaderboard from MySQL
  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch('/api/get_leaderboard.php');
        const data = await res.json();
        if (data.success && data.leaderboard) {
          setLeaderboard(data.leaderboard);

          // Find current user rank
          const myRank = data.leaderboard.find(u => u.id === userId);
          if (myRank) {
            setUserRankInfo({ rank: myRank.rank, totalKm: myRank.total_distance_km });
          }
        }
      } catch (e) {
        console.log('Leaderboard fallback:', e);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [userId]);

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>Peringkat & Achievements</span>
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Leaderboard Nasional SUP Indonesia & Rekor Personal</p>
      </div>

      {/* Hero Stats Card */}
      <div style={{ background: 'linear-gradient(135deg, #03045E 0%, #0077B6 100%)', color: 'white', padding: '18px 16px', borderRadius: '18px', boxShadow: '0 6px 20px rgba(3, 4, 94, 0.25)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>PERINGKAT NASIONAL ANDA</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#90E0EF', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Rank #{userRankInfo.rank} Indonesia</span>
            </h3>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Strava-Style Personal Records (PRs) Cards */}
      <div className="card-clean" style={{ background: '#F8FAFC', border: '1.5px solid #0284c7', borderRadius: '14px', padding: '14px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Personal Records (PRs) SUP Indonesia
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ background: 'white', padding: '12px 6px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block' }}>Distance PR</span>
            <strong style={{ fontSize: '1.15rem', color: '#0284c7', fontWeight: 900 }}>24.5 km</strong>
            <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 800, display: 'block', marginTop: '2px' }}>Terjauh</span>
          </div>

          <div style={{ background: 'white', padding: '12px 6px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block' }}>Best Pace</span>
            <strong style={{ fontSize: '1.15rem', color: '#F59E0B', fontWeight: 900 }}>08:45 /km</strong>
            <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 800, display: 'block', marginTop: '2px' }}>Tercepat</span>
          </div>

          <div style={{ background: 'white', padding: '12px 6px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, display: 'block' }}>Max Speed</span>
            <strong style={{ fontSize: '1.15rem', color: '#00B4D8', fontWeight: 900 }}>9.6 km/h</strong>
            <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 800, display: 'block', marginTop: '2px' }}>Max Peak</span>
          </div>
        </div>
      </div>

      {/* NATIONAL SUP LEADERBOARD TABLE */}
      <div className="card-clean" style={{ border: '1.5px solid #0284c7', borderRadius: '14px', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>Leaderboard SUP Indonesia</h3>
          </div>
          
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
            <button
              onClick={() => setTimeFilter('all_time')}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: 'none',
                background: timeFilter === 'all_time' ? '#0284c7' : 'transparent',
                color: timeFilter === 'all_time' ? 'white' : '#64748b',
                fontWeight: 800,
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              All-Time
            </button>
            <button
              onClick={() => setTimeFilter('this_month')}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: 'none',
                background: timeFilter === 'this_month' ? '#0284c7' : 'transparent',
                color: timeFilter === 'this_month' ? 'white' : '#64748b',
                fontWeight: 800,
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              Bulan Ini
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaderboard.map((item) => {
            const isMe = item.id === userId;

            return (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: isMe ? 'rgba(2, 132, 199, 0.08)' : '#F8FAFC',
                  border: isMe ? '1.5px solid #0284c7' : '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: item.rank === 1 ? '#FEF3C7' : (item.rank === 2 ? '#E2E8F0' : (item.rank === 3 ? '#FFEDD5' : '#E0F2FE')), color: item.rank === 1 ? '#B45309' : (item.rank === 2 ? '#475569' : (item.rank === 3 ? '#C2410C' : '#0284C7')), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.82rem' }}>
                    #{item.rank}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 800 }}>{item.name}</strong>
                      {isMe && <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#0284c7', color: 'white', padding: '1px 6px', borderRadius: '9999px' }}>YOU</span>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>
                      Level: {item.level}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: '#0284c7', fontWeight: 900, display: 'block' }}>
                    {item.total_distance_km} km
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.total_sessions} Sesi • {item.max_speed}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Chart Bar Visualization */}
      <div className="card-clean" style={{ borderRadius: '14px', padding: '14px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>Grafik Akumulasi Jarak Bulanan (2026)</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '120px', padding: '10px 0 0', borderBottom: '2px solid #E2E8F0' }}>
          {[
            { m: 'Jan', h: 60, km: 120 },
            { m: 'Feb', h: 45, km: 90 },
            { m: 'Mar', h: 80, km: 160 },
            { m: 'Apr', h: 55, km: 110 },
            { m: 'May', h: 90, km: 180 },
            { m: 'Jun', h: 100, km: 210 },
            { m: 'Jul', h: 75, km: 145 },
          ].map((bar, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 800 }}>{bar.km}k</span>
              <div style={{ width: '16px', height: `${bar.h}%`, background: i === 6 ? '#0284c7' : '#CBD5E1', borderRadius: '6px 6px 0 0' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{bar.m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements & Badges Collection */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>Badges & Achievements</h3>
          <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 800 }}>
            {stats.badgesUnlocked} / {stats.totalBadges} Unlocked
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {badges.map((b) => (
            <div key={b.id} className="card-clean" style={{ opacity: b.unlocked ? 1 : 0.55, border: b.unlocked ? '1.5px solid #0284c7' : '1px solid #E2E8F0', padding: '12px', borderRadius: '14px' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 800, display: 'block', marginBottom: '2px' }}>{b.name}</strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{b.desc}</p>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: b.unlocked ? '#059669' : '#94A3B8', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {b.unlocked ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Terbuka</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>Terkunci</span>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
