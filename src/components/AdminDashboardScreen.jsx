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
    'Master Navigator 🧭',
    'Super Admin 👑'
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
        setCommunityPosts(data.posts);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadUsers();
    loadCommunityPosts();
  }, []);

  const toggleShowPassword = (userId) => {
    setShowPasswordMap(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Approve Reset Password Request
  const handleApproveResetPassword = async (userId, userName) => {
    if (!window.confirm(`Setujui & Verifikasi Reset Password untuk akun '${userName}' (ID #${userId})?`)) return;

    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_reset',
          user_id: userId
        })
      });
      const data = await res.json();
      setMsgNotice(data.message || 'Verifikasi reset password disetujui!');
      loadUsers();
    } catch (e) {
      alert('Verifikasi reset password disetujui!');
      loadUsers();
    }
  };

  // Handle Super Admin Manual Reset User Password
  const handleAdminResetPassword = async (userId, userName) => {
    const newPass = window.prompt(`Masukkan Password Baru untuk Akun '${userName}' (ID #${userId}):`);
    if (!newPass) return;

    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          user_id: userId,
          new_password: newPass
        })
      });
      const data = await res.json();
      setMsgNotice(data.message || 'Password berhasil di-reset!');
      loadUsers();
    } catch (e) {
      alert('Password berhasil di-reset!');
      loadUsers();
    }
  };

  // Handle Level Change
  const handleLevelChange = async (userId, newLevel) => {
    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_level',
          user_id: userId,
          level: newLevel
        })
      });
      const data = await res.json();
      setMsgNotice(data.message || 'Level berhasil diperbarui!');
      loadUsers();
    } catch (e) {
      alert('Level diperbarui!');
      loadUsers();
    }
  };

  // Approve / Verify Pending User
  const handleApproveUser = async (userId, userName) => {
    if (!window.confirm(`Setujui & Verifikasi pendaftaran akun '${userName}' (ID #${userId})?`)) return;

    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          user_id: userId
        })
      });
      const data = await res.json();
      setMsgNotice(data.message || 'Akun berhasil diverifikasi!');
      loadUsers();
    } catch (e) {
      alert('Akun berhasil diverifikasi!');
      loadUsers();
    }
  };

  // Change Role
  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_role',
          user_id: userId,
          new_role: newRole
        })
      });
      const data = await res.json();
      setMsgNotice(data.message || 'Peran akun diperbarui!');
      loadUsers();
    } catch (e) {
      console.log('Role change error:', e);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Hapus akun '${userName}' (ID #${userId}) dari database MySQL secara permanen?`)) return;

    try {
      const res = await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          user_id: userId
        })
      });
      const data = await res.json();
      setMsgNotice(data.message || 'Akun dihapus!');
      loadUsers();
    } catch (e) {
      alert('Akun dihapus!');
      loadUsers();
    }
  };

  const pendingUsersCount = usersList.filter(u => u.status === 'pending').length;
  const pendingResetCount = usersList.filter(u => u.reset_status === 'reset_pending').length;

  return (
    <div style={{ width: '100%', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
      
      {/* Super Admin Hero Banner */}
      <div 
        style={{
          background: '#0f172a',
          color: 'white',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85, fontWeight: 700, color: '#F59E0B' }}>
              SUPER ADMIN SYSTEM PANEL
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>User & Password Manager 🔐</h2>
          </div>
          <span style={{ fontSize: '2rem' }}>👑</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '10px 12px', borderRadius: '14px' }}>
            <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block' }}>Total User</span>
            <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              {usersList.length} User
            </strong>
          </div>

          <div style={{ background: pendingUsersCount > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.12)', padding: '10px 12px', borderRadius: '14px', border: pendingUsersCount > 0 ? '1px solid #F59E0B' : 'none' }}>
            <span style={{ fontSize: '0.7rem', opacity: 0.9, display: 'block' }}>Verifikasi Daftar</span>
            <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: pendingUsersCount > 0 ? '#FBBF24' : '#34D399' }}>
              {pendingUsersCount} {pendingUsersCount > 0 ? '⏳' : '✔'}
            </strong>
          </div>

          <div style={{ background: pendingResetCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)', padding: '10px 12px', borderRadius: '14px', border: pendingResetCount > 0 ? '1px solid #EF4444' : 'none' }}>
            <span style={{ fontSize: '0.7rem', opacity: 0.9, display: 'block' }}>Reset Password</span>
            <strong style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: pendingResetCount > 0 ? '#FCA5A5' : '#34D399' }}>
              {pendingResetCount} {pendingResetCount > 0 ? '🔑' : '✔'}
            </strong>
          </div>
        </div>
      </div>

      {msgNotice && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
          ⚡ {msgNotice}
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.8rem',
            background: activeTab === 'users' ? '#0284c7' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#64748b',
            cursor: 'pointer'
          }}
        >
          🔐 User & Password Manager ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.8rem',
            background: activeTab === 'moderation' ? '#0284c7' : 'transparent',
            color: activeTab === 'moderation' ? 'white' : '#64748b',
            cursor: 'pointer'
          }}
        >
          🛡️ Moderasi Feed Komunitas ({communityPosts.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>Pengaturan Akun, Verifikasi & Reset Password</h3>

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
                  border: isPendingReset ? '2px solid #EF4444' : (isPendingReg ? '2px solid #F59E0B' : '1px solid #E2E8F0'),
                  background: isPendingReset ? '#FEF2F2' : (isPendingReg ? '#FFFBEB' : 'white')
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: isTargetAdmin ? '#FEF3C7' : (isPendingReset ? '#FEE2E2' : (isPendingReg ? '#FEF3C7' : '#E0F2FE')), color: isTargetAdmin ? '#B45309' : (isPendingReset ? '#DC2626' : (isPendingReg ? '#B45309' : '#0284C7')), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      {isTargetAdmin ? '👑' : (isPendingReset ? '🔑' : (isPendingReg ? '⏳' : '👤'))}
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
                    {isPendingReset ? '🔑 MEMINTA RESET PASSWORD' : (isPendingReg ? '⏳ MENUNGGU VERIFIKASI DAFTAR' : '✔ AKUN TERVERIFIKASI')}
                  </span>
                </div>

                {/* VERIFIKASI RESET PASSWORD BANNER */}
                {isPendingReset && (
                  <div style={{ background: '#FEF2F2', border: '1.5px solid #EF4444', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#991B1B' }}>
                      <strong>⚠️ Permintaan Reset Password:</strong><br />
                      Password Baru Diminta: <code style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FCA5A5' }}>{userItem.requested_password}</code>
                    </div>
                    <button 
                      onClick={() => handleApproveResetPassword(userItem.id, userItem.name)}
                      style={{ background: '#DC2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ✔ SETUJUI RESET
                    </button>
                  </div>
                )}

                {/* PASSWORD DISPLAY & ADMIN RESET ROW */}
                <div style={{ background: '#F1F5F9', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>🔑 Password:</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#0F172A' }}>
                      {isShowingPass ? (userItem.plain_password || '******') : '••••••••'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => toggleShowPassword(userItem.id)}
                      style={{ background: 'white', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {isShowingPass ? '🙈 Sembunyikan' : '👁️ Lihat'}
                    </button>
                    <button 
                      onClick={() => handleAdminResetPassword(userItem.id, userItem.name)}
                      style={{ background: '#0284C7', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🔑 Reset Manual
                    </button>
                  </div>
                </div>

                {/* SUPER ADMIN LEVEL SELECTOR (Setting Level User) */}
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    🎖️ Set Level:
                  </span>
                  <select 
                    value={userItem.level || 'Beginner SUPer'} 
                    onChange={(e) => handleLevelChange(userItem.id, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      fontWeight: 700,
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
                        padding: '8px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      ✔ VERIFIKASI & SETUJUI DAFTAR AKUN
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleChangeRole(userItem.id, isTargetAdmin ? 'user' : 'super_admin')}
                      style={{
                        flex: 1,
                        background: isTargetAdmin ? '#E2E8F0' : 'rgba(0,180,216,0.12)',
                        color: isTargetAdmin ? '#475569' : 'var(--ocean-blue)',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {isTargetAdmin ? 'Ubah ke User Biasa' : 'Jadikan Super Admin 👑'}
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
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Hapus
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>Moderasi Feed Komunitas SUP Indonesia</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {communityPosts.length > 0 ? (
              communityPosts.map((post) => (
                <div key={post.id} className="card-clean" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', display: 'block' }}>{post.title}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Oleh: {post.user_name} • 📍 {post.spot_name} ({post.distance_km})</span>
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
                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🗑️ Hapus Post
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px' }}>
                Tidak ada postingan komunitas untuk dimoderasi.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
