# Monthly reporting sources

Use these sources together for a monthly Genesis Learning Academy (GLAK) engagement and lead summary. None of them alone captures every parent touchpoint.

## 1. Google Analytics 4 (GA4)

**Where:** [analytics.google.com](https://analytics.google.com) → GLAK property

**What to pull:**

| Report / event | Use |
| --- | --- |
| Users, sessions, page views | Overall site traffic |
| `contact_form_submit` | Contact / visit request form completions |
| `enrollment_form_submit` | Enrollment packet submissions |
| `conversion` (labels: `contact_lead`, `enrollment_lead`) | Lead conversions if Ads/conversion tags are configured |
| `meta_lead`, `meta_contact` (GTM dataLayer → Meta Pixel) | Facebook/Meta Lead and Contact events when GTM tags are configured (see `ANALYTICS_SETUP.md`) |
| Top pages (`/contact`, `/enroll`, `/programs`, `/tuition`) | Which pages drive interest |

**Notes:** Replace placeholder `GA_MEASUREMENT_ID` in `index.html` and `src/utils/analytics.ts` with the live property ID (see `ANALYTICS_SETUP.md`). Filter by calendar month and compare to prior month.

## 2. Form submission logs (contact + enrollment)

**Where:**

- **Staff inbox** — emails sent to `STAFF_EMAIL` (default `jay@brogrammers.agency`) via Resend for each `/api/contact` and `/api/enroll` submission
- **Resend dashboard** — [resend.com](https://resend.com) → Emails → filter by domain `glak@emails.brogrammersagency.com`
- **Server logs** — on the production host: `journalctl -u glak-api` or `glak-api.log` in `DEPLOY_PATH` if using the `nohup` fallback

**What to count:**

- New contact inquiries (subject: `New Genesis inquiry: …`)
- New enrollment applications (subject: `New Enrollment: …`)
- Failed sends (Resend errors or 500 responses in API logs)

**Notes:** GA4 can under-count if analytics is blocked; email/logs are the source of truth for actual submissions delivered to staff.

## 3. Twilio (phone calls)

**Where:**

- **MySQL** — `inbound_calls` and matching `lead_events` rows created by the Twilio webhook at `/api/twilio/voice/inbound`
- **Twilio Console** — Monitor → Logs → Calls as the fallback/source-of-truth for reconciliation and recording playback

**What to pull:**

```sql
-- Monthly call summary
SELECT
  COUNT(*) AS total_calls,
  SUM(answered = 1) AS answered,
  SUM(answered = 0 OR answered IS NULL) AS missed,
  SUM(COALESCE(duration_seconds, 0)) AS talk_seconds
FROM inbound_calls
WHERE created_at >= '2026-06-01' AND created_at < '2026-07-01';

-- Peak call hours (UTC)
SELECT HOUR(created_at) AS hour_utc, COUNT(*) AS calls
FROM inbound_calls
WHERE created_at >= '2026-06-01' AND created_at < '2026-07-01'
GROUP BY hour_utc
ORDER BY calls DESC;

-- Lead channel mix, including calls
SELECT event_type, COUNT(*) AS count
FROM lead_events
WHERE created_at >= '2026-06-01' AND created_at < '2026-07-01'
GROUP BY event_type;
```

**Notes:** Many parents call instead of using the web form. Compare call volume to form submissions to understand channel mix. Recording URLs/SIDs are stored for reporting, but Twilio may require authenticated Console/API access to play or download recordings.

## 4. Twilio (inbound SMS)

**Where:**

- **MySQL** — `inbound_sms` and matching `lead_events` rows created by the Twilio webhook at `/api/twilio/sms/inbound`
- **Staff inbox** — notification emails (subject: `New inbound SMS from …`) sent to `STAFF_EMAIL`
- **Twilio Console** — Monitor → Logs → Messaging as the fallback/source-of-truth for reconciliation

**What to pull:**

```sql
-- Monthly inbound SMS summary
SELECT
  COUNT(*) AS total_sms,
  COUNT(DISTINCT from_number) AS unique_senders,
  SUM(num_media > 0) AS messages_with_media
FROM inbound_sms
WHERE created_at >= '2026-06-01' AND created_at < '2026-07-01';

-- Recent inbound SMS with message preview
SELECT
  created_at,
  from_number,
  to_number,
  LEFT(body, 120) AS message_preview,
  num_media,
  notification_status
FROM inbound_sms
WHERE created_at >= '2026-06-01' AND created_at < '2026-07-01'
ORDER BY created_at DESC;

-- Lead channel mix, including SMS
SELECT event_type, COUNT(*) AS count
FROM lead_events
WHERE created_at >= '2026-06-01' AND created_at < '2026-07-01'
  AND event_type IN ('contact_form_submission', 'enrollment_form_submission', 'inbound_phone_call', 'inbound_sms')
GROUP BY event_type;
```

**Notes:** Inbound texts receive an automatic reply directing callers to phone support; staff follow up manually using the notification email and stored message body.

## 5. Facebook engagement

**Where:**

- **MySQL** — `social_posts` rows logged by Brobot as drafts and updated when Marie publishes
- **Facebook Pages API sync** — `npm run social-posts -- sync-facebook --since YYYY-MM-DD --until YYYY-MM-DD` when `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` are configured
- Meta Business Suite / Facebook Page Insights as fallback for metrics not exposed by the token

**What to pull:**

```sql
-- Monthly Facebook posts created/published through the manual Brobot workflow
SELECT
  COALESCE(published_at, planned_for, created_at) AS activity_date,
  status,
  post_theme,
  LEFT(caption, 180) AS caption_preview,
  cta,
  facebook_url,
  facebook_post_id,
  metrics_synced_at,
  JSON_EXTRACT(metrics, '$.impressionsUnique') AS reach,
  JSON_EXTRACT(metrics, '$.impressions') AS impressions,
  JSON_EXTRACT(metrics, '$.reactions') AS reactions,
  JSON_EXTRACT(metrics, '$.comments') AS comments,
  JSON_EXTRACT(metrics, '$.shares') AS shares,
  JSON_EXTRACT(metrics, '$.clicks') AS clicks,
  JSON_LENGTH(asset_paths) AS asset_count,
  metrics
FROM social_posts
WHERE platform = 'facebook'
  AND COALESCE(published_at, planned_for, created_at) >= '2026-07-01'
  AND COALESCE(published_at, planned_for, created_at) < '2026-08-01'
ORDER BY activity_date DESC;

-- Monthly Facebook posting cadence
SELECT
  status,
  COUNT(*) AS posts
FROM social_posts
WHERE platform = 'facebook'
  AND COALESCE(published_at, planned_for, created_at) >= '2026-07-01'
  AND COALESCE(published_at, planned_for, created_at) < '2026-08-01'
GROUP BY status;
```

**What to include in the report:**

- Number of Facebook posts drafted/approved/published
- Published post dates, themes, captions/CTA, and post links
- Available engagement metrics from `metrics` or Meta Business Suite: reach/views, reactions, comments, shares, clicks
- Notes about active page cadence and local-family positioning

**Notes:** Brobot should create a draft row when generating post copy/media and update it to `published` when Marie confirms publication. Include Facebook post permalinks whenever Marie can provide them. Tie spikes in site traffic (GA4) to Facebook posts when possible. Messenger and comment inquiries are leads even when they never hit the website form. See [`FACEBOOK_POST_WORKFLOW.md`](./FACEBOOK_POST_WORKFLOW.md).

## 6. Meta / Facebook Ads (paid)

**Where:**

- **MySQL** — `meta_ad_accounts`, `meta_campaigns`, `meta_ad_sets`, `meta_ad_creatives`, `meta_ads`, `meta_ad_insights_snapshots`, `meta_custom_audiences`, and `meta_ad_sync_runs`
- **Graph API sync** — `npm run meta-ads -- sync --since YYYY-MM-DD --until YYYY-MM-DD` when `META_AD_ACCOUNT_ID` and `META_ACCESS_TOKEN` (or `FACEBOOK_LONG_LIVED_USER_TOKEN`) are configured
- **Protected API** — same `SOCIAL_POSTS_API_KEY` auth as social posts (`x-api-key` header)
- **Ad previews** — after sync, each ad row stores `preview_shareable_link` and `preview_url` (falls back to the shareable link). Open either URL in a browser to see what the ad looks like. The monthly report endpoint also returns these links per ad.
- **Instagram delivery** — yes, ads can appear on Instagram when the ad set targets it. Insights snapshots break down delivery by `publisher_platform` (`facebook`, `instagram`, etc.) and `platform_position` (feed, story, reels). Ad set rows store configured `publisher_platforms`, `instagram_positions`, and full `targeting` JSON.

**Env vars:**

| Variable | Required | Description |
| --- | --- | --- |
| `META_AD_ACCOUNT_ID` | Yes (sync) | Ad account ID, with or without `act_` prefix |
| `META_ACCESS_TOKEN` | Yes (sync) | Marketing API token with `ads_read` |
| `FACEBOOK_LONG_LIVED_USER_TOKEN` | Fallback | Used when `META_ACCESS_TOKEN` is unset |
| `SOCIAL_POSTS_API_KEY` | Yes (API) | Protects `/api/meta-ads/*` endpoints |

**What to pull:**

```sql
-- Monthly spend and delivery by publisher platform (Facebook vs Instagram)
SELECT
  publisher_platform,
  SUM(impressions) AS impressions,
  SUM(reach) AS reach,
  SUM(clicks) AS clicks,
  SUM(link_clicks) AS link_clicks,
  SUM(leads) AS leads,
  SUM(landing_page_views) AS landing_page_views,
  ROUND(SUM(spend), 2) AS spend
FROM meta_ad_insights_snapshots
WHERE date_start >= '2026-07-01'
  AND date_end < '2026-08-01'
  AND insight_level = 'ad'
GROUP BY publisher_platform
ORDER BY spend DESC;

-- Placement breakdown (feed, story, reels, etc.)
SELECT
  publisher_platform,
  platform_position,
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  ROUND(SUM(spend), 2) AS spend
FROM meta_ad_insights_snapshots
WHERE date_start >= '2026-07-01'
  AND date_end < '2026-08-01'
GROUP BY publisher_platform, platform_position
ORDER BY spend DESC;

-- Active ads with preview links for the report appendix
SELECT
  a.name,
  a.status,
  a.preview_shareable_link,
  a.preview_url,
  a.meta_campaign_id,
  s.publisher_platforms,
  s.instagram_positions,
  s.facebook_positions,
  s.targeting
FROM meta_ads a
LEFT JOIN meta_ad_sets s ON s.meta_ad_set_id = a.meta_ad_set_id
WHERE a.status = 'ACTIVE'
ORDER BY a.name;

-- Campaign summary for the month
SELECT
  c.name,
  c.objective,
  c.status,
  ROUND(SUM(i.spend), 2) AS spend,
  SUM(i.impressions) AS impressions,
  SUM(i.clicks) AS clicks
FROM meta_campaigns c
LEFT JOIN meta_ad_insights_snapshots i
  ON i.meta_campaign_id = c.meta_campaign_id
 AND i.date_start >= '2026-07-01'
 AND i.date_end < '2026-08-01'
GROUP BY c.meta_campaign_id, c.name, c.objective, c.status
ORDER BY spend DESC;
```

**CLI examples:**

```bash
# Full sync: structure + audiences + insights for July
npm run meta-ads -- sync --since 2026-07-01 --until 2026-07-31

# Structure only (campaigns, ad sets, ads, creatives)
npm run meta-ads -- sync-structure

# Insights only with platform/placement breakdowns
npm run meta-ads -- sync-insights --since 2026-07-01 --until 2026-07-31

# List stored insights filtered to Instagram
npm run meta-ads -- list-insights --start 2026-07-01 --end 2026-08-01 --platform instagram

# Monthly report bundle (summary, platform split, campaigns, ads with previews)
npm run meta-ads -- list-report --start 2026-07-01 --end 2026-08-01

# Recent sync audit trail
npm run meta-ads -- list-sync-runs --limit 10
```

**API examples:**

```bash
# Monthly report (same shape as list-report CLI)
curl -H "x-api-key: $SOCIAL_POSTS_API_KEY" \
  "https://genesislearningacademyofkennesaw.com/api/meta-ads/report?start=2026-07-01&end=2026-08-01"

# Recent sync runs
curl -H "x-api-key: $SOCIAL_POSTS_API_KEY" \
  "https://genesislearningacademyofkennesaw.com/api/meta-ads/sync-runs?limit=10"
```

**What to include in the report:**

- Total ad spend, impressions, reach, and clicks for the month
- Facebook vs Instagram (and other publisher platforms) split
- Top placements (feed, story, reels, etc.)
- Active campaign names/objectives and notable ad preview links
- Custom audience sizes if retargeting/prospecting audiences changed

**Notes:** Insights snapshots store daily rows with `publisher_platform` and `platform_position` breakdowns so monthly reports can answer placement questions without re-querying Meta. Parsed action columns (`link_clicks`, `landing_page_views`, `leads`, `post_engagements`) are populated during sync from the raw `actions` JSON. Ad set rows store configured `publisher_platforms`, position targeting, and full `targeting` JSON for report context. Each sync writes an audit row to `meta_ad_sync_runs`.

## Suggested monthly checklist

1. Export or screenshot GA4 traffic + `contact_form_submit` + `enrollment_form_submit` for the month.
2. Count staff notification emails (contact + enrollment + inbound SMS) from Resend or inbox search.
3. Summarize Twilio inbound calls (total, answered, missed).
4. Summarize Twilio inbound SMS (total, unique senders).
5. Summarize Facebook reach, engagement, and notable posts or messages.
6. Sync Meta Ads (`npm run meta-ads -- sync --since … --until …`) and summarize paid spend, Facebook vs Instagram delivery, and top campaigns.
7. Record totals in a single row: site sessions, contact leads, enrollment leads, phone calls, inbound SMS, Facebook reach, ad spend.

## Related docs

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — API, `STAFF_EMAIL`, and production form delivery
- [`../ANALYTICS_SETUP.md`](../ANALYTICS_SETUP.md) — GA4 measurement ID setup
