import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const GREETING_TEXT =
  "It's a beautiful day at Genesis. Press 1 to be connected to the center.";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'audio');
const outPath = path.join(outDir, 'inbound-greeting.mp3');

const apiKey = String(process.env.ELEVENLABS_API_KEY || '').trim();
if (!apiKey) {
  console.error('Error: ELEVENLABS_API_KEY is required.');
  process.exit(1);
}

const voiceId = String(process.env.ELEVENLABS_VOICE_ID || '').trim();
if (!voiceId) {
  console.error('Error: ELEVENLABS_VOICE_ID is required.');
  console.error('Pick a voice in the ElevenLabs Voice Library and set its voice ID.');
  process.exit(1);
}

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
  {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: GREETING_TEXT,
      model_id: 'eleven_turbo_v2_5',
    }),
  }
);

if (!response.ok) {
  const detail = await response.text();
  console.error(`ElevenLabs API error (${response.status}): ${detail}`);
  process.exit(1);
}

const buffer = Buffer.from(await response.arrayBuffer());
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, buffer);

console.log(outPath);
