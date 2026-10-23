import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { regionFor } from './regions';
import type { CatchLocation } from './types';
import { fetchWithTimeout, formatCoords } from './util';

export const DEMO_LOCATION: CatchLocation = {
  lat: 30.4103,
  lon: -97.9064,
  name: 'Lake Travis, TX',
  regionId: 'gulf',
  source: 'demo',
};

export type LocateResult =
  | { ok: true; location: CatchLocation }
  | { ok: false; reason: 'denied' | 'unavailable' };

export async function locateMe(): Promise<LocateResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { ok: false, reason: 'denied' };
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
    ]);
    if (!pos) return { ok: false, reason: 'unavailable' };
    const { latitude: lat, longitude: lon } = pos.coords;
    return { ok: true, location: await describeCoords(lat, lon, 'gps') };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** Builds a location with a human-readable name, using whatever geocoder is reachable. */
export async function describeCoords(lat: number, lon: number, source: CatchLocation['source']): Promise<CatchLocation> {
  const base = { lat, lon, regionId: regionFor(lat, lon), source };
  const name = (await reverseGeocode(lat, lon)) ?? formatCoords(lat, lon);
  return { ...base, name };
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  if (Platform.OS !== 'web') {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (place) {
        const town = place.city ?? place.subregion ?? place.district ?? place.name;
        return [town, place.region].filter(Boolean).join(', ') || null;
      }
    } catch {
      // fall through to the web geocoder
    }
  }
  try {
    const res = await fetchWithTimeout(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      4000,
    );
    if (!res.ok) return null;
    const d = await res.json();
    const town = d.locality || d.city;
    const st = (d.principalSubdivisionCode as string | undefined)?.split('-')[1] ?? d.principalSubdivision;
    return [town, st].filter(Boolean).join(', ') || null;
  } catch {
    return null;
  }
}

/** Forward search for the manual location editor. Returns [] when the network is unavailable. */
export async function searchPlaces(query: string): Promise<CatchLocation[]> {
  try {
    const res = await fetchWithTimeout(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en`,
      4000,
    );
    if (!res.ok) return [];
    const d = await res.json();
    return (d.results ?? []).map((r: any) => ({
      lat: r.latitude,
      lon: r.longitude,
      name: [r.name, r.admin1].filter(Boolean).join(', '),
      regionId: regionFor(r.latitude, r.longitude),
      source: 'manual' as const,
    }));
  } catch {
    return [];
  }
}

/** Reads GPS coordinates from photo EXIF when the platform provides it. */
export function coordsFromExif(exif: Record<string, any> | null | undefined): { lat: number; lon: number } | null {
  if (!exif) return null;
  const gps = exif.GPS ?? exif['{GPS}'] ?? exif;
  let lat = toDecimal(gps.GPSLatitude ?? gps.Latitude);
  let lon = toDecimal(gps.GPSLongitude ?? gps.Longitude);
  if (lat == null || lon == null) return null;
  const latRef = gps.GPSLatitudeRef ?? gps.LatitudeRef;
  const lonRef = gps.GPSLongitudeRef ?? gps.LongitudeRef;
  if (latRef === 'S' && lat > 0) lat = -lat;
  if (lonRef === 'W' && lon > 0) lon = -lon;
  if (lat === 0 && lon === 0) return null;
  return { lat, lon };
}

function toDecimal(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  if (Array.isArray(v) && v.length === 3) {
    const [d, m, s] = v.map(Number);
    return d + m / 60 + s / 3600;
  }
  return null;
}
