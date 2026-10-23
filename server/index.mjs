// Wrangler AI server: the app POSTs a fish photo, this asks Claude and returns the estimate.
// The Anthropic API key stays here, never on the phone.
//
//   cd server && npm install
//   ANTHROPIC_API_KEY=sk-ant-... npm start          # listens on :8787
//   EXPO_PUBLIC_WRANGLER_API_URL=http://<your-ip>:8787 npx expo start
import http from 'node:http';
import Anthropic from '@anthropic-ai/sdk';

const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.WRANGLER_MODEL ?? 'claude-opus-5-5';
const MAX_BODY = 12 * 1024 * 1024;

const client = new Anthropic();

// Mirrors RawAnswer in src/lib/ai.ts; the prompt itself is built by the app.
const ANSWER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'isFish', 'speciesId', 'speciesName', 'confidence', 'lengthIn', 'weightLb', 'sizeReasoning',
    'regionalRarity', 'trophyWeightLb', 'locationGuess', 'funFact', 'alternatives',
  ],
  properties: {
    isFish: { type: 'boolean' },
    speciesId: { type: 'string' },
    speciesName: { type: 'string' },
    confidence: { type: 'number' },
    lengthIn: { type: 'number' },
    weightLb: { type: 'number' },
    sizeReasoning: { type: 'string' },
    regionalRarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
    trophyWeightLb: { type: 'number' },
    locationGuess: { type: 'string' },
    funFact: { type: 'string' },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['speciesId', 'speciesName', 'confidence'],
        properties: {
          speciesId: { type: 'string' },
          speciesName: { type: 'string' },
          confidence: { type: 'number' },
        },
      },
    },
  },
};

const MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

async function identify({ image, mimeType, prompt }) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // On a safety decline, let the API retry on its default fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: ANSWER_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });
  if (response.stop_reason === 'refusal') {
    const err = new Error('Claude declined to analyze this photo.');
    err.status = 422;
    throw err;
  }
  const text = response.content.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('Empty response from Claude.');
  return JSON.parse(text);
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true, model: MODEL });
  if (req.method !== 'POST' || req.url !== '/identify') return send(res, 404, { error: 'Not found' });

  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) return send(res, 413, { error: 'Photo too large (max 12 MB).' });
    chunks.push(chunk);
  }

  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return send(res, 400, { error: 'Body must be JSON.' });
  }
  if (typeof body.image !== 'string' || typeof body.prompt !== 'string' || !MEDIA_TYPES.has(body.mimeType)) {
    return send(res, 400, { error: 'Expected { image: base64, mimeType: image/jpeg|png|webp|gif, prompt }.' });
  }

  try {
    send(res, 200, await identify(body));
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return send(res, 429, { error: 'Rate limited. Try again shortly.' });
    if (e instanceof Anthropic.AuthenticationError) return send(res, 500, { error: 'Server API key is invalid.' });
    if (e instanceof Anthropic.BadRequestError) return send(res, 400, { error: e.message });
    if (e instanceof Anthropic.APIError) return send(res, 502, { error: `Claude API error ${e.status}` });
    console.error(e);
    send(res, e.status ?? 500, { error: e.message ?? 'Failed to analyze photo.' });
  }
});

server.listen(PORT, () => console.log(`Wrangler AI server on http://localhost:${PORT} (model ${MODEL})`));
