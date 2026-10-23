import { Platform } from 'react-native';
import { REGIONS } from './regions';
import { RARITY_ORDER } from './points';
import { SPECIES, SPECIES_BY_ID, commonSpeciesIn, lengthFromWeight, weightFromLength } from './species';
import type { AiEstimate, AiSource, CatchLocation, RarityTier } from './types';
import { base64ToBlob, clamp, seededRandom } from './util';

/**
 * Fish identification. Three back ends, picked in this order:
 *  1. "claude"  - the page is running inside a Claude artifact viewer; the photo goes to Claude
 *                 on the viewer's own account (no API key needed). Browser preview only.
 *  2. "server"  - EXPO_PUBLIC_WRANGLER_API_URL points at server/index.mjs, which calls the
 *                 Anthropic API with a key kept on the server. Used by local dev and the real app.
 *  3. "demo"    - no AI reachable; returns a plausible made-up estimate so the flow can be tested.
 */

const API_URL = process.env.EXPO_PUBLIC_WRANGLER_API_URL;

type SampleFn = ((input: string, opts?: Record<string, unknown>) => Promise<{ text: string }>) & {
  json: <T>(input: string, opts?: Record<string, unknown>) => Promise<T>;
  limits: () => Promise<{ images?: unknown }>;
};

declare global {
  interface Window {
    claude?: { use: (name: string) => Promise<unknown> };
  }
}

let samplePromise: Promise<SampleFn | null> | null = null;

function getSample(): Promise<SampleFn | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.claude?.use) {
    return Promise.resolve(null);
  }
  samplePromise ??= window.claude
    .use('sample')
    .then(async (s) => {
      if (!s) return null;
      const sample = s as SampleFn;
      const limits = await sample.limits().catch(() => null);
      return limits?.images ? sample : null;
    })
    .catch(() => null);
  return samplePromise;
}

export async function aiMode(): Promise<AiSource> {
  if (await getSample()) return 'claude';
  if (API_URL) return 'server';
  return 'demo';
}

export class AiError extends Error {
  constructor(
    public code: 'not_a_fish' | 'not_granted' | 'rate_limited' | 'cancelled' | 'failed',
    message: string,
  ) {
    super(message);
  }
}

export interface IdentifyInput {
  base64: string;
  mimeType: string;
  location: CatchLocation | null;
  signal?: AbortSignal;
}

interface RawAnswer {
  isFish: boolean;
  speciesId: string | null;
  speciesName: string;
  confidence: number;
  lengthIn: number;
  weightLb: number;
  sizeReasoning?: string;
  regionalRarity?: string;
  trophyWeightLb?: number;
  locationGuess?: string | null;
  funFact?: string;
  alternatives?: { speciesId: string; speciesName: string; confidence: number }[];
}

export function buildPrompt(location: CatchLocation | null): string {
  const where = !location
    ? 'unknown (judge from the fish alone)'
    : location.lat != null
      ? `GPS ${location.lat.toFixed(4)}, ${location.lon!.toFixed(4)} (${location.name}; region: ${REGIONS[location.regionId].name})`
      : `${location.name} (region: ${REGIONS[location.regionId].name})`;
  const list = SPECIES.map((s) => `${s.id} = ${s.name}`).join('\n');
  return `You are the fish-identification engine of Wrangler, a fishing app. The attached photo was taken by an angler of a fish they just caught.
Catch location: ${where}.

Tasks:
1. Decide whether the photo shows a real fish. If not, set isFish to false.
2. Identify the species. Use the location to break ties between look-alike species. If it matches one of the ids below, use that id; otherwise set speciesId to "other" and give the common name.
3. Estimate total length (inches) and weight (pounds). Judge scale from hands, fingers, reels, rods, boat parts, coolers, rulers or any object of known size. A typical adult hand is about 7.5 in long and 3.5 in wide across the palm. Body depth and girth matter for weight. Be realistic, not flattering.
4. Rate how unusual this species is to catch in this region: common, uncommon, rare, epic, or legendary.
5. Give one short, fun, accurate fact about the species.

Species ids:
${list}

Reply with only a JSON object in this exact shape:
{"isFish": true, "speciesId": "largemouth_bass", "speciesName": "Largemouth Bass", "confidence": 0.82, "lengthIn": 18.5, "weightLb": 3.4, "sizeReasoning": "Fish spans about 2.5 hand-widths...", "regionalRarity": "common", "trophyWeightLb": 8, "locationGuess": "Lake Travis area, TX", "funFact": "...", "alternatives": [{"speciesId": "spotted_bass", "speciesName": "Spotted Bass", "confidence": 0.12}]}
confidence is 0 to 1 for the species call. trophyWeightLb is the weight a trophy specimen of this species reaches. locationGuess names the nearest notable lake, river, coast or town for the GPS point, or null if unsure. Keep sizeReasoning under 25 words.`;
}

export async function identifyFish(input: IdentifyInput): Promise<AiEstimate> {
  const sample = await getSample();
  if (sample) return normalize(await askClaudeInArtifact(sample, input), 'claude');
  if (API_URL) return normalize(await askServer(input), 'server');
  return demoEstimate(input);
}

async function askClaudeInArtifact(sample: SampleFn, input: IdentifyInput): Promise<RawAnswer> {
  try {
    return await sample.json<RawAnswer>(buildPrompt(input.location), {
      images: [base64ToBlob(input.base64, input.mimeType)],
      signal: input.signal,
      cache: false,
    });
  } catch (e: any) {
    const code = e?.code as string | undefined;
    if (code === 'cancelled') throw new AiError('cancelled', 'Cancelled');
    if (code === 'not_granted' || code === 'sampling_disabled')
      throw new AiError('not_granted', 'Claude access was not allowed for this page.');
    if (code === 'rate_limited') throw new AiError('rate_limited', 'Too many requests. Try again in a minute.');
    if (code === 'image_rejected') throw new AiError('failed', 'That photo could not be read. Try a different one.');
    throw new AiError('failed', 'The AI could not analyze this photo. Try again or enter the details yourself.');
  }
}

async function askServer(input: IdentifyInput): Promise<RawAnswer> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: input.base64, mimeType: input.mimeType, prompt: buildPrompt(input.location) }),
      signal: input.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new AiError('cancelled', 'Cancelled');
    throw new AiError('failed', 'Could not reach the Wrangler AI server.');
  }
  if (res.status === 429) throw new AiError('rate_limited', 'Too many requests. Try again in a minute.');
  if (!res.ok) throw new AiError('failed', 'The AI server could not analyze this photo.');
  return (await res.json()) as RawAnswer;
}

function normalize(raw: RawAnswer, source: AiSource): AiEstimate {
  if (!raw || raw.isFish === false) {
    throw new AiError('not_a_fish', "That doesn't look like a fish. Try a clearer photo of your catch.");
  }
  const known = raw.speciesId && SPECIES_BY_ID[raw.speciesId] ? raw.speciesId : 'other';
  const speciesName = known !== 'other' ? SPECIES_BY_ID[known].name : String(raw.speciesName || 'Unknown fish');
  let lengthIn = clamp(Number(raw.lengthIn) || 0, 0, 200);
  let weightLb = clamp(Number(raw.weightLb) || 0, 0, 2000);
  if (!lengthIn && weightLb) lengthIn = lengthFromWeight(known, weightLb);
  if (!weightLb && lengthIn) weightLb = weightFromLength(known, lengthIn);
  const rarity = RARITY_ORDER.includes(raw.regionalRarity as RarityTier)
    ? (raw.regionalRarity as RarityTier)
    : undefined;
  return {
    speciesId: known,
    speciesName,
    lengthIn: Math.round(lengthIn * 10) / 10,
    weightLb: Math.round(weightLb * 100) / 100,
    confidence: clamp(Number(raw.confidence) || 0.5, 0, 1),
    notes: raw.sizeReasoning,
    funFact: raw.funFact,
    regionalRarity: rarity,
    trophyWeightLb: Number(raw.trophyWeightLb) || undefined,
    locationGuess: raw.locationGuess ?? undefined,
    alternatives: (raw.alternatives ?? [])
      .filter((a) => a && a.speciesName)
      .slice(0, 3)
      .map((a) => ({
        speciesId: SPECIES_BY_ID[a.speciesId] ? a.speciesId : 'other',
        speciesName: SPECIES_BY_ID[a.speciesId]?.name ?? a.speciesName,
        confidence: clamp(Number(a.confidence) || 0, 0, 1),
      })),
    source,
  };
}

async function demoEstimate(input: IdentifyInput): Promise<AiEstimate> {
  await new Promise((r) => setTimeout(r, 1800));
  if (input.signal?.aborted) throw new AiError('cancelled', 'Cancelled');
  const rand = seededRandom(input.base64.length + input.base64.charCodeAt(100 % input.base64.length));
  const pool = commonSpeciesIn(input.location?.regionId ?? 'gulf');
  const pick = pool[Math.floor(rand() * pool.length)];
  const weightLb = Math.round(pick.trophyLb * (0.15 + rand() * 0.55) * 100) / 100;
  const alt = pool.filter((s) => s.id !== pick.id)[0];
  return {
    speciesId: pick.id,
    speciesName: pick.name,
    weightLb,
    lengthIn: lengthFromWeight(pick.id, weightLb),
    confidence: 0.55 + rand() * 0.35,
    notes: 'Demo estimate. Connect Claude for a real analysis.',
    alternatives: alt ? [{ speciesId: alt.id, speciesName: alt.name, confidence: 0.1 }] : [],
    source: 'demo',
  };
}
