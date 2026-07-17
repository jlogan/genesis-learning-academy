#!/usr/bin/env node
import fs from 'fs';
import process from 'process';
import { ensureLeadTables, listSocialPosts, saveSocialPost, updateSocialPost } from '../server.js';

function usage() {
  console.log(`Usage:
  node scripts/social-posts.mjs create --file post.json
  node scripts/social-posts.mjs publish --id 12 --url https://facebook.com/... [--published-at "2026-07-17 10:30:00"]
  node scripts/social-posts.mjs list --start 2026-07-01 --end 2026-08-01 [--status published]

JSON fields for create/update:
  plannedFor, publishedAt, platform, status, postTheme, caption, cta, facebookUrl,
  slackChannel, slackThreadTs, requestedBy, createdBy, assetPaths[], selectedAssetPath,
  metrics{}, notes
`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command };
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = rest[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function readPayload(file) {
  if (!file) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.help || args.command === 'help' || args.command === '--help' || args.command === '-h') {
    usage();
    return;
  }

  if (!['create', 'publish', 'update', 'list'].includes(args.command)) {
    usage();
    process.exitCode = 1;
    return;
  }

  await ensureLeadTables();

  if (args.command === 'create') {
    const payload = readPayload(args.file);
    const id = await saveSocialPost(payload);
    if (!id) throw new Error('Database is not configured; social post was not saved.');
    console.log(JSON.stringify({ success: true, socialPostId: id }, null, 2));
    return;
  }

  if (args.command === 'publish') {
    if (!args.id) throw new Error('--id is required for publish');
    const payload = {
      ...readPayload(args.file),
      status: 'published',
      facebookUrl: args.url || undefined,
      publishedAt: args.publishedAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
      notes: args.notes || undefined,
    };
    const id = await updateSocialPost(Number(args.id), payload);
    console.log(JSON.stringify({ success: true, socialPostId: id }, null, 2));
    return;
  }

  if (args.command === 'update') {
    if (!args.id) throw new Error('--id is required for update');
    const id = await updateSocialPost(Number(args.id), readPayload(args.file));
    console.log(JSON.stringify({ success: true, socialPostId: id }, null, 2));
    return;
  }

  if (args.command === 'list') {
    const posts = await listSocialPosts({
      startDate: args.start || args.startDate,
      endDate: args.end || args.endDate,
      platform: args.platform || 'facebook',
      status: args.status,
    });
    console.log(JSON.stringify({ success: true, count: posts.length, posts }, null, 2));
    return;
  }

  usage();
  process.exitCode = 1;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
