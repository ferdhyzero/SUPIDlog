import React, { useState, useEffect } from 'react';
import EditProfileModal from './EditProfileModal';

export default function ProfileScreen({ currentUser, onOpenLogin, onLogout, onNavigate }) {
  const isGuest = !currentUser;
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [profileStats, setProfileStats] = useState({
    name: currentUser ? currentUser.name : 'Guest SUPer',
    level: currentUser ? (currentUser.level || 'Explorer') : 'Pengunjung Mode Tamu',
    avatar_url: currentUser ? (currentUser.avatar_url || '') : '',
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
            avatar_url: data.user.avatar_url || '',
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
    <div style={{ width: '100%', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Profile Header */}
      <div className="hero-card" style={{ textAlign: 'center', background: isSuperAdmin ? '#0f172a' : '#0284c7', padding: '20px 16px', position: 'relative' }}>
        
        {!isGuest && (
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Edit Profil ✏️
          </button>
        )}

        <div 
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'white',
            color: isSuperAdmin ? '#f59e0b' : '#0284c7',
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}
        >
          {profileStats.avatar_url ? (
            <img 
              src={profileStats.avatar_url} 
              alt={profileStats.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            isSuperAdmin ? '👑' : (isGuest ? '👤' : <img src="/sup-paddle-icon-blue.png" alt="SUP Paddle" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />)
          )}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
          {isGuest ? 'Guest SUPer' : profileStats.name}
        </h2>
        
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>
          {isSuperAdmin ? '🛡️ Super Admin System' : (isGuest ? '🔒 Mode Tamu (Belum Terdaftar)' : `Level: ${profileStats.level} 🧭 • Rank #${profileStats.community_rank}`)}
        </div>

        {isGuest && (
          <div style={{ marginTop: '12px' }}>
            <button 
              onClick={onOpenLogin}
              style={{ background: 'white', color: '#0284c7', border: 'none', padding: '6px 16px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
            >
              🔑 Masuk / Daftar Akun
            </button>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditProfileModal
          user={currentUser || { id: 1, name: profileStats.name }}
          onClose={() => setShowEditModal(false)}
          onSaveSuccess={(updated) => {
            setProfileStats(prev => ({ ...prev, name: updated.name }));
          }}
        />
      )}

      {/* Super Admin Quick Access Card */}
      {isSuperAdmin && (
        <div 
          onClick={() => onNavigate('admin')}
          style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#92400e', display: 'block' }}>Super Admin Panel</strong>
              <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Kelola Akses User & Level</span>
            </div>
          </div>
          <span style={{ fontSize: '1rem', color: '#b45309', fontWeight: 800 }}>➔</span>
        </div>
      )}

      {/* Profile Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        <div className="card-clean">
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total Jarak Tempuh</span>
          <strong style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', color: '#0284c7' }}>
            {isGuest ? '0.0' : profileStats.alltime_dist} <span style={{ fontSize: '0.7rem' }}>km</span>
          </strong>
        </div>

        <div className="card-clean">
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Jarak Bulan Ini</span>
          <strong style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', color: '#059669' }}>
            {isGuest ? '0.0' : profileStats.monthly_dist} <span style={{ fontSize: '0.7rem' }}>km</span>
          </strong>
        </div>

        <div className="card-clean">
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Spot Tersering</span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block', wordBreak: 'break-word' }}>{isGuest ? '-' : profileStats.favorite_spot}</strong>
        </div>

        <div className="card-clean">
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Peringkat Komunitas</span>
          <strong style={{ fontSize: '0.95rem', color: '#0284c7', display: 'block' }}>
            {isGuest ? '-' : `Rank #${profileStats.community_rank} 🏆`}
          </strong>
        </div>
      </div>

      {/* Quick Access Menu Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          className="card-clean" 
          onClick={() => handleProtectedNavigate('gear')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', padding: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚙️</span>
            <div>
              <strong style={{ fontSize: '0.88rem', display: 'block' }}>Gear Locker</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Manajemen Equipment</span>
            </div>
          </div>
          <span style={{ fontSize: '1rem', color: '#0284c7' }}>➔</span>
        </button>

        <button 
          className="card-clean" 
          onClick={() => handleProtectedNavigate('stats')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', padding: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>📊</span>
            <div>
              <strong style={{ fontSize: '0.88rem', display: 'block' }}>Peringkat & Achievements</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Leaderboard & Medali</span>
            </div>
          </div>
          <span style={{ fontSize: '1rem', color: '#0284c7' }}>➔</span>
        </button>

        <button 
          className="card-clean" 
          onClick={() => handleProtectedNavigate('community')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', padding: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>👥</span>
            <div>
              <strong style={{ fontSize: '0.88rem', display: 'block' }}>Community Feed</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Komunitas SUP Indonesia</span>
            </div>
          </div>
          <span style={{ fontSize: '1rem', color: '#0284c7' }}>➔</span>
        </button>
      </div>

    </div>
  );
}
