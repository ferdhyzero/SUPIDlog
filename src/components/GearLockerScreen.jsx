import React, { useState, useEffect } from 'react';

export default function GearLockerScreen({ userId = 2 }) {
  const [gearList, setGearList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [gearType, setGearType] = useState('Board');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [reminder, setReminder] = useState('Bilas air tawar setelah mendayung');

  const loadGear = async () => {
    try {
      const res = await fetch(`/api/get_gear.php?user_id=${userId}`);
      const data = await res.json();
      if (data.success) setGearList(data.gearItems);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGear();
  }, [userId]);

  const handleMaintenance = async (gearId) => {
    try {
      await fetch('/api/save_gear.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: 'maintain', gear_id: gearId })
      });
      loadGear();
    } catch (e) {}
  };

  const handleAddGear = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      await fetch('/api/save_gear.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: 'add', gear_type: gearType, name, price: price || 'Rp0', reminder })
      });
      setShowAddModal(false);
      setName('');
      setPrice('');
      loadGear();
    } catch (e) {}
  };

  const handleDeleteGear = async (gearId, gearName) => {
    if (!window.confirm(`Hapus '${gearName}'?`)) return;

    try {
      await fetch('/api/save_gear.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action: 'delete', gear_id: gearId })
      });
      loadGear();
    } catch (e) {}
  };

  return (
    <div style={{ width: '100%', padding: '12px 12px 24px 12px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Gear Locker</span>
        </h2>

        <button 
          onClick={() => setShowAddModal(true)}
          style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
        >
          + Tambah Gear
        </button>
      </div>

      {/* Gear List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {gearList.map((item) => (
          <div key={item.id} className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 5 8 10 8 15C8 19 10 22 12 22C14 22 16 19 16 15C16 10 15 5 12 2Z"/></svg>
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', fontWeight: 800 }}>{item.name}</strong>
                  <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, display: 'block' }}>{item.gear_type} • {item.purchase_date}</span>
                </div>
              </div>

              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', background: '#D1FAE5', padding: '3px 8px', borderRadius: '6px' }}>{item.condition_status || 'Baik'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: '#F8FAFC', padding: '8px', borderRadius: '10px', textAlign: 'center', fontSize: '0.72rem' }}>
              <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Sesi</span><strong>{item.sessions_count}</strong></div>
              <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Jarak</span><strong>{item.distance_km} km</strong></div>
              <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Harga</span><strong>{item.price}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#92400E', background: '#FEF3C7', padding: '6px 10px', borderRadius: '8px' }}>
              <span>{item.reminder}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => handleMaintenance(item.id)} style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '3px 6px', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}>Cuci</button>
                <button onClick={() => handleDeleteGear(item.id, item.name)} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '3px 6px', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}>Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Gear */}
      {showAddModal && (
        <div className="modal-sheet">
          <div className="modal-sheet-content" style={{ borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Tambah Gear Baru</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '26px', height: '26px' }}>✕</button>
            </div>

            <form onSubmit={handleAddGear} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select value={gearType} onChange={(e) => setGearType(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                <option value="Board">Board (Papan SUP)</option>
                <option value="Paddle">Paddle (Dayung)</option>
                <option value="PFD">PFD (Pelampung)</option>
                <option value="Leash">Leash (Tali Kaki)</option>
              </select>
              <input type="text" placeholder="Nama Gear & Merk" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
              <input type="text" placeholder="Harga (Rp)" value={price} onChange={(e) => setPrice(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
              <button type="submit" className="btn-cta-jumbo" style={{ marginTop: '4px' }}>Simpan Gear</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
