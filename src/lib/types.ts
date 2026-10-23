export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type RegionId =
  | 'alaska'
  | 'hawaii'
  | 'pnw'
  | 'california'
  | 'southwest'
  | 'rockies'
  | 'plains'
  | 'gulf'
  | 'florida'
  | 'southeast'
  | 'midwest'
  | 'great_lakes'
  | 'northeast'
  | 'intl';

export interface User {
  id: string;
  name: string;
  handle: string;
  avatarColor: string;
  bio?: string;
  homeWater?: string;
}

export interface Conditions {
  tempF: number;
  pressureInHg: number;
  pressureTrend: 'rising' | 'falling' | 'steady';
  windMph: number;
  sky: string;
  moonPhase: string;
  moonIllumination: number; // 0..1
  source: 'live' | 'simulated';
}

export interface CatchLocation {
  lat?: number;
  lon?: number;
  name: string;
  regionId: RegionId;
  source: 'gps' | 'photo' | 'manual' | 'demo';
}

export type AiSource = 'claude' | 'server' | 'demo';

export interface AiEstimate {
  speciesId: string;
  speciesName: string;
  lengthIn: number;
  weightLb: number;
  confidence: number; // 0..1
  notes?: string;
  funFact?: string;
  regionalRarity?: RarityTier;
  trophyWeightLb?: number;
  locationGuess?: string;
  alternatives?: { speciesId: string; speciesName: string; confidence: number }[];
  source: AiSource;
}

export interface PointsBreakdown {
  size: number;
  rarity: RarityTier;
  multiplier: number;
  firstOfSpecies: number;
  personalBest: number;
  releaseBonus: number;
  total: number;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface Catch {
  id: string;
  userId: string;
  createdAt: number;
  photo?: string; // data URI
  speciesId: string; // 'other' when not in the species list
  speciesName: string;
  customTrophyLb?: number; // for 'other'
  customRarity?: RarityTier; // for 'other'
  lengthIn: number;
  weightLb: number;
  ai?: AiEstimate;
  edited: boolean;
  location: CatchLocation;
  secretSpot: boolean;
  released: boolean;
  caption: string;
  conditions?: Conditions;
  points: PointsBreakdown;
  reactions: Record<string, string[]>; // emoji -> user ids
  comments: Comment[];
  notifiedFriends: boolean;
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'reaction'
  | 'comment'
  | 'big_catch';

export interface AppNotification {
  id: string;
  type: NotificationType;
  fromUserId: string;
  catchId?: string;
  text: string;
  createdAt: number;
  read: boolean;
}

export interface Settings {
  units: 'imperial' | 'metric';
}

export interface AppState {
  version: number;
  meId: string | null;
  users: Record<string, User>;
  friends: string[];
  incomingRequests: string[];
  outgoingRequests: string[];
  catches: Catch[];
  notifications: AppNotification[];
  settings: Settings;
}
