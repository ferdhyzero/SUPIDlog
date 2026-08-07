import React, { useState, useEffect } from 'react';
import AdminAIDiagnosticsScreen from './AdminAIDiagnosticsScreen';

export default function AdminDashboardScreen({ currentUser }) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgNotice, setMsgNotice] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});

  const levelOptions = ['Beginner SUPer', 'Explorer', 'Advanced SUPer', 'Pro Athlete', 'Master Navigator', 'Super Admin'];
  const [communityPosts, setCommunityPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'moderation', 'ai_diagnostics'

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin_users.php?action=list');
      const data = await res.json();
      if (data.success) setUsersList(data.users);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityPosts = async () => {
    try {
      const res = await fetch('/api/get_community.php?user_id=1');
      const data = await res.json();
      if (data.success) setCommunityPosts(data.posts || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadUsers();
    loadCommunityPosts();
  }, []);

  const handleApproveUser = async (userId, userName) => {
    try {
      await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_registration', user_id: userId })
      });
      setMsgNotice(`User '${userName}' disetujui!`);
      setUsersList(usersList.map(u => u.id === userId ? { ...u, status: 'active' } : u));
    } catch (e) {}
  };

  const handleApproveResetPassword = async (userId, userName) => {
    try {
      await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_reset', user_id: userId })
      });
      setMsgNotice(`Permintaan reset password user '${userName}' disetujui!`);
      setUsersList(usersList.map(u => u.id === userId ? { ...u, reset_status: null } : u));
    } catch (e) {}
  };

  const handleAdminResetPassword = async (userId, userName) => {
    const newPassword = window.prompt(`Masukkan password baru untuk '${userName}':`, '123456');
    if (!newPassword) return;

    try {
      await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', user_id: userId, new_password: newPassword })
      });
      setMsgNotice(`Password user '${userName}' diubah!`);
      loadUsers();
    } catch (e) {}
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_role', user_id: userId, new_role: newRole })
      });
      setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {}
  };

  const handleLevelChange = async (userId, newLevel) => {
    try {
      await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_level', user_id: userId, level: newLevel })
      });
      setUsersList(usersList.map(u => u.id === userId ? { ...u, level: newLevel } : u));
    } catch (e) {}
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Hapus akun '${userName}' secara permanen?`)) return;

    try {
      await fetch('/api/admin_users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', user_id: userId })
      });
      setUsersList(usersList.filter(u => u.id !== userId));
    } catch (e) {}
  };

  const pendingUsersCount = usersList.filter(u => u.status === 'pending').length;
  const pendingResetCount = usersList.filter(u => u.reset_status === 'reset_pending').length;

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Super Admin Banner */}
      <div 
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.33) 0%, rgba(30, 41, 59, 0.23) 100%), url(https://images.unsplash.com/photo-1520950237264-dfe336995c34?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzV8fHBhZGRsZSUyMGJvYXJkfGVufDB8fDB8fHww)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          borderRadius: '16px',
          padding: '14px',
          boxShadow: '0 4px 15px rgba(15, 23, 42, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, color: '#F59E0B' }}>SUPER ADMIN</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '2px' }}>User & Access Panel</h2>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 10px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.68rem', opacity: 0.8, display: 'block' }}>Total User</span>
            <strong style={{ fontSize: '1.1rem', fontWeight: 900 }}>{usersList.length}</strong>
          </div>

          <div style={{ background: pendingUsersCount > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)', padding: '8px 10px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.68rem', opacity: 0.9, display: 'block' }}>Daftar Pending</span>
            <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: pendingUsersCount > 0 ? '#FBBF24' : '#34D399' }}>{pendingUsersCount}</strong>
          </div>

          <div style={{ background: pendingResetCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)', padding: '8px 10px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.68rem', opacity: 0.9, display: 'block' }}>Reset Pending</span>
            <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: pendingResetCount > 0 ? '#FCA5A5' : '#34D399' }}>{pendingResetCount}</strong>
          </div>
        </div>
      </div>

      {msgNotice && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 }}>
          {msgNotice}
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', background: '#E2E8F0', padding: '3px', borderRadius: '10px', gap: '2px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{ flex: 1, padding: '6px 4px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.75rem', background: activeTab === 'users' ? '#0284C7' : 'transparent', color: activeTab === 'users' ? 'white' : '#64748B', cursor: 'pointer' }}
        >
          User ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          style={{ flex: 1, padding: '6px 4px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.75rem', background: activeTab === 'moderation' ? '#0284C7' : 'transparent', color: activeTab === 'moderation' ? 'white' : '#64748B', cursor: 'pointer' }}
        >
          Moderasi ({communityPosts.length})
        </button>

        <button
          onClick={() => setActiveTab('ai_diagnostics')}
          style={{ flex: 1.2, padding: '6px 4px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.75rem', background: activeTab === 'ai_diagnostics' ? '#0284C7' : 'transparent', color: activeTab === 'ai_diagnostics' ? 'white' : '#64748B', cursor: 'pointer' }}
        >
          🤖 AI Diagnostics
        </button>
      </div>

      {activeTab === 'ai_diagnostics' ? (
        <AdminAIDiagnosticsScreen currentUser={currentUser} />
      ) : activeTab === 'users' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {usersList.map((userItem) => {
            const isPendingReg = userItem.status === 'pending';
            const isPendingReset = userItem.reset_status === 'reset_pending';
            const isTargetAdmin = userItem.role === 'super_admin';
            const isShowingPass = !!showPasswordMap[userItem.id];

            return (
              <div key={userItem.id} className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderRadius: '12px', padding: '10px 12px', border: isPendingReset ? '1.5px solid #EF4444' : (isPendingReg ? '1.5px solid #F59E0B' : '1px solid #E2E8F0') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.9rem', fontWeight: 800 }}>{userItem.name}</strong>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '9999px', background: isTargetAdmin ? '#F59E0B' : '#64748B', color: 'white' }}>
                      {isTargetAdmin ? 'ADMIN' : 'USER'}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isPendingReset ? '#DC2626' : (isPendingReg ? '#B45309' : '#059669') }}>
                    {isPendingReset ? 'Reset' : (isPendingReg ? 'Pending' : 'Aktif')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '6px 8px', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pass: <strong style={{ color: '#0F172A' }}>{isShowingPass ? (userItem.plain_password || '***') : '••••'}</strong></span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setShowPasswordMap(prev => ({ ...prev, [userItem.id]: !prev[userItem.id] }))} style={{ background: 'white', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>{isShowingPass ? 'Tutup' : 'Lihat'}</button>
                    <button onClick={() => handleAdminResetPassword(userItem.id, userItem.name)} style={{ background: '#0284C7', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>Reset</button>
                  </div>
                </div>

                {isPendingReset && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '6px 8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: 700 }}>Req Pass: <strong>{userItem.requested_password}</strong></span>
                    <button onClick={() => handleApproveResetPassword(userItem.id, userItem.name)} style={{ background: '#DC2626', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>Setujui Reset</button>
                  </div>
                )}

                {isPendingReg && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '6px 8px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 700 }}>Menunggu Verifikasi</span>
                    <button onClick={() => handleApproveUser(userItem.id, userItem.name)} style={{ background: '#D97706', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>Setujui Pendaftaran</button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={userItem.level || 'Beginner SUPer'}
                      onChange={(e) => handleLevelChange(userItem.id, e.target.value)}
                      style={{ fontSize: '0.7rem', padding: '2px 4px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    >
                      {levelOptions.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>

                    <select
                      value={userItem.role || 'user'}
                      onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                      style={{ fontSize: '0.7rem', padding: '2px 4px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    >
                      <option value="user">User biasa</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    {userItem.id !== 1 && userItem.email !== 'ahmadferdy66@gmail.com' && (
                      <button onClick={() => handleDeleteUser(userItem.id, userItem.name)} style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>Hapus</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {communityPosts.map((post) => (
            <div key={post.id} className="card-clean" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '10px' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', display: 'block', fontWeight: 800 }}>{post.title}</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{post.user_name} • {post.spot_name}</span>
              </div>
              <button onClick={() => setCommunityPosts(communityPosts.filter(p => p.id !== post.id))} style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>Hapus</button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
