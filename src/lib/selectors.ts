import { RARITY_ORDER } from './points';
import { SPECIES } from './species';
import type { AppState, Catch, Conditions } from './types';

export type Period = 'week' | 'month' | 'all';

const PERIOD_MS: Record<Period, number> = { week: 7 * 86400000, month: 30 * 86400000, all: Infinity };

export function circleIds(s: AppState): string[] {
  return s.meId ? [s.meId, ...s.friends] : [...s.friends];
}

export function feedCatches(s: AppState): Catch[] {
  const ids = new Set(circleIds(s));
  return s.catches.filter((c) => ids.has(c.userId)).sort((a, b) => b.createdAt - a.createdAt);
}

/** Users in your circle who logged a catch in the last 24 hours, newest first. */
export function storyUsers(s: AppState, now = Date.now()): { userId: string; catches: Catch[] }[] {
  const recent = feedCatches(s).filter((c) => now - c.createdAt < 86400000);
  const map = new Map<string, Catch[]>();
  for (const c of recent) map.set(c.userId, [...(map.get(c.userId) ?? []), c]);
  return [...map.entries()].map(([userId, catches]) => ({ userId, catches }));
}

export interface LeaderRow {
  userId: string;
  points: number;
  catches: number;
  best?: Catch;
}

export function leaderboard(s: AppState, period: Period, now = Date.now()): LeaderRow[] {
  const since = now - PERIOD_MS[period];
  return circleIds(s)
    .map((userId) => {
      const mine = s.catches.filter((c) => c.userId === userId && c.createdAt >= since);
      const best = mine.reduce<Catch | undefined>((b, c) => (!b || c.points.total > b.points.total ? c : b), undefined);
      return { userId, points: mine.reduce((n, c) => n + c.points.total, 0), catches: mine.length, best };
    })
    .sort((a, b) => b.points - a.points || b.catches - a.catches);
}

export function userCatches(s: AppState, userId: string): Catch[] {
  return s.catches.filter((c) => c.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
}

export function userStats(s: AppState, userId: string) {
  const mine = userCatches(s, userId);
  const species = new Set(mine.map((c) => c.speciesId === 'other' ? `other:${c.speciesName}` : c.speciesId));
  return {
    catches: mine.length,
    points: mine.reduce((n, c) => n + c.points.total, 0),
    species: species.size,
    friends: userId === s.meId ? s.friends.length : undefined,
  };
}

export interface DexEntry {
  speciesId: string;
  name: string;
  count: number;
  bestLb: number;
  bestCatch?: Catch;
}

export function fishdex(s: AppState, userId: string): { entries: DexEntry[]; others: DexEntry[]; caught: number; total: number } {
  const mine = userCatches(s, userId);
  const entries = SPECIES.map((sp) => {
    const list = mine.filter((c) => c.speciesId === sp.id);
    const bestCatch = list.reduce<Catch | undefined>((b, c) => (!b || c.weightLb > b.weightLb ? c : b), undefined);
    return { speciesId: sp.id, name: sp.name, count: list.length, bestLb: bestCatch?.weightLb ?? 0, bestCatch };
  });
  const otherMap = new Map<string, Catch[]>();
  for (const c of mine.filter((x) => x.speciesId === 'other')) otherMap.set(c.speciesName, [...(otherMap.get(c.speciesName) ?? []), c]);
  const others = [...otherMap.entries()].map(([name, list]) => {
    const bestCatch = list.reduce((b, c) => (c.weightLb > b.weightLb ? c : b));
    return { speciesId: 'other', name, count: list.length, bestLb: bestCatch.weightLb, bestCatch };
  });
  return { entries, others, caught: entries.filter((e) => e.count > 0).length + others.length, total: SPECIES.length };
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
}

export function badges(s: AppState, userId: string): Badge[] {
  const mine = userCatches(s, userId);
  const dex = fishdex(s, userId);
  const has = (tier: (typeof RARITY_ORDER)[number]) => mine.some((c) => RARITY_ORDER.indexOf(c.points.rarity) >= RARITY_ORDER.indexOf(tier));
  const released = mine.filter((c) => c.released).length;
  return [
    { id: 'first', emoji: '🎣', title: 'First Cast', description: 'Log your first catch', earned: mine.length >= 1 },
    { id: 'five', emoji: '🐟', title: 'Getting Hooked', description: 'Log 5 catches', earned: mine.length >= 5 },
    { id: 'species5', emoji: '📖', title: 'Collector', description: 'Catch 5 different species', earned: dex.caught >= 5 },
    { id: 'species10', emoji: '🧭', title: 'Explorer', description: 'Catch 10 different species', earned: dex.caught >= 10 },
    { id: 'rare', emoji: '💎', title: 'Rare Find', description: 'Catch a Rare (or rarer) fish', earned: has('rare') },
    { id: 'legend', emoji: '👑', title: 'Legend', description: 'Catch a Legendary fish', earned: has('legendary') },
    { id: 'trophy', emoji: '🏆', title: 'Wall Hanger', description: 'Catch a trophy-size fish', earned: mine.some((c) => c.points.size >= 200) },
    { id: 'release', emoji: '♻️', title: 'Conservationist', description: 'Release 5 fish', earned: released >= 5 },
  ];
}

/** "When do you catch the most?" from the auto-logged conditions. */
export function conditionInsights(catches: Catch[]): { label: string; value: string }[] {
  const withC = catches.filter((c): c is Catch & { conditions: Conditions } => !!c.conditions);
  if (withC.length < 2) return [];
  const top = <K extends string>(get: (c: Conditions) => K) => {
    const counts = new Map<K, number>();
    for (const c of withC) counts.set(get(c.conditions), (counts.get(get(c.conditions)) ?? 0) + 1);
    const [k, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return `${k} (${Math.round((n / withC.length) * 100)}%)`;
  };
  const avgTemp = Math.round(withC.reduce((n, c) => n + c.conditions.tempF, 0) / withC.length);
  const hours = withC.map((c) => new Date(c.createdAt).getHours());
  const bucket = (h: number) => (h < 5 ? 'Night' : h < 10 ? 'Morning' : h < 16 ? 'Midday' : h < 21 ? 'Evening' : 'Night');
  const times = new Map<string, number>();
  hours.forEach((h) => times.set(bucket(h), (times.get(bucket(h)) ?? 0) + 1));
  const bestTime = [...times.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return [
    { label: 'Pressure', value: top((c) => c.pressureTrend) },
    { label: 'Moon', value: top((c) => c.moonPhase) },
    { label: 'Sky', value: top((c) => c.sky) },
    { label: 'Avg air temp', value: `${avgTemp}°F` },
    { label: 'Best time', value: bestTime },
  ];
}
