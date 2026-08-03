import React, { useState, useEffect, useCallback } from 'react';
import ActivityDetailModal from './ActivityDetailModal';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Auto-fit Leaflet bounds for Feed Card
function FeedMapFitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) {
      const bounds = coords.map(c => [c[0], c[1]]);
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [16, 16], maxZoom: 16 });
      }, 100);
    }
  }, [coords, map]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// MINI LEAFLET MAP FOR FEED CARD (Real Map + GPS Polyline)
// ─────────────────────────────────────────────────────────────────────
function FeedMiniMap({ routeJson }) {
  try {
    let points = typeof routeJson === 'string' ? JSON.parse(routeJson) : routeJson;
    if (!Array.isArray(points) || points.length < 2) return null;

    const coords = points.map(p => Array.isArray(p) ? p : [p.lat, p.lng]).filter(p => p[0] && p[1]);
    if (coords.length < 2) return null;

    const startPt = coords[0];
    const endPt = coords[coords.length - 1];
    const centerLat = (Math.min(...coords.map(p => p[0])) + Math.max(...coords.map(p => p[0]))) / 2;
    const centerLng = (Math.min(...coords.map(p => p[1])) + Math.max(...coords.map(p => p[1]))) / 2;

    return (
      <div style={{ height: '160px', width: '100%', borderRadius: '12px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={14}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%', pointerEvents: 'none' }}
        >
          <TileLayer url="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png" />
          <FeedMapFitBounds coords={coords} />
          <Polyline positions={coords} pathOptions={{ color: '#0284c7', weight: 4, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />
          <CircleMarker center={startPt} radius={5} pathOptions={{ fillColor: '#2DC76D', fillOpacity: 1, color: 'white', weight: 2 }} />
          <CircleMarker center={endPt} radius={4.5} pathOptions={{ fillColor: '#0284c7', fillOpacity: 1, color: 'white', weight: 2 }} />
        </MapContainer>
      </div>
    );
  } catch (e) {
    return null;
  }
}


// ─────────────────────────────────────────────────────────────────────
// ACTIVITY FEED CARD (Strava-style)
// ─────────────────────────────────────────────────────────────────────
function ActivityFeedCard({ act, currentUserId, onKudos, onComment, onClick }) {
  const [kudosCount, setKudosCount] = useState(act.kudos_count || 0);
  const [isKudosed, setIsKudosed] = useState(false);
  const [kudosLoading, setKudosLoading] = useState(false);

  const initials = (act.user_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = ['#0284c7', '#059669', '#7C3AED', '#DC2626', '#D97706', '#0891B2'];
  const colorIdx = (act.user_name || '').charCodeAt(0) % avatarColors.length;

  const hasRoute = act.route_json && act.route_json.length > 10;
  const feedMap = hasRoute ? <FeedMiniMap routeJson={act.route_json} /> : null;
  const showMap = hasRoute && feedMap;

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
      if (data.success) {
        setKudosCount(data.kudos_count);
        setIsKudosed(data.is_kudosed);
      }
    } catch (e) {}
    setKudosLoading(false);
  };

  const handleShare = async () => {
    const text = `${act.user_name} paddled ${act.distance_km} km at ${act.spot_name}! 🏄 via SUP.ID`;
    if (navigator.share) {
      try { await navigator.share({ title: 'SUP Activity', text, url: window.location.href }); } catch (e) {}
    } else {
      navigator.clipboard?.writeText(text);
      alert('Link aktivitas berhasil disalin!');
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '18px',
      border: '1px solid #E8EEF4',
      boxShadow: '0 2px 12px rgba(215, 215, 215, 0)',
      overflow: 'hidden',
      marginBottom: '2px',
    }}>
      {/* ── Clickable area: Header + Stats + Map ── */}
      <div onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* ── Header: Avatar + User + Time ── */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {act.avatar_url ? (
            <img src={act.avatar_url} alt={act.user_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${avatarColors[colorIdx]}, ${avatarColors[(colorIdx + 1) % avatarColors.length]})`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0, border: '2px solid #E2E8F0' }}>
              {initials}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.user_name}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {act.time_ago} · {act.spot_name}
            </div>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </div>

      {/* ── Activity Name ── */}
      <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '12px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', marginBottom: '10px' }}>
          {act.spot_name} Paddling Session
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display: 'flex', gap: '0', borderTop: '1px solid #F1F5F9', borderBottom: showMap ? 'none' : '1px solid #F1F5F9', paddingTop: '10px', paddingBottom: showMap ? '10px' : '10px' }}>
          {[
            { label: 'Jarak', value: `${parseFloat(act.distance_km || 0).toFixed(2)} km` },
            { label: 'Kecepatan', value: act.avg_speed || '—' },
            { label: 'Waktu', value: act.duration_formatted || '—' }
          ].map((stat, i) => (
            <div key={i} style={{ flex: 1, textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Route Map (SVG) or Gradient Placeholder ── */}
      {showMap ? (
        <div style={{ padding: '0 14px 14px' }}>
          {feedMap}
        </div>
      ) : (
        <div style={{
          margin: '0 14px 14px',
          height: '100px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0369a1 0%, #0891B2 40%, #06B6D4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ position: 'absolute', bottom: `${i * 18}px`, left: 0, right: 0, height: '2px', background: 'white', opacity: 0.6 + i * 0.08, borderRadius: '1px' }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', color: 'white', position: 'relative', zIndex: 1 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ opacity: 0.85, display: 'block', margin: '0 auto 4px' }}>
              <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
            </svg>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.9 }}>{act.water_condition || 'Flat Water'}</span>
          </div>
        </div>
      )}
      </div>{/* end clickable area */}

      {/* ── Action Bar: Kudos, Comment, Share ── */}
      <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Kudos */}
        <button
          onClick={handleKudos}
          disabled={kudosLoading || !currentUserId}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: isKudosed ? '#EFF6FF' : 'transparent',
            border: isKudosed ? '1.5px solid #BFDBFE' : '1.5px solid #E2E8F0',
            color: isKudosed ? '#2563EB' : '#64748B',
            padding: '6px 14px', borderRadius: '9999px',
            fontWeight: 800, fontSize: '0.78rem', cursor: currentUserId ? 'pointer' : 'default',
            transition: 'all 0.18s ease'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={isKudosed ? '#2563EB' : 'none'} stroke={isKudosed ? '#2563EB' : 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          Like {kudosCount > 0 && <span style={{ fontWeight: 900 }}>{kudosCount}</span>}
        </button>

        {/* Comment */}
        <button
          onClick={() => onComment && onComment(act)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: '1.5px solid #E2E8F0',
            color: '#64748B', padding: '6px 14px', borderRadius: '9999px',
            fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Komentar
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: '1.5px solid #E2E8F0',
            color: '#64748B', padding: '6px 14px', borderRadius: '9999px',
            fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN HOMESCREEN
// ─────────────────────────────────────────────────────────────────────
export default function HomeScreen({ userId = null, userName = 'Guest SUPer', onStartPaddle, onOpenAllActivities, onRequireLogin, refreshTrigger }) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'dashboard'

  // ── Feed state ──
  const [feedActivities, setFeedActivities] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // ── Dashboard state ──
  const [dashboardData, setDashboardData] = useState({
    today: { distance: '0.0', calories: 0, time: '00:00' },
    goal: { target: 100, current: 0, percent: 0 },
    recentActivities: []
  });
  const [weather, setWeather] = useState({ temp: '28°C', wind: 'Angin 6 Knot', water: 'Flat Water', status: 'REAL GPS WEATHER' });
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const modalItemsPerPage = 5;

  // Comment modal
  const [commentActivity, setCommentActivity] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // ── PWA install ──
  useEffect(() => {
    const handleBeforeInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    if (window.matchMedia('(display-mode: standalone)').matches) setPwaInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setDeferredPrompt(null); setPwaInstalled(true); }
    } else {
      alert('UNTUK INSTALL APLIKASI PWA SUPID LOG DI HP:\n\n1. Buka menu Browser (titik 3 di kanan atas Chrome / tombol Share di Safari).\n2. Pilih "Tambahkan ke Layar Utama" / "Add to Home Screen" / "Install App".\n\nAplikasi SUPID Log akan terpasang di HP Anda!');
    }
  };

  // ── Live GPS Weather ──
  useEffect(() => {
    async function fetchLiveGpsWeather(lat, lon) {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code`);
        const data = await response.json();
        if (data && data.current) {
          const tempC = Math.round(data.current.temperature_2m);
          const windKnots = Math.round(data.current.wind_speed_10m * 0.54);
          let waterCond = windKnots > 14 ? 'Rough Wave' : windKnots > 7 ? 'Choppy Water' : 'Flat Water';
          setWeather({ temp: `${tempC}°C`, wind: `Angin ${windKnots} Knot`, water: waterCond, status: 'LIVE GPS WEATHER' });
        }
      } catch (e) {}
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchLiveGpsWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchLiveGpsWeather(-5.147, 119.432),
        { timeout: 8000 }
      );
    } else {
      fetchLiveGpsWeather(-5.147, 119.432);
    }
  }, []);

  // ── Fetch All-User Activity Feed ──
  useEffect(() => {
    async function loadFeed() {
      setFeedLoading(true);
      try {
        const res = await fetch('/api/get_all_activities.php?limit=30');
        const data = await res.json();
        if (data.success) setFeedActivities(data.activities || []);
      } catch (e) {}
      setFeedLoading(false);
    }
    loadFeed();
  }, [refreshTrigger]);

  // ── Fetch User Dashboard ──
  useEffect(() => {
    if (!userId) {
      setDashboardData({ today: { distance: '0.0', calories: 0, time: '00:00' }, goal: { target: 100, current: 0, percent: 0 }, recentActivities: [] });
      setLoading(false);
      return;
    }
    async function loadDashboard() {
      try {
        const res = await fetch(`/api/get_user_dashboard.php?user_id=${userId}`);
        const data = await res.json();
        if (data.success && data.today) setDashboardData(data);
      } catch (err) {}
      finally { setLoading(false); }
    }
    loadDashboard();
  }, [userId, refreshTrigger]);

  // ── Comment Modal Logic ──
  const openCommentModal = useCallback(async (act) => {
    setCommentActivity(act);
    setCommentText('');
    try {
      const res = await fetch(`/api/get_comments.php?post_id=${act.id}&type=activity`);
      const data = await res.json();
      setComments(data.comments || data || []);
    } catch (e) { setComments([]); }
  }, []);

  const submitComment = async () => {
    if (!commentText.trim() || !userId || !commentActivity) return;
    setCommentLoading(true);
    try {
      await fetch('/api/add_comment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, post_id: commentActivity.id, type: 'activity', content: commentText.trim() })
      });
      setCommentText('');
      const res = await fetch(`/api/get_comments.php?post_id=${commentActivity.id}&type=activity`);
      const data = await res.json();
      setComments(data.comments || data || []);
    } catch (e) {}
    setCommentLoading(false);
  };

  const { today, goal, recentActivities } = dashboardData;
  const isGuest = !userId;
  const displayDistance = isGuest ? '0.0' : (today?.distance ?? '0.0');
  const displayTime = isGuest ? '00:00' : (today?.time ?? '00:00');

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', padding: '0 0 90px 0', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

      {/* ══ TAB NAVIGATOR ══ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'white',
        borderBottom: '1px solid #E8EEF4',
        padding: '10px 14px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', borderRadius: '12px', padding: '3px' }}>
          {[
            {
              key: 'feed',
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>,
              label: 'Activity Feed'
            },
            {
              key: 'dashboard',
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
              label: 'My Dashboard'
            }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '9px 4px',
                borderRadius: '10px', border: 'none',
                background: activeTab === tab.key ? 'white' : 'transparent',
                color: activeTab === tab.key ? '#0284c7' : '#64748B',
                fontWeight: activeTab === tab.key ? 900 : 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ height: '10px' }} />
      </div>

      {/* ══ TAB 1: ACTIVITY FEED ══ */}
      {activeTab === 'feed' && (
        <div style={{ padding: '12px 12px 0' }}>
          {feedLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'white', borderRadius: '18px', border: '1px solid #E8EEF4', height: '260px', animation: 'pulse 1.5s infinite' }}>
                  <div style={{ padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E2E8F0' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '60%', height: '12px', background: '#E2E8F0', borderRadius: '6px', marginBottom: '6px' }} />
                      <div style={{ width: '40%', height: '10px', background: '#E2E8F0', borderRadius: '6px' }} />
                    </div>
                  </div>
                  <div style={{ margin: '0 14px', height: '120px', background: '#E2E8F0', borderRadius: '12px' }} />
                </div>
              ))}
            </div>
          ) : feedActivities.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                </svg>
              </div>
              <p style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginBottom: '6px' }}>Belum Ada Aktivitas</p>
              <p style={{ fontSize: '0.82rem', color: '#64748B' }}>Jadilah yang pertama mencatat sesi paddle!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {feedActivities.map(act => (
                <ActivityFeedCard
                  key={act.id}
                  act={act}
                  currentUserId={userId}
                  onKudos={() => {}}
                  onComment={openCommentModal}
                  onClick={() => setSelectedActivity(act)}
                />
              ))}
              <div style={{ textAlign: 'center', padding: '10px 0 4px', fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ height: '1px', width: '40px', background: '#E2E8F0' }} />
                {feedActivities.length} aktivitas terakhir
                <div style={{ height: '1px', width: '40px', background: '#E2E8F0' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 2: MY DASHBOARD ══ */}
      {activeTab === 'dashboard' && (
        <div style={{ padding: '12px 12px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Guest prompt */}
          {isGuest && (
            <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1.5px solid #BFDBFE', borderRadius: '16px', padding: '18px', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E3A5F', marginBottom: '6px' }}>Login untuk melihat Dashboard</p>
              <p style={{ fontSize: '0.78rem', color: '#3B82F6', marginBottom: '14px' }}>Simpan sesi paddle & lihat statistik Anda</p>
              <button onClick={onRequireLogin} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px 28px', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}>
                Login Sekarang
              </button>
            </div>
          )}

          {/* Hero Greeting & Weather Card */}
          <div
            className="hero-card"
            style={{ height: '200px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)', borderRadius: '18px', padding: '18px 16px', boxShadow: '0 6px 20px rgba(2, 132, 199, 0.25)', border: '1px solid rgba(255, 255, 255, 0.25)' }}
          >
            <img src="/sup-hero-bg.webp" alt="Stand Up Paddle Boarding Indonesia" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%', opacity: 0.95, filter: 'brightness(1.05) contrast(1.05)', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(7, 13, 27, 0.10) 0%, rgba(3, 105, 161, 0.25) 100%)', zIndex: 1, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', opacity: 0.95, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.7)', color: 'white' }}>{isGuest ? 'Mode Tamu' : 'Good Morning,'}</p>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textShadow: '0 2px 6px rgba(0,0,0,0.8)', color: 'white' }}>{userName}</h2>
                </div>
                <button onClick={handleInstallClick} style={{ background: 'rgba(255,255,255,0.22)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '16px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <img src="/logo.png" alt="Logo" style={{ height: '20px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }} />
                  <span>{pwaInstalled ? 'Active' : 'Install PWA'}</span>
                </button>
              </div>




              <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: 700, marginTop: '95px' }}>
                {[
                  { icon: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>, label: weather.temp },
                  { icon: <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>, label: weather.wind },
                  { icon: <><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></>, label: weather.water }
                ].map((w, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', padding: '5px 12px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.4)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{w.icon}</svg>
                    {w.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Activity Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Today's Paddling</h3>
              <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div className="stat-value">{displayDistance}</div>
                <div className="stat-label">Distance (km)</div>
              </div>
              <div className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div className="stat-value">{displayTime}</div>
                <div className="stat-label">Duration (m:s)</div>
              </div>
            </div>
          </div>

          {/* Goal Progress Banner */}
          <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                Monthly Target (100 km)
              </span>
              <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '0.8rem' }}>{goal.percent}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${goal.percent}%`, height: '100%', background: '#0284c7', transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Recent Activity Log */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Paddles</h3>
              <button onClick={() => setShowAllActivitiesModal(true)} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>See All ➔</button>
            </div>

            {recentActivities.length === 0 ? (
              <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)' }}>
                <img src="/start-paddle-bold-blue.png" alt="SUP Paddle" style={{ width: '42px', height: '42px', margin: '0 auto 8px', display: 'block', objectFit: 'contain' }} />
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Belum ada aktivitas tercatat</p>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Tekan tombol paddle di bawah untuk memulai sesi paddle pertama Anda!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentActivities.slice(0, 5).map((act) => (
                  <div key={act.id} className="glass-panel" style={{ padding: '12px 16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{act.spot}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{act.date} • {act.type || 'Flat Water'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--ocean-primary)', fontSize: '1rem' }}>{act.distance}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.duration_formatted}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* POPUP MODAL SEMUA AKTIVITAS */}
          {showAllActivitiesModal && (
            <div className="modal-backdrop" onClick={() => setShowAllActivitiesModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', maxHeight: '80vh', background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      Semua Sesi Dayung Saya
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total {recentActivities.length} Aktivitas Tercatat</span>
                  </div>
                  <button onClick={() => setShowAllActivitiesModal(false)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                  {recentActivities && recentActivities.length > 0 ? (
                    recentActivities.slice((modalPage - 1) * modalItemsPerPage, modalPage * modalItemsPerPage).map((act, index) => (
                      <div key={act.id || index} className="card-clean" style={{ padding: '12px 14px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #00B4D8 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <strong style={{ fontSize: '0.92rem', color: '#0F172A', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.spot}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>{act.date} • {act.type || 'Flat Water'}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <strong style={{ fontSize: '0.95rem', color: '#0284c7', display: 'block', fontWeight: 800 }}>{act.distance}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{act.duration_formatted}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>Belum ada riwayat aktivitas.</div>
                  )}
                </div>

                {recentActivities && recentActivities.length > modalItemsPerPage && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '10px', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Hal <strong>{modalPage}</strong> dari <strong>{Math.ceil(recentActivities.length / modalItemsPerPage)}</strong></span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button disabled={modalPage === 1} onClick={() => setModalPage(p => Math.max(p - 1, 1))} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: modalPage === 1 ? '#E2E8F0' : 'white', color: modalPage === 1 ? '#94A3B8' : '#0284c7', fontSize: '0.7rem', fontWeight: 800, cursor: modalPage === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                      <button disabled={modalPage === Math.ceil(recentActivities.length / modalItemsPerPage)} onClick={() => setModalPage(p => Math.min(p + 1, Math.ceil(recentActivities.length / modalItemsPerPage)))} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', background: modalPage === Math.ceil(recentActivities.length / modalItemsPerPage) ? '#E2E8F0' : 'white', color: modalPage === Math.ceil(recentActivities.length / modalItemsPerPage) ? '#94A3B8' : '#0284c7', fontSize: '0.7rem', fontWeight: 800, cursor: modalPage === Math.ceil(recentActivities.length / modalItemsPerPage) ? 'not-allowed' : 'pointer' }}>Next</button>
                    </div>
                  </div>
                )}

                <button onClick={() => setShowAllActivitiesModal(false)} style={{ width: '100%', marginTop: '14px', padding: '12px', borderRadius: '12px', background: '#0284c7', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.88rem' }}>TUTUP POP-UP</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ COMMENT MODAL ══ */}
      {commentActivity && (
        <div onClick={() => setCommentActivity(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '20px 20px 0 0', padding: '20px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Komentar
              </h3>
              <button onClick={() => setCommentActivity(null)} style={{ background: '#F1F5F9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 20px', color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Jadilah yang pertama berkomentar</span>
                </div>
              ) : (
                comments.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #06B6D4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', flexShrink: 0 }}>
                      {(c.user_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, background: '#F8FAFC', borderRadius: '12px', padding: '8px 12px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0284c7', marginBottom: '2px' }}>{c.user_name || 'User'}</div>
                      <div style={{ fontSize: '0.82rem', color: '#0F172A' }}>{c.content || c.comment}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {userId ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
                  placeholder="Tulis komentar..."
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}
                />
                <button onClick={submitComment} disabled={commentLoading || !commentText.trim()} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem', opacity: !commentText.trim() ? 0.5 : 1 }}>
                  {commentLoading ? '...' : 'Kirim'}
                </button>
              </div>
            ) : (
              <button onClick={() => { setCommentActivity(null); onRequireLogin && onRequireLogin(); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0284c7', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                Login untuk berkomentar
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══ ACTIVITY DETAIL MODAL ══ */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          currentUserId={userId}
          onClose={() => setSelectedActivity(null)}
          onRequireLogin={onRequireLogin}
        />
      )}

    </div>
  );
}
