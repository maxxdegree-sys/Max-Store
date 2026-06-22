// Major Pakistani cities for delivery location picker (grouped by province).

export const DEFAULT_LOCATION = {
  city: 'Kharian',
  province: 'Punjab',
  area: '',
  country: 'Pakistan',
  source: 'default'
};

export const POPULAR_CITIES = [
  { city: 'Lahore', province: 'Punjab' },
  { city: 'Karachi', province: 'Sindh' },
  { city: 'Islamabad', province: 'Islamabad Capital Territory' },
  { city: 'Rawalpindi', province: 'Punjab' },
  { city: 'Faisalabad', province: 'Punjab' },
  { city: 'Multan', province: 'Punjab' },
  { city: 'Peshawar', province: 'Khyber Pakhtunkhwa' },
  { city: 'Kharian', province: 'Punjab' }
];

export const PAKISTAN_CITIES = [
  { city: 'Abbottabad', province: 'Khyber Pakhtunkhwa' },
  { city: 'Attock', province: 'Punjab' },
  { city: 'Bahawalpur', province: 'Punjab' },
  { city: 'Bannu', province: 'Khyber Pakhtunkhwa' },
  { city: 'Bhakkar', province: 'Punjab' },
  { city: 'Chakwal', province: 'Punjab' },
  { city: 'Chiniot', province: 'Punjab' },
  { city: 'Dera Ghazi Khan', province: 'Punjab' },
  { city: 'Dera Ismail Khan', province: 'Khyber Pakhtunkhwa' },
  { city: 'Faisalabad', province: 'Punjab' },
  { city: 'Gilgit', province: 'Gilgit-Baltistan' },
  { city: 'Gujranwala', province: 'Punjab' },
  { city: 'Gujrat', province: 'Punjab' },
  { city: 'Gwadar', province: 'Balochistan' },
  { city: 'Hyderabad', province: 'Sindh' },
  { city: 'Islamabad', province: 'Islamabad Capital Territory' },
  { city: 'Jhang', province: 'Punjab' },
  { city: 'Jhelum', province: 'Punjab' },
  { city: 'Karachi', province: 'Sindh' },
  { city: 'Kasur', province: 'Punjab' },
  { city: 'Khanewal', province: 'Punjab' },
  { city: 'Kharian', province: 'Punjab' },
  { city: 'Kohat', province: 'Khyber Pakhtunkhwa' },
  { city: 'Lahore', province: 'Punjab' },
  { city: 'Larkana', province: 'Sindh' },
  { city: 'Mardan', province: 'Khyber Pakhtunkhwa' },
  { city: 'Mingora', province: 'Khyber Pakhtunkhwa' },
  { city: 'Mirpur', province: 'Azad Kashmir' },
  { city: 'Multan', province: 'Punjab' },
  { city: 'Muzaffarabad', province: 'Azad Kashmir' },
  { city: 'Nawabshah', province: 'Sindh' },
  { city: 'Okara', province: 'Punjab' },
  { city: 'Peshawar', province: 'Khyber Pakhtunkhwa' },
  { city: 'Quetta', province: 'Balochistan' },
  { city: 'Rahim Yar Khan', province: 'Punjab' },
  { city: 'Rawalpindi', province: 'Punjab' },
  { city: 'Sahiwal', province: 'Punjab' },
  { city: 'Sargodha', province: 'Punjab' },
  { city: 'Sheikhupura', province: 'Punjab' },
  { city: 'Sialkot', province: 'Punjab' },
  { city: 'Sukkur', province: 'Sindh' },
  { city: 'Swat', province: 'Khyber Pakhtunkhwa' },
  { city: 'Turbat', province: 'Balochistan' },
  { city: 'Wah Cantonment', province: 'Punjab' }
].sort((a, b) => a.city.localeCompare(b.city));

export function formatDeliveryLabel(loc) {
  if (!loc?.city) return 'Select location';
  const prov = loc.province && loc.province !== loc.city ? loc.province : 'Pakistan';
  return `${loc.city}, ${prov}`;
}

export function matchPakistanCity(name) {
  const q = (name || '').trim().toLowerCase();
  if (!q) return null;
  const exact = PAKISTAN_CITIES.find((c) => c.city.toLowerCase() === q);
  if (exact) return { ...exact };
  const partial = PAKISTAN_CITIES.find((c) => q.includes(c.city.toLowerCase()) || c.city.toLowerCase().includes(q));
  return partial ? { ...partial } : { city: name.trim(), province: guessProvince(name) };
}

function guessProvince(city) {
  const c = (city || '').toLowerCase();
  if (['karachi', 'hyderabad', 'sukkur', 'larkana', 'nawabshah'].some((x) => c.includes(x))) return 'Sindh';
  if (['islamabad'].some((x) => c.includes(x))) return 'Islamabad Capital Territory';
  if (['peshawar', 'mardan', 'abbottabad', 'swat', 'kohat'].some((x) => c.includes(x))) return 'Khyber Pakhtunkhwa';
  if (['quetta', 'gwadar', 'turbat'].some((x) => c.includes(x))) return 'Balochistan';
  if (['gilgit', 'hunza'].some((x) => c.includes(x))) return 'Gilgit-Baltistan';
  if (['mirpur', 'muzaffarabad'].some((x) => c.includes(x))) return 'Azad Kashmir';
  return 'Punjab';
}

export function groupCitiesByProvince(cities = PAKISTAN_CITIES) {
  const map = {};
  for (const c of cities) {
    if (!map[c.province]) map[c.province] = [];
    map[c.province].push(c);
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}
