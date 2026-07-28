#!/usr/bin/env node
import process from 'process';
import {
  ensureLeadTables,
  syncMetaAds,
  syncMetaAdAccountStructure,
  syncMetaAdInsights,
  syncMetaCustomAudiences,
  listMetaAdAccounts,
  listMetaCampaigns,
  listMetaAds,
  listMetaAdInsights,
  listMetaCustomAudiences,
  getMetaAdsReport,
  listMetaAdSyncRuns,
} from '../server.js';

function usage() {
  console.log(`Usage:
  node scripts/meta-ads.mjs sync [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--no-audiences] [--level ad]
  node scripts/meta-ads.mjs sync-structure
  node scripts/meta-ads.mjs sync-insights --since YYYY-MM-DD --until YYYY-MM-DD [--level ad] [--no-breakdowns]
  node scripts/meta-ads.mjs sync-audiences
  node scripts/meta-ads.mjs list-accounts
  node scripts/meta-ads.mjs list-campaigns [--start YYYY-MM-DD] [--end YYYY-MM-DD]
  node scripts/meta-ads.mjs list-ads [--campaign-id ID] [--ad-set-id ID] [--status ACTIVE]
  node scripts/meta-ads.mjs list-insights --start YYYY-MM-DD --end YYYY-MM-DD [--platform facebook|instagram]
  node scripts/meta-ads.mjs list-report --start YYYY-MM-DD --end YYYY-MM-DD
  node scripts/meta-ads.mjs list-sync-runs [--limit 20]
  node scripts/meta-ads.mjs list-audiences

Requires META_AD_ACCOUNT_ID and META_ACCESS_TOKEN (or FACEBOOK_LONG_LIVED_USER_TOKEN) for sync commands.
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.help || args.command === 'help' || args.command === '--help' || args.command === '-h') {
    usage();
    return;
  }

  const commands = [
    'sync',
    'sync-structure',
    'sync-insights',
    'sync-audiences',
    'list-accounts',
    'list-campaigns',
    'list-ads',
    'list-insights',
    'list-report',
    'list-sync-runs',
    'list-audiences',
  ];
  if (!commands.includes(args.command)) {
    usage();
    process.exitCode = 1;
    return;
  }

  await ensureLeadTables();

  if (args.command === 'sync') {
    const result = await syncMetaAds({
      since: args.since || null,
      until: args.until || null,
      syncAudiences: !args.noAudiences,
      insightLevel: args.level || 'ad',
      includeBreakdowns: !args.noBreakdowns,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.command === 'sync-structure') {
    console.log(JSON.stringify(await syncMetaAdAccountStructure(), null, 2));
    return;
  }

  if (args.command === 'sync-insights') {
    if (!args.since || !args.until) throw new Error('--since and --until are required for sync-insights');
    const result = await syncMetaAdInsights({
      since: args.since,
      until: args.until,
      level: args.level || 'ad',
      includeBreakdowns: !args.noBreakdowns,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.command === 'sync-audiences') {
    console.log(JSON.stringify(await syncMetaCustomAudiences(), null, 2));
    return;
  }

  if (args.command === 'list-accounts') {
    const accounts = await listMetaAdAccounts();
    console.log(JSON.stringify({ success: true, count: accounts.length, accounts }, null, 2));
    return;
  }

  if (args.command === 'list-campaigns') {
    const campaigns = await listMetaCampaigns({
      startDate: args.start || args.startDate,
      endDate: args.end || args.endDate,
    });
    console.log(JSON.stringify({ success: true, count: campaigns.length, campaigns }, null, 2));
    return;
  }

  if (args.command === 'list-ads') {
    const ads = await listMetaAds({
      metaCampaignId: args.campaignId,
      metaAdSetId: args.adSetId,
      status: args.status,
    });
    console.log(JSON.stringify({ success: true, count: ads.length, ads }, null, 2));
    return;
  }

  if (args.command === 'list-insights') {
    const insights = await listMetaAdInsights({
      startDate: args.start || args.startDate || args.since,
      endDate: args.end || args.endDate || args.until,
      publisherPlatform: args.platform,
      insightLevel: args.level || 'ad',
    });
    console.log(JSON.stringify({ success: true, count: insights.length, insights }, null, 2));
    return;
  }

  if (args.command === 'list-report') {
    const startDate = args.start || args.startDate || args.since;
    const endDate = args.end || args.endDate || args.until;
    if (!startDate || !endDate) throw new Error('--start and --end are required for list-report');
    const report = await getMetaAdsReport({
      startDate,
      endDate,
      metaAccountId: args.accountId || args.metaAccountId || null,
      insightLevel: args.level || 'ad',
    });
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (args.command === 'list-sync-runs') {
    const syncRuns = await listMetaAdSyncRuns({ limit: args.limit || 20 });
    console.log(JSON.stringify({ success: true, count: syncRuns.length, syncRuns }, null, 2));
    return;
  }

  if (args.command === 'list-audiences') {
    const audiences = await listMetaCustomAudiences();
    console.log(JSON.stringify({ success: true, count: audiences.length, audiences }, null, 2));
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
