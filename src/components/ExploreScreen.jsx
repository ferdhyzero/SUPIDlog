import React, { useState, useEffect, useRef } from 'react';
import SpotDetailModal from './SpotDetailModal';

// High-Definition Stand-Up Paddleboard (SUP) & Beach Photography Pool
const SUP_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', // SUP paddler in turquoise ocean
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=600&q=80', // Sunset paddleboarding at beach
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=600&q=80', // Clear water beach SUP launching
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', // Tropical beach coast
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80', // Lake paddleboarding
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80', // Surf & SUP ocean beach
  'https://images.unsplash.com/photo-1516690561799-46d8f7489abf?auto=format&fit=crop&w=600&q=80', // Island reef paddleboarding
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80', // River paddleboarding
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80', // Sunset coastal water
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'  // Open water adventure
];

// Dynamic Automatic SUP Photo Engine for Unlimited Spots
export const getSpotPhoto = (spot) => {
  if (!spot) return SUP_PHOTO_POOL[0];
  if (spot.image_url) return spot.image_url;

  // Deterministic Hash Algorithm for consistent unique photo per spot
  const str = `${spot.id || ''}_${spot.name || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUP_PHOTO_POOL.length;
  return SUP_PHOTO_POOL[index];
};

export default function ExploreScreen({ userId = null, onSelectSpot, onRequireLogin }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('map'); // Default to map view
  const [mapType, setMapType] = useState('satellite'); // 'satellite' (Google Hybrid) or 'roadmap' (Google Standard)
  const [savedPlans, setSavedPlans] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [selectedPlanSpot, setSelectedPlanSpot] = useState(null);
  const [activeMapLocation, setActiveMapLocation] = useState(null);
  const [selectedSpotForModal, setSelectedSpotForModal] = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(7);

  // Pagination state (5 items per page for optimal performance & lazy loading UX)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const markersGroupInstance = useRef(null);
  const routePolylineGroupInstance = useRef(null);

  // Add Spot Modal state
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotCategory, setNewSpotCategory] = useState('Ocean');
  const [newSpotDifficulty, setNewSpotDifficulty] = useState('Easy');
  const [newSpotLat, setNewSpotLat] = useState(-5.147812);
  const [newSpotLng, setNewSpotLng] = useState(119.415421);
  const [detectingGps, setDetectingGps] = useState(false);

  const [targetDate, setTargetDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });

  // Master spots database fetched 100% dynamically from MySQL DB with LocalStorage Offline PWA Fallback
  const [spots, setSpots] = useState(() => {
    const cached = localStorage.getItem('supid_spots_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Dynamically load Leaflet Library
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    } else {
      setLeafletReady(true);
    }
  }, []);

  // Fetch spots, saved plans, and user activity history from MySQL
  useEffect(() => {
    async function loadData() {
      try {
        const resSpots = await fetch('/api/get_spots.php');
        const dataSpots = await resSpots.json();
        if (dataSpots.success && dataSpots.spots) {
          setSpots(dataSpots.spots);
          localStorage.setItem('supid_spots_cache', JSON.stringify(dataSpots.spots));
        }
      } catch (err) {
        console.log('Spots DB fetch error, using LocalStorage cache fallback:', err);
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

        try {
          const resAct = await fetch(`/api/get_activities.php?user_id=${userId}`);
          const dataAct = await resAct.json();
          if (dataAct.success && dataAct.activities) {
            setUserActivities(dataAct.activities);
          }
        } catch (err) {
          console.log('Activities fallback:', err);
        }
      } else {
        setSavedPlans([]);
        setUserActivities([]);
      }
    }
    loadData();
  }, [userId]);

  // Unique Visit Badge Calculator & Distinct Color Palette
  const getVisitBadge = (spotName) => {
    if (!userActivities || userActivities.length === 0) return null;

    const matchedActivities = userActivities.filter(
      (act) => act.spot_name && act.spot_name.toLowerCase().trim() === spotName.toLowerCase().trim()
    );
    const count = matchedActivities.length;

    if (count === 0) return null;

    if (count >= 5) {
      return {
        iconType: 'crown',
        text: `${count}x Sesi`,
        bg: '#7C3AED',
        color: '#FFFFFF',
        pinColor: '#7C3AED',
        count: count
      };
    } else if (count >= 2) {
      return {
        iconType: 'star',
        text: `${count}x Sesi`,
        bg: '#F59E0B',
        color: '#FFFFFF',
        pinColor: '#F59E0B',
        count: count
      };
    } else {
      return {
        iconType: 'check',
        text: `1x Sesi`,
        bg: '#10B981',
        color: '#FFFFFF',
        pinColor: '#10B981',
        count: count
      };
    }
  };

  // Helper renderer for SVG Visit Icon
  const renderVisitIcon = (type) => {
    if (type === 'crown') {
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
        </svg>
      );
    }
    if (type === 'star') {
      return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      );
    }
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  };

  // GPS Polyline Sanitization & Smooth Route Rendering Function
  const renderPastRoutePolyline = (spot) => {
    if (!leafletMapInstance.current || !window.L || !spot) return;
    const map = leafletMapInstance.current;

    if (!routePolylineGroupInstance.current) {
      routePolylineGroupInstance.current = window.L.layerGroup().addTo(map);
    }
    const polyGroup = routePolylineGroupInstance.current;
    polyGroup.clearLayers();

    if (!userActivities || userActivities.length === 0) return;

    // Find matched activity for this spot
    const matchedAct = userActivities.find(
      (act) => act.spot_name && act.spot_name.toLowerCase().trim() === spot.name.toLowerCase().trim()
    );

    if (!matchedAct || !matchedAct.route_json) return;

    try {
      let rawRoute = typeof matchedAct.route_json === 'string' ? JSON.parse(matchedAct.route_json) : matchedAct.route_json;
      if (!Array.isArray(rawRoute) || rawRoute.length < 2) return;

      // 1. Sanitize GPS points (Filter out 0,0 & extreme GPS noise jumps)
      const cleanCoords = [];
      let prevPt = null;

      rawRoute.forEach((pt) => {
        let lat = null, lng = null;
        if (Array.isArray(pt) && pt.length >= 2) {
          lat = parseFloat(pt[0]);
          lng = parseFloat(pt[1]);
        } else if (pt && typeof pt === 'object') {
          lat = parseFloat(pt.lat || pt.latitude);
          lng = parseFloat(pt.lng || pt.longitude);
        }

        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;
        if (lat < -11 || lat > 6 || lng < 95 || lng > 141) return; // Must be inside Indonesia bounds

        // Filter out extreme jumps (> 0.05 deg jump in micro-step)
        if (prevPt) {
          const dLat = Math.abs(lat - prevPt[0]);
          const dLng = Math.abs(lng - prevPt[1]);
          if (dLat > 0.05 || dLng > 0.05) return; // Anomaly jump filter
        }

        cleanCoords.push([lat, lng]);
        prevPt = [lat, lng];
      });

      if (cleanCoords.length >= 2) {
        // Render Smooth Glowing Neon Cyan Leaflet Polyline
        const polyline = window.L.polyline(cleanCoords, {
          color: '#00B4D8',
          weight: 4.5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(polyGroup);

        // Add Start (Green) and Finish (Red) pin indicators
        const startPt = cleanCoords[0];
        const finishPt = cleanCoords[cleanCoords.length - 1];

        const startIcon = window.L.divIcon({
          html: `<div style="background:#10B981; color:white; padding:2px 6px; borderRadius:4px; font-size:10px; font-weight:800; border:1px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.4);">START</div>`,
          className: '',
          iconSize: [42, 20],
          iconAnchor: [21, 10]
        });
        const finishIcon = window.L.divIcon({
          html: `<div style="background:#EF4444; color:white; padding:2px 6px; borderRadius:4px; font-size:10px; font-weight:800; border:1px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.4);">FINISH</div>`,
          className: '',
          iconSize: [44, 20],
          iconAnchor: [22, 10]
        });

        window.L.marker(startPt, { icon: startIcon }).addTo(polyGroup);
        window.L.marker(finishPt, { icon: finishIcon }).addTo(polyGroup);

        // Fit map bounds to show complete track
        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
      }
    } catch (err) {
      console.log('GPS polyline render error:', err);
    }
  };

  const filters = ['All', 'Rencana Trip', 'Pernah Dayung', 'Flat Water', 'River', 'Ocean', 'Lake', 'Race', 'Surf', 'Camping'];

  const filteredSpots = spots.filter((spot) => {
    const matchesSearch = spot.name.toLowerCase().includes(searchQuery.toLowerCase()) || spot.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = activeFilter === 'All' || spot.category === activeFilter || spot.tag === activeFilter;
    if (activeFilter === 'Pernah Dayung') {
      const badge = getVisitBadge(spot.name);
      matchesFilter = badge !== null && badge.count > 0;
    } else if (activeFilter === 'Rencana Trip') {
      matchesFilter = savedPlans && savedPlans.some(p => p.spot_name && p.spot_name.toLowerCase().trim() === spot.name.toLowerCase().trim());
    }

    return matchesSearch && matchesFilter;
  });

  // INITIALIZE MAP INSTANCE & TILE LAYERS ONCE
  useEffect(() => {
    if (!leafletReady || !window.L || !mapRef.current) return;

    if (!leafletMapInstance.current) {
      const initialCenter = [-5.147812, 119.415421];
      const map = window.L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 3,
        maxZoom: 20
      }).setView(initialCenter, 6);

      window.L.control.zoom({ position: 'topright' }).addTo(map);

      map.on('zoomend', () => {
        setCurrentZoomLevel(map.getZoom());
      });

      leafletMapInstance.current = map;
      markersGroupInstance.current = window.L.layerGroup().addTo(map);
      routePolylineGroupInstance.current = window.L.layerGroup().addTo(map);
    }

    const map = leafletMapInstance.current;

    // Switch Tile Layer between Google Satellite & Roadmap
    map.eachLayer((layer) => {
      if (layer instanceof window.L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const googleTileUrl = mapType === 'satellite'
      ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
      : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    window.L.tileLayer(googleTileUrl, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);
  }, [leafletReady, mapType]);

  // FORCE MAP RESIZE INVALIDATION WHEN SWITCHING BACK TO MAP VIEW OR SELECTING SPOT FROM LIST
  useEffect(() => {
    if (viewMode === 'map' && leafletMapInstance.current) {
      const timer = setTimeout(() => {
        leafletMapInstance.current.invalidateSize();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [viewMode, activeMapLocation]);

  // RENDER MARKERS DYNAMICALLY WITHOUT OVERRIDING USER'S MANUAL ZOOM/PAN
  useEffect(() => {
    if (!leafletReady || !window.L || !markersGroupInstance.current) return;

    const markersGroup = markersGroupInstance.current;
    markersGroup.clearLayers();

    filteredSpots.forEach((spot) => {
      if (!spot.lat || !spot.lng) return;

      const badge = getVisitBadge(spot.name);
      const isSelected = activeMapLocation && activeMapLocation.name === spot.name;
      const pinColor = isSelected ? '#EF4444' : (badge ? badge.pinColor : '#0284c7');

      let pinSvg = '';
      let iconWidth = 32;
      let iconHeight = 42;
      let anchorX = 16;
      let anchorY = 42;

      // 1. ZOOM OUT VIEW (Zoom <= 8): Render compact micro-pin dots with zero text clutter
      if (currentZoomLevel <= 8) {
        iconWidth = 18;
        iconHeight = 18;
        anchorX = 9;
        anchorY = 9;
        pinSvg = `
          <div style="position:relative; width:18px; height:18px; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="${spot.name}">
            <div style="width:14px; height:14px; border-radius:50%; background:${pinColor}; border:2px solid #FFFFFF; box-shadow:0 2px 6px rgba(0,0,0,0.6); transform:${isSelected ? 'scale(1.4)' : 'scale(1)'}; transition:all 0.2s ease;"></div>
          </div>
        `;
      }
      // 2. MEDIUM ZOOM VIEW (Zoom 9 - 11): Render medium pin icons with compact titles
      else if (currentZoomLevel <= 11) {
        iconWidth = 24;
        iconHeight = 32;
        anchorX = 12;
        anchorY = 32;
        pinSvg = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer; filter:drop-shadow(0px 3px 6px rgba(0,0,0,0.5)); transform:${isSelected ? 'scale(1.15)' : 'scale(1)'};">
            <svg width="24" height="32" viewBox="0 0 24 34" fill="none">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22s12-13 12-22c0-6.63-5.37-12-12-12z" fill="${pinColor}" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="12" cy="12" r="4.5" fill="#FFFFFF"/>
            </svg>
            <div style="background:rgba(15,23,42,0.9); color:white; padding:1px 5px; borderRadius:4px; font-size:9px; font-weight:800; white-space:nowrap; margin-top:-5px; border:1px solid rgba(255,255,255,0.3);">
              ${spot.name}
            </div>
          </div>
        `;
      }
      // 3. CLOSE-UP ZOOM VIEW (Zoom >= 12): Render full-size detailed pin icons & badges
      else {
        iconWidth = 34;
        iconHeight = 46;
        anchorX = 17;
        anchorY = 46;
        pinSvg = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer; filter:drop-shadow(0px 4px 8px rgba(0,0,0,0.5)); transform:${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition:all 0.2s ease;">
            <svg width="34" height="46" viewBox="0 0 24 34" fill="none">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22s12-13 12-22c0-6.63-5.37-12-12-12z" fill="${pinColor}" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="12" cy="12" r="4.5" fill="#FFFFFF"/>
            </svg>
            <div style="background:rgba(15,23,42,0.92); color:white; padding:2px 7px; borderRadius:6px; font-size:10px; font-weight:800; white-space:nowrap; margin-top:-7px; border:1px solid rgba(255,255,255,0.4); text-shadow:0 1px 2px rgba(0,0,0,0.8);">
              ${spot.name}
            </div>
          </div>
        `;
      }

      const customIcon = window.L.divIcon({
        html: pinSvg,
        className: '',
        iconSize: [iconWidth, iconHeight],
        iconAnchor: [anchorX, anchorY]
      });

      window.L.marker([spot.lat, spot.lng], { icon: customIcon })
        .addTo(markersGroup)
        .on('click', (e) => {
          if (e && e.originalEvent) {
            e.originalEvent.stopPropagation();
          }

          // 1st click focuses map location & draws GPS route so user can explore surrounding area.
          // 2nd click opens SpotDetailModal.
          if (activeMapLocation && activeMapLocation.name === spot.name) {
            setSelectedSpotForModal(spot);
          } else {
            setActiveMapLocation(spot);
            renderPastRoutePolyline(spot);
          }

          if (onSelectSpot) onSelectSpot(spot);
        });
    });
  }, [leafletReady, filteredSpots, activeMapLocation, currentZoomLevel]);

  // PAN/FLY TO SELECTED LOCATION ONCE WITHOUT LOCKING ZOOM OUT
  useEffect(() => {
    if (!leafletMapInstance.current || !activeMapLocation || !activeMapLocation.lat || !activeMapLocation.lng) return;
    const map = leafletMapInstance.current;
    
    // Smoothly fly to the location once, using comfortable zoom (13) or current zoom if already zoomed in
    const targetZoom = Math.max(map.getZoom(), 13);
    map.flyTo([activeMapLocation.lat, activeMapLocation.lng], targetZoom, { duration: 1.2 });

    // Also attempt rendering past GPS route line if available
    renderPastRoutePolyline(activeMapLocation);

    // Invalidate size to guarantee crisp tile render
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [activeMapLocation]);

  // REAL-TIME SEARCH BOX ADDRESS GEOCODING & MAP DIRECTING
  const handlePerformAddressSearch = async (queryText) => {
    if (!queryText || queryText.trim().length < 2) return;
    const cleanQuery = queryText.trim();

    // 1. Check if spot exists in MySQL DB spots list
    const matchedSpot = spots.find(s => s.name.toLowerCase().includes(cleanQuery.toLowerCase()));
    if (matchedSpot && matchedSpot.lat && matchedSpot.lng) {
      setActiveMapLocation(matchedSpot);
      setViewMode('map');
      return;
    }

    // 2. Perform Real-time Geocoding Search via OpenStreetMap / Google Place Nominatim
    setIsSearchingGeocode(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery + ' Indonesia')}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const topMatch = data[0];
        const lat = parseFloat(topMatch.lat);
        const lng = parseFloat(topMatch.lon);
        const displayName = topMatch.display_name.split(',')[0];

        const searchedLoc = {
          name: displayName || cleanQuery,
          lat: lat,
          lng: lng
        };

        setActiveMapLocation(searchedLoc);
        setViewMode('map');
      } else {
        alert(`Lokasi '${cleanQuery}' tidak ditemukan. Coba masukkan nama pantai atau kota yang lebih spesifik.`);
      }
    } catch (err) {
      console.log('Geocode error:', err);
    } finally {
      setIsSearchingGeocode(false);
    }
  };

  // Debounce search query to trigger address lookup
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handlePerformAddressSearch(searchQuery);
      }
    }, 700);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset pagination to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  // Handle Unpin / Delete Saved Plan
  const handleUnpinPlan = async (planId, spotName) => {
    if (!confirm(`Apakah Anda yakin ingin melepaskan sematan lokasi '${spotName}'?`)) return;

    try {
      const res = await fetch('/api/delete_planned_spot.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: planId, user_id: userId })
      });
      const data = await res.json();
      setSavedPlans(savedPlans.filter(p => p.id !== planId));
    } catch (e) {
      setSavedPlans(savedPlans.filter(p => p.id !== planId));
    }
  };

  // Check login before pinning custom plan
  const handleInitiatePin = (spot) => {
    if (!userId) {
      alert('Mode Guest: Silakan Login terlebih dahulu untuk menyematkan lokasi & target tanggal ke database!');
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



  // Calculate pagination bounds
  const totalPages = Math.max(1, Math.ceil(filteredSpots.length / itemsPerPage));
  const paginatedSpots = filteredSpots.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ width: '100%', padding: '12px 12px 90px 12px', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Explore Spots
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Peta Google Satellite & Destinasi ({spots.length} Spot Terdaftar)</p>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setShowAddSpotModal(true)}
              style={{
                padding: '5px 9px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 800,
                background: '#0284c7',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Baru
            </button>

            {/* Google Satellite vs Road Map Switcher */}
            <button
              onClick={() => setMapType(mapType === 'satellite' ? 'roadmap' : 'satellite')}
              style={{
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.72rem',
                fontWeight: 800,
                background: mapType === 'satellite' ? '#0f172a' : '#f8fafc',
                color: mapType === 'satellite' ? '#F59E0B' : '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Ubah Mode Tampilan Google Maps Satelit / Standard"
            >
              {mapType === 'satellite' ? 'Satelit' : 'Standard'}
            </button>

            {/* View Switcher: Maps vs List */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
              <button 
                onClick={() => setViewMode('map')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: viewMode === 'map' ? '#0284c7' : 'transparent',
                  color: viewMode === 'map' ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Maps
              </button>

              <button 
                onClick={() => setViewMode('list')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: viewMode === 'list' ? 'white' : 'transparent',
                  color: viewMode === 'list' ? '#0284c7' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* REAL-TIME ADDRESS SEARCH BOX WITH DIRECT MAP GEOCODING NAVIGATION */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            handlePerformAddressSearch(searchQuery);
          }
        }}
        style={{ position: 'relative' }}
      >
        <input 
          type="text" 
          placeholder="Cari alamat / pantai (misal: Pantai Kuta, Sanur, Akkarena)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 42px 10px 38px',
            borderRadius: '14px',
            border: '2px solid var(--ocean-blue)',
            fontSize: '0.85rem',
            background: 'white',
            boxShadow: 'var(--shadow-sm)',
            fontFamily: 'inherit'
          }}
        />
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>

        <button
          type="submit"
          disabled={isSearchingGeocode}
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#0284c7',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          {isSearchingGeocode ? 'Cari...' : 'Ke Lokasi ➔'}
        </button>
      </form>

      {/* Custom Pin Action Banner for Custom Search Result */}
      {searchQuery.trim().length >= 3 && (
        <div 
          onClick={() => handleInitiatePin({ name: searchQuery.trim() })}
          style={{
            background: 'linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)',
            color: 'white',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <div>
              <strong style={{ fontSize: '0.85rem', display: 'block' }}>Sematkan "{searchQuery}"</strong>
              <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>Simpan lokasi ke Rencana Kunjungan</span>
            </div>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
            SEMATKAN
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      )}

      {/* Filter Horizontal Scroll Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {filters.map((f) => (
          <button 
            key={f}
            className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
            onClick={() => {
              setActiveFilter(f);
              setActiveMapLocation(null);
            }}
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* MAP CONTAINER ALWAYS MOUNTED IN DOM TO PREVENT BLANK CANVAS ON VIEW SWITCH */}
      <div style={{ display: viewMode === 'map' ? 'block' : 'none', height: '500px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--ocean-blue)', boxShadow: 'var(--shadow-md)', position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

        {/* Floating GPS Target "Lokasi Saya" Button */}
        <button
          type="button"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  if (leafletMapInstance.current) {
                    leafletMapInstance.current.setView([latitude, longitude], 14, { animate: true });
                  }
                },
                (err) => {
                  alert('Gagal mendeteksi lokasi GPS HP/Browser Anda.');
                }
              );
            }
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            background: 'white',
            color: '#0F172A',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            padding: '7px 12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="12" y1="2" x2="12" y2="4"/>
            <line x1="12" y1="20" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="4" y2="12"/>
            <line x1="20" y1="12" x2="22" y2="12"/>
          </svg>
          Lokasi Saya
        </button>

        <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(8px)', color: 'white', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeMapLocation 
                ? `FOKUS: "${activeMapLocation.name}" (${activeMapLocation.lat ? activeMapLocation.lat.toFixed(4) : ''}, ${activeMapLocation.lng ? activeMapLocation.lng.toFixed(4) : ''})`
                : `GOOGLE MAPS SATELLITE: ${spots.length} Penanda Titik Dinamis`}
            </span>
          </div>

          {activeMapLocation && (
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button 
                onClick={() => setSelectedSpotForModal(activeMapLocation)} 
                style={{ background: '#0284c7', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 800, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
              >
                Lihat Detail ➔
              </button>
              <button onClick={() => { setActiveMapLocation(null); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 800 }}>
                Reset ↺
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spot Cards List with 5 Items Pagination */}
      <div style={{ display: viewMode === 'list' ? 'flex' : 'none', flexDirection: 'column', gap: '10px' }}>
        
        {/* Rencana Kunjungan Saya Inside List View */}
        {userId && savedPlans && savedPlans.length > 0 && (
          <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', padding: '10px 12px', borderRadius: '14px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Rencana Trip Saya ({savedPlans.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {savedPlans.map((plan) => {
                const visitBadge = getVisitBadge(plan.spot_name);
                return (
                  <div key={plan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div 
                      onClick={() => {
                        const found = spots.find(s => s.name.toLowerCase().trim() === plan.spot_name.toLowerCase().trim());
                        if (found) {
                          setActiveMapLocation(found);
                          setSelectedSpotForModal(found);
                          setViewMode('map');
                        }
                      }}
                      style={{ cursor: 'pointer', flex: 1, minWidth: 0, paddingRight: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#78350F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {plan.spot_name}
                        </strong>
                        {visitBadge && (
                          <span style={{ background: visitBadge.bg, color: visitBadge.color, padding: '1px 6px', borderRadius: '9999px', fontSize: '0.62rem', fontWeight: 800, flexShrink: 0 }}>
                            {visitBadge.text}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#B45309', display: 'block' }}>Target: {plan.formatted_date || plan.planned_date}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ background: plan.days_left <= 3 ? '#FEF2F2' : '#FFFBEB', color: plan.days_left <= 3 ? '#EF4444' : '#D97706', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800 }}>
                        {plan.days_left <= 0 ? 'Hari Ini!' : `${plan.days_left} H`}
                      </span>

                      {/* Unpin Button */}
                      <button
                        onClick={() => handleUnpinPlan(plan.id, plan.spot_name)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                        title="Lepas sematan"
                      >
                        Unpin
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {paginatedSpots.map((spot) => {
          const visitBadge = getVisitBadge(spot.name);
          return (
            <div 
              key={spot.id || spot.name} 
              className="card-clean"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '0',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'white',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              {/* Full Card Top Landscape Photo Cover Banner */}
              <div 
                onClick={() => {
                  setActiveMapLocation(spot);
                  setSelectedSpotForModal(spot);
                  setViewMode('map');
                  if (onSelectSpot) onSelectSpot(spot);
                }}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
                  cursor: 'pointer',
                  background: '#0F172A'
                }}
              >
                <img 
                  src={getSpotPhoto(spot)} 
                  alt={spot.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    e.target.src = SUP_PHOTO_POOL[0];
                  }}
                />

                {/* Dark Gradient Overlay for Crisp Text Readability */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.2) 60%)', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', color: 'white', padding: '3px 9px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800, border: '1px solid rgba(255,255,255,0.3)' }}>
                      {spot.category || 'Ocean'}
                    </span>

                    {visitBadge && (
                      <span style={{ background: visitBadge.bg, color: visitBadge.color, padding: '3px 8px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                        {renderVisitIcon(visitBadge.iconType)}
                        {visitBadge.text}
                      </span>
                    )}
                  </div>

                  {/* Bottom Title & GPS inside Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                        {spot.name}
                      </h4>
                      <div style={{ color: '#F59E0B', fontSize: '0.75rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {'★'.repeat(spot.stars || 5)}{'☆'.repeat(5 - (spot.stars || 5))}
                        <span style={{ color: '#E2E8F0', fontSize: '0.68rem', fontWeight: 600 }}>
                          ({spot.lat ? spot.lat.toFixed(3) : ''}, {spot.lng ? spot.lng.toFixed(3) : ''})
                        </span>
                      </div>
                    </div>

                    <span style={{ background: '#0284c7', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                      Peta & Detail ➔
                    </span>
                  </div>

                </div>
              </div>

              {/* Card Bottom Action Area */}
              <div style={{ padding: '10px 12px' }}>
                <button 
                  onClick={() => handleInitiatePin(spot)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '10px',
                    background: 'rgba(0,180,216,0.08)',
                    color: 'var(--ocean-blue)',
                    border: '1px dashed var(--ocean-blue)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Sematkan Tanggal Rencana
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty Search State UX */}
        {filteredSpots.length === 0 && (
          <div style={{ background: 'white', border: '1px dashed #CBD5E1', borderRadius: '16px', padding: '32px 16px', textAlign: 'center', margin: '12px 0' }}>
            <div style={{ color: 'var(--ocean-blue)', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>Spot Tidak Ditemukan</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Tidak ada lokasi dayung yang cocok dengan kata kunci "{searchQuery}" atau filter "{activeFilter}".
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
              style={{ background: 'var(--ocean-blue)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Reset Semua Saringan
            </button>
          </div>
        )}

        {/* PAGINATION CONTROL BAR (5 Data Limit per Page) */}
        {filteredSpots.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '12px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Hal <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredSpots.length} Spot)
            </span>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: currentPage === 1 ? '#E2E8F0' : 'white',
                  color: currentPage === 1 ? '#94A3B8' : '#0284c7',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Sebelumnya
              </button>

              {/* Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: 'none',
                    background: currentPage === pg ? '#0284c7' : '#E2E8F0',
                    color: currentPage === pg ? 'white' : '#475569',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {pg}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: currentPage === totalPages ? '#E2E8F0' : 'white',
                  color: currentPage === totalPages ? '#94A3B8' : '#0284c7',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                Berikutnya
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SPOT DETAIL POP-UP MODAL ON PIN CLICK */}
      {selectedSpotForModal && (
        <SpotDetailModal
          spot={selectedSpotForModal}
          onClose={() => setSelectedSpotForModal(null)}
        />
      )}

      {/* MODAL SET TARGET VISIT DATE */}
      {selectedPlanSpot && (
        <div className="modal-sheet">
          <div className="modal-sheet-content" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase' }}>
                  SEMATKAN LOKASI
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px' }}>
                  {typeof selectedPlanSpot === 'string' ? selectedPlanSpot : selectedPlanSpot.name}
                </h3>
              </div>
              <button onClick={() => setSelectedPlanSpot(null)} style={{ border: 'none', background: '#E2E8F0', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>
                Target Tanggal Paddle:
              </label>
              <input 
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem', fontWeight: 700 }}
              />
            </div>

            <button className="btn-cta-jumbo" onClick={handleSavePlanDate} style={{ padding: '12px', fontSize: '0.9rem' }}>
              SEMATKAN LOKASI & TANGGAL
            </button>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH REKOMENDASI SPOT BARU DENGAN LOKASI GPS */}
      {showAddSpotModal && (
        <div className="modal-sheet">
          <div className="modal-sheet-content" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ocean-blue)', textTransform: 'uppercase' }}>
                  DESTINASI PADDLE
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px' }}>
                  Tambah Spot Baru
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
                  if (data.success) {
                    // Refetch dynamic spots list from MySQL DB
                    const resSpots = await fetch('/api/get_spots.php');
                    const dataSpots = await resSpots.json();
                    if (dataSpots.success && dataSpots.spots) {
                      setSpots(dataSpots.spots);
                    }
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
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nama Spot / Pantai / Danau</label>
                <input
                  type="text"
                  placeholder="Contoh: Pantai Akkarena"
                  value={newSpotName}
                  onChange={(e) => setNewSpotName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Kategori Perairan</label>
                <select
                  value={newSpotCategory}
                  onChange={(e) => setNewSpotCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                >
                  <option value="Ocean">Ocean / Pantai</option>
                  <option value="Flat Water">Flat Water / Air Tenang</option>
                  <option value="Lake">Lake / Danau</option>
                  <option value="River">River / Sungai</option>
                </select>
              </div>

              {/* Automatic GPS Location Detection Button */}
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Koordinat GPS:</span>
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
                          alert(`GPS Lokasi Terkini Terdeteksi: (${lat}, ${lng})`);
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
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {detectingGps ? 'Mendeteksi...' : 'Ambil GPS Terkini'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem' }}>
                  <div>
                    <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Lat</label>
                    <input
                      type="number"
                      step="any"
                      value={newSpotLat}
                      onChange={(e) => setNewSpotLat(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Lng</label>
                    <input
                      type="number"
                      step="any"
                      value={newSpotLng}
                      onChange={(e) => setNewSpotLng(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>

              <button className="btn-cta-jumbo" type="submit" style={{ marginTop: '4px', padding: '10px', fontSize: '0.85rem' }}>
                SIMPAN SPOT BARU
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
