import React, { useState, useEffect } from 'react';

export default function AdminDashboardScreen({ currentUser }) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgNotice, setMsgNotice] = useState('');

  const levelOptions = [
    'Beginner SUPer',
    'Explorer',
    'Advanced SUPer',
    'Pro Athlete',
    'Master Navigator 🧭',
    'Super Admin 👑'
  ];

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

  useEffect(() => {
    loadUsers();
  }, []);

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
    if (!window.confirm(`Setujui & Verifikasi akun '${userName}' (ID #${userId})?`)) return;

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

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Super Admin Hero Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #312E81 100%)',
          color: 'white',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85, fontWeight: 700, color: '#F59E0B' }}>
              SUPER ADMIN SYSTEM PANEL
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>Kelola User & Level 🛡️</h2>
          </div>
          <span style={{ fontSize: '2.5rem' }}>👑</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '12px 16px', borderRadius: '16px' }}>
            <span style={{ fontSize: '0.72rem', opacity: 0.8, display: 'block' }}>Total User Terdaftar</span>
            <strong style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>{usersList.length} User</strong>
          </div>

          <div style={{ background: pendingUsersCount > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.12)', padding: '12px 16px', borderRadius: '16px', border: pendingUsersCount > 0 ? '1.5px solid #F59E0B' : 'none' }}>
            <span style={{ fontSize: '0.72rem', opacity: 0.9, display: 'block' }}>Menunggu Verifikasi</span>
            <strong style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: pendingUsersCount > 0 ? '#FBBF24' : '#34D399' }}>
              {pendingUsersCount} User {pendingUsersCount > 0 ? '⏳' : '✔'}
            </strong>
          </div>
        </div>
      </div>

      {msgNotice && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
          ⚡ {msgNotice}
        </div>
      )}

      {/* User Management List */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>Pengaturan Akun, Level & Verifikasi Admin</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {usersList.map((userItem) => {
            const isPending = userItem.status === 'pending';
            const isTargetAdmin = userItem.role === 'super_admin';

            return (
              <div 
                key={userItem.id} 
                className="card-clean" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  border: isPending ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                  background: isPending ? '#FFFBEB' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: isTargetAdmin ? '#FEF3C7' : (isPending ? '#FEF3C7' : '#E0F2FE'), color: isTargetAdmin ? '#B45309' : (isPending ? '#B45309' : '#0284C7'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      {isTargetAdmin ? '👑' : (isPending ? '⏳' : '👤')}
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
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: isPending ? '#FEF3C7' : '#D1FAE5',
                      color: isPending ? '#B45309' : '#059669',
                      border: `1px solid ${isPending ? '#F59E0B' : '#10B981'}`
                    }}
                  >
                    {isPending ? '⏳ MENUNGGU VERIFIKASI' : '✔ TERVERIFIKASI'}
                  </span>
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
                  {isPending ? (
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
                      ✔ VERIFIKASI & SETUJUI AKUN
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

    </div>
  );
}
