import { DEFAULT_LOCATION, matchPakistanCity } from '../data/pakistanCities.js';

const STORAGE_KEY = 'maxx-delivery-location';

export function loadSavedLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('alrafiq-delivery-location');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.city) return normalizeLocation(parsed);
  } catch { /* ignore */ }
  return null;
}

export function saveLocation(loc) {
  const normalized = normalizeLocation(loc);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch { /* quota */ }
  return normalized;
}

export function normalizeLocation(loc = {}) {
  const matched = matchPakistanCity(loc.city);
  return {
    city: matched?.city || loc.city || DEFAULT_LOCATION.city,
    province: loc.province || matched?.province || DEFAULT_LOCATION.province,
    area: loc.area || '',
    country: 'Pakistan',
    source: loc.source || 'manual',
    lat: loc.lat ?? null,
    lng: loc.lng ?? null
  };
}

export function hasGeolocation() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/** Reverse geocode lat/lng via OpenStreetMap Nominatim (no API key). */
export async function reverseGeocode(lat, lng) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw new Error('Could not resolve address');
  const data = await res.json();
  const addr = data.address || {};
  const cityName =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    addr.state_district ||
    addr.suburb ||
    '';
  const province = addr.state || addr.region || '';
  const area = addr.suburb || addr.neighbourhood || addr.quarter || '';
  const matched = matchPakistanCity(cityName);
  return normalizeLocation({
    city: matched?.city || cityName,
    province: matched?.province || province,
    area,
    source: 'gps',
    lat,
    lng
  });
}

/** Detect city from browser GPS. */
export function detectGpsLocation() {
  return new Promise((resolve, reject) => {
    if (!hasGeolocation()) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          resolve(loc);
        } catch (e) {
          reject(e);
        }
      },
      (err) => {
        const msg =
          err.code === 1 ? 'Location permission denied' :
          err.code === 2 ? 'Location unavailable' :
          err.code === 3 ? 'Location request timed out' :
          'Could not detect location';
        reject(new Error(msg));
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });
}

/** Rough city from IP (fallback when GPS denied or unavailable). */
export async function detectIpLocation() {
  const res = await fetch('https://ipapi.co/json/');
  if (!res.ok) throw new Error('IP lookup failed');
  const data = await res.json();
  if (data.country_code && data.country_code !== 'PK') {
    return normalizeLocation({ ...DEFAULT_LOCATION, source: 'default' });
  }
  const matched = matchPakistanCity(data.city);
  return normalizeLocation({
    city: matched?.city || data.city || DEFAULT_LOCATION.city,
    province: matched?.province || data.region || DEFAULT_LOCATION.province,
    source: 'ip'
  });
}
