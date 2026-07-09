import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateEnrollmentPDF } from '../server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, 'fixtures', 'enrollment-sample.json');
const outDir = path.join(__dirname, '..', 'tmp');
const outPath = path.join(outDir, 'enrollment-preview.pdf');

const data = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const buffer = await generateEnrollmentPDF(data);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, buffer);

console.log(`Wrote ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
