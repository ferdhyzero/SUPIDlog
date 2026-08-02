import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ─────────────────────────────────────────────────────────────────────
// Auto-fit map bounds to route
// ─────────────────────────────────────────────────────────────────────
function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) {
      const bounds = coords.map(c => [c[0], c[1]]);
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      }, 200);
    }
  }, [coords, map]);
  return null;
}

// Map Tile Options
const MAP_TILES = {
  street: {
    label: 'Biasa',
    url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
    attribution: '&copy; CartoDB & OSM'
  },
  satellite: {
    label: 'Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery'
  }
};

// ─────────────────────────────────────────────────────────────────────
// ACTIVITY DETAIL MODAL (SUP.ID Blue Theme, Map Switcher, 3D Perspective, Replay)
// ─────────────────────────────────────────────────────────────────────
export default function ActivityDetailModal({ activity, currentUserId, onClose, onRequireLogin }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [kudosCount, setKudosCount] = useState(activity?.kudos_count || 0);
  const [isKudosed, setIsKudosed] = useState(false);
  const [kudosLoading, setKudosLoading] = useState(false);

  // Map layer state: 'street' | 'satellite'
  const [mapType, setMapType] = useState('satellite'); // Default satellite like Strava 3D
  // 3D Perspective Tilt state
  const [is3D, setIs3D] = useState(true); // Default 3D perspective mode

  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [animIndex, setAnimIndex] = useState(null); // null means show full route
  const animRef = useRef(null);

  const act = activity;
  if (!act) return null;

  const initials = (act.user_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = ['#0284c7', '#059669', '#7C3AED', '#DC2626', '#D97706', '#0891B2'];
  const colorIdx = (act.user_name || '').charCodeAt(0) % avatarColors.length;

  // Parse route
  let routeCoords = [];
  try {
    const raw = typeof act.route_json === 'string' ? JSON.parse(act.route_json) : act.route_json;
    if (Array.isArray(raw) && raw.length >= 2) {
      routeCoords = raw.map(p => Array.isArray(p) ? p : [p.lat, p.lng]).filter(p => p[0] && p[1]);
    }
  } catch (e) {}

  const hasRoute = routeCoords.length >= 2;
  const startPt = hasRoute ? routeCoords[0] : null;
  const endPt = hasRoute ? routeCoords[routeCoords.length - 1] : null;
  const centerLat = hasRoute ? (Math.min(...routeCoords.map(p => p[0])) + Math.max(...routeCoords.map(p => p[0]))) / 2 : -5.147;
  const centerLng = hasRoute ? (Math.min(...routeCoords.map(p => p[1])) + Math.max(...routeCoords.map(p => p[1]))) / 2 : 119.432;

  // Display route: either slice when playing animation or full route
  const displayedRoute = (isPlaying && animIndex !== null)
    ? routeCoords.slice(0, animIndex + 1)
    : routeCoords;

  const currentMarker = (isPlaying && animIndex !== null && routeCoords[animIndex])
    ? routeCoords[animIndex]
    : endPt;

  // Play animation controller
  const handlePlayAnimation = () => {
    if (!hasRoute) return;
    if (isPlaying) {
      clearInterval(animRef.current);
      setIsPlaying(false);
      setAnimIndex(null);
      return;
    }

    setIsPlaying(true);
    setAnimIndex(1);

    const stepTime = Math.max(30, Math.floor(3000 / routeCoords.length));
    let idx = 1;

    animRef.current = setInterval(() => {
      idx++;
      if (idx >= routeCoords.length) {
        clearInterval(animRef.current);
        setIsPlaying(false);
        setAnimIndex(null);
      } else {
        setAnimIndex(idx);
      }
    }, stepTime);
  };

  useEffect(() => {
    return () => clearInterval(animRef.current);
  }, []);

  // Load comments
  useEffect(() => {
    if (!act.id) return;
    fetch(`/api/get_comments.php?post_id=${act.id}&type=activity`)
      .then(r => r.json())
      .then(data => setComments(data.comments || data || []))
      .catch(() => setComments([]));
  }, [act.id]);

  const handleKudos = async () => {
    if (!currentUserId) return;
    setKudosLoading(true);
    try {
      const res = await fetch('/api/toggle_kudos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, activity_id: act.id })
      });
      const data = await res.json();
      if (data.success) { setKudosCount(data.kudos_count); setIsKudosed(data.is_kudosed); }
    } catch (e) {}
    setKudosLoading(false);
  };

  const submitComment = async () => {
    if (!commentText.trim() || !currentUserId) return;
    setCommentLoading(true);
    try {
      await fetch('/api/add_comment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, post_id: act.id, type: 'activity', content: commentText.trim() })
      });
      setCommentText('');
      const res = await fetch(`/api/get_comments.php?post_id=${act.id}&type=activity`);
      const data = await res.json();
      setComments(data.comments || data || []);
    } catch (e) {}
    setCommentLoading(false);
  };

  // Stats data
  const stats = [
    { icon: <><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></>, label: 'Jarak', value: `${parseFloat(act.distance_km || 0).toFixed(2)} km`, color: '#0284c7' },
    { icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, label: 'Durasi', value: act.duration_formatted || '—', color: '#059669' },
    { icon: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></>, label: 'Kecepatan', value: act.avg_speed || '—', color: '#D97706' },
    { icon: <><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></>, label: 'Kalori', value: act.calories ? `${act.calories} kcal` : '—', color: '#DC2626' },
  ];

  return (
    <div className="activity-detail-overlay" onClick={onClose}>
      <div className="activity-detail-sheet" onClick={e => e.stopPropagation()}>

        {/* ── Leaflet Map Container + Floating Controls ── */}
        <div style={{ height: '55vh', background: mapType === 'satellite' ? '#111827' : '#e5e1d6', position: 'relative', zIndex: 1, overflow: 'hidden', perspective: '1000px' }}>
          
          {/* Top Left Back Button */}
          <button onClick={onClose} style={{
            position: 'absolute', top: '16px', left: '16px', zIndex: 1000,
            background: 'white', border: 'none', width: '40px', height: '40px',
            borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          {/* Map Controls Right Side */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')} style={{
              background: 'white', border: 'none', width: '40px', height: '40px',
              borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 12 12 17 22 12"></polyline><polyline points="2 17 12 22 22 17"></polyline></svg>
            </button>
            <button onClick={() => setIs3D(!is3D)} style={{
              background: 'white', border: 'none', width: '40px', height: '40px',
              borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)', fontWeight: 800, fontSize: '0.9rem', color: 'black'
            }}>
              {is3D ? '2D' : '3D'}
            </button>
          </div>

          {hasRoute ? (
            <>
              {/* Bottom Right Play Button */}
              <button onClick={handlePlayAnimation} disabled={isPlaying} style={{
                position: 'absolute', bottom: '20px', right: '16px', zIndex: 1000,
                background: 'white', border: 'none', width: '60px', height: '60px',
                borderRadius: '50%', cursor: isPlaying ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'all 0.2s ease', opacity: isPlaying ? 0.7 : 1
              }}>
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><rect x="7" y="7" width="10" height="10"/></svg>
                ) : (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(2px)' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )}
              </button>

              <div style={{
                height: '100%',
                width: '100%',
                transform: is3D ? 'translateY(5%) rotateX(50deg) scale(1.8)' : 'none',
                transformOrigin: 'center center',
                transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
              }}>
                <MapContainer
                  center={[centerLat, centerLng]}
                  zoom={14}
                  scrollWheelZoom={false}
                  dragging={true}
                  zoomControl={false}
                  attributionControl={false}
                  style={{ height: '55vh', width: '100%', zIndex: 1 }}
                >
                <TileLayer url={MAP_TILES[mapType]?.url || MAP_TILES.street.url} attribution={MAP_TILES[mapType]?.attribution || ''} />
                <FitBounds coords={routeCoords} />

                {/* Outer Glow Stroke for SUP.ID Ocean Blue Contrast */}
                <Polyline
                  positions={displayedRoute}
                  pathOptions={{ color: '#0369a1', weight: 6.5, opacity: 0.7, lineCap: 'round', lineJoin: 'round' }}
                />
                {/* Main SUP.ID Ocean Blue Polyline */}
                <Polyline
                  positions={displayedRoute}
                  pathOptions={{ color: '#00D2FF', weight: 4, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
                />

                {/* Start marker (green) */}
                <CircleMarker center={startPt} radius={7} pathOptions={{ fillColor: '#2DC76D', fillOpacity: 1, color: 'white', weight: 3 }} />
                {/* End / Moving marker (cyan blue dot) */}
                <CircleMarker center={currentMarker} radius={6.5} pathOptions={{ fillColor: '#00D2FF', fillOpacity: 1, color: 'white', weight: 3 }} />
              </MapContainer>
              </div>
            </>
          ) : (
            <div style={{
              height: '100%',
              background: 'linear-gradient(135deg, #0369a1, #0891B2, #06B6D4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
              <div style={{ textAlign: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" style={{ opacity: 0.7, marginBottom: '8px' }}>
                  <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                </svg>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>Tidak ada rute GPS tercatat</div>
              </div>
            </div>
          )}
        </div>

        {/* ── User Info ── */}
        <div style={{ padding: '16px', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            {act.avatar_url ? (
              <img src={act.avatar_url} alt={act.user_name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #E2E8F0' }} />
            ) : (
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColors[colorIdx]}, ${avatarColors[(colorIdx + 1) % avatarColors.length]})`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', border: '2.5px solid #E2E8F0' }}>
                {initials}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>{act.user_name}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {act.time_ago} · {act.formatted_date || ''}
              </div>
            </div>
          </div>
          <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0F172A', marginBottom: '4px' }}>
            {act.spot_name} Paddling Session
          </h2>
          {act.weather && (
            <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
              {act.water_condition || 'Flat Water'} · {act.weather}
            </div>
          )}
        </div>

        {/* ── Stats Grid ── */}
        <div style={{ padding: '0 16px 16px', background: 'white' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                background: '#F8FAFC',
                borderRadius: '14px',
                padding: '14px',
                border: '1px solid #E8EEF4',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Kudos Bar ── */}
        <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '10px' }}>
          <button
            onClick={handleKudos}
            disabled={kudosLoading || !currentUserId}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: isKudosed ? '#EFF6FF' : '#F8FAFC',
              border: isKudosed ? '1.5px solid #BFDBFE' : '1.5px solid #E2E8F0',
              color: isKudosed ? '#2563EB' : '#64748B',
              padding: '10px', borderRadius: '12px',
              fontWeight: 800, fontSize: '0.82rem', cursor: currentUserId ? 'pointer' : 'default',
              transition: 'all 0.18s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isKudosed ? '#2563EB' : 'none'} stroke={isKudosed ? '#2563EB' : 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            Kudos {kudosCount > 0 && <span style={{ fontWeight: 900 }}>{kudosCount}</span>}
          </button>
        </div>

        {/* ── Comments Section ── */}
        <div style={{ padding: '16px 16px 24px', background: 'white', borderTop: '1px solid #F1F5F9' }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Komentar ({comments.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', maxHeight: '220px', overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Jadilah yang pertama berkomentar</span>
              </div>
            ) : (
              comments.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #06B6D4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem', flexShrink: 0 }}>
                    {(c.user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, background: '#F8FAFC', borderRadius: '12px', padding: '8px 12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#0284c7', marginBottom: '2px' }}>{c.user_name || 'User'}</div>
                    <div style={{ fontSize: '0.82rem', color: '#0F172A' }}>{c.content || c.comment}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment input */}
          {currentUserId ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
                placeholder="Tulis komentar..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem', outline: 'none', background: '#F8FAFC' }}
              />
              <button
                onClick={submitComment}
                disabled={commentLoading || !commentText.trim()}
                style={{
                  background: '#0284c7', color: 'white', border: 'none',
                  padding: '10px 16px', borderRadius: '12px', fontWeight: 800,
                  cursor: 'pointer', fontSize: '0.82rem',
                  opacity: !commentText.trim() ? 0.5 : 1
                }}
              >
                {commentLoading ? '...' : 'Kirim'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onClose(); onRequireLogin && onRequireLogin(); }}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0284c7', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}
            >
              Login untuk berkomentar
            </button>
          )}
        </div>

        {/* Bottom safe area so bottom navigation bar does not cover comment input */}
        <div style={{ height: '90px', background: 'white' }} />
      </div>
    </div>
  );
}
