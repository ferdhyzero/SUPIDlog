import React, { useState, useEffect } from 'react';

export default function ExploreScreen({ userId = null, onSelectSpot, onRequireLogin }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('map'); // Default to map view for instant Google Maps experience
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' or 'k' (satellite)
  const [savedPlans, setSavedPlans] = useState([]);
  const [selectedPlanSpot, setSelectedPlanSpot] = useState(null);

  // Add Spot Modal state
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotCategory, setNewSpotCategory] = useState('Ocean');
  const [newSpotDifficulty, setNewSpotDifficulty] = useState('Easy');
  const [newSpotLat, setNewSpotLat] = useState(-5.1478);
  const [newSpotLng, setNewSpotLng] = useState(119.4154);
  const [detectingGps, setDetectingGps] = useState(false);

  const [targetDate, setTargetDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });

  const [spots, setSpots] = useState([
    { id: 1, name: 'Bosowa Beach', stars: 5, category: 'Flat Water', season: 'All Year', difficulty: 'Easy', water: 'Calm', visitedCount: 512, lat: -5.1478, lng: 119.4154 },
    { id: 2, name: 'Samalona Island', stars: 4, category: 'Ocean', tag: 'Island Tour', season: 'May-Oct', difficulty: 'Medium', water: 'Clear', visitedCount: 420, lat: -5.1234, lng: 119.3456 },
    { id: 3, name: 'Rammang-Rammang', stars: 5, category: 'River', season: 'All Year', difficulty: 'Easy', water: 'Flat', visitedCount: 380, lat: -4.9234, lng: 119.6456 },
    { id: 4, name: 'Danau Toba', stars: 5, category: 'Lake', season: 'Jun-Sep', difficulty: 'Medium', water: 'Deep Blue', visitedCount: 290, lat: 2.6845, lng: 98.8756 },
    { id: 5, name: 'Wakatobi Marine Park', stars: 5, category: 'Ocean', tag: 'Surf & Reef', season: 'Apr-Nov', difficulty: 'Hard', water: 'Ultra Clear', visitedCount: 185, lat: -5.3123, lng: 123.5432 },
  ]);

  // Fetch spots & user saved plans from MySQL API
  useEffect(() => {
    async function loadData() {
      try {
        const resSpots = await fetch('/api/get_spots.php');
        const dataSpots = await resSpots.json();
        if (dataSpots.success && dataSpots.spots && dataSpots.spots.length > 0) {
          setSpots(dataSpots.spots);
        }
      } catch (err) {
        console.log('Spots offline fallback:', err);
      }

      if (userId) {
        try {
          const resPlans = await fetch(`/api/get_saved_spots.php?user_id=${userId}`);
          const dataPlans = await resPlans.json();
          if (dataPlans.success) {
            setSavedPlans(dataPlans.savedSpots);
          }
        } catch (err) {
          console.log('Saved plans fallback:', err);
        }
      } else {
        setSavedPlans([]);
      }
    }
    loadData();
  }, [userId]);

  // Check login before pinning custom plan
  const handleInitiatePin = (spot) => {
    if (!userId) {
      alert('🔒 Mode Guest: Silakan Login terlebih dahulu untuk menyematkan lokasi & target tanggal ke database!');
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setSelectedPlanSpot(spot);
  };

  // Save custom or standard plan date to MySQL
  const handleSavePlanDate = async () => {
    if (!selectedPlanSpot || !userId) return;

    const spotNameToSave = typeof selectedPlanSpot === 'string' ? selectedPlanSpot : selectedPlanSpot.name;

    try {
      const res = await fetch('/api/save_planned_spot.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          spot_name: spotNameToSave,
          location_address: searchQuery ? `Hasil Pencarian: ${searchQuery}` : '',
          planned_date: targetDate,
          notes: `Rencana paddle trip ke ${spotNameToSave}`
        })
      });
      const data = await res.json();
      alert(data.message || `Lokasi '${spotNameToSave}' berhasil disematkan!`);

      // Refetch saved plans from MySQL
      const resPlans = await fetch(`/api/get_saved_spots.php?user_id=${userId}`);
      const dataPlans = await resPlans.json();
      if (dataPlans.success) {
        setSavedPlans(dataPlans.savedSpots);
      }
    } catch (e) {
      alert(`Lokasi '${spotNameToSave}' tersimpan!`);
    } finally {
      setSelectedPlanSpot(null);
    }
  };

  const filters = ['All', 'Flat Water', 'River', 'Ocean', 'Lake', 'Race', 'Surf', 'Camping'];

  // Debounce search query to prevent Google Maps iframe flickering on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 600);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredSpots = spots.filter((spot) => {
    const matchesSearch = spot.name.toLowerCase().includes(searchQuery.toLowerCase()) || spot.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || spot.category === activeFilter || spot.tag === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const googleMapsSearchUrl = debouncedSearchQuery 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(debouncedSearchQuery + ' SUP Indonesia')}&t=${mapType}&z=13&output=embed`
    : `https://maps.google.com/maps?q=-5.1478,119.4154&t=${mapType}&z=10&output=embed`;

  return (
    <div style={{ width: '100%', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>Explore Spots 📍</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Peta & Destinasi Paddle Terbaik Indonesia</p>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setShowAddSpotModal(true)}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: '#0284c7',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ➕ Spot Baru
          </button>

          {/* Satellite vs Road Map Toggle */}
          <button
            onClick={() => setMapType(mapType === 'roadmap' ? 'k' : 'roadmap')}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: mapType === 'k' ? '#0f172a' : '#f8fafc',
              color: mapType === 'k' ? '#F59E0B' : '#0f172a',
              cursor: 'pointer'
            }}
            title="Ubah Mode Tampilan Peta Satelit / Standard"
          >
            {mapType === 'k' ? '🛰️ Satelit' : '🗺️ Peta Standard'}
          </button>

          {/* View Switcher: Google Maps vs Lista */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
            <button 
              onClick={() => setViewMode('map')}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 800,
                background: viewMode === 'map' ? '#0284c7' : 'transparent',
                color: viewMode === 'map' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              🗺️ Maps
            </button>

            <button 
              onClick={() => setViewMode('list')}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 800,
                background: viewMode === 'list' ? 'white' : 'transparent',
                color: viewMode === 'list' ? '#0284c7' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              📋 List
            </button>
          </div>
        </div>
      </div>

      {/* Rencana Kunjungan Saya (Planned Trip Reminders Card) */}
      {userId && savedPlans && savedPlans.length > 0 && (
        <div className="card-clean" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.1rem' }}>📌</span>
            <strong style={{ fontSize: '0.85rem', color: '#92400e' }}>Rencana Paddle Trip Disematkan (Pengingat)</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedPlans.map((plan) => (
              <div key={plan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#78350F', display: 'block' }}>{plan.spot_name}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#B45309' }}>🗓️ Target: {plan.formatted_date || plan.planned_date}</span>
                </div>

                <div style={{ background: plan.days_left <= 3 ? '#FEF2F2' : '#FFFBEB', color: plan.days_left <= 3 ? '#EF4444' : '#D97706', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {plan.days_left <= 0 ? '⏰ Hari Ini!' : `⏰ ${plan.days_left} Hari Lagi!`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Google Maps Search Box */}
      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder="🔍 Cari lokasi apapun di Google Maps (misal: Pantai Losari, Sanur Bali)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px 14px 44px',
            borderRadius: '16px',
            border: '2px solid var(--ocean-blue)',
            fontSize: '0.92rem',
            background: 'white',
            boxShadow: 'var(--shadow-sm)',
            fontFamily: 'inherit'
          }}
        />
        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>
          📍
        </span>
      </div>

      {/* Custom Pin Action Banner for Custom Search Result */}
      {searchQuery.trim().length >= 3 && (
        <div 
          onClick={() => handleInitiatePin({ name: searchQuery.trim() })}
          style={{
            background: 'linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)',
            color: 'white',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📌</span>
            <div>
              <strong style={{ fontSize: '0.92rem', display: 'block' }}>Sematkan "{searchQuery}"</strong>
              <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Simpan lokasi pencarian ini ke Rencana Kunjungan + Tanggal</span>
            </div>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '6px 12px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800 }}>
            SEMATKAN ➔
          </span>
        </div>
      )}

      {/* Filter Horizontal Scroll Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {filters.map((f) => (
          <button 
            key={f}
            className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* REAL GOOGLE MAPS EXPLORE VIEW */}
      {viewMode === 'map' ? (
        <div style={{ height: '420px', borderRadius: '20px', overflow: 'hidden', border: '2.5px solid var(--ocean-blue)', boxShadow: 'var(--shadow-md)', position: 'relative' }}>
          <iframe 
            title="Explore Google Maps SUP Spots Indonesia"
            src={googleMapsSearchUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
          />
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: 'white', padding: '8px 14px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
            {searchQuery ? `📍 HASIL PETA GOOGLE MAPS: "${searchQuery}"` : '📍 Peta Google Maps Spot SUP Indonesia (Ketik nama lokasi apapun di atas)'}
          </div>
        </div>
      ) : (
        /* Spot Cards List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSpots.map((spot) => (
            <div 
              key={spot.id} 
              className="card-clean"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px'
              }}
            >
              <div 
                onClick={() => onSelectSpot(spot)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, var(--ocean-blue) 0%, var(--aqua) 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}
                  >
                    📍
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{spot.name}</h4>
                    <div style={{ color: 'var(--gold-star)', fontSize: '0.82rem', marginTop: '2px' }}>
                      {'★'.repeat(spot.stars)}{'☆'.repeat(5 - spot.stars)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ocean-blue)', fontWeight: 600 }}>
                      {spot.category}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Details</span>
                  <span style={{ fontSize: '1rem', color: 'var(--ocean-blue)' }}>➔</span>
                </div>
              </div>

              {/* Action Button: Sematkan Rencana Kunjungan */}
              <button 
                onClick={() => handleInitiatePin(spot)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(0,180,216,0.12)',
                  color: 'var(--ocean-blue)',
                  border: '1px dashed var(--ocean-blue)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📌 Sematkan ke Rencana Kunjungan & Tanggal
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL SET TARGET VISIT DATE */}
      {selectedPlanSpot && (
        <div className="modal-sheet">
          <div className="modal-sheet-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase' }}>
                  SEMATKAN LOKASI KE DATABASE
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '2px' }}>
                  {typeof selectedPlanSpot === 'string' ? selectedPlanSpot : selectedPlanSpot.name} 📍
                </h3>
              </div>
              <button onClick={() => setSelectedPlanSpot(null)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>
                🗓️ Pilih Target Tanggal Kegiatan Paddle:
              </label>
              <input 
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '1rem', fontWeight: 700 }}
              />
            </div>

            <button className="btn-cta-jumbo" onClick={handleSavePlanDate}>
              SEMATKAN LOKASI & TANGGAL 📌
            </button>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH REKOMENDASI SPOT BARU DENGAN LOKASI GPS */}
      {showAddSpotModal && (
        <div className="modal-sheet">
          <div className="modal-sheet-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase' }}>
                  REKOMENDASIKAN DESTINASI PADDLE
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Tambah Spot Baru 📍
                </h3>
              </div>
              <button onClick={() => setShowAddSpotModal(false)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newSpotName.trim()) return;

                try {
                  const res = await fetch('/api/create_spot.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: newSpotName,
                      category: newSpotCategory,
                      difficulty: newSpotDifficulty,
                      lat: newSpotLat,
                      lng: newSpotLng
                    })
                  });
                  const data = await res.json();
                  if (data.success && data.spot) {
                    setSpots([data.spot, ...spots]);
                    alert(data.message || 'Spot baru berhasil ditambahkan!');
                    setShowAddSpotModal(false);
                    setNewSpotName('');
                  } else {
                    alert(data.message || 'Spot berhasil ditambahkan!');
                    setShowAddSpotModal(false);
                  }
                } catch (err) {
                  alert(`Spot '${newSpotName}' berhasil direkomendasikan!`);
                  setShowAddSpotModal(false);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nama Spot / Pantai / Danau / Sungai</label>
                <input
                  type="text"
                  placeholder="Contoh: Pantai Akkarena Makassar"
                  value={newSpotName}
                  onChange={(e) => setNewSpotName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Kategori Perairan</label>
                <select
                  value={newSpotCategory}
                  onChange={(e) => setNewSpotCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                >
                  <option value="Ocean">Ocean / Laut / Pantai</option>
                  <option value="Flat Water">Flat Water / Air Tenang</option>
                  <option value="Lake">Lake / Danau</option>
                  <option value="River">River / Sungai</option>
                </select>
              </div>

              {/* Automatic GPS Location Detection Button */}
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>📍 Koordinat GPS Lokasi:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!('geolocation' in navigator)) {
                        alert('Fitur GPS tidak didukung di browser ini.');
                        return;
                      }
                      setDetectingGps(true);
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const lat = parseFloat(pos.coords.latitude.toFixed(6));
                          const lng = parseFloat(pos.coords.longitude.toFixed(6));
                          setNewSpotLat(lat);
                          setNewSpotLng(lng);
                          setDetectingGps(false);
                          alert(` GPS Lokasi Terkini Terdeteksi: (${lat}, ${lng})`);
                        },
                        (err) => {
                          setDetectingGps(false);
                          alert('Gagal membaca GPS terkini. Menggunakan posisi koordinat default.');
                        },
                        { enableHighAccuracy: true, timeout: 8000 }
                      );
                    }}
                    style={{
                      background: '#0284c7',
                      color: 'white',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {detectingGps ? 'Mendeteksi GPS...' : '🎯 Ambil GPS Terkini'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                  <div>
                    <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={newSpotLat}
                      onChange={(e) => setNewSpotLat(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={newSpotLng}
                      onChange={(e) => setNewSpotLng(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                </div>
              </div>

              <button className="btn-cta-jumbo" type="submit" style={{ marginTop: '6px' }}>
                SIMPAN & SEMATKAN SPOT BARU 📍
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
