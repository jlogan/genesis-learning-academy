# Deployment

Production deploys run automatically on pushes to `main` via root [`buddy.yml`](../buddy.yml) (Buddy.works / CloudPanel on Dozer).

A legacy GitHub Actions workflow also exists at [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml); Buddy is the primary path.

## Production host

| Setting | Value |
| --- | --- |
| Server | Dozer `67.205.186.58` |
| SSH user | `glak` |
| Docroot | `/home/glak/htdocs/genesislearningacademyofkennesaw.com` |
| API service | `glak-api` (systemd) on `127.0.0.1:3002` |
| nginx | Proxies `/api/*` → `http://127.0.0.1:3002` |

Static files are served by nginx from the docroot. Only `/api/*` hits the Node process.

## Buddy pipeline flow

1. `npm ci` and `npm run build`
2. Verify `dist/index.html` and `dist/assets/`
3. Stage API payload (`server.js`, `package.json`, `package-lock.json`, deploy templates)
4. SFTP `dist/` to docroot (`deletion` enabled so old hashed assets are removed)
5. SFTP API payload to docroot (`deletion` disabled; excludes `.env` / `node_modules`)
6. SSH: `npm ci --omit=dev`, restart `glak-api`, verify local and public `/api/health`, fingerprint-check the gallery URL

Concurrent pushes cancel in-progress deploys so only the latest commit reaches production.

## Buddy variables

Switch the Buddy project to **YAML configuration** so it reads the root `buddy.yml`.

Use BA workspace/global variables for shared infrastructure:

| Variable | Required | Description |
| --- | --- | --- |
| `DOZER_HOST` | Yes | Production CloudPanel host |
| `BROBOT_SSH_KEY` | Yes | BA deploy SSH key, type **SSH key** / encrypted |

Configure these under the project variables for this site:

| Variable | Required | Description |
| --- | --- | --- |
| `PROD_SSH_USER` | Yes | `glak` |
| `PROD_DEPLOY_PATH` | Yes | `/home/glak/htdocs/genesislearningacademyofkennesaw.com` |
| `PROD_SITE_URL` | Yes | `https://genesislearningacademyofkennesaw.com` |
| `PROD_APP_PORT` | No | API port for local health check (default: `3002`) |
| `PROD_HEALTH_URL` | No | Static page fingerprint check (default: gallery URL) |

Do not add per-project `PROD_SSH_HOST` or `PROD_SSH_KEY` for BA CloudPanel-hosted projects when the global variables are available.

## Server setup (one-time)

### 1. API environment

Create `/etc/glak-api.env` on the server (readable by the `glak` user / service):

```bash
RESEND_API_KEY=re_your_key_here
STAFF_EMAIL=jay@brogrammers.agency
PORT=3002
PUBLIC_SITE_URL=https://genesislearningacademyofkennesaw.com

# Twilio marketing call forwarding/reporting
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FORWARD_TO_NUMBER=+17706724255
# Optional guard: reject webhooks for any other Twilio number
TWILIO_MARKETING_NUMBER=+1yourtwilionumber

# Lead/reporting database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=genesisleads
DB_USER=genesisleads
DB_PASSWORD=your-generated-password
```

`STAFF_EMAIL` is optional; it defaults to `jay@brogrammers.agency` when unset. When `DB_*` variables are present, contact, enrollment, Twilio call, and inbound SMS records are saved to MySQL before notifications/reporting events are finalized. `/api/health` returns `database: "connected"` only after a successful database ping.

For the Twilio marketing number, configure **Voice & Fax → A call comes in** as a webhook using `HTTP POST` to:

```text
https://genesislearningacademyofkennesaw.com/api/twilio/voice/inbound
```

The API returns TwiML that forwards to `TWILIO_FORWARD_TO_NUMBER`, records the bridged call, and posts dial/recording callbacks back to `/api/twilio/voice/status`. `TWILIO_AUTH_TOKEN` is required so the API can reject unsigned/spoofed Twilio requests. `PUBLIC_SITE_URL` must be the public HTTPS origin Twilio can reach for status and recording callbacks.

For inbound SMS on the same Twilio number, configure **Messaging → A message comes in** as a webhook using `HTTP POST` to:

```text
https://genesislearningacademyofkennesaw.com/api/twilio/sms/inbound
```

The API stores each message in MySQL, emails staff at `STAFF_EMAIL`, and returns TwiML with an automatic SMS reply. If `TWILIO_MARKETING_NUMBER` is set, SMS webhooks for other numbers are ignored (empty TwiML response).

### 2. systemd service (recommended)

Adjust `WorkingDirectory` in [`deploy/glak-api.service`](../deploy/glak-api.service) if the docroot changes, then on the server:

```bash
sudo cp /home/glak/htdocs/genesislearningacademyofkennesaw.com/glak-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now glak-api
```

### 3. nginx `/api` proxy

Add the snippet from [`deploy/nginx-api-proxy.conf`](../deploy/nginx-api-proxy.conf) inside the production `server { }` block, **before** the static `location /` block. Reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Static files continue to be served by nginx from the docroot. Only `/api/*` is proxied to `http://127.0.0.1:3002`.

### 4. SSH and permissions

- Install the matching **public** key for `glak` on Dozer.
- Ensure the docroot exists and is writable by `glak`.
- Grant passwordless `sudo systemctl restart glak-api` (and `status`/`journalctl`) for the deploy user.

## Local development

| Command | Purpose |
| --- | --- |
| `npm run dev:all` | Vite frontend + Express API (proxied via Vite on port 3001) |
| `npm run server` | API only on port 3001 (local default) |
| `docker-compose up` | Vite + API + nginx with `/api` proxy |

Local dev uses port **3001** by default. Production uses **3002** via `/etc/glak-api.env` and `deploy/glak-api.service`.

## Health checks

After deploy, Buddy extracts the hashed JS bundle name from `index.html` and confirms that fingerprint appears in the HTML served at `PROD_HEALTH_URL` (gallery by default).

The API health check calls `GET /api/health` locally on port 3002 and publicly at `PROD_SITE_URL/api/health`, expecting `{"status":"ok"}`.

## GitHub Actions secrets (legacy)

If using the GitHub workflow instead of Buddy:

| Secret | Description |
| --- | --- |
| `DEPLOY_HOST` | `67.205.186.58` |
| `DEPLOY_USER` | `glak` |
| `DEPLOY_SSH_KEY` or `DEPLOY_SSH_KEY_B64` | Deploy private key |
| `DEPLOY_PATH` | `/home/glak/htdocs/genesislearningacademyofkennesaw.com` |
