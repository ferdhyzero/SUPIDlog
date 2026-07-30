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
    <div style={{ width: '100%', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>Gear Locker 🎒</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manajemen & Log Perawatan Peralatan SUP</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#0284c7',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          ➕ Tambah Gear
        </button>
      </div>

      {/* Gear List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {gearList.map((item) => (
          <div key={item.id} className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--aqua-light)', color: 'var(--ocean-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  {item.gear_type === 'Board' ? '🏄‍♂️' : item.gear_type === 'Paddle' ? '🛶' : item.gear_type === 'PFD' ? '🦺' : '⚓'}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{item.name}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--ocean-blue)', fontWeight: 600 }}>
                    {item.gear_type} • {item.purchase_date}
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', background: '#D1FAE5', padding: '4px 10px', borderRadius: '9999px' }}>
                {item.condition_status || 'Excellent ✨'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Sesi Paddle</span>
                <strong>{item.sessions_count} Sesi</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Total Jarak</span>
                <strong>{item.distance_km} km</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Harga</span>
                <strong>{item.price}</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#B45309', background: '#FEF3C7', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>💡 {item.reminder}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => handleMaintenance(item.id)}
                  style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  🧼 Cuci
                </button>
                <button 
                  onClick={() => handleDeleteGear(item.id, item.name)}
                  style={{ background: '#EF4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Gear */}
      {showAddModal && (
        <div className="modal-sheet">
          <div className="modal-sheet-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>➕ Tambah Peralatan Baru</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '28px', height: '28px' }}>✕</button>
            </div>

            <form onSubmit={handleAddGear} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Kategori Gear</label>
                <select value={gearType} onChange={(e) => setGearType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <option value="Board">Board (Papan SUP)</option>
                  <option value="Paddle">Paddle (Dayung Carbon)</option>
                  <option value="PFD">PFD (Pelampung Safety)</option>
                  <option value="Leash">Leash (Tali Kaki)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nama Peralatan & Merk</label>
                <input type="text" placeholder="Contoh: Quickblade Carbon 85" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Harga Beli</label>
                <input type="text" placeholder="Contoh: Rp4.500.000" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Catatan Perawatan</label>
                <input type="text" value={reminder} onChange={(e) => setReminder(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </div>

              <button type="submit" className="btn-cta-jumbo" style={{ marginTop: '8px' }}>
                SIMPAN KE GEAR LOCKER 🎒
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
