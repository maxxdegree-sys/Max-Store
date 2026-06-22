// Pakistani courier companies + their official tracking pages.
// Most courier sites use a form / JS lookup rather than a GET deep-link, so we link to
// the official tracking page and surface the CN (consignment number) for the customer to
// paste. Verified Jun 2026 — if a courier changes its tracking page, update the URL here.
export const COURIERS = [
  { id: 'tcs',         name: 'TCS',           track: 'https://www.tcsexpress.com/tracking/' },
  { id: 'leopards',    name: 'Leopards',      track: 'https://www.leopardscourier.com/tracking' },
  { id: 'postex',      name: 'PostEx',        track: 'https://postex.pk/tracking' },
  { id: 'mp',          name: 'M&P',           track: 'https://mnptracking.com.pk/' },
  { id: 'trax',        name: 'Trax',          track: 'https://www.trax.pk/' },
  { id: 'callcourier', name: 'Call Courier',  track: 'https://cod.callcourier.com.pk/' },
  { id: 'daewoo',      name: 'Daewoo FastEx', track: 'https://fastex.pk/' },
  { id: 'blueex',      name: 'BlueEX',        track: 'https://blue-ex.com/' },
  { id: 'other',       name: 'Other',         track: '' }
];

// Match by id or by normalised display name, so legacy free-text courier values still resolve.
const byKey = (v) => {
  if (!v) return null;
  const k = String(v).toLowerCase().replace(/[^a-z0-9]/g, '');
  return COURIERS.find(
    (c) => c.id === k || c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === k
  ) || null;
};

export const courierName = (v) => byKey(v)?.name || v || '';

/** Official tracking-page URL for a courier (CN is shown separately for the user to paste). */
export const courierTrackingUrl = (v) => byKey(v)?.track || '';
