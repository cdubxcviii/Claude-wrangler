import type { RegionId } from './types';

export const REGIONS: Record<RegionId, { name: string; short: string }> = {
  alaska: { name: 'Alaska', short: 'AK' },
  hawaii: { name: 'Hawaii', short: 'HI' },
  pnw: { name: 'Pacific Northwest', short: 'PNW' },
  california: { name: 'California & Nevada', short: 'CA/NV' },
  southwest: { name: 'Desert Southwest', short: 'SW' },
  rockies: { name: 'Rocky Mountains', short: 'Rockies' },
  plains: { name: 'Great Plains', short: 'Plains' },
  gulf: { name: 'Texas & Gulf Coast', short: 'Gulf' },
  florida: { name: 'Florida', short: 'FL' },
  southeast: { name: 'Southeast', short: 'SE' },
  midwest: { name: 'Midwest', short: 'MW' },
  great_lakes: { name: 'Great Lakes', short: 'Lakes' },
  northeast: { name: 'Northeast', short: 'NE' },
  intl: { name: 'Outside the US', short: 'Intl' },
};

export const REGION_IDS = Object.keys(REGIONS) as RegionId[];

// Coarse bounding boxes, checked in order. Good enough to judge how unusual a
// species is for an area; users can override the region when editing a catch.
const BOXES: [RegionId, number, number, number, number][] = [
  // id, minLat, maxLat, minLon, maxLon
  ['alaska', 51, 72, -180, -129],
  ['hawaii', 18, 23, -161, -154],
  ['florida', 24.4, 31, -87.6, -79.8],
  ['gulf', 25.8, 33.5, -106.7, -88],
  ['southwest', 31, 37.1, -114.8, -103],
  ['california', 32.5, 42, -124.6, -114],
  ['pnw', 42, 49.5, -125, -116.5],
  ['rockies', 37, 49.5, -116.5, -102],
  ['plains', 33.5, 49.5, -104, -95],
  ['great_lakes', 41.4, 49.5, -95, -75.5],
  ['northeast', 38.5, 47.6, -80.6, -66.8],
  ['midwest', 36, 43.6, -97, -80.5],
  ['southeast', 29.5, 39.5, -95, -75],
];

export function regionFor(lat?: number, lon?: number): RegionId {
  if (lat == null || lon == null) return 'intl';
  for (const [id, a, b, c, d] of BOXES) {
    if (lat >= a && lat <= b && lon >= c && lon <= d) return id;
  }
  return 'intl';
}
