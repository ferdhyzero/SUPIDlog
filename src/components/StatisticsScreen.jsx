import React, { useState, useEffect } from 'react';

export default function StatisticsScreen({ userId = 2 }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
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
    { id: 1, name: 'First Paddle 🏄‍♂️', desc: 'Selesaikan sesi paddle pertama', unlocked: true },
    { id: 2, name: '50 KM Club 🏅', desc: 'Capai total jarak 50 KM', unlocked: true },
    { id: 3, name: 'Century SUPer 👑', desc: 'Capai total jarak 100 KM Target Indonesia', unlocked: true },
    { id: 4, name: 'Island Hopper 🏝️', desc: 'Kunjungi minimal 3 pulau SUP Indonesia', unlocked: true },
    { id: 5, name: 'Ocean Master 🌊', desc: 'Dayung di perairan laut gelombang tinggi', unlocked: true },
    { id: 6, name: 'Speed Demon ⚡', desc: 'Tembus kecepatan dayung > 7.0 KM/H', unlocked: true },
    { id: 7, name: 'Sunrise Paddler 🌅', desc: 'Mulai sesi paddle sebelum jam 6 pagi', unlocked: false },
    { id: 8, name: 'Marathon Paddler 🏃', desc: 'Selesaikan 20 KM dalam satu kali sesi', unlocked: false },
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
    <div style={{ width: '100%', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ocean-dark)' }}>Peringkat & Achievements 🏆</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Leaderboard Nasional SUP Indonesia & Rekor</p>
      </div>

      {/* Hero Stats Card */}
      <div style={{ background: 'linear-gradient(135deg, #03045E 0%, #0077B6 100%)', color: 'white', padding: '20px', borderRadius: '20px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>PERINGKAT NASIONAL ANDA</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#90E0EF', marginTop: '2px' }}>
              Rank #{userRankInfo.rank} Indonesia 🇮🇩
            </h3>
          </div>
          <span style={{ fontSize: '2.5rem' }}>🥇</span>
        </div>
      </div>

      {/* NATIONAL SUP LEADERBOARD TABLE */}
      <div className="card-clean" style={{ border: '2px solid var(--ocean-blue)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>🏆</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Leaderboard SUP Indonesia</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--ocean-blue)', fontWeight: 700 }}>Otomatis dari Aktifitas</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {leaderboard.map((item) => {
            const isMe = item.id === userId;

            return (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  background: isMe ? 'rgba(0,180,216,0.12)' : '#F8FAFC',
                  border: isMe ? '1.5px solid var(--ocean-blue)' : '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: item.rank === 1 ? '#FEF3C7' : (item.rank === 2 ? '#E2E8F0' : (item.rank === 3 ? '#FFEDD5' : '#E0F2FE')), color: item.rank === 1 ? '#B45309' : (item.rank === 2 ? '#475569' : (item.rank === 3 ? '#C2410C' : '#0284C7')), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.88rem' }}>
                    {item.rank === 1 ? '🥇' : (item.rank === 2 ? '🥈' : (item.rank === 3 ? '🥉' : `#${item.rank}`))}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{item.name}</strong>
                      {isMe && <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'var(--ocean-blue)', color: 'white', padding: '1px 6px', borderRadius: '9999px' }}>YOU</span>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ocean-blue)', fontWeight: 600 }}>
                      Level: {item.level}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: 'var(--ocean-blue)', display: 'block' }}>
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
      <div className="card-clean">
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>Grafik Akumulasi Jarak Bulanan (2026)</h3>
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
              <span style={{ fontSize: '0.68rem', color: 'var(--ocean-blue)', fontWeight: 800 }}>{bar.km}k</span>
              <div style={{ width: '16px', height: `${bar.h}%`, background: i === 6 ? 'var(--ocean-blue)' : '#CBD5E1', borderRadius: '6px 6px 0 0' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{bar.m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements & Badges Collection */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Badges & Achievements</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--ocean-blue)', fontWeight: 700 }}>
            {stats.badgesUnlocked} / {stats.totalBadges} Unlocked
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {badges.map((b) => (
            <div key={b.id} className="card-clean" style={{ opacity: b.unlocked ? 1 : 0.5, border: b.unlocked ? '1.5px solid var(--aqua)' : '1px solid #E2E8F0', padding: '12px' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--ocean-dark)', display: 'block', marginBottom: '2px' }}>{b.name}</strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{b.desc}</p>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: b.unlocked ? '#059669' : '#94A3B8', marginTop: '6px', display: 'inline-block' }}>
                {b.unlocked ? '✔ Terbuka' : '🔒 Terkunci'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
