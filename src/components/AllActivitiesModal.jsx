import React, { useState, useEffect } from 'react';

export default function AllActivitiesModal({ userId = 2, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchAllActivities() {
      try {
        const res = await fetch(`/api/get_activities.php?user_id=${userId}`);
        const data = await res.json();
        if (data.success && data.activities) {
          setActivities(data.activities);
        }
      } catch (err) {
        console.log('Error fetching all activities:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllActivities();
  }, [userId]);

  const filteredActivities = activities.filter((act) =>
    (act.spot_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (act.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (act.water_condition || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal-sheet">
      <div className="modal-sheet-content" style={{ maxHeight: '85vh' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RIWAYAT PADDLE LENGKAP
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>
              Semua Aktivitas 🏄‍♂️
            </h2>
          </div>

          <button 
            onClick={onClose}
            style={{ background: '#E2E8F0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {/* Search Input Box */}
        <div style={{ marginBottom: '16px' }}>
          <input 
            type="text" 
            placeholder="🔍 Cari riwayat berdasarkan spot atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid #CBD5E1',
              fontSize: '0.88rem',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Activities List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            Memuat riwayat aktivitas...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            Belum ada riwayat aktivitas paddle yang dicatat.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {filteredActivities.map((act) => (
              <div 
                key={act.id} 
                className="card-clean"
                style={{
                  padding: '16px',
                  borderLeft: '4px solid var(--ocean-blue)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--aqua-light)', color: 'var(--ocean-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      📍
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{act.spot_name}</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {act.created_at ? new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sesi Paddle'}
                      </span>
                    </div>
                  </div>

                  <strong style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--ocean-blue)' }}>
                    {act.distance_km} km
                  </strong>
                </div>

                {/* Metrics Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#F8FAFC', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Duration</span>
                    <strong>{act.duration_formatted || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Avg Speed</span>
                    <strong style={{ color: 'var(--ocean-blue)' }}>{act.avg_speed || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Condition</span>
                    <strong>{act.water_condition || 'Flat'}</strong>
                  </div>
                </div>

                {act.notes && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontStyle: 'italic', margin: 0, background: 'rgba(0,180,216,0.06)', padding: '8px 10px', borderRadius: '8px' }}>
                    "{act.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <button className="btn-cta-jumbo" onClick={onClose}>
          TUTUP RIWAYAT
        </button>

      </div>
    </div>
  );
}
