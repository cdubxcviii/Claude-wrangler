import { SPECIES_BY_ID, rarityFor } from './species';
import type { Catch, PointsBreakdown, RarityTier, RegionId } from './types';

export const RARITY: Record<RarityTier, { label: string; multiplier: number; color: string }> = {
  common: { label: 'Common', multiplier: 1, color: '#8E8E93' },
  uncommon: { label: 'Uncommon', multiplier: 1.5, color: '#22A861' },
  rare: { label: 'Rare', multiplier: 2, color: '#2F80ED' },
  epic: { label: 'Epic', multiplier: 3, color: '#9B51E0' },
  legendary: { label: 'Legendary', multiplier: 5, color: '#E8A400' },
};

export const RARITY_ORDER: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const FIRST_OF_SPECIES_BONUS = 50;
export const PERSONAL_BEST_BONUS = 25;
export const RELEASE_BONUS = 0.1; // +10%
export const TROPHY_SIZE_POINTS = 200;

export interface ScoreInput {
  speciesId: string;
  weightLb: number;
  regionId: RegionId;
  released: boolean;
  customTrophyLb?: number;
  customRarity?: RarityTier;
}

/**
 * Wrangler points:
 *   size      = 200 x (weight / species trophy weight), 10 min, 400 max
 *   x rarity  = how unusual the species is where it was caught (x1 .. x5)
 *   + 50 the first time you log a species, + 25 for a new personal best
 *   x 1.1 when the fish is released
 */
export function scoreCatch(input: ScoreInput, history: Catch[], userId: string, excludeId?: string): PointsBreakdown {
  const species = SPECIES_BY_ID[input.speciesId];
  const trophy = species?.trophyLb ?? input.customTrophyLb ?? 10;
  const rarity = species ? rarityFor(input.speciesId, input.regionId) : input.customRarity ?? 'rare';
  const size = Math.round(
    Math.min(400, Math.max(10, TROPHY_SIZE_POINTS * (input.weightLb / trophy))),
  );
  const multiplier = RARITY[rarity].multiplier;

  const mine = history.filter(
    (c) => c.userId === userId && c.id !== excludeId && c.speciesId === input.speciesId,
  );
  const firstOfSpecies = mine.length === 0 ? FIRST_OF_SPECIES_BONUS : 0;
  const best = mine.reduce((m, c) => Math.max(m, c.weightLb), 0);
  const personalBest = mine.length > 0 && input.weightLb > best ? PERSONAL_BEST_BONUS : 0;

  const subtotal = size * multiplier + firstOfSpecies + personalBest;
  const releaseBonus = input.released ? Math.round(subtotal * RELEASE_BONUS) : 0;
  return {
    size,
    rarity,
    multiplier,
    firstOfSpecies,
    personalBest,
    releaseBonus,
    total: Math.round(subtotal + releaseBonus),
  };
}

/** A catch worth bragging about: near-trophy size or rare-or-better. */
export function isBragWorthy(p: PointsBreakdown): boolean {
  return p.size >= 150 || RARITY_ORDER.indexOf(p.rarity) >= RARITY_ORDER.indexOf('rare');
}
