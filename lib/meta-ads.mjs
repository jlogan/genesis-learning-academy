let getDbPool = () => null;

export function configureMetaAdsDb(poolGetter) {
  getDbPool = poolGetter;
}

function poolOrThrow() {
  const pool = getDbPool();
  if (!pool) throw new Error('Database is not configured.');
  return pool;
}

function normalizeAdAccountId(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.startsWith('act_') ? raw : `act_${raw}`;
}

function parseMetaDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function parseMetaDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function toNullableDecimal(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toNullableInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function sanitizeGraphPayload(value) {
  if (Array.isArray(value)) return value.map(sanitizeGraphPayload);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'access_token')
      .map(([key, child]) => [key, sanitizeGraphPayload(child)])
  );
}

const META_INSIGHT_ACTION_ALIASES = {
  link_clicks: ['link_click'],
  landing_page_views: ['landing_page_view', 'omni_landing_page_view'],
  leads: ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead', 'onsite_conversion.messaging_conversation_started_7d'],
  post_engagements: ['post_engagement', 'post_reaction', 'comment', 'post'],
};

function sumActionValues(actions, actionTypes) {
  if (!Array.isArray(actions)) return null;
  let total = 0;
  let found = false;
  for (const action of actions) {
    if (!actionTypes.includes(action.action_type)) continue;
    const value = toNullableInt(action.value);
    if (value === null) continue;
    total += value;
    found = true;
  }
  return found ? total : null;
}

export function parseMetaInsightActions(actions) {
  const parsed = {};
  for (const [column, actionTypes] of Object.entries(META_INSIGHT_ACTION_ALIASES)) {
    parsed[column] = sumActionValues(actions, actionTypes);
  }
  return parsed;
}

function resolveAdPreviewUrl(ad) {
  return ad.preview_url || ad.preview_shareable_link || null;
}

export function getMetaAdsConfig() {
  const adAccountId = normalizeAdAccountId(process.env.META_AD_ACCOUNT_ID);
  const accessToken = String(process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_LONG_LIVED_USER_TOKEN || '').trim();
  const graphVersion = process.env.META_GRAPH_VERSION || process.env.FACEBOOK_GRAPH_VERSION || 'v23.0';
  if (!adAccountId || !accessToken) {
    throw new Error('META_AD_ACCOUNT_ID and META_ACCESS_TOKEN (or FACEBOOK_LONG_LIVED_USER_TOKEN) must be configured.');
  }
  return { adAccountId, accessToken, graphVersion };
}

async function metaGraphRequest(pathname, params = {}) {
  const { accessToken, graphVersion } = getMetaAdsConfig();
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${pathname.replace(/^\//, '')}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Meta Graph API request failed with ${response.status}`);
  }
  return body;
}

async function metaGraphPaginate(pathname, params = {}, { maxPages = 50 } = {}) {
  const rows = [];
  let nextPath = pathname;
  let nextParams = { ...params };
  let page = 0;

  while (nextPath && page < maxPages) {
    const body = await metaGraphRequest(nextPath, nextParams);
    rows.push(...(body.data || []));
    const nextUrl = body.paging?.next;
    if (!nextUrl) break;
    const parsed = new URL(nextUrl);
    nextPath = parsed.pathname.replace(new RegExp(`^/${getMetaAdsConfig().graphVersion}/`), '');
    nextParams = Object.fromEntries(parsed.searchParams.entries());
    delete nextParams.access_token;
    page += 1;
  }

  return rows;
}

export async function ensureMetaAdsTables() {
  const pool = getDbPool();
  if (!pool) {
    console.warn('Database env vars are not set; Meta Ads persistence is disabled.');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_ad_accounts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      meta_account_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NULL,
      account_status INT NULL,
      currency VARCHAR(10) NULL,
      timezone_name VARCHAR(100) NULL,
      business_name VARCHAR(255) NULL,
      synced_at DATETIME NULL,
      raw_payload JSON NULL,
      UNIQUE KEY uk_meta_ad_accounts_account_id (meta_account_id),
      INDEX idx_meta_ad_accounts_synced_at (synced_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_campaigns (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      meta_campaign_id VARCHAR(64) NOT NULL,
      meta_account_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NULL,
      status VARCHAR(50) NULL,
      effective_status VARCHAR(50) NULL,
      objective VARCHAR(100) NULL,
      buying_type VARCHAR(50) NULL,
      start_time DATETIME NULL,
      stop_time DATETIME NULL,
      daily_budget DECIMAL(14, 2) NULL,
      lifetime_budget DECIMAL(14, 2) NULL,
      synced_at DATETIME NULL,
      raw_payload JSON NULL,
      UNIQUE KEY uk_meta_campaigns_campaign_id (meta_campaign_id),
      INDEX idx_meta_campaigns_account (meta_account_id),
      INDEX idx_meta_campaigns_status (status),
      INDEX idx_meta_campaigns_start_time (start_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_ad_sets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      meta_ad_set_id VARCHAR(64) NOT NULL,
      meta_campaign_id VARCHAR(64) NOT NULL,
      meta_account_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NULL,
      status VARCHAR(50) NULL,
      effective_status VARCHAR(50) NULL,
      optimization_goal VARCHAR(100) NULL,
      billing_event VARCHAR(50) NULL,
      publisher_platforms JSON NULL,
      facebook_positions JSON NULL,
      instagram_positions JSON NULL,
      audience_network_positions JSON NULL,
      messenger_positions JSON NULL,
      targeting JSON NULL,
      start_time DATETIME NULL,
      stop_time DATETIME NULL,
      daily_budget DECIMAL(14, 2) NULL,
      lifetime_budget DECIMAL(14, 2) NULL,
      synced_at DATETIME NULL,
      raw_payload JSON NULL,
      UNIQUE KEY uk_meta_ad_sets_ad_set_id (meta_ad_set_id),
      INDEX idx_meta_ad_sets_campaign (meta_campaign_id),
      INDEX idx_meta_ad_sets_account (meta_account_id),
      INDEX idx_meta_ad_sets_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_ad_creatives (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      meta_creative_id VARCHAR(64) NOT NULL,
      meta_account_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NULL,
      title VARCHAR(500) NULL,
      body TEXT NULL,
      call_to_action_type VARCHAR(100) NULL,
      link_url VARCHAR(1000) NULL,
      thumbnail_url VARCHAR(1000) NULL,
      image_url VARCHAR(1000) NULL,
      video_id VARCHAR(64) NULL,
      object_story_spec JSON NULL,
      synced_at DATETIME NULL,
      raw_payload JSON NULL,
      UNIQUE KEY uk_meta_ad_creatives_creative_id (meta_creative_id),
      INDEX idx_meta_ad_creatives_account (meta_account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_ads (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      meta_ad_id VARCHAR(64) NOT NULL,
      meta_ad_set_id VARCHAR(64) NOT NULL,
      meta_campaign_id VARCHAR(64) NULL,
      meta_creative_id VARCHAR(64) NULL,
      meta_account_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NULL,
      status VARCHAR(50) NULL,
      effective_status VARCHAR(50) NULL,
      preview_shareable_link VARCHAR(1000) NULL,
      preview_url VARCHAR(1000) NULL,
      synced_at DATETIME NULL,
      raw_payload JSON NULL,
      UNIQUE KEY uk_meta_ads_ad_id (meta_ad_id),
      INDEX idx_meta_ads_ad_set (meta_ad_set_id),
      INDEX idx_meta_ads_campaign (meta_campaign_id),
      INDEX idx_meta_ads_creative (meta_creative_id),
      INDEX idx_meta_ads_account (meta_account_id),
      INDEX idx_meta_ads_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_ad_insights_snapshots (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced_at DATETIME NOT NULL,
      date_start DATE NOT NULL,
      date_end DATE NOT NULL,
      insight_level VARCHAR(20) NOT NULL,
      meta_account_id VARCHAR(64) NOT NULL,
      meta_campaign_id VARCHAR(64) NULL,
      meta_ad_set_id VARCHAR(64) NULL,
      meta_ad_id VARCHAR(64) NULL,
      entity_id VARCHAR(64) NOT NULL,
      publisher_platform VARCHAR(50) NULL,
      platform_position VARCHAR(100) NULL,
      impressions BIGINT UNSIGNED NULL,
      reach BIGINT UNSIGNED NULL,
      clicks BIGINT UNSIGNED NULL,
      spend DECIMAL(14, 4) NULL,
      ctr DECIMAL(10, 6) NULL,
      cpc DECIMAL(14, 4) NULL,
      cpm DECIMAL(14, 4) NULL,
      frequency DECIMAL(10, 4) NULL,
      link_clicks BIGINT UNSIGNED NULL,
      landing_page_views BIGINT UNSIGNED NULL,
      leads BIGINT UNSIGNED NULL,
      post_engagements BIGINT UNSIGNED NULL,
      actions JSON NULL,
      raw_payload JSON NULL,
      UNIQUE KEY uk_meta_ad_insights_snapshot (
        date_start, date_end, insight_level, entity_id,
        publisher_platform, platform_position
      ),
      INDEX idx_meta_ad_insights_account_dates (meta_account_id, date_start, date_end),
      INDEX idx_meta_ad_insights_campaign (meta_campaign_id, date_start),
      INDEX idx_meta_ad_insights_ad_set (meta_ad_set_id, date_start),
      INDEX idx_meta_ad_insights_ad (meta_ad_id, date_start),
      INDEX idx_meta_ad_insights_platform (publisher_platform, platform_position)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_custom_audiences (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      meta_audience_id VARCHAR(64) NOT NULL,
      meta_account_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NULL,
      description TEXT NULL,
      subtype VARCHAR(100) NULL,
      approximate_count INT UNSIGNED NULL,
      delivery_status VARCHAR(50) NULL,
      operation_status VARCHAR(50) NULL,
      synced_at DATETIME NULL,
      raw_payload JSON NULL,
      UNIQUE KEY uk_meta_custom_audiences_audience_id (meta_audience_id),
      INDEX idx_meta_custom_audiences_account (meta_account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta_ad_sync_runs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      started_at DATETIME NOT NULL,
      finished_at DATETIME NULL,
      sync_type VARCHAR(50) NOT NULL,
      meta_account_id VARCHAR(64) NULL,
      date_since DATE NULL,
      date_until DATE NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'running',
      counts JSON NULL,
      error_message TEXT NULL,
      INDEX idx_meta_ad_sync_runs_started (started_at),
      INDEX idx_meta_ad_sync_runs_type_status (sync_type, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await ensureMetaAdsColumnUpgrades(pool);
}

async function ensureColumnExists(pool, tableName, columnName, alterSql) {
  const [cols] = await pool.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
  if (!cols.length) await pool.query(`ALTER TABLE ${tableName} ${alterSql}`);
}

async function ensureMetaAdsColumnUpgrades(pool) {
  const adColumns = [
    ['preview_shareable_link', 'ADD COLUMN preview_shareable_link VARCHAR(1000) NULL AFTER effective_status'],
    ['preview_url', 'ADD COLUMN preview_url VARCHAR(1000) NULL AFTER preview_shareable_link'],
  ];
  for (const [columnName, alterSql] of adColumns) {
    await ensureColumnExists(pool, 'meta_ads', columnName, alterSql);
  }

  await ensureColumnExists(
    pool,
    'meta_ad_sets',
    'targeting',
    'ADD COLUMN targeting JSON NULL AFTER messenger_positions'
  );

  const insightColumns = [
    ['link_clicks', 'ADD COLUMN link_clicks BIGINT UNSIGNED NULL AFTER frequency'],
    ['landing_page_views', 'ADD COLUMN landing_page_views BIGINT UNSIGNED NULL AFTER link_clicks'],
    ['leads', 'ADD COLUMN leads BIGINT UNSIGNED NULL AFTER landing_page_views'],
    ['post_engagements', 'ADD COLUMN post_engagements BIGINT UNSIGNED NULL AFTER leads'],
  ];
  for (const [columnName, alterSql] of insightColumns) {
    await ensureColumnExists(pool, 'meta_ad_insights_snapshots', columnName, alterSql);
  }
}

async function startMetaAdSyncRun({ syncType, metaAccountId, since, until } = {}) {
  const pool = poolOrThrow();
  const startedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const [result] = await pool.execute(
    `INSERT INTO meta_ad_sync_runs
      (started_at, sync_type, meta_account_id, date_since, date_until, status)
     VALUES
      (:startedAt, :syncType, :metaAccountId, :dateSince, :dateUntil, 'running')`,
    {
      startedAt,
      syncType,
      metaAccountId: metaAccountId || null,
      dateSince: since || null,
      dateUntil: until || null,
    }
  );
  return { id: result.insertId, startedAt };
}

async function finishMetaAdSyncRun(runId, { status, counts, errorMessage } = {}) {
  const pool = poolOrThrow();
  const finishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.execute(
    `UPDATE meta_ad_sync_runs
     SET finished_at = :finishedAt,
         status = :status,
         counts = CAST(:counts AS JSON),
         error_message = :errorMessage
     WHERE id = :runId`,
    {
      runId,
      finishedAt,
      status: status || 'success',
      counts: counts ? JSON.stringify(counts) : null,
      errorMessage: errorMessage || null,
    }
  );
}

async function withMetaAdSyncAudit(syncType, metaAccountId, options, fn) {
  let runId = null;
  try {
    const run = await startMetaAdSyncRun({
      syncType,
      metaAccountId,
      since: options?.since || null,
      until: options?.until || null,
    });
    runId = run.id;
    const result = await fn();
    await finishMetaAdSyncRun(runId, {
      status: 'success',
      counts: result?.counts || (result?.count !== undefined ? { count: result.count } : result),
    });
    return result;
  } catch (error) {
    if (runId) {
      await finishMetaAdSyncRun(runId, { status: 'error', errorMessage: error.message }).catch(() => {});
    }
    throw error;
  }
}

async function upsertMetaAdAccount(account) {
  const pool = poolOrThrow();
  const syncedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.execute(
    `INSERT INTO meta_ad_accounts
      (meta_account_id, name, account_status, currency, timezone_name, business_name, synced_at, raw_payload)
     VALUES
      (:metaAccountId, :name, :accountStatus, :currency, :timezoneName, :businessName, :syncedAt, CAST(:rawPayload AS JSON))
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       account_status = VALUES(account_status),
       currency = VALUES(currency),
       timezone_name = VALUES(timezone_name),
       business_name = VALUES(business_name),
       synced_at = VALUES(synced_at),
       raw_payload = VALUES(raw_payload)`,
    {
      metaAccountId: account.id,
      name: account.name || null,
      accountStatus: toNullableInt(account.account_status),
      currency: account.currency || null,
      timezoneName: account.timezone_name || null,
      businessName: account.business_name || null,
      syncedAt,
      rawPayload: JSON.stringify(sanitizeGraphPayload(account)),
    }
  );
}

async function upsertMetaCampaign(campaign, metaAccountId) {
  const pool = poolOrThrow();
  const syncedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.execute(
    `INSERT INTO meta_campaigns
      (meta_campaign_id, meta_account_id, name, status, effective_status, objective, buying_type,
       start_time, stop_time, daily_budget, lifetime_budget, synced_at, raw_payload)
     VALUES
      (:metaCampaignId, :metaAccountId, :name, :status, :effectiveStatus, :objective, :buyingType,
       :startTime, :stopTime, :dailyBudget, :lifetimeBudget, :syncedAt, CAST(:rawPayload AS JSON))
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       status = VALUES(status),
       effective_status = VALUES(effective_status),
       objective = VALUES(objective),
       buying_type = VALUES(buying_type),
       start_time = VALUES(start_time),
       stop_time = VALUES(stop_time),
       daily_budget = VALUES(daily_budget),
       lifetime_budget = VALUES(lifetime_budget),
       synced_at = VALUES(synced_at),
       raw_payload = VALUES(raw_payload)`,
    {
      metaCampaignId: campaign.id,
      metaAccountId,
      name: campaign.name || null,
      status: campaign.status || null,
      effectiveStatus: campaign.effective_status || null,
      objective: campaign.objective || null,
      buyingType: campaign.buying_type || null,
      startTime: parseMetaDate(campaign.start_time),
      stopTime: parseMetaDate(campaign.stop_time),
      dailyBudget: toNullableDecimal(campaign.daily_budget),
      lifetimeBudget: toNullableDecimal(campaign.lifetime_budget),
      syncedAt,
      rawPayload: JSON.stringify(sanitizeGraphPayload(campaign)),
    }
  );
}

async function upsertMetaAdSet(adSet, metaAccountId) {
  const pool = poolOrThrow();
  const targeting = adSet.targeting || {};
  const syncedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.execute(
    `INSERT INTO meta_ad_sets
      (meta_ad_set_id, meta_campaign_id, meta_account_id, name, status, effective_status,
       optimization_goal, billing_event, publisher_platforms, facebook_positions, instagram_positions,
       audience_network_positions, messenger_positions, targeting, start_time, stop_time, daily_budget, lifetime_budget,
       synced_at, raw_payload)
     VALUES
      (:metaAdSetId, :metaCampaignId, :metaAccountId, :name, :status, :effectiveStatus,
       :optimizationGoal, :billingEvent, CAST(:publisherPlatforms AS JSON), CAST(:facebookPositions AS JSON),
       CAST(:instagramPositions AS JSON), CAST(:audienceNetworkPositions AS JSON), CAST(:messengerPositions AS JSON),
       CAST(:targeting AS JSON), :startTime, :stopTime, :dailyBudget, :lifetimeBudget, :syncedAt, CAST(:rawPayload AS JSON))
     ON DUPLICATE KEY UPDATE
       meta_campaign_id = VALUES(meta_campaign_id),
       name = VALUES(name),
       status = VALUES(status),
       effective_status = VALUES(effective_status),
       optimization_goal = VALUES(optimization_goal),
       billing_event = VALUES(billing_event),
       publisher_platforms = VALUES(publisher_platforms),
       facebook_positions = VALUES(facebook_positions),
       instagram_positions = VALUES(instagram_positions),
       audience_network_positions = VALUES(audience_network_positions),
       messenger_positions = VALUES(messenger_positions),
       targeting = VALUES(targeting),
       start_time = VALUES(start_time),
       stop_time = VALUES(stop_time),
       daily_budget = VALUES(daily_budget),
       lifetime_budget = VALUES(lifetime_budget),
       synced_at = VALUES(synced_at),
       raw_payload = VALUES(raw_payload)`,
    {
      metaAdSetId: adSet.id,
      metaCampaignId: adSet.campaign_id || null,
      metaAccountId,
      name: adSet.name || null,
      status: adSet.status || null,
      effectiveStatus: adSet.effective_status || null,
      optimizationGoal: adSet.optimization_goal || null,
      billingEvent: adSet.billing_event || null,
      publisherPlatforms: targeting.publisher_platforms ? JSON.stringify(targeting.publisher_platforms) : null,
      facebookPositions: targeting.facebook_positions ? JSON.stringify(targeting.facebook_positions) : null,
      instagramPositions: targeting.instagram_positions ? JSON.stringify(targeting.instagram_positions) : null,
      audienceNetworkPositions: targeting.audience_network_positions ? JSON.stringify(targeting.audience_network_positions) : null,
      messengerPositions: targeting.messenger_positions ? JSON.stringify(targeting.messenger_positions) : null,
      targeting: Object.keys(targeting).length ? JSON.stringify(targeting) : null,
      startTime: parseMetaDate(adSet.start_time),
      stopTime: parseMetaDate(adSet.stop_time),
      dailyBudget: toNullableDecimal(adSet.daily_budget),
      lifetimeBudget: toNullableDecimal(adSet.lifetime_budget),
      syncedAt,
      rawPayload: JSON.stringify(sanitizeGraphPayload(adSet)),
    }
  );
}

async function upsertMetaAdCreative(creative, metaAccountId) {
  const pool = poolOrThrow();
  const syncedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const linkData = creative.object_story_spec?.link_data || creative.object_story_spec?.video_data?.call_to_action?.value || {};
  await pool.execute(
    `INSERT INTO meta_ad_creatives
      (meta_creative_id, meta_account_id, name, title, body, call_to_action_type, link_url,
       thumbnail_url, image_url, video_id, object_story_spec, synced_at, raw_payload)
     VALUES
      (:metaCreativeId, :metaAccountId, :name, :title, :body, :callToActionType, :linkUrl,
       :thumbnailUrl, :imageUrl, :videoId, CAST(:objectStorySpec AS JSON), :syncedAt, CAST(:rawPayload AS JSON))
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       title = VALUES(title),
       body = VALUES(body),
       call_to_action_type = VALUES(call_to_action_type),
       link_url = VALUES(link_url),
       thumbnail_url = VALUES(thumbnail_url),
       image_url = VALUES(image_url),
       video_id = VALUES(video_id),
       object_story_spec = VALUES(object_story_spec),
       synced_at = VALUES(synced_at),
       raw_payload = VALUES(raw_payload)`,
    {
      metaCreativeId: creative.id,
      metaAccountId,
      name: creative.name || null,
      title: creative.title || linkData.name || linkData.title || null,
      body: creative.body || linkData.message || linkData.description || null,
      callToActionType: creative.call_to_action_type || linkData.call_to_action?.type || null,
      linkUrl: creative.link_url || linkData.link || null,
      thumbnailUrl: creative.thumbnail_url || null,
      imageUrl: creative.image_url || linkData.picture || linkData.image_url || null,
      videoId: creative.video_id || creative.object_story_spec?.video_data?.video_id || null,
      objectStorySpec: creative.object_story_spec ? JSON.stringify(creative.object_story_spec) : null,
      syncedAt,
      rawPayload: JSON.stringify(sanitizeGraphPayload(creative)),
    }
  );
}

async function upsertMetaAd(ad, metaAccountId) {
  const pool = poolOrThrow();
  const syncedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const creativeId = ad.creative?.id || ad.creative_id || null;
  if (creativeId && ad.creative) {
    await upsertMetaAdCreative(ad.creative, metaAccountId);
  }
  await pool.execute(
    `INSERT INTO meta_ads
      (meta_ad_id, meta_ad_set_id, meta_campaign_id, meta_creative_id, meta_account_id, name, status,
       effective_status, preview_shareable_link, preview_url, synced_at, raw_payload)
     VALUES
      (:metaAdId, :metaAdSetId, :metaCampaignId, :metaCreativeId, :metaAccountId, :name, :status,
       :effectiveStatus, :previewShareableLink, :previewUrl, :syncedAt, CAST(:rawPayload AS JSON))
     ON DUPLICATE KEY UPDATE
       meta_ad_set_id = VALUES(meta_ad_set_id),
       meta_campaign_id = VALUES(meta_campaign_id),
       meta_creative_id = VALUES(meta_creative_id),
       name = VALUES(name),
       status = VALUES(status),
       effective_status = VALUES(effective_status),
       preview_shareable_link = VALUES(preview_shareable_link),
       preview_url = VALUES(preview_url),
       synced_at = VALUES(synced_at),
       raw_payload = VALUES(raw_payload)`,
    {
      metaAdId: ad.id,
      metaAdSetId: ad.adset_id || null,
      metaCampaignId: ad.campaign_id || null,
      metaCreativeId: creativeId,
      metaAccountId,
      name: ad.name || null,
      status: ad.status || null,
      effectiveStatus: ad.effective_status || null,
      previewShareableLink: ad.preview_shareable_link || null,
      previewUrl: resolveAdPreviewUrl(ad),
      syncedAt,
      rawPayload: JSON.stringify(sanitizeGraphPayload(ad)),
    }
  );
}

async function upsertMetaCustomAudience(audience, metaAccountId) {
  const pool = poolOrThrow();
  const syncedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.execute(
    `INSERT INTO meta_custom_audiences
      (meta_audience_id, meta_account_id, name, description, subtype, approximate_count,
       delivery_status, operation_status, synced_at, raw_payload)
     VALUES
      (:metaAudienceId, :metaAccountId, :name, :description, :subtype, :approximateCount,
       :deliveryStatus, :operationStatus, :syncedAt, CAST(:rawPayload AS JSON))
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       description = VALUES(description),
       subtype = VALUES(subtype),
       approximate_count = VALUES(approximate_count),
       delivery_status = VALUES(delivery_status),
       operation_status = VALUES(operation_status),
       synced_at = VALUES(synced_at),
       raw_payload = VALUES(raw_payload)`,
    {
      metaAudienceId: audience.id,
      metaAccountId,
      name: audience.name || null,
      description: audience.description || null,
      subtype: audience.subtype || null,
      approximateCount: toNullableInt(audience.approximate_count ?? audience.approximate_count_lower_bound),
      deliveryStatus: audience.delivery_status || null,
      operationStatus: audience.operation_status || null,
      syncedAt,
      rawPayload: JSON.stringify(sanitizeGraphPayload(audience)),
    }
  );
}

async function upsertMetaAdInsightSnapshot(row, metaAccountId) {
  const pool = poolOrThrow();
  const syncedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const level = row.level || 'ad';
  const entityId = row.ad_id || row.adset_id || row.campaign_id || row.account_id || metaAccountId;
  const parsedActions = parseMetaInsightActions(row.actions);

  await pool.execute(
    `INSERT INTO meta_ad_insights_snapshots
      (synced_at, date_start, date_end, insight_level, meta_account_id, meta_campaign_id, meta_ad_set_id,
       meta_ad_id, entity_id, publisher_platform, platform_position, impressions, reach, clicks, spend,
       ctr, cpc, cpm, frequency, link_clicks, landing_page_views, leads, post_engagements, actions, raw_payload)
     VALUES
      (:syncedAt, :dateStart, :dateEnd, :insightLevel, :metaAccountId, :metaCampaignId, :metaAdSetId,
       :metaAdId, :entityId, :publisherPlatform, :platformPosition, :impressions, :reach, :clicks, :spend,
       :ctr, :cpc, :cpm, :frequency, :linkClicks, :landingPageViews, :leads, :postEngagements,
       CAST(:actions AS JSON), CAST(:rawPayload AS JSON))
     ON DUPLICATE KEY UPDATE
       synced_at = VALUES(synced_at),
       meta_campaign_id = VALUES(meta_campaign_id),
       meta_ad_set_id = VALUES(meta_ad_set_id),
       meta_ad_id = VALUES(meta_ad_id),
       impressions = VALUES(impressions),
       reach = VALUES(reach),
       clicks = VALUES(clicks),
       spend = VALUES(spend),
       ctr = VALUES(ctr),
       cpc = VALUES(cpc),
       cpm = VALUES(cpm),
       frequency = VALUES(frequency),
       link_clicks = VALUES(link_clicks),
       landing_page_views = VALUES(landing_page_views),
       leads = VALUES(leads),
       post_engagements = VALUES(post_engagements),
       actions = VALUES(actions),
       raw_payload = VALUES(raw_payload)`,
    {
      syncedAt,
      dateStart: parseMetaDateOnly(row.date_start),
      dateEnd: parseMetaDateOnly(row.date_stop ?? row.date_end),
      insightLevel: level,
      metaAccountId,
      metaCampaignId: row.campaign_id || null,
      metaAdSetId: row.adset_id || null,
      metaAdId: row.ad_id || null,
      entityId,
      publisherPlatform: row.publisher_platform || null,
      platformPosition: row.platform_position || null,
      impressions: toNullableInt(row.impressions),
      reach: toNullableInt(row.reach),
      clicks: toNullableInt(row.clicks),
      spend: toNullableDecimal(row.spend),
      ctr: toNullableDecimal(row.ctr),
      cpc: toNullableDecimal(row.cpc),
      cpm: toNullableDecimal(row.cpm),
      frequency: toNullableDecimal(row.frequency),
      linkClicks: parsedActions.link_clicks,
      landingPageViews: parsedActions.landing_page_views,
      leads: parsedActions.leads,
      postEngagements: parsedActions.post_engagements,
      actions: row.actions ? JSON.stringify(row.actions) : null,
      rawPayload: JSON.stringify(sanitizeGraphPayload(row)),
    }
  );
}

export async function syncMetaAdAccountStructure({ skipAudit = false } = {}) {
  poolOrThrow();
  const { adAccountId } = getMetaAdsConfig();
  const runSync = async () => {
  const account = await metaGraphRequest(`/${adAccountId}`, {
    fields: 'id,name,account_status,currency,timezone_name,business_name',
  });
  await upsertMetaAdAccount(account);

  const campaignFields = [
    'id', 'name', 'status', 'effective_status', 'objective', 'buying_type',
    'start_time', 'stop_time', 'daily_budget', 'lifetime_budget',
  ].join(',');
  const campaigns = await metaGraphPaginate(`/${adAccountId}/campaigns`, {
    fields: campaignFields,
    limit: 100,
  });
  for (const campaign of campaigns) {
    await upsertMetaCampaign(campaign, adAccountId);
  }

  const adSetFields = [
    'id', 'name', 'campaign_id', 'status', 'effective_status', 'optimization_goal', 'billing_event',
    'targeting',
    'start_time', 'stop_time', 'daily_budget', 'lifetime_budget',
  ].join(',');
  const adSets = await metaGraphPaginate(`/${adAccountId}/adsets`, {
    fields: adSetFields,
    limit: 100,
  });
  for (const adSet of adSets) {
    await upsertMetaAdSet(adSet, adAccountId);
  }

  const creativeFields = [
    'id', 'name', 'title', 'body', 'call_to_action_type', 'link_url', 'thumbnail_url',
    'image_url', 'video_id', 'object_story_spec',
  ].join(',');
  const creatives = await metaGraphPaginate(`/${adAccountId}/adcreatives`, {
    fields: creativeFields,
    limit: 100,
  });
  for (const creative of creatives) {
    await upsertMetaAdCreative(creative, adAccountId);
  }

  const adFields = [
    'id', 'name', 'adset_id', 'campaign_id', 'status', 'effective_status',
    'preview_shareable_link',
    'creative{id,name,title,body,call_to_action_type,link_url,thumbnail_url,image_url,video_id,object_story_spec}',
  ].join(',');
  const ads = await metaGraphPaginate(`/${adAccountId}/ads`, {
    fields: adFields,
    limit: 100,
  });
  for (const ad of ads) {
    await upsertMetaAd(ad, adAccountId);
  }

  return {
    success: true,
    metaAccountId: adAccountId,
    counts: {
      campaigns: campaigns.length,
      adSets: adSets.length,
      creatives: creatives.length,
      ads: ads.length,
    },
  };
  };
  if (skipAudit) return runSync();
  return withMetaAdSyncAudit('structure', adAccountId, {}, runSync);
}

export async function syncMetaCustomAudiences({ skipAudit = false } = {}) {
  poolOrThrow();
  const { adAccountId } = getMetaAdsConfig();
  const runSync = async () => {
  const fields = [
    'id', 'name', 'description', 'subtype', 'approximate_count',
    'approximate_count_lower_bound', 'delivery_status', 'operation_status',
  ].join(',');
  const audiences = await metaGraphPaginate(`/${adAccountId}/customaudiences`, {
    fields,
    limit: 100,
  });
  for (const audience of audiences) {
    await upsertMetaCustomAudience(audience, adAccountId);
  }
  return { success: true, metaAccountId: adAccountId, count: audiences.length };
  };
  if (skipAudit) return runSync();
  return withMetaAdSyncAudit('audiences', adAccountId, {}, runSync);
}

export async function syncMetaAdInsights({
  since,
  until,
  level = 'ad',
  includeBreakdowns = true,
  skipAudit = false,
} = {}) {
  poolOrThrow();
  const { adAccountId } = getMetaAdsConfig();
  if (!since || !until) {
    throw new Error('since and until are required (YYYY-MM-DD).');
  }

  const runSync = async () => {
  const fields = [
    'account_id', 'campaign_id', 'adset_id', 'ad_id', 'date_start', 'date_stop',
    'impressions', 'reach', 'clicks', 'spend', 'ctr', 'cpc', 'cpm', 'frequency', 'actions',
  ].join(',');

  const params = {
    fields,
    level,
    time_range: JSON.stringify({ since, until }),
    time_increment: 1,
    limit: 500,
  };
  if (includeBreakdowns) {
    params.breakdowns = 'publisher_platform,platform_position';
  }

  const rows = await metaGraphPaginate(`/${adAccountId}/insights`, params);
  for (const row of rows) {
    await upsertMetaAdInsightSnapshot({ ...row, level }, adAccountId);
  }

  return {
    success: true,
    metaAccountId: adAccountId,
    since,
    until,
    level,
    includeBreakdowns,
    count: rows.length,
  };
  };
  if (skipAudit) return runSync();
  return withMetaAdSyncAudit('insights', adAccountId, { since, until }, runSync);
}

export async function syncMetaAds({
  since,
  until,
  syncAudiences = true,
  insightLevel = 'ad',
  includeBreakdowns = true,
} = {}) {
  const { adAccountId } = getMetaAdsConfig();
  return withMetaAdSyncAudit('full', adAccountId, { since, until }, async () => {
  const structure = await syncMetaAdAccountStructure({ skipAudit: true });
  let audiences = null;
  if (syncAudiences) {
    try {
      audiences = await syncMetaCustomAudiences({ skipAudit: true });
    } catch (error) {
      audiences = { success: false, error: error.message };
    }
  }

  let insights = null;
  if (since && until) {
    insights = await syncMetaAdInsights({ since, until, level: insightLevel, includeBreakdowns, skipAudit: true });
  }

  return {
    success: true,
    structure,
    audiences,
    insights,
  };
  });
}

export async function listMetaAdAccounts() {
  const pool = getDbPool();
  if (!pool) return [];
  const [rows] = await pool.execute(`SELECT * FROM meta_ad_accounts ORDER BY synced_at DESC, id DESC`);
  return rows;
}

export async function listMetaCampaigns({ metaAccountId, startDate, endDate } = {}) {
  const pool = getDbPool();
  if (!pool) return [];
  const where = [];
  const params = {};
  if (metaAccountId) {
    where.push('meta_account_id = :metaAccountId');
    params.metaAccountId = normalizeAdAccountId(metaAccountId);
  }
  if (startDate) {
    where.push('COALESCE(start_time, created_at) >= :startDate');
    params.startDate = startDate;
  }
  if (endDate) {
    where.push('COALESCE(start_time, created_at) < :endDate');
    params.endDate = endDate;
  }
  const [rows] = await pool.execute(
    `SELECT * FROM meta_campaigns
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY COALESCE(start_time, created_at) DESC, id DESC`,
    params
  );
  return rows;
}

export async function listMetaAds({ metaAccountId, metaCampaignId, metaAdSetId, status } = {}) {
  const pool = getDbPool();
  if (!pool) return [];
  const where = [];
  const params = {};
  if (metaAccountId) {
    where.push('meta_account_id = :metaAccountId');
    params.metaAccountId = normalizeAdAccountId(metaAccountId);
  }
  if (metaCampaignId) {
    where.push('meta_campaign_id = :metaCampaignId');
    params.metaCampaignId = metaCampaignId;
  }
  if (metaAdSetId) {
    where.push('meta_ad_set_id = :metaAdSetId');
    params.metaAdSetId = metaAdSetId;
  }
  if (status) {
    where.push('status = :status');
    params.status = status;
  }
  const [rows] = await pool.execute(
    `SELECT * FROM meta_ads
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY synced_at DESC, id DESC`,
    params
  );
  return rows;
}

export async function listMetaAdInsights({
  metaAccountId,
  startDate,
  endDate,
  publisherPlatform,
  insightLevel = 'ad',
} = {}) {
  const pool = getDbPool();
  if (!pool) return [];
  const where = ['insight_level = :insightLevel'];
  const params = { insightLevel };
  if (metaAccountId) {
    where.push('meta_account_id = :metaAccountId');
    params.metaAccountId = normalizeAdAccountId(metaAccountId);
  }
  if (startDate) {
    where.push('date_start >= :startDate');
    params.startDate = startDate;
  }
  if (endDate) {
    where.push('date_end < :endDate');
    params.endDate = endDate;
  }
  if (publisherPlatform) {
    where.push('publisher_platform = :publisherPlatform');
    params.publisherPlatform = publisherPlatform;
  }
  const [rows] = await pool.execute(
    `SELECT * FROM meta_ad_insights_snapshots
     WHERE ${where.join(' AND ')}
     ORDER BY date_start DESC, spend DESC, id DESC`,
    params
  );
  return rows;
}

export async function listMetaCustomAudiences({ metaAccountId } = {}) {
  const pool = getDbPool();
  if (!pool) return [];
  const where = [];
  const params = {};
  if (metaAccountId) {
    where.push('meta_account_id = :metaAccountId');
    params.metaAccountId = normalizeAdAccountId(metaAccountId);
  }
  const [rows] = await pool.execute(
    `SELECT * FROM meta_custom_audiences
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY name ASC, id DESC`,
    params
  );
  return rows;
}

export async function listMetaAdSyncRuns({ limit = 20 } = {}) {
  const pool = getDbPool();
  if (!pool) return [];
  const [rows] = await pool.execute(
    `SELECT * FROM meta_ad_sync_runs ORDER BY started_at DESC, id DESC LIMIT :limit`,
    { limit: Math.min(Math.max(Number(limit) || 20, 1), 100) }
  );
  return rows;
}

export async function getMetaAdsReport({
  metaAccountId,
  startDate,
  endDate,
  insightLevel = 'ad',
} = {}) {
  const pool = getDbPool();
  if (!pool) return null;
  if (!startDate || !endDate) {
    throw new Error('startDate and endDate are required (YYYY-MM-DD).');
  }

  const accountId = metaAccountId ? normalizeAdAccountId(metaAccountId) : null;
  const insightParams = { startDate, endDate, insightLevel };
  if (accountId) insightParams.metaAccountId = accountId;

  const insightWhere = ['insight_level = :insightLevel', 'date_start >= :startDate', 'date_end < :endDate'];
  const params = { insightLevel, startDate, endDate };
  if (accountId) {
    insightWhere.push('meta_account_id = :metaAccountId');
    params.metaAccountId = accountId;
  }

  const [summaryRows] = await pool.execute(
    `SELECT
       ROUND(COALESCE(SUM(spend), 0), 2) AS spend,
       COALESCE(SUM(impressions), 0) AS impressions,
       COALESCE(SUM(reach), 0) AS reach,
       COALESCE(SUM(clicks), 0) AS clicks,
       COALESCE(SUM(link_clicks), 0) AS link_clicks,
       COALESCE(SUM(landing_page_views), 0) AS landing_page_views,
       COALESCE(SUM(leads), 0) AS leads,
       COALESCE(SUM(post_engagements), 0) AS post_engagements
     FROM meta_ad_insights_snapshots
     WHERE ${insightWhere.join(' AND ')}`,
    params
  );

  const [byPlatform] = await pool.execute(
    `SELECT
       COALESCE(publisher_platform, 'unknown') AS publisher_platform,
       COALESCE(SUM(impressions), 0) AS impressions,
       COALESCE(SUM(reach), 0) AS reach,
       COALESCE(SUM(clicks), 0) AS clicks,
       COALESCE(SUM(link_clicks), 0) AS link_clicks,
       COALESCE(SUM(leads), 0) AS leads,
       ROUND(COALESCE(SUM(spend), 0), 2) AS spend
     FROM meta_ad_insights_snapshots
     WHERE ${insightWhere.join(' AND ')}
     GROUP BY publisher_platform
     ORDER BY spend DESC`,
    params
  );

  const [byPlacement] = await pool.execute(
    `SELECT
       COALESCE(publisher_platform, 'unknown') AS publisher_platform,
       COALESCE(platform_position, 'unknown') AS platform_position,
       COALESCE(SUM(impressions), 0) AS impressions,
       COALESCE(SUM(clicks), 0) AS clicks,
       ROUND(COALESCE(SUM(spend), 0), 2) AS spend
     FROM meta_ad_insights_snapshots
     WHERE ${insightWhere.join(' AND ')}
     GROUP BY publisher_platform, platform_position
     ORDER BY spend DESC`,
    params
  );

  const campaignWhere = [];
  const campaignParams = { startDate, endDate, insightLevel };
  if (accountId) {
    campaignWhere.push('c.meta_account_id = :metaAccountId');
    campaignParams.metaAccountId = accountId;
  }

  const [campaigns] = await pool.execute(
    `SELECT
       c.meta_campaign_id,
       c.name,
       c.objective,
       c.status,
       ROUND(COALESCE(SUM(i.spend), 0), 2) AS spend,
       COALESCE(SUM(i.impressions), 0) AS impressions,
       COALESCE(SUM(i.clicks), 0) AS clicks,
       COALESCE(SUM(i.link_clicks), 0) AS link_clicks,
       COALESCE(SUM(i.leads), 0) AS leads
     FROM meta_campaigns c
     LEFT JOIN meta_ad_insights_snapshots i
       ON i.meta_campaign_id = c.meta_campaign_id
      AND i.date_start >= :startDate
      AND i.date_end < :endDate
      AND i.insight_level = :insightLevel
     ${campaignWhere.length ? `WHERE ${campaignWhere.join(' AND ')}` : ''}
     GROUP BY c.meta_campaign_id, c.name, c.objective, c.status
     ORDER BY spend DESC, c.name ASC`,
    campaignParams
  );

  const adWhere = [];
  const adParams = { startDate, endDate, insightLevel };
  if (accountId) {
    adWhere.push('a.meta_account_id = :metaAccountId');
    adParams.metaAccountId = accountId;
  }

  const [ads] = await pool.execute(
    `SELECT
       a.meta_ad_id,
       a.name,
       a.status,
       a.preview_shareable_link,
       a.preview_url,
       c.name AS campaign_name,
       c.objective AS campaign_objective,
       s.publisher_platforms,
       s.instagram_positions,
       s.facebook_positions,
       s.targeting,
       cr.title AS creative_title,
       cr.body AS creative_body,
       cr.thumbnail_url,
       cr.link_url,
       ROUND(COALESCE(SUM(i.spend), 0), 2) AS spend,
       COALESCE(SUM(i.impressions), 0) AS impressions,
       COALESCE(SUM(i.clicks), 0) AS clicks,
       COALESCE(SUM(i.link_clicks), 0) AS link_clicks,
       COALESCE(SUM(i.leads), 0) AS leads
     FROM meta_ads a
     LEFT JOIN meta_campaigns c ON c.meta_campaign_id = a.meta_campaign_id
     LEFT JOIN meta_ad_sets s ON s.meta_ad_set_id = a.meta_ad_set_id
     LEFT JOIN meta_ad_creatives cr ON cr.meta_creative_id = a.meta_creative_id
     LEFT JOIN meta_ad_insights_snapshots i
       ON i.meta_ad_id = a.meta_ad_id
      AND i.date_start >= :startDate
      AND i.date_end < :endDate
      AND i.insight_level = :insightLevel
     ${adWhere.length ? `WHERE ${adWhere.join(' AND ')}` : ''}
     GROUP BY
       a.meta_ad_id, a.name, a.status, a.preview_shareable_link, a.preview_url,
       c.name, c.objective, s.publisher_platforms, s.instagram_positions, s.facebook_positions,
       s.targeting, cr.title, cr.body, cr.thumbnail_url, cr.link_url
     ORDER BY spend DESC, a.name ASC`,
    adParams
  );

  const syncRuns = await listMetaAdSyncRuns({ limit: 5 });

  return {
    success: true,
    startDate,
    endDate,
    insightLevel,
    metaAccountId: accountId,
    summary: summaryRows[0] || {},
    byPlatform,
    byPlacement,
    campaigns,
    ads,
    syncRuns,
    notes: {
      adPreviews: 'Use preview_shareable_link or preview_url on each ad row to open the live ad preview in Meta.',
      instagramDelivery: 'Check byPlatform for publisher_platform = instagram, and ad set publisher_platforms / instagram_positions for configured placements.',
    },
  };
}
