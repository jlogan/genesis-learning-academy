# Google Analytics Setup Instructions

## Overview
Your site is now configured with Google Analytics 4 (GA4) tracking, including conversion tracking for enrollment form submissions.

## Setup Steps

### 1. Create Google Analytics Account
1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring" or "Admin" → "Create Property"
4. Set up a GA4 property for your website

### 2. Get Your Measurement ID
1. In Google Analytics, go to **Admin** (bottom left)
2. Select your property
3. Click **Data Streams** under the Property column
4. Click on your web data stream
5. Copy your **Measurement ID** (format: G-XXXXXXXXXX)

### 3. Add Measurement ID to Your Site
1. Open `index.html` in your project
2. Find **line 19**: `<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>`
3. Replace `GA_MEASUREMENT_ID` with your actual Measurement ID (appears 3 times in lines 19-26)

Example:
```html
<!-- Before -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>

<!-- After -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
```

### 4. Set Up Conversions (Optional but Recommended)
To track enrollment form submissions as conversions in Google Ads:

1. Go to [Google Ads](https://ads.google.com/)
2. Navigate to **Tools & Settings** → **Conversions**
3. Click the **+** button to create a new conversion action
4. Select **Website** as the source
5. Choose **Manual code setup** or **Google tag**
6. Copy your Conversion ID and Conversion Label
7. Open `src/utils/analytics.ts`
8. On line 42, replace `AW-CONVERSION_ID/CONVERSION_LABEL` with your actual values

Example:
```typescript
// Before
send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',

// After
send_to: 'AW-123456789/AbC-dEfGhIjK_lMnO',
```

## What's Being Tracked

### Automatic Tracking
- **Page views**: Every page visit is automatically tracked
- **User demographics**: Location, device, browser, etc.
- **Traffic sources**: How users find your site (search, direct, referral, social)

### Custom Events
- **Enrollment form submissions**: Tracked as conversions when users submit the enrollment form
- **Number of children**: Tracked to understand family sizes
- **Language preferences**: Tracked to understand multilingual needs

## Viewing Your Analytics

### Real-Time Reports
1. Go to Google Analytics
2. Click **Reports** → **Real-time**
3. See live visitor data as people use your site

### Traffic Sources
1. Click **Reports** → **Acquisition** → **Traffic acquisition**
2. View how users find your site (Google search, direct, social, etc.)

### Search Console Integration (Recommended)
1. Set up [Google Search Console](https://search.google.com/search-console)
2. Verify your website ownership
3. Link Search Console to Google Analytics in **Admin** → **Search Console Links**
4. View actual search terms users type to find your site

### Conversion Tracking
1. Click **Reports** → **Engagement** → **Conversions**
2. See enrollment form submission data
3. Track conversion rates and lead generation

## Key Metrics to Monitor

### For Lead Generation
- **Conversions**: Total enrollment form submissions
- **Conversion rate**: Percentage of visitors who submit the form
- **Traffic sources**: Which channels bring the most leads (organic search, Facebook, etc.)
- **Landing pages**: Which pages users first visit
- **Exit pages**: Where users leave without converting

### For SEO Performance
- **Organic search traffic**: Users from Google/Bing search
- **Search queries**: What people search to find you (requires Search Console integration)
- **Bounce rate**: Percentage of single-page sessions
- **Average session duration**: How long users stay on your site

## SEO Optimizations Implemented

✅ **Local SEO for "Child Care in Kennesaw GA"**
- Optimized title and meta description with target keywords
- Added geo-location meta tags for Kennesaw, GA
- Implemented Local Business structured data (Schema.org)
- Added keywords targeting local child care searches

✅ **Structured Data**
- ChildCare schema for better search visibility
- Address and phone number markup
- Operating hours information
- Service area specification

✅ **Open Graph & Social Media**
- Facebook and Twitter card optimization
- Proper image and description tags for social sharing

## Next Steps

1. **Submit sitemap to Google Search Console** to help Google index your pages
2. **Create Google Business Profile** for local search visibility
3. **Monitor search performance** weekly to see ranking improvements
4. **A/B test headlines** to improve conversion rates
5. **Track phone calls** by setting up call tracking if available

## Support Resources

- [Google Analytics Help Center](https://support.google.com/analytics)
- [GA4 Conversion Tracking Guide](https://support.google.com/analytics/answer/9267568)
- [Google Search Console Help](https://support.google.com/webmasters)
- [Local SEO Best Practices](https://developers.google.com/search/docs/appearance/structured-data/local-business)

## Privacy & Compliance

Your site is configured with:
- Cookie consent via SameSite and Secure flags
- No personally identifiable information (PII) sent to Google Analytics
- GDPR-friendly tracking setup

Consider adding a Privacy Policy page if you don't have one already.

## Meta (Facebook) Ads via Google Tag Manager

The site does **not** embed Meta Pixel IDs or Conversions API tokens in source code. GTM (`GTM-PPQ3GWSH` in `index.html`) owns Meta Pixel firing and any server-side CAPI configuration.

### Client-side dataLayer events (this repo)

After successful form submit or phone link click, the app pushes **non-PII** events to `window.dataLayer`. Configure GTM Custom Event triggers and Meta tags to listen for:

| dataLayer `event` | Meta standard event | When fired | Key fields |
| --- | --- | --- | --- |
| `meta_lead` | Lead | Contact or enrollment form success | `event_id`, `lead_type` (`contact_form` \| `enrollment_form`), `interest`, `number_of_children`, `language_preference`, `page_path` |
| `meta_contact` | Contact | `tel:` link click (Footer, Navigation) | `event_id`, `contact_method` (`phone`), `link_location`, `page_path` |

**Event ID / deduplication:** Form submissions use the API `submissionId` as `event_id` when available (stable across browser and server). Phone clicks generate a client `event_id` (`phone.<uuid>`). Pass the same `event_id` to Meta CAPI on the server if you add server-side lead tracking later.

Implementation: `src/utils/analytics.ts` (`pushMetaLeadEvent`, `pushMetaContactEvent`, `handlePhoneLinkClick`).

### GTM setup checklist (ops)

1. **Container** — Confirm `GTM-PPQ3GWSH` is published for production (`index.html` head + body noscript).
2. **Meta Pixel tag** — Add via GTM Meta template or custom HTML; use your Pixel ID from [Meta Events Manager](https://business.facebook.com/events_manager). Do not commit Pixel ID to this repo unless you intentionally centralize it in public HTML (current pattern: GTM only).
3. **Triggers** — Custom Event triggers: `meta_lead` → Meta **Lead**; `meta_contact` → Meta **Contact**.
4. **Variables** — Map dataLayer keys (`event_id`, `lead_type`, `interest`, `link_location`, etc.) to tag parameters or event parameters as needed.
5. **CAPI (optional)** — Configure in GTM server container or separate backend; reuse `event_id` from form submissions for deduplication. Store access tokens in env/secrets (e.g. production host `.env`), not in git.
6. **Verify** — Meta Events Manager → Test Events; GTM Preview mode; submit test contact/enrollment on staging; click header/footer phone links.

### Env / secrets (production host)

No Meta-specific env vars are required for client-side dataLayer pushes. If you add CAPI or offline conversions:

- `META_PIXEL_ID` — Pixel ID (Events Manager)
- `META_CAPI_ACCESS_TOKEN` — Conversions API token (restricted, server-only)

See also `docs/MONTHLY_REPORTING.md` for lead reporting alongside GA4 and form email logs.
