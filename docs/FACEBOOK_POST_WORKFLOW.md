# Facebook post workflow

This is the manual workflow for Genesis Learning Academy social posts until we automate posting through Meta/Facebook.

## Slack flow

1. Marie starts a new Slack thread and asks Brobot for one Facebook post, including any context/theme.
2. Brobot generates:
   - final caption copy
   - CTA
   - downloadable media files
   - a draft tracking row in MySQL with `status='draft'`
3. Marie gives feedback until the caption/media are approved.
4. When Marie publishes the post, she replies in the same thread with:
   - "Published" or "I have published this post on Facebook"
   - the Facebook post URL if available
5. Brobot updates the same MySQL row to `status='published'`, sets `published_at`, and stores `facebook_url`.
6. Monthly reporting reads `social_posts` for the report date range and lists the posts in the Facebook section.

## MySQL table

`social_posts` is created by `ensureLeadTables()` in `server.js`.

Important columns:

- `platform` — default `facebook`
- `status` — `draft`, `approved`, `published`, `needs_revision`, etc.
- `planned_for` — date the post is intended for
- `published_at` — date/time Marie says it went live
- `post_theme` — short topic/theme
- `caption` — final caption text
- `cta` — call to action
- `asset_paths` — JSON array of local generated/downloadable image paths
- `selected_asset_path` — asset Marie chose, if known
- `facebook_url` — public Facebook post permalink when available
- `slack_channel`, `slack_thread_ts` — source Slack context
- `metrics` — JSON snapshot for future likes/reach/comments/shares/clicks

## Brobot CLI logging

Create a draft row from a JSON payload:

```bash
npm run social-posts -- create --file /path/to/post.json
```

Mark a row published:

```bash
npm run social-posts -- publish --id 12 --url "https://www.facebook.com/..."
```

List posts for a monthly report:

```bash
npm run social-posts -- list --start 2026-07-01 --end 2026-08-01 --status published
```

Example payload:

```json
{
  "plannedFor": "2026-07-17",
  "status": "draft",
  "postTheme": "Gentle beginnings infant care",
  "caption": "Gentle beginnings lead to big milestones...",
  "cta": "Ask about infant care",
  "assetPaths": [
    "/Users/jaylogan/Projects/genesis-learning-academy/social-posts/week-2026-07-13/photo-only/photo-only-02-gentle-beginnings-a.png"
  ],
  "slackChannel": "C09RATLMCAF",
  "slackThreadTs": "1783973686.431889",
  "requestedBy": "Marie Arevalo",
  "createdBy": "Brobot"
}
```

## API endpoints

The server also exposes protected internal endpoints for future automation. They require `SOCIAL_POSTS_API_KEY` and the key must be sent via `x-api-key` or `Authorization: Bearer ...`.

- `POST /api/social-posts` — create a row
- `PATCH /api/social-posts/:id` — update/publish a row
- `GET /api/social-posts?start=YYYY-MM-DD&end=YYYY-MM-DD&status=published` — report data

## Future Meta/Facebook automation

Preferred path:

1. Create/verify a Meta app with Page permissions.
2. Use Facebook Graph API to publish media + caption to the Page.
3. Store the returned post ID/permalink in `social_posts.facebook_url` / `raw_payload`.
4. Add a scheduled metrics sync that updates `metrics` with reach/impressions/reactions/comments/shares/clicks when API access allows it.

Browser posting is a fallback only if API access/permissions are blocked.
