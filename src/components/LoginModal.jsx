import React, { useState } from 'react';

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successPendingMsg, setSuccessPendingMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessPendingMsg('');
    setLoading(true);

    if (isForgotPass) {
      try {
        const response = await fetch('/api/reset_password.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, new_password: newPassword }),
        });
        const data = await response.json();
        setLoading(false);
        if (data.success) {
          setSuccessPendingMsg(data.message || '🔑 Password berhasil di-reset! Silakan login dengan password baru Anda.');
          setIsForgotPass(false);
          setPassword(newPassword);
          setNewPassword('');
        } else {
          setErrorMsg(data.message || 'Gagal mereset password.');
        }
      } catch (err) {
        setLoading(false);
        setErrorMsg('Gagal terhubung ke server.');
      }
      return;
    }

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

  return (
    <div className="modal-sheet">
      <div className="modal-sheet-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AKUN SUP.ID INDONESIA
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              {isForgotPass ? '🔑 Reset Password' : (isRegister ? 'Daftar Akun Baru 🏄‍♂️' : 'Masuk ke SUPID Log 🔑')}
            </h2>
          </div>

          <button 
            onClick={onClose}
            style={{ background: '#E2E8F0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle Login / Register / Forgot */}
        {!isForgotPass && (
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
        )}

        {/* Success Notice Box */}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
          {isRegister && !isForgotPass && (
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
              Email Terdaftar
            </label>
            <input 
              type="email" 
              placeholder="ahmadferdy66@gmail.com atau sapril@sup.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
            />
          </div>

          {!isForgotPass ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPass(true); setErrorMsg(''); setSuccessPendingMsg(''); }}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  🔑 Lupa Password?
                </button>
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Masukkan Password Baru
              </label>
              <input 
                type="text" 
                placeholder="Password Baru Anda"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn-cta-jumbo"
            disabled={loading}
            style={{ width: '100%', marginTop: '6px' }}
          >
            {loading ? 'Memproses...' : (isForgotPass ? 'SIMPAN PASSWORD BARU 🔑' : (isRegister ? 'KIRIM PENDAFTARAN 🏄‍♂️' : 'MASUK SEKARANG 🔑'))}
          </button>
        </form>

        {isForgotPass && (
          <button 
            onClick={() => { setIsForgotPass(false); setErrorMsg(''); setSuccessPendingMsg(''); }}
            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
          >
            ← Kembali ke Menu Login
          </button>
        )}

      </div>
    </div>
  );
}
