import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { DEFAULT_LOCATION, formatDeliveryLabel } from '../data/pakistanCities.js';
import {
  detectGpsLocation,
  detectIpLocation,
  loadSavedLocation,
  saveLocation,
  normalizeLocation
} from '../utils/location.js';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => loadSavedLocation() || { ...DEFAULT_LOCATION });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const setLocation = useCallback((loc) => {
    const next = saveLocation(loc);
    setLocationState(next);
    return next;
  }, []);

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  const detectLocation = useCallback(async ({ preferGps = true, silent = false } = {}) => {
    setDetecting(true);
    try {
      let loc = null;
      if (preferGps) {
        try {
          loc = await detectGpsLocation();
        } catch (gpsErr) {
          if (!silent) toast.error(gpsErr.message);
          loc = await detectIpLocation();
        }
      } else {
        loc = await detectIpLocation();
      }
      setLocation(loc);
      if (!silent) toast.success(`Delivering to ${formatDeliveryLabel(loc)}`);
      return loc;
    } catch (e) {
      if (!silent) toast.error(e.message || 'Could not detect location');
      throw e;
    } finally {
      setDetecting(false);
    }
  }, [setLocation]);

  // On first visit, try IP-based city silently (no permission prompt).
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    const saved = loadSavedLocation();
    if (saved) {
      setLocationState(saved);
      return;
    }
    detectIpLocation()
      .then((loc) => setLocationState(saveLocation(loc)))
      .catch(() => setLocationState({ ...DEFAULT_LOCATION }));
  }, [initialized]);

  const value = useMemo(() => ({
    location,
    label: formatDeliveryLabel(location),
    pickerOpen,
    detecting,
    setLocation,
    openPicker,
    closePicker,
    detectLocation
  }), [location, pickerOpen, detecting, setLocation, openPicker, closePicker, detectLocation]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useDeliveryLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useDeliveryLocation must be used within LocationProvider');
  return ctx;
}

export function useDeliveryLocationOptional() {
  return useContext(LocationContext);
}

export { normalizeLocation };
