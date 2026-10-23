import { fetchWithTimeout, seededRandom } from './util';
import type { Conditions } from './types';

const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export function moonPhase(at: number): { name: string; illumination: number; emoji: string } {
  const age = ((((at - KNOWN_NEW_MOON) / 86400000) % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2;
  const phases: [number, string, string][] = [
    [1.84566, 'New Moon', '🌑'],
    [5.53699, 'Waxing Crescent', '🌒'],
    [9.22831, 'First Quarter', '🌓'],
    [12.91963, 'Waxing Gibbous', '🌔'],
    [16.61096, 'Full Moon', '🌕'],
    [20.30228, 'Waning Gibbous', '🌖'],
    [23.99361, 'Last Quarter', '🌗'],
    [27.68493, 'Waning Crescent', '🌘'],
    [Infinity, 'New Moon', '🌑'],
  ];
  const [, name, emoji] = phases.find(([limit]) => age < limit)!;
  return { name, illumination, emoji };
}

export function moonEmoji(name: string): string {
  return (
    {
      'New Moon': '🌑',
      'Waxing Crescent': '🌒',
      'First Quarter': '🌓',
      'Waxing Gibbous': '🌔',
      'Full Moon': '🌕',
      'Waning Gibbous': '🌖',
      'Last Quarter': '🌗',
      'Waning Crescent': '🌘',
    } as Record<string, string>
  )[name] ?? '🌙';
}

const WEATHER_CODES: [number, string][] = [
  [0, 'Clear'],
  [2, 'Partly cloudy'],
  [3, 'Overcast'],
  [48, 'Fog'],
  [57, 'Drizzle'],
  [67, 'Rain'],
  [77, 'Snow'],
  [82, 'Showers'],
  [86, 'Snow showers'],
  [99, 'Thunderstorm'],
];

function skyFromCode(code: number): string {
  return WEATHER_CODES.find(([max]) => code <= max)?.[1] ?? 'Cloudy';
}

const HPA_TO_INHG = 0.0295299830714;

/** Live weather from Open-Meteo (free, no key); falls back to a plausible simulation. */
export async function fetchConditions(lat: number | undefined, lon: number | undefined, at = Date.now()): Promise<Conditions> {
  const moon = moonPhase(at);
  if (lat != null && lon != null) {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
        '&current=temperature_2m,surface_pressure,wind_speed_10m,weather_code' +
        '&hourly=surface_pressure&past_hours=4&forecast_hours=1' +
        '&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto';
      const res = await fetchWithTimeout(url, 4000);
      if (res.ok) {
        const d = await res.json();
        const hourly: number[] = d.hourly?.surface_pressure ?? [];
        const delta = hourly.length > 1 ? hourly[hourly.length - 1] - hourly[0] : 0;
        return {
          tempF: Math.round(d.current.temperature_2m),
          pressureInHg: Math.round(d.current.surface_pressure * HPA_TO_INHG * 100) / 100,
          pressureTrend: delta > 0.6 ? 'rising' : delta < -0.6 ? 'falling' : 'steady',
          windMph: Math.round(d.current.wind_speed_10m),
          sky: skyFromCode(d.current.weather_code),
          moonPhase: moon.name,
          moonIllumination: moon.illumination,
          source: 'live',
        };
      }
    } catch {
      // network blocked or offline: simulate below
    }
  }
  return simulateConditions(lat ?? 30, lon ?? -97, at);
}

export function simulateConditions(lat: number, lon: number, at: number): Conditions {
  const rand = seededRandom(Math.floor(at / 3600000) * 31 + Math.round(lat * 10) * 7 + Math.round(lon * 10));
  const month = new Date(at).getMonth();
  const seasonal = 55 + 25 * Math.sin(((month - 3) / 12) * 2 * Math.PI) - (Math.abs(lat) - 30) * 0.8;
  const moon = moonPhase(at);
  const trendRoll = rand();
  return {
    tempF: Math.round(seasonal + (rand() - 0.5) * 14),
    pressureInHg: Math.round((29.75 + rand() * 0.5) * 100) / 100,
    pressureTrend: trendRoll < 0.33 ? 'falling' : trendRoll < 0.66 ? 'steady' : 'rising',
    windMph: Math.round(2 + rand() * 14),
    sky: ['Clear', 'Partly cloudy', 'Overcast', 'Partly cloudy', 'Showers'][Math.floor(rand() * 5)],
    moonPhase: moon.name,
    moonIllumination: moon.illumination,
    source: 'simulated',
  };
}
