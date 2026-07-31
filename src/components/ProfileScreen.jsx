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

  // Timeframe Analytics state: 'monthly', 'weekly', 'yearly'
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');
  const [analyticsData, setAnalyticsData] = useState({
    total_sessions: 0,
    total_distance_km: '0.0',
    top_speed_kmh: '0.0',
    total_calories: 0
  });

  // Bucket List state
  const [bucketList, setBucketList] = useState([]);
  const [showAddBucketModal, setShowAddBucketModal] = useState(false);
  const [newBucketSpot, setNewBucketSpot] = useState('');
  const [newBucketMonth, setNewBucketMonth] = useState('Agustus 2026');
  const [newBucketNotes, setNewBucketNotes] = useState('Rencana paddle trip impian');

  const isSuperAdmin = !isGuest && (currentUser.role === 'super_admin' || currentUser.email === 'ahmadferdy66@gmail.com' || currentUser.name === 'ferdhy');

  // Fetch dynamic stats & timeframe analytics from MySQL
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
      } catch (e) {}

      // Fetch Timeframe Analytics
      try {
        const resA = await fetch(`/api/get_user_analytics.php?user_id=${currentUser.id}&period=${analyticsPeriod}`);
        const dataA = await resA.json();
        if (dataA.success && dataA.stats) {
          setAnalyticsData(dataA.stats);
        }
      } catch (e) {}

      // Fetch Bucket List
      try {
        const resB = await fetch(`/api/bucket_list.php?action=list&user_id=${currentUser.id}`);
        const dataB = await resB.json();
        if (dataB.success) {
          setBucketList(dataB.bucket_list);
        }
      } catch (e) {}
    }
    loadStats();
  }, [currentUser, analyticsPeriod]);

  const handleAddBucketItem = async (e) => {
    e.preventDefault();
    if (!newBucketSpot.trim()) return;

    try {
      const res = await fetch('/api/bucket_list.php?action=add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          spot_name: newBucketSpot,
          target_month: newBucketMonth,
          notes: newBucketNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowAddBucketModal(false);
        setNewBucketSpot('');
        // Reload bucket list
        const resB = await fetch(`/api/bucket_list.php?action=list&user_id=${currentUser.id}`);
        const dataB = await resB.json();
        if (dataB.success) setBucketList(dataB.bucket_list);
      }
    } catch (err) {
      alert('Gagal menambah spot impian.');
    }
  };

  const handleCompleteBucketItem = async (item) => {
    if (confirm(`Selamat! Apakah Anda sudah menyelesaikan sesi dayung di '${item.spot_name}'? Stempel Paspor Digital akan otomatis terbuka!`)) {
      try {
        const res = await fetch('/api/bucket_list.php?action=complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            user_id: currentUser.id,
            spot_name: item.spot_name
          })
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          setBucketList(bucketList.map(b => b.id === item.id ? { ...b, is_completed: 1 } : b));
        }
      } catch (e) {}
    }
  };

  const handleProtectedNavigate = (tab) => {
    if (isGuest && (tab === 'gear' || tab === 'stats' || tab === 'community' || tab === 'admin')) {
      alert('🔒 Silakan Login / Daftar terlebih dahulu untuk menguji fitur ini!');
      onOpenLogin(false);
      return;
    }
    onNavigate(tab);
  };

  return (
    <div style={{ width: '100%', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Profile Header with Real Stand-Up Paddleboard (SUP) Action Photo API */}
      <div 
        className="hero-card" 
        style={{ 
          textAlign: 'center', 
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #070D1B 0%, #0369a1 100%)', 
          padding: '20px 16px' 
        }}
      >
        {/* Background Stand-Up Paddleboard Action Image */}
        <img 
          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&auto=format&fit=crop" 
          alt="Stand Up Paddle Boarding"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=1000&auto=format&fit=crop';
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 35%',
            opacity: 0.65,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Transparent Dark Ocean Overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, rgba(7, 13, 27, 0.30) 0%, rgba(15, 23, 42, 0.60) 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          {!isGuest && (
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
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
            isSuperAdmin ? '👑' : (isGuest ? '👤' : <img src="/start-paddle-bold-blue.png" alt="SUP Paddle" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />)
          )}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
          {isGuest ? 'Guest SUPer' : profileStats.name}
        </h2>
        
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>
          {isSuperAdmin ? '🛡️ Super Admin System' : (isGuest ? '🔒 Mode Tamu (Belum Terdaftar)' : `Level: ${profileStats.level} 🧭 • Rank #${profileStats.community_rank}`)}
        </div>

        {isGuest && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.8rem', opacity: 0.95, lineHeight: 1.4, margin: '0 0 4px' }}>
              Masuk atau daftar akun baru untuk menyimpan statistik sesi dayung, paspor digital, dan garasi peralatan SUP Anda!
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button 
                onClick={() => onOpenLogin(false)}
                style={{ flex: 1, background: 'white', color: '#0284c7', border: 'none', padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              >
                🔑 MASUK AKUN
              </button>
              <button 
                onClick={() => onOpenLogin(true)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.25)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
              >
                📝 DAFTAR BARU
              </button>
            </div>
          </div>
        )}
        </div>
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

      {/* Logged-in User Full Dashboard Modules */}
      {!isGuest && (
        <>
          {/* 1. Timeframe Analytics Jurnal Dayung (Mingguan, Bulanan, Tahunan) */}
          <div className="card-clean" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>📖 Jurnal Dayung Saya</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Analitik Statistik Berdasar Periode</span>
              </div>

              {/* Timeframe Filter Tabs */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '10px' }}>
                <button
                  onClick={() => setAnalyticsPeriod('weekly')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: analyticsPeriod === 'weekly' ? '#0284c7' : 'transparent',
                    color: analyticsPeriod === 'weekly' ? 'white' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Minggu Ini
                </button>
                <button
                  onClick={() => setAnalyticsPeriod('monthly')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: analyticsPeriod === 'monthly' ? '#0284c7' : 'transparent',
                    color: analyticsPeriod === 'monthly' ? 'white' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Bulan Ini
                </button>
                <button
                  onClick={() => setAnalyticsPeriod('yearly')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: analyticsPeriod === 'yearly' ? '#0284c7' : 'transparent',
                    color: analyticsPeriod === 'yearly' ? 'white' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Tahun Ini
                </button>
              </div>
            </div>

            {/* Analytics Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total Jarak Tempuh</span>
                <strong style={{ fontSize: '1.15rem', color: '#0284c7', fontFamily: 'var(--font-heading)' }}>
                  {analyticsData.total_distance_km} <span style={{ fontSize: '0.7rem' }}>km</span>
                </strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total Sesi Paddle</span>
                <strong style={{ fontSize: '1.15rem', color: '#059669', fontFamily: 'var(--font-heading)' }}>
                  {analyticsData.total_sessions} <span style={{ fontSize: '0.7rem' }}>sesi</span>
                </strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Top Speed</span>
                <strong style={{ fontSize: '1.05rem', color: '#d97706', fontFamily: 'var(--font-heading)' }}>
                  {analyticsData.top_speed_kmh} <span style={{ fontSize: '0.7rem' }}>km/h</span>
                </strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Spot Tersering</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profileStats.favorite_spot}
                </strong>
              </div>
            </div>
          </div>

          {/* 2. Bucket List / Spot Impian Manager */}
          <div className="card-clean" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>🎯 Bucket List / Spot Impian</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Lokasi Dayung Yang Ingin Dikunjungi</span>
              </div>
              <button
                onClick={() => setShowAddBucketModal(true)}
                style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                ➕ Tambah
              </button>
            </div>

            {/* Bucket List Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bucketList && bucketList.length > 0 ? (
                bucketList.map((item) => {
                  const isDone = item.is_completed == 1;
                  return (
                    <div 
                      key={item.id} 
                      style={{ 
                        background: isDone ? '#f0fdf4' : '#f8fafc', 
                        border: isDone ? '1px solid #86efac' : '1px solid #e2e8f0', 
                        padding: '10px 12px', 
                        borderRadius: '10px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: isDone ? '#166534' : 'var(--text-main)', textDecoration: isDone ? 'line-through' : 'none', display: 'block' }}>
                          {item.spot_name}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🗓️ Target: {item.target_month || 'Agustus 2026'} • {item.notes}</span>
                      </div>

                      {isDone ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800 }}>
                          🏆 Dikunjungi
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCompleteBucketItem(item)}
                          style={{ background: '#0284c7', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          ✔ Tandai Selesai
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                  Belum ada spot impian. Klik ➕ Tambah untuk membuat target trip dayung Anda!
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Bucket List Item Modal */}
      {showAddBucketModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>🎯 Tambah Spot Impian (Bucket List)</h3>
            <form onSubmit={handleAddBucketItem} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nama Spot Impian</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Raja Ampat, Danau Toba, Sanur..." 
                  value={newBucketSpot} 
                  onChange={(e) => setNewBucketSpot(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Target Waktu Trip</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Agustus 2026" 
                  value={newBucketMonth} 
                  onChange={(e) => setNewBucketMonth(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Catatan Perjalanan</label>
                <input 
                  type="text" 
                  placeholder="Catatan trip atau perlengkapan yang disiapkan..." 
                  value={newBucketNotes} 
                  onChange={(e) => setNewBucketNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddBucketModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#e2e8f0', color: '#475569', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#0284c7', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                  Simpan Target 🎯
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
