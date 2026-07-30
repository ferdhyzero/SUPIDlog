import React, { useState } from 'react';

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successPendingMsg, setSuccessPendingMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessPendingMsg('');
    setLoading(true);

    const endpoint = isRegister ? '/api/register.php' : '/api/login.php';
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLoading(false);

      if (data.isPending) {
        // Registration or Login blocked due to pending verification status
        if (isRegister) {
          setSuccessPendingMsg(data.message || '⏳ Pendaftaran Berhasil! Akun Anda telah tersimpan di MySQL dan saat ini MENUNGGU VERIFIKASI dari Super Admin (ferdhy).');
          setName('');
          setPassword('');
        } else {
          setErrorMsg(data.message || '⏳ Akun Anda masih MENUNGGU VERIFIKASI dari Super Admin (ferdhy).');
        }
        return;
      }

      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.message || 'Gagal masuk. Periksa kembali data Anda.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi XAMPP MySQL Anda.');
    }
  };

  const handleDemoSapril = () => {
    onLoginSuccess({
      id: 2,
      name: 'Sapril',
      email: 'sapril@sup.id',
      role: 'user',
      status: 'approved',
      level: 'Explorer',
      community_rank: 15,
      favorite_spot: 'Bosowa',
      total_distance_km: 1842,
      total_sessions: 324,
    });
  };

  const handleDemoSuperAdmin = () => {
    onLoginSuccess({
      id: 1,
      name: 'ferdhy',
      email: 'ahmadferdy66@gmail.com',
      role: 'super_admin',
      status: 'approved',
      level: 'Super Admin 👑',
      community_rank: 1,
      favorite_spot: 'All Spots',
      total_distance_km: 2450,
      total_sessions: 410,
    });
  };

  return (
    <div className="modal-sheet">
      <div className="modal-sheet-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AKUN SUP.ID INDONESIA
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {isRegister ? 'Daftar Akun Baru 🏄‍♂️' : 'Masuk ke SUPID Log 🔑'}
            </h2>
          </div>

          <button 
            onClick={onClose}
            style={{ background: '#E2E8F0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle Login / Register */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '14px', marginBottom: '20px' }}>
          <button 
            onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessPendingMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: !isRegister ? 'white' : 'transparent',
              color: !isRegister ? 'var(--ocean-blue)' : 'var(--text-muted)',
              boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer'
            }}
          >
            Masuk (Login)
          </button>
          <button 
            onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessPendingMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: isRegister ? 'white' : 'transparent',
              color: isRegister ? 'var(--ocean-blue)' : 'var(--text-muted)',
              boxShadow: isRegister ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer'
            }}
          >
            Daftar (Register)
          </button>
        </div>

        {/* Success Pending Registration Box */}
        {successPendingMsg && (
          <div style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', color: '#92400E', padding: '12px 14px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>
            {successPendingMsg}
          </div>
        )}

        {/* Error Notice Box */}
        {errorMsg && (
          <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '12px 14px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Nama Lengkap
              </label>
              <input 
                type="text" 
                placeholder="Contoh: Budi SUPer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isRegister}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Email / Username
            </label>
            <input 
              type="text" 
              placeholder="ahmadferdy66@gmail.com atau sapril@sup.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn-cta-jumbo"
            disabled={loading}
            style={{ width: '100%', marginTop: '6px' }}
          >
            {loading ? 'Memproses...' : (isRegister ? 'KIRIM PENDAFTARAN 🏄‍♂️' : 'MASUK SEKARANG 🔑')}
          </button>
        </form>

      </div>
    </div>
  );
}
