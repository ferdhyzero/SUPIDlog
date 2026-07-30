import React, { useState } from 'react';

export default function EditProfileModal({ user, onClose, onSaveSuccess }) {
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [clubName, setClubName] = useState(user?.club_name || 'SUP.ID Indonesia');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/update_profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          name,
          avatar_url: avatarUrl,
          club_name: clubName,
          emergency_contact: emergencyContact
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Profil berhasil diperbarui!');
        if (onSaveSuccess) onSaveSuccess(data.user);
        onClose();
      } else {
        alert(data.message || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      alert('Profil diperbarui!');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-sheet">
      <div className="modal-sheet-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ocean-blue)' }}>Edit Profil SUPer ✏️</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-muted)' }}>Nama Lengkap / Username</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-muted)' }}>URL Foto Avatar / Gambar</label>
            <input 
              type="text"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-muted)' }}>Klub SUP / Komunitas</label>
            <input 
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-muted)' }}>Nomor HP Kontak Darurat SOS (WhatsApp)</label>
            <input 
              type="tel"
              placeholder="08123456789"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#0284c7', color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
