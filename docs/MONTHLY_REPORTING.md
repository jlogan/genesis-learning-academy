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

**Where:** Twilio Console → Monitor → Logs → Calls (and any configured Twilio number for GLAK)

**What to pull:**

- Inbound call count and total minutes for the month
- Missed / unanswered calls
- Peak call times (helps staffing for tour requests)

**Notes:** Many parents call instead of using the web form. Compare call volume to form submissions to understand channel mix. Document the Twilio number and account owner in your internal runbook.

## 4. Facebook engagement

**Where:** Meta Business Suite / Facebook Page Insights for the GLAK page

**What to pull:**

- Page views and reach
- Post engagement (reactions, comments, shares)
- Messenger conversations started (if Page inbox is monitored)
- Top-performing posts (events, photos, enrollment reminders)

**Notes:** Tie spikes in site traffic (GA4) to Facebook posts when possible. Messenger and comment inquiries are leads even when they never hit the website form.

## Suggested monthly checklist

1. Export or screenshot GA4 traffic + `contact_form_submit` + `enrollment_form_submit` for the month.
2. Count staff notification emails (contact + enrollment) from Resend or inbox search.
3. Summarize Twilio inbound calls (total, answered, missed).
4. Summarize Facebook reach, engagement, and notable posts or messages.
5. Record totals in a single row: site sessions, contact leads, enrollment leads, phone calls, Facebook reach.

## Related docs

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — API, `STAFF_EMAIL`, and production form delivery
- [`../ANALYTICS_SETUP.md`](../ANALYTICS_SETUP.md) — GA4 measurement ID setup
