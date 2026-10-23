import type { RarityTier, RegionId } from './types';

export type FishShape =
  | 'bass'
  | 'trout'
  | 'pike'
  | 'catfish'
  | 'panfish'
  | 'carp'
  | 'gar'
  | 'tuna'
  | 'flat'
  | 'drum';

export type FishPattern = 'none' | 'stripes' | 'bars' | 'spots' | 'blotch';

export interface Species {
  id: string;
  name: string;
  scientific: string;
  water: 'fresh' | 'salt';
  trophyLb: number; // a true wall-hanger: scores 200 size points
  k: number; // weight(lb) ~= length(in)^3 / k
  shape: FishShape;
  pattern: FishPattern;
  colors: { back: string; body: string; belly: string; fin: string; mark: string };
  rarity: Partial<Record<RegionId, RarityTier>>;
  outside: RarityTier; // rarity anywhere not listed
}

type R = Partial<Record<RegionId, RarityTier>>;
const all = (tier: RarityTier, ids: RegionId[]): R =>
  Object.fromEntries(ids.map((id) => [id, tier])) as R;

const EAST: RegionId[] = ['southeast', 'midwest', 'great_lakes', 'northeast', 'gulf', 'florida', 'plains'];
const WARM: RegionId[] = ['southeast', 'gulf', 'florida', 'midwest', 'plains', 'southwest', 'california'];
const SALT_SE: RegionId[] = ['gulf', 'florida', 'southeast'];

export const SPECIES: Species[] = [
  // ---- Black bass & temperate bass ----
  {
    id: 'largemouth_bass', name: 'Largemouth Bass', scientific: 'Micropterus salmoides', water: 'fresh',
    trophyLb: 8, k: 1700, shape: 'bass', pattern: 'blotch',
    colors: { back: '#3E5B2E', body: '#7FA05A', belly: '#E9EBC8', fin: '#5E7A43', mark: '#2B3F1F' },
    rarity: { ...all('common', [...EAST, 'southwest', 'california']), ...all('uncommon', ['pnw', 'rockies']) },
    outside: 'rare',
  },
  {
    id: 'smallmouth_bass', name: 'Smallmouth Bass', scientific: 'Micropterus dolomieu', water: 'fresh',
    trophyLb: 5, k: 1900, shape: 'bass', pattern: 'bars',
    colors: { back: '#6B5530', body: '#B08D57', belly: '#EFE2C4', fin: '#8A6D3E', mark: '#4A3920' },
    rarity: { ...all('common', ['great_lakes', 'northeast', 'midwest']), ...all('uncommon', ['pnw', 'rockies', 'plains', 'southeast']) },
    outside: 'rare',
  },
  {
    id: 'spotted_bass', name: 'Spotted Bass', scientific: 'Micropterus punctulatus', water: 'fresh',
    trophyLb: 4, k: 1800, shape: 'bass', pattern: 'spots',
    colors: { back: '#4C5C2C', body: '#9AAA62', belly: '#F0F0D4', fin: '#6E7E44', mark: '#2F3A1A' },
    rarity: { ...all('common', ['southeast', 'gulf']), ...all('uncommon', ['midwest', 'california', 'plains']) },
    outside: 'epic',
  },
  {
    id: 'striped_bass', name: 'Striped Bass', scientific: 'Morone saxatilis', water: 'fresh',
    trophyLb: 30, k: 2250, shape: 'bass', pattern: 'stripes',
    colors: { back: '#4A5E6E', body: '#C9D3DA', belly: '#F5F7F8', fin: '#7D8E9B', mark: '#2E3B45' },
    rarity: { ...all('common', ['northeast']), ...all('uncommon', ['california', 'southeast', 'gulf', 'southwest']) },
    outside: 'rare',
  },
  {
    id: 'white_bass', name: 'White Bass', scientific: 'Morone chrysops', water: 'fresh',
    trophyLb: 3, k: 2250, shape: 'bass', pattern: 'stripes',
    colors: { back: '#56636D', body: '#D6DDE2', belly: '#F7F8F9', fin: '#8C99A3', mark: '#5D6A73' },
    rarity: { ...all('common', ['gulf', 'plains', 'midwest']), ...all('uncommon', ['great_lakes', 'southeast']) },
    outside: 'rare',
  },
  {
    id: 'peacock_bass', name: 'Peacock Bass', scientific: 'Cichla ocellaris', water: 'fresh',
    trophyLb: 9, k: 1800, shape: 'bass', pattern: 'bars',
    colors: { back: '#4D6B2A', body: '#D8C341', belly: '#F2A33A', fin: '#D9572B', mark: '#22301A' },
    rarity: { florida: 'rare', hawaii: 'rare', intl: 'uncommon' },
    outside: 'legendary',
  },
  // ---- Trout, salmon & char ----
  {
    id: 'rainbow_trout', name: 'Rainbow Trout', scientific: 'Oncorhynchus mykiss', water: 'fresh',
    trophyLb: 8, k: 2700, shape: 'trout', pattern: 'spots',
    colors: { back: '#4F6B57', body: '#C8D2C0', belly: '#F4F1EA', fin: '#9AA98F', mark: '#D9667A' },
    rarity: { ...all('common', ['pnw', 'rockies', 'california', 'alaska']), ...all('uncommon', ['northeast', 'great_lakes', 'southwest', 'southeast']) },
    outside: 'rare',
  },
  {
    id: 'brown_trout', name: 'Brown Trout', scientific: 'Salmo trutta', water: 'fresh',
    trophyLb: 10, k: 2600, shape: 'trout', pattern: 'spots',
    colors: { back: '#5E4A2A', body: '#C9A96B', belly: '#F3E3BC', fin: '#9C7B45', mark: '#B5402F' },
    rarity: { ...all('common', ['rockies', 'northeast']), ...all('uncommon', ['great_lakes', 'pnw', 'california', 'midwest']) },
    outside: 'rare',
  },
  {
    id: 'brook_trout', name: 'Brook Trout', scientific: 'Salvelinus fontinalis', water: 'fresh',
    trophyLb: 4, k: 2700, shape: 'trout', pattern: 'spots',
    colors: { back: '#3D4D33', body: '#7F8C59', belly: '#E8743B', fin: '#D35A2E', mark: '#F2D35B' },
    rarity: { ...all('common', ['northeast']), ...all('uncommon', ['great_lakes', 'rockies']) },
    outside: 'epic',
  },
  {
    id: 'cutthroat_trout', name: 'Cutthroat Trout', scientific: 'Oncorhynchus clarkii', water: 'fresh',
    trophyLb: 6, k: 2800, shape: 'trout', pattern: 'spots',
    colors: { back: '#5A6136', body: '#C2B678', belly: '#F2E6C6', fin: '#A0904E', mark: '#2E2A18' },
    rarity: { ...all('common', ['rockies']), ...all('uncommon', ['pnw', 'alaska']) },
    outside: 'epic',
  },
  {
    id: 'lake_trout', name: 'Lake Trout', scientific: 'Salvelinus namaycush', water: 'fresh',
    trophyLb: 25, k: 2700, shape: 'trout', pattern: 'spots',
    colors: { back: '#4A5560', body: '#8D99A3', belly: '#E9ECEE', fin: '#6F7B85', mark: '#D9DDE0' },
    rarity: { ...all('common', ['great_lakes', 'alaska']), ...all('uncommon', ['northeast', 'rockies']) },
    outside: 'epic',
  },
  {
    id: 'golden_trout', name: 'Golden Trout', scientific: 'Oncorhynchus aguabonita', water: 'fresh',
    trophyLb: 3, k: 2800, shape: 'trout', pattern: 'bars',
    colors: { back: '#7A7A2E', body: '#E8C24A', belly: '#E0503A', fin: '#E07A3A', mark: '#5A6A3A' },
    rarity: { california: 'rare', rockies: 'epic' },
    outside: 'legendary',
  },
  {
    id: 'arctic_grayling', name: 'Arctic Grayling', scientific: 'Thymallus arcticus', water: 'fresh',
    trophyLb: 3, k: 2900, shape: 'trout', pattern: 'spots',
    colors: { back: '#4B4E62', body: '#9C9FB3', belly: '#E6E3EA', fin: '#7B5EA7', mark: '#2B2D3A' },
    rarity: { alaska: 'uncommon', rockies: 'epic' },
    outside: 'legendary',
  },
  {
    id: 'chinook_salmon', name: 'Chinook (King) Salmon', scientific: 'Oncorhynchus tshawytscha', water: 'fresh',
    trophyLb: 35, k: 2300, shape: 'trout', pattern: 'spots',
    colors: { back: '#3F5466', body: '#B8C4CC', belly: '#F2F4F5', fin: '#5E7080', mark: '#1F2A33' },
    rarity: { ...all('common', ['alaska']), ...all('uncommon', ['pnw', 'great_lakes', 'california']) },
    outside: 'epic',
  },
  {
    id: 'coho_salmon', name: 'Coho (Silver) Salmon', scientific: 'Oncorhynchus kisutch', water: 'fresh',
    trophyLb: 15, k: 2450, shape: 'trout', pattern: 'spots',
    colors: { back: '#3A5C70', body: '#C2CED6', belly: '#F4F6F7', fin: '#6A8394', mark: '#22323C' },
    rarity: { ...all('common', ['alaska', 'pnw']), ...all('uncommon', ['great_lakes', 'california']) },
    outside: 'epic',
  },
  {
    id: 'sockeye_salmon', name: 'Sockeye Salmon', scientific: 'Oncorhynchus nerka', water: 'fresh',
    trophyLb: 10, k: 2900, shape: 'trout', pattern: 'none',
    colors: { back: '#3C6B48', body: '#C9372C', belly: '#E0574A', fin: '#4F7C52', mark: '#2B4A33' },
    rarity: { alaska: 'common', pnw: 'uncommon' },
    outside: 'epic',
  },
  // ---- Perch, walleye & pike family ----
  {
    id: 'walleye', name: 'Walleye', scientific: 'Sander vitreus', water: 'fresh',
    trophyLb: 10, k: 2700, shape: 'pike', pattern: 'blotch',
    colors: { back: '#6A5A2A', body: '#C3AC5E', belly: '#F2EBCF', fin: '#9A8545', mark: '#3E3416' },
    rarity: { ...all('common', ['great_lakes', 'plains', 'midwest']), ...all('uncommon', ['northeast', 'rockies', 'pnw']) },
    outside: 'rare',
  },
  {
    id: 'yellow_perch', name: 'Yellow Perch', scientific: 'Perca flavescens', water: 'fresh',
    trophyLb: 1.5, k: 2200, shape: 'bass', pattern: 'bars',
    colors: { back: '#5C6B2A', body: '#E3C94A', belly: '#F5EDC4', fin: '#E08A3A', mark: '#3A4418' },
    rarity: { ...all('common', ['great_lakes', 'northeast', 'midwest', 'plains']), ...all('uncommon', ['rockies', 'pnw']) },
    outside: 'rare',
  },
  {
    id: 'northern_pike', name: 'Northern Pike', scientific: 'Esox lucius', water: 'fresh',
    trophyLb: 20, k: 3900, shape: 'pike', pattern: 'spots',
    colors: { back: '#3D5230', body: '#7E9658', belly: '#EDEFD4', fin: '#8C6A3A', mark: '#DCE3B8' },
    rarity: { ...all('common', ['great_lakes', 'alaska']), ...all('uncommon', ['northeast', 'plains', 'rockies', 'midwest']) },
    outside: 'epic',
  },
  {
    id: 'muskellunge', name: 'Muskellunge', scientific: 'Esox masquinongy', water: 'fresh',
    trophyLb: 40, k: 3600, shape: 'pike', pattern: 'bars',
    colors: { back: '#4D5A3A', body: '#A7AE7E', belly: '#ECEBD8', fin: '#8A5A3A', mark: '#3A4428' },
    rarity: { great_lakes: 'rare', northeast: 'rare', midwest: 'epic' },
    outside: 'legendary',
  },
  {
    id: 'chain_pickerel', name: 'Chain Pickerel', scientific: 'Esox niger', water: 'fresh',
    trophyLb: 4, k: 3600, shape: 'pike', pattern: 'blotch',
    colors: { back: '#3F5131', body: '#9DA65E', belly: '#EEEED3', fin: '#7A7F44', mark: '#2B3A1C' },
    rarity: { ...all('uncommon', ['northeast', 'southeast', 'florida']) },
    outside: 'epic',
  },
  // ---- Panfish ----
  {
    id: 'bluegill', name: 'Bluegill', scientific: 'Lepomis macrochirus', water: 'fresh',
    trophyLb: 1.25, k: 1200, shape: 'panfish', pattern: 'bars',
    colors: { back: '#3F4F5E', body: '#7D8F6A', belly: '#E8A84A', fin: '#4E5C66', mark: '#2B3640' },
    rarity: { ...all('common', [...EAST, 'southwest', 'california']), ...all('uncommon', ['pnw', 'rockies']) },
    outside: 'rare',
  },
  {
    id: 'crappie', name: 'Crappie', scientific: 'Pomoxis spp.', water: 'fresh',
    trophyLb: 2.5, k: 1700, shape: 'panfish', pattern: 'spots',
    colors: { back: '#4A5547', body: '#C9CFC0', belly: '#F2F3EE', fin: '#6E7869', mark: '#2D3529' },
    rarity: { ...all('common', ['southeast', 'gulf', 'midwest', 'plains']), ...all('uncommon', ['great_lakes', 'northeast', 'florida', 'california', 'southwest']) },
    outside: 'rare',
  },
  {
    id: 'redear_sunfish', name: 'Redear Sunfish', scientific: 'Lepomis microlophus', water: 'fresh',
    trophyLb: 2, k: 1200, shape: 'panfish', pattern: 'none',
    colors: { back: '#53603A', body: '#B0B271', belly: '#EAD38A', fin: '#7F8452', mark: '#C9442E' },
    rarity: { ...all('common', ['southeast', 'florida', 'gulf']), ...all('uncommon', ['midwest', 'california']) },
    outside: 'rare',
  },
  {
    id: 'pumpkinseed', name: 'Pumpkinseed', scientific: 'Lepomis gibbosus', water: 'fresh',
    trophyLb: 0.8, k: 1250, shape: 'panfish', pattern: 'spots',
    colors: { back: '#4F6B4A', body: '#C8A85A', belly: '#F0A040', fin: '#6E8A5E', mark: '#3FA0B8' },
    rarity: { ...all('common', ['northeast', 'great_lakes']), ...all('uncommon', ['midwest', 'pnw']) },
    outside: 'rare',
  },
  // ---- Catfish, carp & rough fish ----
  {
    id: 'channel_catfish', name: 'Channel Catfish', scientific: 'Ictalurus punctatus', water: 'fresh',
    trophyLb: 20, k: 2700, shape: 'catfish', pattern: 'spots',
    colors: { back: '#4D5560', body: '#9CA4AD', belly: '#EEF0F2', fin: '#6A727B', mark: '#2B3036' },
    rarity: { ...all('common', WARM), ...all('uncommon', ['great_lakes', 'northeast', 'rockies']) },
    outside: 'rare',
  },
  {
    id: 'blue_catfish', name: 'Blue Catfish', scientific: 'Ictalurus furcatus', water: 'fresh',
    trophyLb: 60, k: 2100, shape: 'catfish', pattern: 'none',
    colors: { back: '#3D4E66', body: '#8EA0B8', belly: '#EDF1F6', fin: '#5A6C84', mark: '#2B3A4E' },
    rarity: { ...all('common', ['gulf', 'southeast']), ...all('uncommon', ['midwest', 'plains']) },
    outside: 'epic',
  },
  {
    id: 'flathead_catfish', name: 'Flathead Catfish', scientific: 'Pylodictis olivaris', water: 'fresh',
    trophyLb: 50, k: 1900, shape: 'catfish', pattern: 'blotch',
    colors: { back: '#5A4A2E', body: '#B09A62', belly: '#EFE5C6', fin: '#7E6A42', mark: '#3A2E1A' },
    rarity: { ...all('uncommon', ['gulf', 'southeast', 'midwest', 'plains']) },
    outside: 'epic',
  },
  {
    id: 'common_carp', name: 'Common Carp', scientific: 'Cyprinus carpio', water: 'fresh',
    trophyLb: 25, k: 1800, shape: 'carp', pattern: 'none',
    colors: { back: '#6B5A2E', body: '#C9A65A', belly: '#F2E2B4', fin: '#A0703A', mark: '#4A3A1E' },
    rarity: { ...all('common', [...EAST, 'rockies', 'pnw', 'california', 'southwest']) },
    outside: 'uncommon',
  },
  {
    id: 'longnose_gar', name: 'Longnose Gar', scientific: 'Lepisosteus osseus', water: 'fresh',
    trophyLb: 25, k: 7400, shape: 'gar', pattern: 'spots',
    colors: { back: '#4E5A3A', body: '#A9AF83', belly: '#EEEDD8', fin: '#7E8458', mark: '#2E3420' },
    rarity: { ...all('uncommon', ['gulf', 'southeast', 'florida', 'midwest']) },
    outside: 'epic',
  },
  {
    id: 'bowfin', name: 'Bowfin', scientific: 'Amia calva', water: 'fresh',
    trophyLb: 10, k: 3000, shape: 'pike', pattern: 'blotch',
    colors: { back: '#3E4A2E', body: '#7A8458', belly: '#D8D9B8', fin: '#4F6A3A', mark: '#22301A' },
    rarity: { ...all('uncommon', ['southeast', 'florida', 'great_lakes']) },
    outside: 'epic',
  },
  {
    id: 'freshwater_drum', name: 'Freshwater Drum', scientific: 'Aplodinotus grunniens', water: 'fresh',
    trophyLb: 15, k: 2200, shape: 'drum', pattern: 'none',
    colors: { back: '#6A6E72', body: '#C6C9CC', belly: '#F2F3F4', fin: '#8E9296', mark: '#4A4E52' },
    rarity: { ...all('common', ['midwest', 'great_lakes', 'plains']), gulf: 'uncommon' },
    outside: 'rare',
  },
  // ---- Saltwater ----
  {
    id: 'redfish', name: 'Redfish (Red Drum)', scientific: 'Sciaenops ocellatus', water: 'salt',
    trophyLb: 25, k: 2400, shape: 'drum', pattern: 'spots',
    colors: { back: '#8A5A3A', body: '#D99A5E', belly: '#F4E3CC', fin: '#B0703E', mark: '#1A1410' },
    rarity: { ...all('common', SALT_SE), northeast: 'rare' },
    outside: 'epic',
  },
  {
    id: 'speckled_trout', name: 'Speckled Trout', scientific: 'Cynoscion nebulosus', water: 'salt',
    trophyLb: 7, k: 3000, shape: 'trout', pattern: 'spots',
    colors: { back: '#4D5E66', body: '#B7C4C8', belly: '#F2F4F4', fin: '#C9A84A', mark: '#1E262A' },
    rarity: { ...all('common', SALT_SE) },
    outside: 'epic',
  },
  {
    id: 'snook', name: 'Snook', scientific: 'Centropomus undecimalis', water: 'salt',
    trophyLb: 20, k: 2700, shape: 'pike', pattern: 'stripes',
    colors: { back: '#5A6046', body: '#C8C9A6', belly: '#F4F4E8', fin: '#D9C24A', mark: '#1E1E14' },
    rarity: { florida: 'uncommon', gulf: 'rare' },
    outside: 'epic',
  },
  {
    id: 'tarpon', name: 'Tarpon', scientific: 'Megalops atlanticus', water: 'salt',
    trophyLb: 100, k: 2700, shape: 'carp', pattern: 'none',
    colors: { back: '#3E5468', body: '#D4DDE4', belly: '#F6F8FA', fin: '#7C8EA0', mark: '#9AAABB' },
    rarity: { florida: 'rare', gulf: 'rare', southeast: 'epic' },
    outside: 'legendary',
  },
  {
    id: 'flounder', name: 'Flounder', scientific: 'Paralichthys spp.', water: 'salt',
    trophyLb: 8, k: 2000, shape: 'flat', pattern: 'spots',
    colors: { back: '#6A5A44', body: '#A89478', belly: '#E9E0D2', fin: '#8A785E', mark: '#3E3424' },
    rarity: { ...all('common', [...SALT_SE, 'northeast']), california: 'uncommon' },
    outside: 'rare',
  },
  {
    id: 'sheepshead', name: 'Sheepshead', scientific: 'Archosargus probatocephalus', water: 'salt',
    trophyLb: 10, k: 1500, shape: 'panfish', pattern: 'bars',
    colors: { back: '#5E6266', body: '#D2D4D6', belly: '#F2F3F4', fin: '#7A7E82', mark: '#1E2022' },
    rarity: { ...all('common', SALT_SE), northeast: 'uncommon' },
    outside: 'epic',
  },
  {
    id: 'red_snapper', name: 'Red Snapper', scientific: 'Lutjanus campechanus', water: 'salt',
    trophyLb: 20, k: 1750, shape: 'bass', pattern: 'none',
    colors: { back: '#B8323A', body: '#E06A6A', belly: '#F6D2CC', fin: '#C8484A', mark: '#8A1E26' },
    rarity: { gulf: 'uncommon', florida: 'uncommon', southeast: 'rare' },
    outside: 'epic',
  },
  {
    id: 'mahi_mahi', name: 'Mahi-Mahi', scientific: 'Coryphaena hippurus', water: 'salt',
    trophyLb: 40, k: 3200, shape: 'tuna', pattern: 'spots',
    colors: { back: '#1E7A6A', body: '#4FBF6A', belly: '#F2D84A', fin: '#2A7AC8', mark: '#1E4A8A' },
    rarity: { florida: 'uncommon', gulf: 'rare', hawaii: 'uncommon', southeast: 'rare' },
    outside: 'epic',
  },
  {
    id: 'bluefish', name: 'Bluefish', scientific: 'Pomatomus saltatrix', water: 'salt',
    trophyLb: 15, k: 2600, shape: 'tuna', pattern: 'none',
    colors: { back: '#2E5A7A', body: '#9AB4C8', belly: '#EEF2F6', fin: '#4E7896', mark: '#1E3A50' },
    rarity: { northeast: 'common', southeast: 'common', florida: 'uncommon' },
    outside: 'rare',
  },
  {
    id: 'pacific_halibut', name: 'Pacific Halibut', scientific: 'Hippoglossus stenolepis', water: 'salt',
    trophyLb: 100, k: 2000, shape: 'flat', pattern: 'blotch',
    colors: { back: '#4E4A3E', body: '#7E7A66', belly: '#EDEBE4', fin: '#5E5A4C', mark: '#2E2B22' },
    rarity: { alaska: 'common', pnw: 'uncommon', california: 'rare' },
    outside: 'epic',
  },
  {
    id: 'yellowfin_tuna', name: 'Yellowfin Tuna', scientific: 'Thunnus albacares', water: 'salt',
    trophyLb: 120, k: 1700, shape: 'tuna', pattern: 'none',
    colors: { back: '#1E3A6A', body: '#8FA8C8', belly: '#EEF2F6', fin: '#F2C83A', mark: '#F2C83A' },
    rarity: { hawaii: 'uncommon', gulf: 'rare', california: 'rare', florida: 'rare' },
    outside: 'epic',
  },
];

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(
  SPECIES.map((s) => [s.id, s]),
);

export function getSpecies(id: string): Species | undefined {
  return SPECIES_BY_ID[id];
}

export function rarityFor(speciesId: string, regionId: RegionId): RarityTier {
  const s = SPECIES_BY_ID[speciesId];
  if (!s) return 'rare';
  return s.rarity[regionId] ?? s.outside;
}

/** Estimated weight from length using the species' length-weight factor. */
export function weightFromLength(speciesId: string, lengthIn: number): number {
  const k = SPECIES_BY_ID[speciesId]?.k ?? 2400;
  return Math.round(((lengthIn ** 3) / k) * 100) / 100;
}

export function lengthFromWeight(speciesId: string, weightLb: number): number {
  const k = SPECIES_BY_ID[speciesId]?.k ?? 2400;
  return Math.round(Math.cbrt(weightLb * k) * 10) / 10;
}

/** Species that are common in a region, for demo/simulation purposes. */
export function commonSpeciesIn(regionId: RegionId): Species[] {
  const list = SPECIES.filter((s) => {
    const t = s.rarity[regionId];
    return t === 'common' || t === 'uncommon';
  });
  return list.length ? list : SPECIES.filter((s) => s.outside === 'uncommon' || s.outside === 'rare');
}

// A neutral palette for fish that are not in the list.
export const OTHER_COLORS = { back: '#4E5A66', body: '#A3AEB8', belly: '#EEF1F3', fin: '#6E7A86', mark: '#2E3640' };
