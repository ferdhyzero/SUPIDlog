import React, { useState, useEffect } from 'react';

export default function StatisticsScreen({ userId = 2 }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all_time');
  const [userRankInfo, setUserRankInfo] = useState({ rank: 1, totalKm: '0.0' });

  const badges = [
    { id: 1, name: 'First Paddle', unlocked: true },
    { id: 2, name: '50 KM Club', unlocked: true },
    { id: 3, name: 'Century SUPer', unlocked: true },
    { id: 4, name: 'Island Hopper', unlocked: true },
    { id: 5, name: 'Ocean Master', unlocked: true },
    { id: 6, name: 'Speed Demon', unlocked: true },
    { id: 7, name: 'Sunrise Paddler', unlocked: false },
    { id: 8, name: 'Marathon Paddler', unlocked: false },
  ];

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch('/api/get_leaderboard.php');
        const data = await res.json();
        if (data.success && data.leaderboard) {
          setLeaderboard(data.leaderboard);
          const myRank = data.leaderboard.find(u => u.id === userId);
          if (myRank) setUserRankInfo({ rank: myRank.rank, totalKm: myRank.total_distance_km });
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [userId]);

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span>Peringkat & Record</span>
      </h2>

      {/* Hero Stats Card */}
      <div style={{ background: 'linear-gradient(135deg, #03045E 0%, #0077B6 100%)', color: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(3, 4, 94, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 800, textTransform: 'uppercase' }}>PERINGKAT NASIONAL</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#90E0EF', marginTop: '2px' }}>Rank #{userRankInfo.rank} Indonesia</h3>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
          </div>
        </div>
      </div>

      {/* Personal Records */}
      <div className="card-clean" style={{ background: '#F8FAFC', border: '1.5px solid #0284c7', borderRadius: '14px', padding: '12px' }}>
        <strong style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '10px', display: 'block', color: 'var(--text-main)' }}>Personal Records (PRs)</strong>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          <div style={{ background: 'white', padding: '10px 4px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, display: 'block' }}>Distance</span>
            <strong style={{ fontSize: '1.05rem', color: '#0284c7', fontWeight: 900 }}>24.5 km</strong>
          </div>

          <div style={{ background: 'white', padding: '10px 4px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, display: 'block' }}>Pace</span>
            <strong style={{ fontSize: '1.05rem', color: '#F59E0B', fontWeight: 900 }}>08:45 /km</strong>
          </div>

          <div style={{ background: 'white', padding: '10px 4px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, display: 'block' }}>Max Speed</span>
            <strong style={{ fontSize: '1.05rem', color: '#00B4D8', fontWeight: 900 }}>9.6 km/h</strong>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card-clean" style={{ border: '1.5px solid #0284c7', borderRadius: '14px', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Leaderboard SUP</strong>
          
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '2px', borderRadius: '8px' }}>
            <button onClick={() => setTimeFilter('all_time')} style={{ padding: '3px 8px', borderRadius: '6px', border: 'none', background: timeFilter === 'all_time' ? '#0284c7' : 'transparent', color: timeFilter === 'all_time' ? 'white' : '#64748b', fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer' }}>Semua</button>
            <button onClick={() => setTimeFilter('this_month')} style={{ padding: '3px 8px', borderRadius: '6px', border: 'none', background: timeFilter === 'this_month' ? '#0284c7' : 'transparent', color: timeFilter === 'this_month' ? 'white' : '#64748b', fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer' }}>Bulan Ini</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {leaderboard.map((item) => {
            const isMe = item.id === userId;
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '10px', background: isMe ? 'rgba(2, 132, 199, 0.08)' : '#F8FAFC', border: isMe ? '1px solid #0284c7' : '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0284c7', width: '24px' }}>#{item.rank}</span>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 800 }}>{item.name}</strong>
                    <span style={{ fontSize: '0.68rem', color: '#0284c7', display: 'block' }}>{item.level}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#0284c7', fontWeight: 900 }}>{item.total_distance_km} km</strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>{item.total_sessions} sesi</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Collection */}
      <div className="card-clean" style={{ borderRadius: '14px', padding: '12px' }}>
        <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>Badges ({badges.filter(b => b.unlocked).length}/{badges.length})</strong>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {badges.map((b) => (
            <div key={b.id} style={{ opacity: b.unlocked ? 1 : 0.4, border: b.unlocked ? '1px solid #0284c7' : '1px solid #E2E8F0', padding: '8px 4px', borderRadius: '10px', textAlign: 'center', background: b.unlocked ? '#F0F9FF' : '#F8FAFC' }}>
              <strong style={{ fontSize: '0.72rem', color: 'var(--text-main)', fontWeight: 800, display: 'block' }}>{b.name}</strong>
              <span style={{ fontSize: '0.62rem', color: b.unlocked ? '#059669' : '#94A3B8', fontWeight: 800 }}>{b.unlocked ? 'Aktif' : 'Kunci'}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
