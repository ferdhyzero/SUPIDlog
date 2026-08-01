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
    if (confirm(`Apakah Anda sudah menyelesaikan sesi dayung di '${item.spot_name}'? Stempel Paspor Digital akan otomatis terbuka!`)) {
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
      alert('Silakan Login / Daftar terlebih dahulu untuk mengakses fitur ini!');
      onOpenLogin(false);
      return;
    }
    onNavigate(tab);
  };

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Profile Header Card */}
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
        {/* Background Stand-Up Paddleboard Action Image */}
        <img 
          src="/sup-hero-bg.webp" 
          alt="Stand Up Paddle Boarding Indonesia"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 60%',
            opacity: 0.95,
            filter: 'brightness(1.05) contrast(1.05)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Translucent Soft Gradient Overlay */}
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
                borderRadius: '12px',
                padding: '5px 12px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profil
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.8)'
            }}
          >
          {profileStats.avatar_url ? (
            <img 
              src={profileStats.avatar_url} 
              alt={profileStats.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            isSuperAdmin ? (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z"/>
              </svg>
            ) : (isGuest ? (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            ) : (
              <img src="/start-paddle-bold-blue.png" alt="SUP Paddle" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            ))
          )}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
          {isGuest ? 'Guest SUPer' : profileStats.name}
        </h2>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(7, 13, 27, 0.45)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', padding: '5px 14px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px', color: 'white' }}>
          {isSuperAdmin ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Super Admin System</span>
            </>
          ) : (isGuest ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Mode Tamu (Belum Terdaftar)</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
              <span>Level: {profileStats.level} • Rank #{profileStats.community_rank}</span>
            </>
          ))}
        </div>

        {isGuest && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.8rem', opacity: 0.95, lineHeight: 1.4, margin: '0 0 4px', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
              Masuk atau daftar akun baru untuk menyimpan statistik sesi dayung, paspor digital, dan garasi peralatan SUP Anda!
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button 
                onClick={() => onOpenLogin(false)}
                style={{ flex: 1, background: 'white', color: '#0284c7', border: 'none', padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span>MASUK AKUN</span>
              </button>
              <button 
                onClick={() => onOpenLogin(true)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.25)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <span>DAFTAR BARU</span>
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
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1.5px solid #F59E0B',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#F59E0B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#92400E', display: 'block', fontWeight: 800 }}>Super Admin Panel</strong>
              <span style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>Kelola Akses User, Password & Level</span>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      )}

      {/* Logged-in User Full Dashboard Modules */}
      {!isGuest && (
        <>
          {/* 1. Timeframe Analytics Jurnal Dayung */}
          <div className="card-clean" style={{ padding: '14px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <div>
                  <strong style={{ fontSize: '0.95rem', fontWeight: 800, display: 'block', color: 'var(--text-main)' }}>Jurnal Dayung Saya</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Analitik Statistik Berdasar Periode</span>
                </div>
              </div>

              {/* Timeframe Filter Tabs */}
              <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
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
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Total Jarak Tempuh</span>
                <strong style={{ fontSize: '1.15rem', color: '#0284c7', fontFamily: 'var(--font-heading)', fontWeight: 900 }}>
                  {analyticsData.total_distance_km} <span style={{ fontSize: '0.7rem' }}>km</span>
                </strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Total Sesi Paddle</span>
                <strong style={{ fontSize: '1.15rem', color: '#059669', fontFamily: 'var(--font-heading)', fontWeight: 900 }}>
                  {analyticsData.total_sessions} <span style={{ fontSize: '0.7rem' }}>sesi</span>
                </strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Top Speed</span>
                <strong style={{ fontSize: '1.05rem', color: '#d97706', fontFamily: 'var(--font-heading)', fontWeight: 900 }}>
                  {analyticsData.top_speed_kmh} <span style={{ fontSize: '0.7rem' }}>km/h</span>
                </strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Spot Tersering</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 800, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profileStats.favorite_spot}
                </strong>
              </div>
            </div>
          </div>

          {/* 2. Bucket List / Spot Impian Manager */}
          <div className="card-clean" style={{ padding: '14px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
                <div>
                  <strong style={{ fontSize: '0.95rem', fontWeight: 800, display: 'block', color: 'var(--text-main)' }}>Bucket List / Spot Impian</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target Lokasi Dayung Yang Ingin Dikunjungi</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddBucketModal(true)}
                style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Tambah</span>
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
                        borderRadius: '12px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', fontWeight: 800, color: isDone ? '#166534' : 'var(--text-main)', textDecoration: isDone ? 'line-through' : 'none', display: 'block' }}>
                          {item.spot_name}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Target: {item.target_month || 'Agustus 2026'} • {item.notes}
                        </span>
                      </div>

                      {isDone ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9H18V21H6z"/>
                            <path d="M4 9H20"/>
                            <path d="M10 3L14 3"/>
                          </svg>
                          Dikunjungi
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCompleteBucketItem(item)}
                          style={{ background: '#0284c7', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span>Selesai</span>
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '14px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                  Belum ada spot impian. Klik Tambah untuk membuat target trip dayung Anda!
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Bucket List Item Modal */}
      {showAddBucketModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
              Tambah Spot Impian (Bucket List)
            </h3>
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
                <button type="button" onClick={() => setShowAddBucketModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#e2e8f0', color: '#475569', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#0284c7', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Access Navigation Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          className="card-clean" 
          onClick={() => handleProtectedNavigate('gear')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', padding: '12px 14px', borderRadius: '14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div>
              <strong style={{ fontSize: '0.88rem', fontWeight: 800, display: 'block', color: 'var(--text-main)' }}>Gear Locker</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Manajemen Equipment & Perawatan</span>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <button 
          className="card-clean" 
          onClick={() => handleProtectedNavigate('stats')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', padding: '12px 14px', borderRadius: '14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DCFCE7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <strong style={{ fontSize: '0.88rem', fontWeight: 800, display: 'block', color: 'var(--text-main)' }}>Peringkat & Achievements</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Leaderboard & Medali SUP</span>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <button 
          className="card-clean" 
          onClick={() => handleProtectedNavigate('community')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', padding: '12px 14px', borderRadius: '14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <strong style={{ fontSize: '0.88rem', fontWeight: 800, display: 'block', color: 'var(--text-main)' }}>Community Feed</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Komunitas SUP Indonesia</span>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

    </div>
  );
}
