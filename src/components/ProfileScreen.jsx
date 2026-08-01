import React, { useState, useEffect } from 'react';
import EditProfileModal from './EditProfileModal';

export default function ProfileScreen({ currentUser, onOpenLogin, onLogout, onNavigate }) {
  const isGuest = !currentUser;
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [profileStats, setProfileStats] = useState({
    name: currentUser ? currentUser.name : 'Guest SUPer',
    level: currentUser ? (currentUser.level || 'Explorer') : 'Mode Tamu',
    avatar_url: currentUser ? (currentUser.avatar_url || '') : '',
    alltime_dist: '0.0',
    monthly_dist: '0.0',
    favorite_spot: '-',
    community_rank: 1
  });

  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');
  const [analyticsData, setAnalyticsData] = useState({
    total_sessions: 0,
    total_distance_km: '0.0',
    top_speed_kmh: '0.0',
    total_calories: 0
  });

  const [bucketList, setBucketList] = useState([]);
  const [showAddBucketModal, setShowAddBucketModal] = useState(false);
  const [newBucketSpot, setNewBucketSpot] = useState('');
  const [newBucketMonth, setNewBucketMonth] = useState('Agustus 2026');
  const [newBucketNotes, setNewBucketNotes] = useState('Rencana trip');

  const isSuperAdmin = !isGuest && (currentUser.role === 'super_admin' || currentUser.email === 'ahmadferdy66@gmail.com' || currentUser.name === 'ferdhy');

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

      try {
        const resA = await fetch(`/api/get_user_analytics.php?user_id=${currentUser.id}&period=${analyticsPeriod}`);
        const dataA = await resA.json();
        if (dataA.success && dataA.stats) {
          setAnalyticsData(dataA.stats);
        }
      } catch (e) {}

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
        setShowAddBucketModal(false);
        setNewBucketSpot('');
        const resB = await fetch(`/api/bucket_list.php?action=list&user_id=${currentUser.id}`);
        const dataB = await resB.json();
        if (dataB.success) setBucketList(dataB.bucket_list);
      }
    } catch (err) {}
  };

  const handleCompleteBucketItem = async (item) => {
    if (confirm(`Tandai '${item.spot_name}' selesai?`)) {
      try {
        const res = await fetch('/api/bucket_list.php?action=complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, user_id: currentUser.id, spot_name: item.spot_name })
        });
        const data = await res.json();
        if (data.success) {
          setBucketList(bucketList.map(b => b.id === item.id ? { ...b, is_completed: 1 } : b));
        }
      } catch (e) {}
    }
  };

  const handleProtectedNavigate = (tab) => {
    if (isGuest && (tab === 'gear' || tab === 'stats' || tab === 'community' || tab === 'admin')) {
      onOpenLogin(false);
      return;
    }
    onNavigate(tab);
  };

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Profile Header */}
      <div 
        className="hero-card" 
        style={{ 
          textAlign: 'center', 
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #070D1B 0%, #0369a1 100%)', 
          borderRadius: '18px',
          padding: '18px 16px',
          boxShadow: '0 6px 20px rgba(2, 132, 199, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.25)'
        }}
      >
        <img 
          src="/sup-hero-bg.webp" 
          alt="SUP Indonesia"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%', opacity: 0.95, filter: 'brightness(1.05)', zIndex: 0, pointerEvents: 'none' }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(7, 13, 27, 0.10) 0%, rgba(3, 105, 161, 0.25) 100%)', zIndex: 1, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          {!isGuest && (
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '10px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Edit</span>
            </button>
          )}

          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.8)'
            }}
          >
          {profileStats.avatar_url ? (
            <img src={profileStats.avatar_url} alt={profileStats.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            isSuperAdmin ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2">
                <path d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z"/>
              </svg>
            ) : (isGuest ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            ) : (
              <img src="/start-paddle-bold-blue.png" alt="SUP" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            ))
          )}
        </div>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
          {isGuest ? 'Guest SUPer' : profileStats.name}
        </h2>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(7, 13, 27, 0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, marginTop: '4px', color: 'white' }}>
          {isSuperAdmin ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Super Admin</span>
            </>
          ) : (isGuest ? (
            <span>Mode Tamu</span>
          ) : (
            <span>{profileStats.level} • Rank #{profileStats.community_rank}</span>
          ))}
        </div>

        {isGuest && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button 
              onClick={() => onOpenLogin(false)}
              style={{ flex: 1, background: 'white', color: '#0284c7', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer' }}
            >
              Masuk
            </button>
            <button 
              onClick={() => onOpenLogin(true)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.25)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer' }}
            >
              Daftar
            </button>
          </div>
        )}
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={currentUser || { id: 1, name: profileStats.name }}
          onClose={() => setShowEditModal(false)}
          onSaveSuccess={(updated) => setProfileStats(prev => ({ ...prev, name: updated.name }))}
        />
      )}

      {/* Super Admin Quick Access */}
      {isSuperAdmin && (
        <div 
          onClick={() => onNavigate('admin')}
          style={{
            background: '#FFFBEB',
            border: '1.5px solid #F59E0B',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F59E0B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#92400E', display: 'block', fontWeight: 800 }}>Super Admin Panel</strong>
              <span style={{ fontSize: '0.72rem', color: '#B45309' }}>Kelola User & Akses</span>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      )}

      {!isGuest && (
        <>
          {/* 1. Timeframe Analytics */}
          <div className="card-clean" style={{ padding: '12px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Jurnal Dayung</strong>

              <div style={{ display: 'flex', background: '#F1F5F9', padding: '2px', borderRadius: '8px' }}>
                {['weekly', 'monthly', 'yearly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setAnalyticsPeriod(period)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: analyticsPeriod === period ? '#0284c7' : 'transparent',
                      color: analyticsPeriod === period ? 'white' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {period === 'weekly' ? 'Minggu' : period === 'monthly' ? 'Bulan' : 'Tahun'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Jarak Tempuh</span>
                <strong style={{ fontSize: '1.05rem', color: '#0284c7', fontWeight: 900 }}>{analyticsData.total_distance_km} <span style={{ fontSize: '0.68rem' }}>km</span></strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Total Sesi</span>
                <strong style={{ fontSize: '1.05rem', color: '#059669', fontWeight: 900 }}>{analyticsData.total_sessions} <span style={{ fontSize: '0.68rem' }}>sesi</span></strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Top Speed</span>
                <strong style={{ fontSize: '1rem', color: '#d97706', fontWeight: 900 }}>{analyticsData.top_speed_kmh} <span style={{ fontSize: '0.68rem' }}>km/h</span></strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Spot Utama</span>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 800, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profileStats.favorite_spot}</strong>
              </div>
            </div>
          </div>

          {/* 2. Bucket List Manager */}
          <div className="card-clean" style={{ padding: '12px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Spot Impian</strong>
              <button
                onClick={() => setShowAddBucketModal(true)}
                style={{ background: '#0284c7', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
              >
                + Tambah
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {bucketList && bucketList.length > 0 ? (
                bucketList.map((item) => {
                  const isDone = item.is_completed == 1;
                  return (
                    <div key={item.id} style={{ background: isDone ? '#f0fdf4' : '#f8fafc', border: isDone ? '1px solid #86efac' : '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.82rem', fontWeight: 800, color: isDone ? '#166534' : 'var(--text-main)', textDecoration: isDone ? 'line-through' : 'none', display: 'block' }}>{item.spot_name}</strong>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Target: {item.target_month || '2026'}</span>
                      </div>
                      {isDone ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>Selesai</span>
                      ) : (
                        <button onClick={() => handleCompleteBucketItem(item)} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}>Ceklis</button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px', background: '#F8FAFC', borderRadius: '10px' }}>Belum ada target spot.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Bucket List Modal */}
      {showAddBucketModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ padding: '16px', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px' }}>Tambah Spot Impian</h3>
            <form onSubmit={handleAddBucketItem} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" placeholder="Nama Spot (Raja Ampat, Toba...)" value={newBucketSpot} onChange={(e) => setNewBucketSpot(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} required />
              <input type="text" placeholder="Target Waktu (Agustus 2026)" value={newBucketMonth} onChange={(e) => setNewBucketMonth(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAddBucketModal(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#e2e8f0', color: '#475569', fontWeight: 800, border: 'none' }}>Batal</button>
                <button type="submit" style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#0284c7', color: 'white', fontWeight: 800, border: 'none' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Access Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[
          { tab: 'gear', title: 'Gear Locker', desc: 'Equipment & Perawatan', icon: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z', bg: '#E0F2FE', color: '#0284C7' },
          { tab: 'stats', title: 'Peringkat & Record', desc: 'Leaderboard & Achievements', icon: 'M18 20V10M12 20V4M6 20v-6', bg: '#DCFCE7', color: '#059669' },
          { tab: 'community', title: 'Community Feed', desc: 'Sesi & Diskusi SUP', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', bg: '#FEF3C7', color: '#D97706' }
        ].map((item) => (
          <button 
            key={item.tab}
            className="card-clean" 
            onClick={() => handleProtectedNavigate(item.tab)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', padding: '10px 12px', borderRadius: '12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={item.icon}/></svg>
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block', color: 'var(--text-main)' }}>{item.title}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.desc}</span>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>

    </div>
  );
}
