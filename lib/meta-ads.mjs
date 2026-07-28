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

  await ensureMetaAdsColumnUpgrades(pool);
}

async function ensureMetaAdsColumnUpgrades(pool) {
  const adColumns = [
    ['preview_shareable_link', 'ADD COLUMN preview_shareable_link VARCHAR(1000) NULL AFTER effective_status'],
    ['preview_url', 'ADD COLUMN preview_url VARCHAR(1000) NULL AFTER preview_shareable_link'],
  ];
  for (const [columnName, alterSql] of adColumns) {
    const [cols] = await pool.query(`SHOW COLUMNS FROM meta_ads LIKE ?`, [columnName]);
    if (!cols.length) await pool.query(`ALTER TABLE meta_ads ${alterSql}`);
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
       audience_network_positions, messenger_positions, start_time, stop_time, daily_budget, lifetime_budget,
       synced_at, raw_payload)
     VALUES
      (:metaAdSetId, :metaCampaignId, :metaAccountId, :name, :status, :effectiveStatus,
       :optimizationGoal, :billingEvent, CAST(:publisherPlatforms AS JSON), CAST(:facebookPositions AS JSON),
       CAST(:instagramPositions AS JSON), CAST(:audienceNetworkPositions AS JSON), CAST(:messengerPositions AS JSON),
       :startTime, :stopTime, :dailyBudget, :lifetimeBudget, :syncedAt, CAST(:rawPayload AS JSON))
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
      previewUrl: ad.preview_url || null,
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

  await pool.execute(
    `INSERT INTO meta_ad_insights_snapshots
      (synced_at, date_start, date_end, insight_level, meta_account_id, meta_campaign_id, meta_ad_set_id,
       meta_ad_id, entity_id, publisher_platform, platform_position, impressions, reach, clicks, spend,
       ctr, cpc, cpm, frequency, actions, raw_payload)
     VALUES
      (:syncedAt, :dateStart, :dateEnd, :insightLevel, :metaAccountId, :metaCampaignId, :metaAdSetId,
       :metaAdId, :entityId, :publisherPlatform, :platformPosition, :impressions, :reach, :clicks, :spend,
       :ctr, :cpc, :cpm, :frequency, CAST(:actions AS JSON), CAST(:rawPayload AS JSON))
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
       actions = VALUES(actions),
       raw_payload = VALUES(raw_payload)`,
    {
      syncedAt,
      dateStart: parseMetaDateOnly(row.date_start),
      dateEnd: parseMetaDateOnly(row.date_end),
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
      actions: row.actions ? JSON.stringify(row.actions) : null,
      rawPayload: JSON.stringify(sanitizeGraphPayload(row)),
    }
  );
}

export async function syncMetaAdAccountStructure() {
  poolOrThrow();
  const { adAccountId } = getMetaAdsConfig();
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
    'targeting{publisher_platforms,facebook_positions,instagram_positions,audience_network_positions,messenger_positions}',
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
}

export async function syncMetaCustomAudiences() {
  poolOrThrow();
  const { adAccountId } = getMetaAdsConfig();
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
}

export async function syncMetaAdInsights({
  since,
  until,
  level = 'ad',
  includeBreakdowns = true,
} = {}) {
  poolOrThrow();
  const { adAccountId } = getMetaAdsConfig();
  if (!since || !until) {
    throw new Error('since and until are required (YYYY-MM-DD).');
  }

  const fields = [
    'account_id', 'campaign_id', 'adset_id', 'ad_id', 'date_start', 'date_end',
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
}

export async function syncMetaAds({
  since,
  until,
  syncAudiences = true,
  insightLevel = 'ad',
  includeBreakdowns = true,
} = {}) {
  const structure = await syncMetaAdAccountStructure();
  let audiences = null;
  if (syncAudiences) {
    try {
      audiences = await syncMetaCustomAudiences();
    } catch (error) {
      audiences = { success: false, error: error.message };
    }
  }

  let insights = null;
  if (since && until) {
    insights = await syncMetaAdInsights({ since, until, level: insightLevel, includeBreakdowns });
  }

  return {
    success: true,
    structure,
    audiences,
    insights,
  };
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
