import type { Settings } from './types';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Deterministic PRNG (mulberry32) so seeded demo data looks the same on every load. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

export function formatLength(inches: number, units: Settings['units']): string {
  if (units === 'metric') return `${(inches * 2.54).toFixed(1)} cm`;
  return `${(Math.round(inches * 10) / 10).toString()}"`;
}

export function formatWeight(lb: number, units: Settings['units']): string {
  if (units === 'metric') return `${(lb * 0.4536).toFixed(2)} kg`;
  if (lb < 1) return `${Math.round(lb * 16)} oz`;
  const whole = Math.floor(lb);
  const oz = Math.round((lb - whole) * 16);
  if (oz === 0) return `${whole} lb`;
  if (oz === 16) return `${whole + 1} lb`;
  return `${whole} lb ${oz} oz`;
}

export function formatPoints(n: number): string {
  return n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString('en-US');
}

export function formatCoords(lat?: number, lon?: number): string {
  if (lat == null || lon == null) return '';
  return `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(3)}°${lon >= 0 ? 'E' : 'W'}`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function base64ToBlob(base64: string, type = 'image/jpeg'): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function dataUriParts(uri: string): { type: string; base64: string } | null {
  const m = /^data:([^;]+);base64,(.*)$/.exec(uri);
  return m ? { type: m[1], base64: m[2] } : null;
}
