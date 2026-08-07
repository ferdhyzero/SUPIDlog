import React, { useState } from 'react';

export default function LocationPermissionModal({ isOpen, onClose, onRetryGps, onUseFallbackCoords }) {
  if (!isOpen) return null;

  const [activeOsTab, setActiveOsTab] = useState('android'); // 'android' or 'ios'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card-clean" style={{ background: 'white', borderRadius: '20px', padding: '20px', maxWidth: '420px', width: '100%', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Header with SVG Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEE2E2', border: '1px solid #FECDD3', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>Izin Lokasi GPS Dibutuhkan</h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>
              Browser membutuhkan izin GPS untuk merekam rute & kecepatan dayung Anda secara otomatis.
            </p>
          </div>
        </div>

        {/* OS Tab Switcher */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', gap: '2px' }}>
          <button
            onClick={() => setActiveOsTab('android')}
            style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.75rem', background: activeOsTab === 'android' ? '#0284C7' : 'transparent', color: activeOsTab === 'android' ? 'white' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            Android (Chrome/Edge)
          </button>
          <button
            onClick={() => setActiveOsTab('ios')}
            style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.75rem', background: activeOsTab === 'ios' ? '#0284C7' : 'transparent', color: activeOsTab === 'ios' ? 'white' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            iPhone (Safari/PWA)
          </button>
        </div>

        {/* OS Instructions Guide */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '12px', fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
          {activeOsTab === 'android' ? (
            <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Klik ikon <strong>Gembok / Setting 🔒</strong> di sebelah kiri alamat website (URL) di browser HP.</li>
              <li>Pilih menu <strong>Izin / Permissions</strong> $\rightarrow$ <strong>Lokasi</strong>.</li>
              <li>Ubah status menjadi <strong>Izinkan / Allow</strong>.</li>
              <li>Kembali ke halaman ini dan tekan tombol <strong>Aktifkan GPS Sekarang</strong> di bawah.</li>
            </ol>
          ) : (
            <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Buka aplikasi <strong>Pengaturan (Settings)</strong> di iPhone Anda.</li>
              <li>Pilih <strong>Privasi & Keamanan</strong> $\rightarrow$ <strong>Layanan Lokasi</strong> (Location Services).</li>
              <li>Pilih aplikasi <strong>Safari / PWA SUP.ID</strong> dan ubah ke <strong>Saat Menggunakan Aplikasi</strong>.</li>
              <li>Kembali ke browser dan tekan tombol <strong>Aktifkan GPS Sekarang</strong> di bawah.</li>
            </ol>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
          <button
            onClick={onRetryGps}
            style={{ background: '#0284C7', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Aktifkan & Minta Izin GPS Sekarang
          </button>

          <button
            onClick={onUseFallbackCoords}
            style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Gunakan Lokasi Demo (Pantai Losari Makassar)
          </button>
        </div>
      </div>
    </div>
  );
}
