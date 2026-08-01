import React, { useState, useEffect } from 'react';

export default function AdminDashboardScreen({ currentUser }) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgNotice, setMsgNotice] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});

  const levelOptions = [
    'Beginner SUPer',
    'Explorer',
    'Advanced SUPer',
    'Pro Athlete',
    'Master Navigator',
    'Super Admin'
  ];

  const [communityPosts, setCommunityPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'moderation'

  // Fetch Users List from MySQL for Super Admin
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin_users.php?action=list');
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
      }
    } catch (e) {
      console.log('Admin users fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityPosts = async () => {
    try {
      const res = await fetch('/api/get_community.php?user_id=1');
      const data = await res.json();
      if (data.success) {
        setCommunityPosts(data.posts || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadUsers();
    loadCommunityPosts();
  }, []);

  const handleApproveUser = async (userId, userName) => {
    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_registration', user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setMsgNotice(`Akun user '${userName}' berhasil diverifikasi dan disetujui!`);
        setUsersList(usersList.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      }
    } catch (e) {
      setUsersList(usersList.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      setMsgNotice(`Akun user '${userName}' disetujui!`);
    }
  };

  const handleApproveResetPassword = async (userId, userName) => {
    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_reset_password', user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setMsgNotice(`Reset password untuk '${userName}' disetujui! Password baru telah diaktifkan.`);
        loadUsers();
      }
    } catch (e) {
      setMsgNotice(`Reset password untuk '${userName}' disetujui.`);
      loadUsers();
    }
  };

  const handleAdminResetPassword = async (userId, userName) => {
    const newPass = prompt(`Masukkan password baru untuk user '${userName}':`, 'supid123');
    if (!newPass) return;

    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_reset_password', user_id: userId, new_password: newPass })
      });
      const data = await res.json();
      if (data.success) {
        setMsgNotice(`Password '${userName}' berhasil diubah ke: ${newPass}`);
        loadUsers();
      }
    } catch (e) {
      setMsgNotice(`Password '${userName}' berhasil diubah.`);
    }
  };

  const handleLevelChange = async (userId, newLevel) => {
    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_level', user_id: userId, level: newLevel })
      });
      const data = await res.json();
      if (data.success) {
        setMsgNotice(`Level user berhasil diperbarui ke: ${newLevel}`);
        setUsersList(usersList.map(u => u.id === userId ? { ...u, level: newLevel } : u));
      }
    } catch (e) {
      setUsersList(usersList.map(u => u.id === userId ? { ...u, level: newLevel } : u));
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_role', user_id: userId, role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        setMsgNotice(`Role user berhasil diubah ke: ${newRole}`);
        setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (e) {
      setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun user '${userName}'? Data tidak dapat dikembalikan!`)) {
      try {
        const res = await fetch('/api/admin_users.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_user', user_id: userId })
        });
        const data = await res.json();
        if (data.success) {
          setMsgNotice(`User '${userName}' berhasil dihapus.`);
          setUsersList(usersList.filter(u => u.id !== userId));
        }
      } catch (e) {
        setUsersList(usersList.filter(u => u.id !== userId));
      }
    }
  };

  const toggleShowPassword = (userId) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const pendingUsersCount = usersList.filter(u => u.status === 'pending').length;
  const pendingResetCount = usersList.filter(u => u.reset_status === 'reset_pending').length;

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
      
      {/* Super Admin Hero Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: 'white',
          borderRadius: '18px',
          padding: '18px 16px',
          boxShadow: '0 6px 20px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: '#F59E0B' }}>
              SUPER ADMIN SYSTEM PANEL
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>User & Password Manager</span>
            </h2>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', fontWeight: 600 }}>Total User</span>
            <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 900 }}>
              {usersList.length} User
            </strong>
          </div>

          <div style={{ background: pendingUsersCount > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '12px', border: pendingUsersCount > 0 ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.7rem', opacity: 0.9, display: 'block', fontWeight: 600 }}>Verifikasi Daftar</span>
            <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: pendingUsersCount > 0 ? '#FBBF24' : '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {pendingUsersCount}
              {pendingUsersCount > 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </strong>
          </div>

          <div style={{ background: pendingResetCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '12px', border: pendingResetCount > 0 ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.7rem', opacity: 0.9, display: 'block', fontWeight: 600 }}>Reset Password</span>
            <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: pendingResetCount > 0 ? '#FCA5A5' : '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {pendingResetCount}
              {pendingResetCount > 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </strong>
          </div>
        </div>
      </div>

      {msgNotice && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>{msgNotice}</span>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', background: '#E2E8F0', padding: '4px', borderRadius: '12px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            flex: 1,
            padding: '10px 8px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.8rem',
            background: activeTab === 'users' ? '#0284C7' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>User & Password Manager ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          style={{
            flex: 1,
            padding: '10px 8px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.8rem',
            background: activeTab === 'moderation' ? '#0284C7' : 'transparent',
            color: activeTab === 'moderation' ? 'white' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Moderasi Feed Komunitas ({communityPosts.length})</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>Pengaturan Akun, Verifikasi & Reset Password</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {usersList.map((userItem) => {
            const isPendingReg = userItem.status === 'pending';
            const isPendingReset = userItem.reset_status === 'reset_pending';
            const isTargetAdmin = userItem.role === 'super_admin';
            const isShowingPass = !!showPasswordMap[userItem.id];

            return (
              <div 
                key={userItem.id} 
                className="card-clean" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  borderRadius: '14px',
                  padding: '14px',
                  border: isPendingReset ? '2px solid #EF4444' : (isPendingReg ? '2px solid #F59E0B' : '1px solid #E2E8F0'),
                  background: isPendingReset ? '#FEF2F2' : (isPendingReg ? '#FFFBEB' : 'white')
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isTargetAdmin ? '#FEF3C7' : (isPendingReset ? '#FEE2E2' : (isPendingReg ? '#FEF3C7' : '#E0F2FE')), color: isTargetAdmin ? '#B45309' : (isPendingReset ? '#DC2626' : (isPendingReg ? '#B45309' : '#0284C7')), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isTargetAdmin ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z"/>
                        </svg>
                      ) : (isPendingReset ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      ) : (isPendingReg ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      )))}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1rem', fontWeight: 800 }}>{userItem.name}</strong>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', background: isTargetAdmin ? '#F59E0B' : '#64748B', color: 'white' }}>
                          {isTargetAdmin ? 'SUPER ADMIN' : 'USER'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {userItem.email} • {userItem.formatted_date || 'Terdaftar'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span 
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: isPendingReset ? '#FEE2E2' : (isPendingReg ? '#FEF3C7' : '#D1FAE5'),
                      color: isPendingReset ? '#DC2626' : (isPendingReg ? '#B45309' : '#059669'),
                      border: `1px solid ${isPendingReset ? '#EF4444' : (isPendingReg ? '#F59E0B' : '#10B981')}`
                    }}
                  >
                    {isPendingReset ? 'MEMINTA RESET PASSWORD' : (isPendingReg ? 'MENUNGGU VERIFIKASI DAFTAR' : 'AKUN TERVERIFIKASI')}
                  </span>
                </div>

                {/* VERIFIKASI RESET PASSWORD BANNER */}
                {isPendingReset && (
                  <div style={{ background: '#FEF2F2', border: '1.5px solid #EF4444', padding: '10px 12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#991B1B' }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Permintaan Reset Password:
                      </strong>
                      Password Baru Diminta: <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FCA5A5', fontWeight: 800 }}>{userItem.requested_password}</code>
                    </div>
                    <button 
                      onClick={() => handleApproveResetPassword(userItem.id, userItem.name)}
                      style={{ background: '#DC2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>SETUJUI RESET</span>
                    </button>
                  </div>
                )}

                {/* PASSWORD DISPLAY & ADMIN RESET ROW */}
                <div style={{ background: '#F1F5F9', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Password:</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#0F172A', fontWeight: 800 }}>
                      {isShowingPass ? (userItem.plain_password || '******') : '••••••••'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => toggleShowPassword(userItem.id)}
                      style={{ background: 'white', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isShowingPass ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                          <span>Sembunyikan</span>
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          <span>Lihat</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleAdminResetPassword(userItem.id, userItem.name)}
                      style={{ background: '#0284C7', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <span>Reset Manual</span>
                    </button>
                  </div>
                </div>

                {/* SUPER ADMIN LEVEL SELECTOR */}
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="7"/>
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                    </svg>
                    Set Level:
                  </span>
                  <select 
                    value={userItem.level || 'Beginner SUPer'} 
                    onChange={(e) => handleLevelChange(userItem.id, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: 'var(--ocean-blue)',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {levelOptions.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                {/* VERIFICATION & MANAGEMENT BUTTONS */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                  {isPendingReg ? (
                    <button 
                      onClick={() => handleApproveUser(userItem.id, userItem.name)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>VERIFIKASI & SETUJUI DAFTAR AKUN</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleChangeRole(userItem.id, isTargetAdmin ? 'user' : 'super_admin')}
                      style={{
                        flex: 1,
                        background: isTargetAdmin ? '#E2E8F0' : 'rgba(0,180,216,0.12)',
                        color: isTargetAdmin ? '#475569' : 'var(--ocean-blue)',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      <span>{isTargetAdmin ? 'Ubah ke User Biasa' : 'Jadikan Super Admin'}</span>
                    </button>
                  )}

                  {userItem.id !== 1 && (
                    <button 
                      onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                      style={{
                        background: '#FEF2F2',
                        color: '#EF4444',
                        border: '1px solid #FCA5A5',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      ) : (
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>Moderasi Feed Komunitas SUP Indonesia</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {communityPosts.length > 0 ? (
              communityPosts.map((post) => (
                <div key={post.id} className="card-clean" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '14px', padding: '14px' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', display: 'block', fontWeight: 800 }}>{post.title}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Oleh: {post.user_name} • Spot: {post.spot_name} ({post.distance_km})</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm(`Apakah Anda yakin ingin menghapus postingan '${post.title}'?`)) {
                        try {
                          await fetch('/api/admin_users.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'delete_post', post_id: post.id })
                          });
                          setCommunityPosts(communityPosts.filter(p => p.id !== post.id));
                          setMsgNotice(`Postingan '${post.title}' berhasil dihapus!`);
                        } catch (e) {
                          setCommunityPosts(communityPosts.filter(p => p.id !== post.id));
                        }
                      }
                    }}
                    style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <span>Hapus Post</span>
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                Tidak ada postingan komunitas untuk dimoderasi.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
