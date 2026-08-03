import React, { useState, useEffect, useRef } from 'react';
import SpotDetailModal from './SpotDetailModal';

// High-Definition Stand-Up Paddleboard (SUP) & Tropical Ocean Photography Pool
const SUP_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', // Stand Up Paddleboarder in clear turquoise sea
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', // White sand tropical beach
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=600&q=80', // Sunset ocean paddleboarding
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=600&q=80', // Crystal clear lagoon & SUP
  'https://images.unsplash.com/photo-1516690561799-46d8f7489abf?auto=format&fit=crop&w=600&q=80', // Tropical island ocean coast
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80', // Bali ocean beach reef
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80', // Ocean shoreline sunset
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80'  // Lake & mountain paddle trip
];

export const getSpotPhoto = (spot) => {
  if (!spot) return SUP_PHOTO_POOL[0];
  if (spot.image_url) return spot.image_url;

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
  const [viewMode, setViewMode] = useState('map');
  const [mapType, setMapType] = useState('satellite');
  const [savedPlans, setSavedPlans] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [selectedPlanSpot, setSelectedPlanSpot] = useState(null);
  const [activeMapLocation, setActiveMapLocation] = useState(null);
  const [selectedSpotForModal, setSelectedSpotForModal] = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(7);
  const [showListBottomSheet, setShowListBottomSheet] = useState(false);

  // Autocomplete Suggestions State
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);

  // Double-Click / Race Condition Lock State
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Pagination state
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

  // Fetch Master Spots and Saved Plans from MySQL
  useEffect(() => {
    async function loadData() {
      try {
        const resSpots = await fetch('/api/get_spots.php');
        const dataSpots = await resSpots.json();
        if (dataSpots.success && dataSpots.spots) {
          setSpots(dataSpots.spots);
          localStorage.setItem('supid_spots_cache', JSON.stringify(dataSpots.spots));
        }
      } catch (e) {}

      if (userId) {
        try {
          const resPlans = await fetch(`/api/get_saved_spots.php?user_id=${userId}`);
          const dataPlans = await resPlans.json();
          if (dataPlans.success) {
            setSavedPlans(dataPlans.savedSpots);
          }
        } catch (e) {}

        try {
          const resAct = await fetch(`/api/get_user_analytics.php?user_id=${userId}&period=yearly`);
          const dataAct = await resAct.json();
          if (dataAct.success && dataAct.activities) {
            setUserActivities(dataAct.activities);
          }
        } catch (e) {}
      }
    }
    loadData();
  }, [userId]);

  // Helper Badge Visit Count per spot
  const getVisitBadge = (spotName) => {
    if (!userActivities || userActivities.length === 0) return null;
    const matchCount = userActivities.filter(
      (act) => act.spot_name && act.spot_name.toLowerCase().trim() === spotName.toLowerCase().trim()
    ).length;

    if (matchCount <= 0) return null;
    if (matchCount >= 5) {
      return { type: 'crown', label: `${matchCount}x (Home Spot)`, bg: '#F59E0B', color: '#FFFFFF', pinColor: '#F59E0B', count: matchCount };
    } else if (matchCount >= 2) {
      return { type: 'star', label: `${matchCount}x (Favorit)`, bg: '#0284C7', color: '#FFFFFF', pinColor: '#0284C7', count: matchCount };
    } else {
      return { type: 'check', label: `1x Selesai`, bg: '#10B981', color: '#FFFFFF', pinColor: '#10B981', count: matchCount };
    }
  };

  const renderPastRoutePolyline = (spot) => {
    if (!leafletMapInstance.current || !window.L || !spot) return;
    const map = leafletMapInstance.current;

    if (!routePolylineGroupInstance.current) {
      routePolylineGroupInstance.current = window.L.layerGroup().addTo(map);
    }
    const polyGroup = routePolylineGroupInstance.current;
    polyGroup.clearLayers();

    if (!userActivities || userActivities.length === 0) return;

    const matchedAct = userActivities.find(
      (act) => act.spot_name && act.spot_name.toLowerCase().trim() === spot.name.toLowerCase().trim()
    );

    if (!matchedAct || !matchedAct.route_json) return;

    try {
      let rawRoute = typeof matchedAct.route_json === 'string' ? JSON.parse(matchedAct.route_json) : matchedAct.route_json;
      if (!Array.isArray(rawRoute) || rawRoute.length < 2) return;

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
        if (lat < -11 || lat > 6 || lng < 95 || lng > 141) return;

        if (prevPt) {
          const dLat = Math.abs(lat - prevPt[0]);
          const dLng = Math.abs(lng - prevPt[1]);
          if (dLat > 0.05 || dLng > 0.05) return;
        }

        cleanCoords.push([lat, lng]);
        prevPt = [lat, lng];
      });

      if (cleanCoords.length >= 2) {
        const polyline = window.L.polyline(cleanCoords, {
          color: '#00F2FE',
          weight: 4,
          opacity: 0.9,
          dashArray: '6, 8',
          lineCap: 'round'
        });
        polyGroup.addLayer(polyline);
      }
    } catch (err) {}
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

      // Map click handler (1x click = reverse geocode to search bar + blue banner, 2x dblclick = open detail modal)
      let mapClickTimer = null;

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        if (mapClickTimer) {
          clearTimeout(mapClickTimer);
          mapClickTimer = null;
          // DOUBLE CLICK (2x): Open detail modal directly
          handleMapPointInteraction(lat, lng, 'dblclick');
        } else {
          mapClickTimer = setTimeout(() => {
            mapClickTimer = null;
            // SINGLE CLICK (1x): Reverse geocode & update search input + blue banner
            handleMapPointInteraction(lat, lng, 'click');
          }, 280);
        }
      });

      leafletMapInstance.current = map;
      markersGroupInstance.current = window.L.layerGroup().addTo(map);
      routePolylineGroupInstance.current = window.L.layerGroup().addTo(map);
    }

    const map = leafletMapInstance.current;

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

  // Smart Reverse Geocoding Map Click Handler (POI Name Priority -> Road/Village Fallback)
  const handleMapPointInteraction = async (lat, lng, actionType) => {
    let placeName = '';
    let placeCategory = 'Pilihan Peta';

    // 1. Proximity check against local database spots (within ~500m / 0.005 degrees)
    const nearbySpot = spots.find(s => {
      if (!s.lat || !s.lng) return false;
      const dLat = Math.abs(parseFloat(s.lat) - lat);
      const dLng = Math.abs(parseFloat(s.lng) - lng);
      return dLat < 0.005 && dLng < 0.005;
    });

    if (nearbySpot) {
      placeName = nearbySpot.name;
      placeCategory = nearbySpot.category || 'Spot SUP';
    } else {
      // 2. Fetch OpenStreetMap Reverse Geocoding with Address Details (zoom 18 for high POI resolution)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await res.json();

        if (data && data.address) {
          const addr = data.address;
          // Priority A: Point of Interest / Tourism / Natural feature / Resort / Camp name
          const poiName = addr.tourism || addr.leisure || addr.amenity || addr.natural || addr.waterway || addr.beach || addr.attraction || addr.park || addr.camp_site || addr.hotel || addr.resort || addr.building;
          
          if (poiName) {
            const subLoc = addr.village || addr.suburb || addr.city_district || addr.county || '';
            placeName = subLoc ? `${poiName} (${subLoc})` : poiName;
            placeCategory = 'POI Spot';
          } else if (addr.road || addr.pedestrian) {
            // Priority B: Street / Road Name
            const roadName = addr.road || addr.pedestrian;
            const subLoc = addr.village || addr.suburb || addr.city_district || addr.county || '';
            placeName = subLoc ? `${roadName}, ${subLoc}` : roadName;
            placeCategory = 'Jalan / Area';
          } else if (addr.village || addr.suburb || addr.city || addr.county) {
            // Priority C: Village / District / City Name
            placeName = addr.village || addr.suburb || addr.city || addr.county;
            placeCategory = 'Kawasan / Daerah';
          } else if (data.display_name) {
            placeName = data.display_name.split(',')[0].trim();
          }
        }
      } catch (e) {}

      if (!placeName) {
        placeName = `Lokasi Peta (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
    }

    const clickedLoc = {
      name: placeName,
      lat: lat,
      lng: lng,
      category: placeCategory
    };

    // 1x Click: Set search bar text, active location, & trigger blue banner
    setSearchQuery(placeName);
    setActiveMapLocation(clickedLoc);
    setShowSuggestionsDropdown(false);

    // 2x Double Click: Open Spot Detail Modal directly
    if (actionType === 'dblclick') {
      setSelectedSpotForModal(clickedLoc);
    }
  };

  useEffect(() => {
    if (viewMode === 'map' && leafletMapInstance.current) {
      const timer = setTimeout(() => {
        leafletMapInstance.current.invalidateSize();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [viewMode, activeMapLocation]);

  // RENDER MARKERS DYNAMICALLY WITH STRIKING CRIMSON RED COLOR (#EF4444)
  useEffect(() => {
    if (!leafletReady || !window.L || !markersGroupInstance.current) return;

    const markersGroup = markersGroupInstance.current;
    markersGroup.clearLayers();

    filteredSpots.forEach((spot) => {
      if (!spot.lat || !spot.lng) return;

      const badge = getVisitBadge(spot.name);
      const isSelected = activeMapLocation && activeMapLocation.name === spot.name;
      const pinColor = isSelected ? '#F59E0B' : (badge ? badge.pinColor : '#EF4444');
      const strokeColor = isSelected ? '#FFFFFF' : '#B91C1C';

      let pinSvg = '';
      let iconWidth = 32;
      let iconHeight = 42;
      let anchorX = 16;
      let anchorY = 42;

      if (currentZoomLevel <= 8) {
        iconWidth = 20;
        iconHeight = 20;
        anchorX = 10;
        anchorY = 10;
        pinSvg = `
          <div style="position:relative; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="${spot.name}">
            <div style="width:16px; height:16px; border-radius:50%; background:#EF4444; border:2.5px solid #FFFFFF; box-shadow:0 3px 8px rgba(0,0,0,0.7); transform:${isSelected ? 'scale(1.5)' : 'scale(1)'}; transition:all 0.2s ease;"></div>
          </div>
        `;
      } else if (currentZoomLevel <= 11) {
        iconWidth = 26;
        iconHeight = 34;
        anchorX = 13;
        anchorY = 34;
        pinSvg = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer; filter:drop-shadow(0px 4px 8px rgba(0,0,0,0.6)); transform:${isSelected ? 'scale(1.2)' : 'scale(1)'};">
            <svg width="26" height="34" viewBox="0 0 24 34" fill="none">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22s12-13 12-22c0-6.63-5.37-12-12-12z" fill="${pinColor}" stroke="${strokeColor}" stroke-width="2.2"/>
              <circle cx="12" cy="12" r="5" fill="#FBBF24" stroke="#FFFFFF" stroke-width="1.5"/>
            </svg>
            <div style="background:#0F172A; color:#FFFFFF; padding:2px 6px; borderRadius:4px; font-size:9px; font-weight:900; white-space:nowrap; margin-top:-5px; border:1px solid #EF4444; box-shadow:0 2px 6px rgba(0,0,0,0.5);">
              ${spot.name}
            </div>
          </div>
        `;
      } else {
        iconWidth = 36;
        iconHeight = 48;
        anchorX = 18;
        anchorY = 48;
        pinSvg = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer; filter:drop-shadow(0px 5px 10px rgba(0,0,0,0.7)); transform:${isSelected ? 'scale(1.25)' : 'scale(1)'}; transition:all 0.2s ease;">
            <svg width="36" height="48" viewBox="0 0 24 34" fill="none">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22s12-13 12-22c0-6.63-5.37-12-12-12z" fill="${pinColor}" stroke="${strokeColor}" stroke-width="2.5"/>
              <circle cx="12" cy="12" r="5.5" fill="#FBBF24" stroke="#FFFFFF" stroke-width="1.5"/>
            </svg>
            <div style="background:#0F172A; color:#FFFFFF; padding:2px 8px; borderRadius:6px; font-size:10px; font-weight:900; white-space:nowrap; margin-top:-7px; border:1.5px solid #EF4444; text-shadow:0 1px 3px rgba(0,0,0,0.9); box-shadow:0 3px 8px rgba(0,0,0,0.6);">
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

          if (activeMapLocation && activeMapLocation.name === spot.name) {
            setSelectedSpotForModal(spot);
          } else {
            setActiveMapLocation(spot);
            renderPastRoutePolyline(spot);
          }

          if (onSelectSpot) onSelectSpot(spot);
        });
    });

    // Render custom activeMapLocation pin if it's a custom clicked location
    if (activeMapLocation && activeMapLocation.lat && activeMapLocation.lng) {
      const isCustomLoc = !filteredSpots.some(s => s.name === activeMapLocation.name);
      if (isCustomLoc) {
        const customTargetSvg = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer; filter:drop-shadow(0px 5px 12px rgba(0,0,0,0.8)); transform:scale(1.25); z-index:999;">
            <svg width="36" height="48" viewBox="0 0 24 34" fill="none">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22s12-13 12-22c0-6.63-5.37-12-12-12z" fill="#00F2FE" stroke="#FFFFFF" stroke-width="2.5"/>
              <circle cx="12" cy="12" r="5.5" fill="#F59E0B" stroke="#FFFFFF" stroke-width="1.5"/>
            </svg>
            <div style="background:#0F172A; color:#00F2FE; padding:3px 8px; borderRadius:6px; font-size:10px; font-weight:900; white-space:nowrap; margin-top:-7px; border:1.5px solid #00F2FE; box-shadow:0 3px 8px rgba(0,0,0,0.7);">
              📍 ${activeMapLocation.name}
            </div>
          </div>
        `;

        const customIcon = window.L.divIcon({
          html: customTargetSvg,
          className: '',
          iconSize: [36, 48],
          iconAnchor: [18, 48]
        });

        window.L.marker([activeMapLocation.lat, activeMapLocation.lng], { icon: customIcon })
          .addTo(markersGroup)
          .on('click', () => {
            setSelectedSpotForModal(activeMapLocation);
          });
      }
    }
  }, [leafletReady, filteredSpots, activeMapLocation, currentZoomLevel]);

  // PAN/FLY TO SELECTED LOCATION WITH PRECISE COORDINATES
  useEffect(() => {
    if (!leafletMapInstance.current || !activeMapLocation || !activeMapLocation.lat || !activeMapLocation.lng) return;
    const map = leafletMapInstance.current;
    
    const targetZoom = Math.max(map.getZoom(), 13);
    map.flyTo([activeMapLocation.lat, activeMapLocation.lng], targetZoom, { duration: 1.2 });

    renderPastRoutePolyline(activeMapLocation);

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [activeMapLocation]);

  // HIGH-PRECISION MULTI-ENGINE AUTOCOMPLETE SEARCH (DB Fuzzy Matcher + Nominatim + Photon Geocoder)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestionsList([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    const rawQuery = searchQuery.trim();
    const qLower = rawQuery.toLowerCase();
    const queryTokens = qLower.split(/\s+/).filter(t => t.length > 0);

    // 1. Instant Tokenized Fuzzy Matching on Local DB Spots
    const localMatches = spots.filter(s => {
      const sName = (s.name || '').toLowerCase();
      const sCat = (s.category || '').toLowerCase();
      const sWater = (s.water || '').toLowerCase();
      const sTag = (s.tag || '').toLowerCase();
      const combined = `${sName} ${sCat} ${sWater} ${sTag}`;
      return queryTokens.every(token => combined.includes(token));
    }).map(s => ({
      name: s.name,
      address: s.name + (s.category ? ` (${s.category})` : ''),
      category: s.category || 'Spot SUP',
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lng),
      source: 'database'
    }));

    setSuggestionsList(localMatches.slice(0, 5));
    setShowSuggestionsDropdown(true);

    // 2. Multi-Engine Geocoding API with 250ms Debounce
    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const geoResults = [];

        // Engine 1: OpenStreetMap Nominatim with Address Details
        const searchUrl = rawQuery.toLowerCase().includes('indonesia')
          ? `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(rawQuery)}&limit=8`
          : `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=id&q=${encodeURIComponent(rawQuery)}&limit=8`;

        const resNom = await fetch(searchUrl);
        const dataNom = await resNom.json();

        if (dataNom && dataNom.length > 0) {
          dataNom.forEach(g => {
            const parts = g.display_name.split(',').map(p => p.trim());
            const primaryName = parts[0];
            const secondaryName = parts.length > 1 ? parts.slice(1, 3).join(', ') : '';
            const fullTitle = secondaryName ? `${primaryName} (${secondaryName})` : primaryName;

            geoResults.push({
              name: primaryName,
              address: fullTitle,
              lat: parseFloat(g.lat),
              lng: parseFloat(g.lon),
              category: g.type ? g.type.toUpperCase() : 'MAPS',
              source: 'nominatim'
            });
          });
        }

        // Engine 2: Photon Komoot Geocoder Fallback for beaches, bays, rivers, lakes, landmarks
        if (geoResults.length < 3) {
          try {
            const resPhoton = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(rawQuery)}&limit=6`);
            const dataPhoton = await resPhoton.json();
            if (dataPhoton && dataPhoton.features) {
              dataPhoton.features.forEach(f => {
                const props = f.properties || {};
                const coords = f.geometry ? f.geometry.coordinates : null;
                if (coords && coords.length >= 2) {
                  const pName = props.name || props.street || rawQuery;
                  const pCity = props.city || props.state || props.country || '';
                  const fullTitle = pCity ? `${pName} (${pCity})` : pName;

                  if (!geoResults.some(g => g.name.toLowerCase() === pName.toLowerCase())) {
                    geoResults.push({
                      name: pName,
                      address: fullTitle,
                      lat: parseFloat(coords[1]),
                      lng: parseFloat(coords[0]),
                      category: props.osm_value ? props.osm_value.toUpperCase() : 'GEO',
                      source: 'photon'
                    });
                  }
                }
              });
            }
          } catch (e) {}
        }

        // Combine DB matches and Geocode Results (removing duplicates)
        const combinedList = [...localMatches];
        geoResults.forEach(gItem => {
          if (!combinedList.some(c => c.name.toLowerCase() === gItem.name.toLowerCase())) {
            combinedList.push(gItem);
          }
        });

        setSuggestionsList(combinedList.slice(0, 8));
      } catch (err) {
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, spots]);

  // Handle selecting a suggestion from autocomplete dropdown
  const handleSelectSuggestion = (item) => {
    setSearchQuery(item.name);
    setShowSuggestionsDropdown(false);
    
    const locObj = {
      name: item.name,
      lat: item.lat,
      lng: item.lng,
      category: item.category || 'Custom Spot'
    };

    // ONLY navigate map, do not force modal open directly
    setActiveMapLocation(locObj);
    setViewMode('map');
  };

  // Perform Address Search Submit
  const handlePerformAddressSearch = async (queryText) => {
    if (!queryText || queryText.trim().length < 2) return;
    const cleanQuery = queryText.trim();
    const queryTokens = cleanQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    setShowSuggestionsDropdown(false);

    // 1. Check local DB spots with tokenized matching
    const matchedSpot = spots.find(s => {
      const sName = (s.name || '').toLowerCase();
      const sCat = (s.category || '').toLowerCase();
      const combined = `${sName} ${sCat}`;
      return queryTokens.every(token => combined.includes(token));
    });

    if (matchedSpot && matchedSpot.lat && matchedSpot.lng) {
      setActiveMapLocation(matchedSpot);
      setViewMode('map');
      return;
    }

    // 2. Perform Multi-Engine Geocoding
    setIsSearchingGeocode(true);
    try {
      const searchUrl = cleanQuery.toLowerCase().includes('indonesia')
        ? `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(cleanQuery)}`
        : `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=id&q=${encodeURIComponent(cleanQuery)}`;

      const res = await fetch(searchUrl);
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
        // Fallback to Photon Komoot API
        const resPhoton = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=1`);
        const dataPhoton = await resPhoton.json();

        if (dataPhoton && dataPhoton.features && dataPhoton.features.length > 0) {
          const f = dataPhoton.features[0];
          const coords = f.geometry.coordinates;
          const pName = f.properties.name || cleanQuery;

          const searchedLoc = {
            name: pName,
            lat: parseFloat(coords[1]),
            lng: parseFloat(coords[0])
          };

          setActiveMapLocation(searchedLoc);
          setViewMode('map');
        } else {
          alert(`Lokasi '${cleanQuery}' tidak ditemukan. Coba ketik nama pantai, danau, sungai, atau kota secara spesifik.`);
        }
      }
    } catch (err) {
    } finally {
      setIsSearchingGeocode(false);
    }
  };

  const handleUnpinPlan = async (planId, spotName) => {
    if (!confirm(`Apakah Anda yakin ingin melepaskan sematan lokasi '${spotName}'?`)) return;

    try {
      await fetch('/api/delete_planned_spot.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: planId, user_id: userId })
      });
      setSavedPlans(savedPlans.filter(p => p.id !== planId));
    } catch (e) {
      setSavedPlans(savedPlans.filter(p => p.id !== planId));
    }
  };

  const handleInitiatePin = (spot) => {
    if (!userId) {
      alert('Mode Guest: Silakan Login terlebih dahulu untuk menyematkan lokasi!');
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setSelectedPlanSpot(spot);
  };

  // SAVE PLANNED SPOT WITH HIGH-PRECISION LAT/LNG AND DOUBLE-CLICK LOCK
  const handleSavePlanDate = async () => {
    if (!selectedPlanSpot || !userId || isSavingPlan) return;

    setIsSavingPlan(true);
    const spotNameToSave = typeof selectedPlanSpot === 'string' ? selectedPlanSpot : selectedPlanSpot.name;
    const spotLat = typeof selectedPlanSpot === 'object' ? selectedPlanSpot.lat : (activeMapLocation ? activeMapLocation.lat : null);
    const spotLng = typeof selectedPlanSpot === 'object' ? selectedPlanSpot.lng : (activeMapLocation ? activeMapLocation.lng : null);

    try {
      const res = await fetch('/api/save_planned_spot.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          spot_name: spotNameToSave,
          location_address: searchQuery ? `Pencarian: ${searchQuery}` : '',
          lat: spotLat,
          lng: spotLng,
          planned_date: targetDate,
          notes: `Rencana trip ke ${spotNameToSave}`
        })
      });
      const data = await res.json();
      alert(data.message || `Lokasi '${spotNameToSave}' berhasil disematkan!`);

      const resPlans = await fetch(`/api/get_saved_spots.php?user_id=${userId}`);
      const dataPlans = await resPlans.json();
      if (dataPlans.success) {
        setSavedPlans(dataPlans.savedSpots);
      }
      setSelectedPlanSpot(null);
    } catch (e) {
      alert(`Lokasi '${spotNameToSave}' tersimpan!`);
      setSelectedPlanSpot(null);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleCreateCustomSpot = async (e) => {
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
      alert(data.message || 'Spot baru berhasil ditambahkan!');
      setShowAddSpotModal(false);
      setNewSpotName('');

      const resSpots = await fetch('/api/get_spots.php');
      const dataSpots = await resSpots.json();
      if (dataSpots.success) {
        setSpots(dataSpots.spots);
      }
    } catch (err) {
      setShowAddSpotModal(false);
    }
  };

  // DELETE SPOT (only for spots created by current user)
  const handleDeleteSpot = async (spot) => {
    if (!userId) {
      alert('Silakan login terlebih dahulu.');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus spot "${spot.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const res = await fetch('/api/delete_spot.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spot_id: spot.id, user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        // Refresh spots list
        const resSpots = await fetch('/api/get_spots.php');
        const dataSpots = await resSpots.json();
        if (dataSpots.success) {
          setSpots(dataSpots.spots);
          localStorage.setItem('supid_spots_cache', JSON.stringify(dataSpots.spots));
        }
        // Refresh saved plans
        if (userId) {
          const resPlans = await fetch(`/api/get_saved_spots.php?user_id=${userId}`);
          const dataPlans = await resPlans.json();
          if (dataPlans.success) setSavedPlans(dataPlans.savedSpots);
        }
      } else {
        alert(data.message || 'Gagal menghapus spot.');
      }
    } catch (e) {
      alert('Terjadi error saat menghapus spot.');
    }
  };

  const totalPages = Math.ceil(filteredSpots.length / itemsPerPage) || 1;
  const paginatedSpots = filteredSpots.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 125px)', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* ── FULL-HEIGHT LEAFLET MAP CONTAINER ── */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* ── FLOATING TOP CONTROLS OVERLAY (SEARCH & FILTERS) ── */}
      <div style={{
        position: 'absolute', top: '8px', left: '8px', right: '8px', zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: '6px'
      }}>
        {/* Search Input Bar */}
        <div style={{ position: 'relative' }}>
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
              placeholder="Cari Spot pantai, danau, sungai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (suggestionsList.length > 0) setShowSuggestionsDropdown(true); }}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: '24px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'white',
                color: '#0F172A',
                boxShadow: '0 3px 14px rgba(0,0,0,0.18)',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            <button
              type="submit"
              disabled={isSearchingGeocode}
              style={{
                position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7'
              }}
              title="Cari Spot"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestionsDropdown && suggestionsList.length > 0 && (
            <div 
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)', zIndex: 2000, maxHeight: '200px', overflowY: 'auto'
              }}
            >
              <div style={{ padding: '6px 10px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.65rem', fontWeight: 800, color: '#0284c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>REKOMENDASI SPOT ({suggestionsList.length})</span>
                <button
                  type="button"
                  onClick={() => { setShowSuggestionsDropdown(false); setSuggestionsList([]); }}
                  style={{ background: '#EF4444', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Tutup
                </button>
              </div>

              {suggestionsList.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  style={{
                    padding: '7px 10px', borderBottom: idx === suggestionsList.length - 1 ? 'none' : '1px solid #F1F5F9',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: 'white'
                  }}
                >
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: item.source === 'database' ? '#E0F2FE' : '#FEF3C7', color: item.source === 'database' ? '#0284c7' : '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 800, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.address || item.name}</strong>
                    <span style={{ fontSize: '0.62rem', color: '#0284c7', fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Horizontal Chips */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none', padding: '1px 0' }}>
          {filters.map((f) => (
            <button 
              key={f}
              onClick={() => { setActiveFilter(f); setActiveMapLocation(null); }}
              style={{
                padding: '4px 10px', borderRadius: '16px', border: 'none', fontSize: '0.66rem', fontWeight: 800,
                background: activeFilter === f ? '#0284c7' : 'white',
                color: activeFilter === f ? 'white' : '#0F172A',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT ACTION BUTTON STACK (LAYER & MY LOCATION) ── */}
      <div style={{
        position: 'absolute', top: '95px', right: '10px', zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        {/* Layer Map Switcher Button (Outline Layers Icon) */}
        <button
          type="button"
          onClick={() => setMapType(mapType === 'satellite' ? 'roadmap' : 'satellite')}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'white', color: '#0F172A', border: 'none',
            boxShadow: '0 3px 12px rgba(0,0,0,0.2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title={mapType === 'satellite' ? 'Tampilan Peta Biasa' : 'Tampilan Peta Satelit'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 12 12 17 22 12"/>
            <polyline points="2 17 12 22 22 17"/>
          </svg>
        </button>

        {/* My Location GPS Target Button */}
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
                () => alert('Gagal mendeteksi lokasi GPS.')
              );
            }
          }}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'white', color: '#0F172A', border: 'none',
            boxShadow: '0 3px 12px rgba(0,0,0,0.2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="Lokasi Saya (GPS Target)"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="12" y1="2" x2="12" y2="4"/>
            <line x1="12" y1="20" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="4" y2="12"/>
            <line x1="20" y1="12" x2="22" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── FLOATING BUTTON "+ BUAT SPOT" (RIGHT BOTTOM ABOVE CAROUSEL) ── */}
      <button
        type="button"
        onClick={() => setShowAddSpotModal(true)}
        style={{
          position: 'absolute', bottom: '180px', right: '10px', zIndex: 1000,
          background: 'white', color: '#0F172A', border: 'none',
          padding: '7px 14px', borderRadius: '24px', fontWeight: 900, fontSize: '0.75rem',
          boxShadow: '0 3px 14px rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', gap: '5px',
          cursor: 'pointer'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        + Buat Spot
      </button>

      {/* ── HORIZONTAL SPOT CARDS CAROUSEL (BOTTOM OVER MAP) ── */}
      <div style={{
        position: 'absolute', bottom: '40px', left: 0, right: 0, zIndex: 1000,
        padding: '0 10px', overflowX: 'auto', display: 'flex', gap: '10px',
        scrollbarWidth: 'none', scrollSnapType: 'x mandatory'
      }}>
        {filteredSpots.map((spot) => {
          const badge = getVisitBadge(spot.name);
          const isSelected = activeMapLocation && activeMapLocation.name === spot.name;

          return (
            <div
              key={spot.id}
              onClick={() => {
                setActiveMapLocation(spot);
                if (leafletMapInstance.current && spot.lat && spot.lng) {
                  leafletMapInstance.current.flyTo([spot.lat, spot.lng], 14, { duration: 1.2 });
                }
              }}
              style={{
                width: '215px', flexShrink: 0, scrollSnapAlign: 'center',
                background: 'white', borderRadius: '14px', border: isSelected ? '2px solid #0284c7' : '1px solid #E2E8F0',
                overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.16)', cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Hero Photo Header */}
              <div style={{ position: 'relative', height: '90px', width: '100%', overflow: 'hidden' }}>
                <img src={getSpotPhoto(spot)} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,23,42,0.8) 100%)' }} />

                <div style={{ position: 'absolute', top: '6px', left: '6px', display: 'flex', gap: '4px' }}>
                  <span style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', color: 'white', padding: '2px 7px', borderRadius: '9999px', fontSize: '0.62rem', fontWeight: 800 }}>
                    {spot.category || 'Spot SUP'}
                  </span>
                  {badge && (
                    <span style={{ background: badge.bg, color: badge.color, padding: '2px 6px', borderRadius: '9999px', fontSize: '0.6rem', fontWeight: 900 }}>
                      {badge.label}
                    </span>
                  )}
                </div>

                <div style={{ position: 'absolute', bottom: '6px', left: '8px', right: '8px' }}>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 900, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {spot.name}
                  </h4>
                </div>
              </div>

              {/* Card Footer Content */}
              <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                <span style={{ fontSize: '0.63rem', color: '#64748B', fontWeight: 700 }}>
                  📍 {spot.lat ? (+spot.lat).toFixed(3) : '-5.147'}, {spot.lng ? (+spot.lng).toFixed(3) : '119.415'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSpotForModal(spot);
                  }}
                  style={{
                    background: '#0284c7', color: 'white', border: 'none',
                    padding: '3px 8px', borderRadius: '14px', fontSize: '0.65rem',
                    fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px'
                  }}
                >
                  Detail ➔
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── BOTTOM DRAWER BAR HANDLE (CLICK/PULL TO SEE ALL SPOTS) ── */}
      <div 
        onClick={() => setShowListBottomSheet(true)}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
          height: '36px', background: 'white', borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          boxShadow: '0 -3px 12px rgba(0,0,0,0.1)', cursor: 'pointer'
        }}
      >
        <div style={{ width: '28px', height: '3px', background: '#CBD5E1', borderRadius: '2px', position: 'absolute', top: '5px' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
          📋 {filteredSpots.length} Spot Dayung <span style={{ color: '#0284c7', fontSize: '0.7rem' }}>▲ Lihat Semua</span>
        </span>
      </div>

      {/* ── POP-UP BOTTOM SHEET FOR SPOTS LIST ── */}
      {showListBottomSheet && (
        <div 
          className="activity-detail-overlay"
          onClick={() => setShowListBottomSheet(false)}
        >
          <div 
            className="activity-detail-sheet"
            onClick={e => e.stopPropagation()} 
            style={{ 
              padding: '16px 16px 90px 16px',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}
          >
            {/* Drag handle */}
            <div style={{ width: '42px', height: '5px', background: '#CBD5E1', borderRadius: '3px', margin: '0 auto 4px auto' }} />

            {/* Header inside Bottom Sheet */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>Daftar Spot Dayung ({filteredSpots.length})</h3>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Pilih spot untuk melihat lokasi di peta</span>
              </div>
              <button 
                onClick={() => setShowListBottomSheet(false)} 
                style={{ background: '#E2E8F0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800, color: '#475569' }}
              >
                ✕
              </button>
            </div>

            {/* Saved Trips Section */}
            {userId && savedPlans && savedPlans.length > 0 && (
              <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', padding: '10px 12px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Rencana Trip Saya ({savedPlans.length})
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {savedPlans.map((plan) => (
                    <div 
                      key={plan.id} 
                      onClick={() => {
                        setShowListBottomSheet(false);
                        setViewMode('map');
                        if (plan.lat && plan.lng) {
                          setActiveMapLocation({ name: plan.spot_name, lat: parseFloat(plan.lat), lng: parseFloat(plan.lng) });
                        } else {
                          const matched = spots.find(s => s.name.toLowerCase().trim() === plan.spot_name.toLowerCase().trim());
                          if (matched) setActiveMapLocation(matched);
                        }
                      }}
                      style={{ background: 'white', padding: '8px 10px', borderRadius: '10px', border: '1px solid #FCD34D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: '#78350F', display: 'block' }}>{plan.spot_name}</strong>
                        <span style={{ fontSize: '0.7rem', color: '#B45309' }}>Tanggal: {plan.formatted_date || plan.planned_date}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleUnpinPlan(plan.id, plan.spot_name); }} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '3px 7px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}>Lepas</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paginated Spots Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paginatedSpots.map((spot) => {
                const badge = getVisitBadge(spot.name);

                return (
                  <div 
                    key={spot.id} 
                    style={{ 
                      background: 'white', 
                      borderRadius: '18px', 
                      border: '1px solid #E2E8F0', 
                      overflow: 'hidden', 
                      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div 
                      onClick={() => {
                        setShowListBottomSheet(false);
                        setViewMode('map');
                        setActiveMapLocation(spot);
                      }}
                      style={{ position: 'relative', height: '130px', width: '100%', overflow: 'hidden', cursor: 'pointer' }}
                    >
                      <img src={getSpotPhoto(spot)} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)' }} />

                      <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                        <span style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800 }}>
                          {spot.category || 'Custom Spot'}
                        </span>
                        {badge && (
                          <span style={{ background: badge.bg, color: badge.color, padding: '3px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 900 }}>
                            {badge.label}
                          </span>
                        )}
                      </div>

                      {userId && (
                        (spot.created_by && parseInt(spot.created_by) === parseInt(userId)) ||
                        spot.category === 'Custom Spot'
                      ) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSpot(spot); }}
                          style={{
                            position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px',
                            borderRadius: '8px', background: 'rgba(239, 68, 68, 0.85)', backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                          }}
                          title="Hapus Spot Ini"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}

                      <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', margin: 0 }}>
                            {spot.name}
                          </h3>
                          <div style={{ fontSize: '0.7rem', color: '#FCD34D', fontWeight: 700, marginTop: '2px' }}>
                            ({spot.lat ? (+spot.lat).toFixed(3) : '-5.147'}, {spot.lng ? (+spot.lng).toFixed(3) : '119.415'})
                          </div>
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedSpotForModal(spot); }} 
                          style={{ background: '#0284c7', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>Fokus Peta</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: '8px 10px' }}>
                      <button
                        onClick={() => { setShowListBottomSheet(false); handleInitiatePin(spot); }}
                        style={{ width: '100%', padding: '7px', borderRadius: '10px', border: '1.5px dashed #38BDF8', background: '#F0F9FF', color: '#0284c7', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>Sematkan Rencana</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', fontSize: '0.75rem', fontWeight: 800, opacity: currentPage === 1 ? 0.5 : 1 }}>Prev</button>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Hal {currentPage} dari {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', fontSize: '0.75rem', fontWeight: 800, opacity: currentPage === totalPages ? 0.5 : 1 }}>Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SEMATKAN RENCANA VISIT */}
      {selectedPlanSpot && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ padding: '16px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px' }}>Sematkan Target Rencana Trip</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Lokasi: <strong>{typeof selectedPlanSpot === 'string' ? selectedPlanSpot : selectedPlanSpot.name}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Target Tanggal Trip</label>
                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setSelectedPlanSpot(null)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#E2E8F0', color: '#475569', fontWeight: 800, border: 'none' }}>Batal</button>
                <button type="button" disabled={isSavingPlan} onClick={handleSavePlanDate} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#0284c7', color: 'white', fontWeight: 800, border: 'none' }}>
                  {isSavingPlan ? 'Simpan...' : 'Simpan Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spot Detail Modal */}
      {selectedSpotForModal && (
        <SpotDetailModal
          spot={selectedSpotForModal}
          userActivities={userActivities}
          onClose={() => setSelectedSpotForModal(null)}
          onInitiatePin={(spot) => {
            setSelectedSpotForModal(null);
            handleInitiatePin(spot);
          }}
        />
      )}

      {/* Add Spot Modal */}
      {showAddSpotModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ padding: '16px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px' }}>Tambah Spot SUP Baru</h3>
            <form onSubmit={handleCreateCustomSpot} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" placeholder="Nama Spot (misal: Pantai Bira)" value={newSpotName} onChange={(e) => setNewSpotName(e.target.value)} required style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <select value={newSpotCategory} onChange={(e) => setNewSpotCategory(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="Ocean">Ocean</option>
                  <option value="Lake">Lake</option>
                  <option value="River">River</option>
                  <option value="Flat Water">Flat Water</option>
                </select>
                <select value={newSpotDifficulty} onChange={(e) => setNewSpotDifficulty(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="number" step="any" placeholder="Latitude (-5.14)" value={newSpotLat} onChange={(e) => setNewSpotLat(parseFloat(e.target.value))} required style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
                <input type="number" step="any" placeholder="Longitude (119.41)" value={newSpotLng} onChange={(e) => setNewSpotLng(parseFloat(e.target.value))} required style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }} />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAddSpotModal(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#E2E8F0', color: '#475569', fontWeight: 800, border: 'none' }}>Batal</button>
                <button type="submit" style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#0284c7', color: 'white', fontWeight: 800, border: 'none' }}>Simpan Spot</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
