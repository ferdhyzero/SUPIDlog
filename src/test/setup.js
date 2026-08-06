import { vi } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';

// Polyfill window.matchMedia for JSDOM PWA display-mode checks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock React-Leaflet components to prevent JSDOM Leaflet map layout errors
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => React.createElement('div', { 'data-testid': 'map-container' }, children),
  TileLayer: () => React.createElement('div', { 'data-testid': 'tile-layer' }),
  Polyline: () => React.createElement('div', { 'data-testid': 'polyline' }),
  CircleMarker: () => React.createElement('div', { 'data-testid': 'circle-marker' }),
  Marker: () => React.createElement('div', { 'data-testid': 'marker' }),
  Popup: ({ children }) => React.createElement('div', { 'data-testid': 'popup' }, children),
  useMap: () => ({ setView: () => {}, flyTo: () => {}, invalidateSize: () => {}, fitBounds: () => {} }),
}));

const originalFetch = global.fetch;

global.fetch = async (url, options) => {
  const urlStr = String(url);

  // If relative URL (e.g. /api/get_passport.php), resolve against localhost
  let targetUrl = urlStr;
  if (urlStr.startsWith('/')) {
    targetUrl = `http://localhost/SUPIDlog${urlStr}`;
  }

  // Handle local PHP API calls
  if (targetUrl.includes('/api/') || targetUrl.includes('localhost')) {
    return originalFetch(targetUrl, options);
  }

  // Fallback mock for external APIs (OpenMeteo Weather / Nominatim Geocoding)
  return {
    ok: true,
    status: 200,
    json: async () => ({
      current_weather: { temperature: 28.5, windspeed: 8.2, weathercode: 1 },
      display_name: 'Makassar, Indonesia'
    })
  };
};
