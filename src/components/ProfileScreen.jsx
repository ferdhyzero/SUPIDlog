import React, { useState, useEffect } from 'react';

export default function ProfileScreen({ currentUser, onOpenLogin, onLogout, onNavigate }) {
  const isGuest = !currentUser;
  
  const [profileStats, setProfileStats] = useState({
    name: currentUser ? currentUser.name : 'Guest SUPer',
    level: currentUser ? (currentUser.level || 'Explorer') : 'Pengunjung Mode Tamu',
    alltime_dist: '0.0',
    monthly_dist: '0.0',
    favorite_spot: '-',
    community_rank: 1
  });

  const isSuperAdmin = !isGuest && (currentUser.role === 'super_admin' || currentUser.email === 'ahmadferdy66@gmail.com' || currentUser.name === 'ferdhy');

  // Fetch dynamic stats from MySQL
  useEffect(() => {
    if (isGuest) return;

    async function loadStats() {
      try {
        const res = await fetch(`/api/get_user_dashboard.php?user_id=${currentUser.id}`);
        const data = await res.json();
        if (data.success && data.user) {
          setProfileStats({
            name: data.user.name,
            level: data.user.level || 'Explorer',
            alltime_dist: data.user.total_distance_km || '0.0',
            monthly_dist: data.user.monthly_distance_km || '0.0',
            favorite_spot: data.user.favorite_spot || '-',
            community_rank: data.user.community_rank || 1
          });
        }
      } catch (e) {
        console.log('Profile stats fallback:', e);
      }
    }
    loadStats();
  }, [currentUser]);

  const handleProtectedNavigate = (tab) => {
    if (isGuest && (tab === 'gear' || tab === 'stats' || tab === 'community' || tab === 'admin')) {
      alert('🔒 Silakan Login / Daftar terlebih dahulu untuk menguji fitur ini!');
      onOpenLogin();
      return;
    }
    onNavigate(tab);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Profile Header */}
      <div className="hero-card" style={{ textAlign: 'center', background: isSuperAdmin ? 'linear-gradient(135deg, #0F172A 0%, #312E81 100%)' : undefined }}>
        <div 
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'white',
            color: isSuperAdmin ? '#F59E0B' : 'var(--ocean-blue)',
            fontSize: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
          }}
        >
          {isSuperAdmin ? '👑' : (isGuest ? '👤' : '🏄‍♂️')}
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
          {isGuest ? 'Guest SUPer' : profileStats.name}
        </h2>
        
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, marginTop: '4px' }}>
          {isSuperAdmin ? '🛡️ Super Admin System' : (isGuest ? '🔒 Mode Tamu (Belum Terdaftar)' : `Level: ${profileStats.level} 🧭 • Rank #${profileStats.community_rank}`)}
        </div>

        <div style={{ marginTop: '16px' }}>
          {!isGuest ? (
            <button 
              onClick={onLogout}
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: 'white', padding: '6px 16px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
            >
              🚪 Keluar (Logout)
            </button>
          ) : (
            <button 
              onClick={onOpenLogin}
              style={{ background: 'var(--aqua)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
            >
              🔑 Masuk / Daftar Akun
            </button>
          )}
        </div>
      </div>

      {/* Super Admin Quick Access Panel Card */}
      {isSuperAdmin && (
        <div 
          onClick={() => onNavigate('admin')}
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: '2px solid #F59E0B',
            borderRadius: '18px',
            padding: '16px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '2rem' }}>🛡️</span>
            <div>
              <strong style={{ fontSize: '1rem', color: '#92400E', display: 'block' }}>Super Admin Panel</strong>
              <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600 }}>Kelola Akses User & Level</span>
            </div>
          </div>
          <span style={{ fontSize: '1.2rem', color: '#B45309', fontWeight: 800 }}>➔</span>
        </div>
      )}

      {/* Profile Stats Grid (Dynamic MySQL Accumulation, No Static Session Column) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div className="card-clean">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Total Distance (All-Time)</span>
          <strong style={{ fontSize: '1.35rem', fontFamily: 'var(--font-heading)', color: 'var(--ocean-blue)' }}>
            {isGuest ? '0.0' : profileStats.alltime_dist} <span style={{ fontSize: '0.75rem' }}>km</span>
          </strong>
        </div>

        <div className="card-clean">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Jarak Tempuh Bulan Ini</span>
          <strong style={{ fontSize: '1.35rem', fontFamily: 'var(--font-heading)', color: '#059669' }}>
            {isGuest ? '0.0' : profileStats.monthly_dist} <span style={{ fontSize: '0.75rem' }}>km</span>
          </strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>🔄 Reset otomatis tiap awal bulan</span>
        </div>

        <div className="card-clean">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Favorite Spot (Spot Tersering)</span>
          <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{isGuest ? '-' : profileStats.favorite_spot}</strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>📍 Dihitung dari frekuensi aktifitas</span>
        </div>

        <div className="card-clean">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Peringkat Komunitas</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--ocean-blue)' }}>
            {isGuest ? '-' : `Rank #${profileStats.community_rank} 🏆`}
          </strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>🇮🇩 SUP Indonesia Leaderboard</span>
        </div>
      </div>

      {/* Quick Access Menu Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          className="card-clean" 
          onClick={() => handleProtectedNavigate('gear')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <div>
              <strong style={{ fontSize: '0.98rem', display: 'block' }}>Gear Locker</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manajemen Equipment</span>
            </div>
          </div>
          <span style={{ fontSize: '1.1rem', color: 'var(--ocean-blue)' }}>➔</span>
        </button>

        <button 
          className="card-clean" 
          onClick={() => handleProtectedNavigate('stats')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <div>
              <strong style={{ fontSize: '0.98rem', display: 'block' }}>Peringkat & Achievements</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Leaderboard & Medali</span>
            </div>
          </div>
          <span style={{ fontSize: '1.1rem', color: 'var(--ocean-blue)' }}>➔</span>
        </button>

        <button 
          className="card-clean" 
          onClick={() => handleProtectedNavigate('community')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>👥</span>
            <div>
              <strong style={{ fontSize: '0.98rem', display: 'block' }}>Community Feed</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SUP Indonesia Community</span>
            </div>
          </div>
          <span style={{ fontSize: '1.1rem', color: 'var(--ocean-blue)' }}>➔</span>
        </button>
      </div>

    </div>
  );
}
