import React, { useState, useEffect } from 'react';

export default function GearLockerScreen({ userId = 2 }) {
  const [gearList, setGearList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [gearType, setGearType] = useState('Board');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [reminder, setReminder] = useState('Bilas air tawar setelah mendayung di laut');

  // Fetch Gear from MySQL
  const loadGear = async () => {
    try {
      const res = await fetch(`/api/get_gear.php?user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        setGearList(data.gearItems);
      }
    } catch (e) {
      console.log('Offline gear fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGear();
  }, [userId]);

  // Handle Maintenance Click
  const handleMaintenance = async (gearId) => {
    try {
      const res = await fetch('/api/save_gear.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'maintain',
          gear_id: gearId
        })
      });
      const data = await res.json();
      alert(data.message || 'Perawatan berhasil dicatat!');
      loadGear();
    } catch (e) {
      alert('Perawatan dicatat!');
    }
  };

  // Handle Add New Gear
  const handleAddGear = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch('/api/save_gear.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'add',
          gear_type: gearType,
          name,
          price: price || 'Rp0',
          reminder
        })
      });
      const data = await res.json();
      alert(data.message || 'Peralatan berhasil ditambahkan!');
      setShowAddModal(false);
      setName('');
      setPrice('');
      loadGear();
    } catch (e) {
      alert('Peralatan ditambahkan!');
      setShowAddModal(false);
    }
  };

  // Handle Delete Gear
  const handleDeleteGear = async (gearId, gearName) => {
    if (!window.confirm(`Hapus '${gearName}' dari Gear Locker?`)) return;

    try {
      const res = await fetch('/api/save_gear.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'delete',
          gear_id: gearId
        })
      });
      const data = await res.json();
      alert(data.message || 'Peralatan dihapus!');
      loadGear();
    } catch (e) {
      loadGear();
    }
  };

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>Gear Locker</span>
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manajemen & Log Perawatan Peralatan SUP</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#0284c7',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Tambah Gear</span>
        </button>
      </div>

      {/* Gear List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {gearList.map((item) => (
          <div key={item.id} className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.gear_type === 'Board' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C9 5 8 10 8 15C8 19 10 22 12 22C14 22 16 19 16 15C16 10 15 5 12 2Z"/>
                    </svg>
                  ) : item.gear_type === 'Paddle' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M12 2a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{item.name}</h4>
                  <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
                    {item.gear_type} • {item.purchase_date}
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', background: '#D1FAE5', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '9999px' }}>
                {item.condition_status || 'Excellent'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '12px', textAlign: 'center', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Sesi Paddle</span>
                <strong style={{ fontWeight: 800 }}>{item.sessions_count} Sesi</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Total Jarak</span>
                <strong style={{ fontWeight: 800 }}>{item.distance_km} km</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Harga</span>
                <strong style={{ fontWeight: 800 }}>{item.price}</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#92400E', background: '#FEF3C7', border: '1px solid #FCD34D', padding: '8px 12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                {item.reminder}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => handleMaintenance(item.id)}
                  style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                  <span>Cuci</span>
                </button>
                <button 
                  onClick={() => handleDeleteGear(item.id, item.name)}
                  style={{ background: '#EF4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Gear */}
      {showAddModal && (
        <div className="modal-sheet">
          <div className="modal-sheet-content" style={{ borderRadius: '20px 20px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Peralatan Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>

            <form onSubmit={handleAddGear} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Kategori Gear</label>
                <select value={gearType} onChange={(e) => setGearType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}>
                  <option value="Board">Board (Papan SUP)</option>
                  <option value="Paddle">Paddle (Dayung Carbon)</option>
                  <option value="PFD">PFD (Pelampung Safety)</option>
                  <option value="Leash">Leash (Tali Kaki)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nama Peralatan & Merk</label>
                <input type="text" placeholder="Contoh: Quickblade Carbon 85" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Harga Beli</label>
                <input type="text" placeholder="Contoh: Rp4.500.000" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Catatan Perawatan</label>
                <input type="text" value={reminder} onChange={(e) => setReminder(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} />
              </div>

              <button type="submit" className="btn-cta-jumbo" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <span>SIMPAN KE GEAR LOCKER</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
