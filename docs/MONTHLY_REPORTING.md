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
- Meta Business Suite / Facebook Page Insights for metrics not yet synced automatically

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

## Suggested monthly checklist

1. Export or screenshot GA4 traffic + `contact_form_submit` + `enrollment_form_submit` for the month.
2. Count staff notification emails (contact + enrollment + inbound SMS) from Resend or inbox search.
3. Summarize Twilio inbound calls (total, answered, missed).
4. Summarize Twilio inbound SMS (total, unique senders).
5. Summarize Facebook reach, engagement, and notable posts or messages.
6. Record totals in a single row: site sessions, contact leads, enrollment leads, phone calls, inbound SMS, Facebook reach.

## Related docs

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — API, `STAFF_EMAIL`, and production form delivery
- [`../ANALYTICS_SETUP.md`](../ANALYTICS_SETUP.md) — GA4 measurement ID setup
