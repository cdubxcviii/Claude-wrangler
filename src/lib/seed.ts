import { simulateConditions } from './conditions';
import { scoreCatch } from './points';
import { regionFor } from './regions';
import { SPECIES_BY_ID, lengthFromWeight } from './species';
import type { AppNotification, AppState, Catch, User } from './types';

export const STATE_VERSION = 1;

export const DEMO_USERS: User[] = [
  { id: 'u_jake', name: 'Jake Morales', handle: 'jakereels', avatarColor: '#F2994A', bio: 'Bass junkie. Lake Fork or bust.', homeWater: 'Lake Fork, TX' },
  { id: 'u_maya', name: 'Maya Chen', handle: 'mayacasts', avatarColor: '#9B51E0', bio: 'Fly fishing the Rockies 🏔️', homeWater: 'Madison River, MT' },
  { id: 'u_tyler', name: 'Tyler Brooks', handle: 'bigtbass', avatarColor: '#27AE60', bio: 'Weekend warrior. Catch & release.', homeWater: 'Lake Travis, TX' },
  { id: 'u_sam', name: 'Sam Okafor', handle: 'samhooks', avatarColor: '#2F80ED', bio: 'Salt life. Keys local.', homeWater: 'Florida Keys' },
  { id: 'u_riley', name: 'Riley Nguyen', handle: 'riley.fly', avatarColor: '#EB5757', bio: 'Walleye whisperer', homeWater: 'Mille Lacs, MN' },
  { id: 'u_dee', name: 'Deanna Price', handle: 'deeontheline', avatarColor: '#56CCF2', bio: 'Salmon season is a lifestyle', homeWater: 'Kenai River, AK' },
  { id: 'u_marcus', name: 'Marcus Webb', handle: 'marcusmuskie', avatarColor: '#6FCF97', bio: 'Fish of 10,000 casts', homeWater: 'Lake St. Clair, MI' },
  { id: 'u_lena', name: 'Lena Ortiz', handle: 'lenalures', avatarColor: '#F2C94C', bio: 'Kayak angler', homeWater: 'Chesapeake Bay' },
  { id: 'u_cody', name: 'Cody Hale', handle: 'codycatfish', avatarColor: '#BB6BD9', bio: 'Night fishing for big cats', homeWater: 'Lake Fork, TX' },
];

const PLACES = {
  fork: { lat: 32.85, lon: -95.6, name: 'Lake Fork, TX' },
  travis: { lat: 30.41, lon: -97.91, name: 'Lake Travis, TX' },
  madison: { lat: 45.6, lon: -111.52, name: 'Madison River, MT' },
  keys: { lat: 24.7, lon: -81.1, name: 'Marathon, Florida Keys' },
  milleLacs: { lat: 46.23, lon: -93.65, name: 'Mille Lacs Lake, MN' },
  kenai: { lat: 60.5, lon: -150.9, name: 'Kenai River, AK' },
  stClair: { lat: 42.47, lon: -82.67, name: 'Lake St. Clair, MI' },
  chesapeake: { lat: 38.6, lon: -76.4, name: 'Chesapeake Bay, MD' },
};

type SeedCatch = [
  userId: string,
  speciesId: string,
  weightLb: number,
  hoursAgo: number,
  place: keyof typeof PLACES,
  caption: string,
  released: boolean,
  secretSpot?: boolean,
];

const SEED_CATCHES: SeedCatch[] = [
  ['u_jake', 'largemouth_bass', 7.4, 3, 'fork', 'Biggest of the year!! Texas rig in 8ft of water 🎣', true, true],
  ['u_maya', 'brown_trout', 4.1, 9, 'madison', 'Dry fly eat at sunset. Shaking.', true],
  ['u_sam', 'tarpon', 86, 20, 'keys', 'Silver king. 40 minute fight. Released healthy 🙌', true],
  ['u_riley', 'walleye', 6.2, 30, 'milleLacs', 'Golden hour walleye bite was ON', false],
  ['u_dee', 'chinook_salmon', 28.5, 44, 'kenai', 'KING. My arms are done.', false],
  ['u_tyler', 'largemouth_bass', 3.2, 52, 'travis', 'Quick morning session before work', true],
  ['u_jake', 'spotted_bass', 2.1, 70, 'fork', 'Spot on a drop shot', true],
  ['u_maya', 'cutthroat_trout', 2.4, 96, 'madison', 'Native cutty 😍', true],
  ['u_sam', 'redfish', 9.8, 120, 'keys', 'Tailing reds on the flats', true],
  ['u_tyler', 'channel_catfish', 8.7, 150, 'travis', 'Night bite with chicken liver', false],
  ['u_riley', 'northern_pike', 14.2, 170, 'milleLacs', 'Gator on a spinnerbait 🐊', true],
  ['u_dee', 'coho_salmon', 9.1, 200, 'kenai', 'Silvers are in', false],
  ['u_jake', 'largemouth_bass', 4.6, 230, 'fork', 'Frog bite in the lily pads', true],
  ['u_maya', 'rainbow_trout', 1.9, 260, 'madison', 'Nymphing the riffle', true],
  ['u_tyler', 'bluegill', 0.7, 300, 'travis', 'Took my nephew out. He out-fished me.', true],
  ['u_sam', 'snook', 12.3, 330, 'keys', 'Dock light snook at midnight', true],
  ['u_marcus', 'muskellunge', 38, 60, 'stClair', 'Finally. 10,000 casts paid off.', true],
  ['u_lena', 'speckled_trout', 3.4, 80, 'chesapeake', 'Kayak specks!', true],
  ['u_cody', 'blue_catfish', 46, 110, 'fork', 'Big blue on cut shad', true],
];

const FRIENDS = ['u_jake', 'u_maya', 'u_tyler', 'u_sam', 'u_riley', 'u_dee'];

const SEED_COMMENTS: [catchIndex: number, userId: string, text: string][] = [
  [0, 'u_tyler', 'Absolute toad 🐸 where was this??'],
  [0, 'u_jake', 'Secret spot for a reason 😂'],
  [2, 'u_maya', 'No way!! 86 lbs?!'],
  [2, 'u_dee', 'Legendary.'],
  [4, 'u_riley', 'That is a FISH'],
  [3, 'u_jake', 'Dinner sorted 🔥'],
];

export function buildSeedState(): AppState {
  const now = Date.now();
  const users = Object.fromEntries(DEMO_USERS.map((u) => [u.id, u]));
  const sorted = [...SEED_CATCHES].sort((a, b) => b[3] - a[3]); // oldest first for scoring
  const catches: Catch[] = [];
  sorted.forEach(([userId, speciesId, weightLb, hoursAgo, placeKey, caption, released, secretSpot], i) => {
    const place = PLACES[placeKey];
    const createdAt = now - hoursAgo * 3600000;
    const regionId = regionFor(place.lat, place.lon);
    const points = scoreCatch({ speciesId, weightLb, regionId, released }, catches, userId);
    const reactors = FRIENDS.filter((f) => f !== userId).filter((_, j) => (i + j) % 2 === 0);
    catches.push({
      id: `seed_${i}`,
      userId,
      createdAt,
      speciesId,
      speciesName: SPECIES_BY_ID[speciesId].name,
      lengthIn: lengthFromWeight(speciesId, weightLb),
      weightLb,
      edited: false,
      location: { ...place, regionId, source: 'gps' },
      secretSpot: !!secretSpot,
      released,
      caption,
      conditions: simulateConditions(place.lat, place.lon, createdAt),
      points,
      reactions: { '🔥': reactors.slice(0, 2), '🎣': reactors.slice(2) },
      comments: [],
      notifiedFriends: points.total > 400,
    });
  });
  catches.reverse(); // newest first
  const byCaption = (idx: number) => catches.find((c) => c.caption === SEED_CATCHES[idx][5]);
  SEED_COMMENTS.forEach(([idx, userId, text], n) => {
    const c = byCaption(idx);
    if (c) c.comments.push({ id: `seed_cm_${n}`, userId, text, createdAt: c.createdAt + (n + 1) * 600000 });
  });

  const notifications: AppNotification[] = [
    {
      id: 'seed_n_req',
      type: 'friend_request',
      fromUserId: 'u_lena',
      text: 'sent you a friend request.',
      createdAt: now - 5 * 3600000,
      read: false,
    },
  ];
  const jakeBig = byCaption(0);
  if (jakeBig) {
    notifications.push({
      id: 'seed_n_big',
      type: 'big_catch',
      fromUserId: 'u_jake',
      catchId: jakeBig.id,
      text: `just landed a ${jakeBig.weightLb} lb Largemouth Bass (${jakeBig.points.total} pts)!`,
      createdAt: jakeBig.createdAt,
      read: false,
    });
  }

  return {
    version: STATE_VERSION,
    meId: null,
    users,
    friends: FRIENDS,
    incomingRequests: ['u_lena'],
    outgoingRequests: [],
    catches,
    notifications,
    settings: { units: 'imperial' },
  };
}

export const REACTION_EMOJI = ['🔥', '🎣', '😮', '👑'];

export const FRIEND_COMMENTS = [
  'Nice fish! 🔥',
  "Okay that's a hog",
  'Where at?? 👀',
  'Jealous.',
  'Absolute unit',
  'Great catch!',
  'Teach me your ways',
  'Pic or it didn’t happen… oh wait 😂',
  'That’s going on the wall',
  'Leaderboard is shaking',
];
