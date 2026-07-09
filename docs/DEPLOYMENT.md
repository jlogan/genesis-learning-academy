# Deployment

Production deploys run automatically on pushes to `main` via [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

## Flow

1. `npm ci` and `npm run build`
2. Verify `dist/index.html` exists
3. Validate and load the SSH private key
4. `rsync` the contents of `dist/` to the remote web root (`--delete` removes old hashed assets)
5. `rsync` API files (`server.js`, `package.json`, `package-lock.json`, deploy templates) to the same web root
6. SSH: `npm ci --omit=dev` and restart the API process (`systemd`, `pm2`, or `nohup` fallback)
7. Health check the gallery URL for the new Vite asset fingerprint
8. Warn if `/api/health` is unreachable (usually means nginx proxy or `glak-api` service is not configured yet)

Concurrent pushes cancel in-progress deploys so only the latest commit reaches production.

## GitHub secrets

Configure these under **Settings → Secrets and variables → Actions**:

| Secret | Required | Description |
| --- | --- | --- |
| `DEPLOY_HOST` | Yes | Server hostname or IP |
| `DEPLOY_USER` | Yes | SSH user |
| `DEPLOY_SSH_KEY` | Yes* | Private key (PEM). Raw multiline key; optional if `DEPLOY_SSH_KEY_B64` is set. |
| `DEPLOY_SSH_KEY_B64` | Yes* | Base64-encoded private key. Preferred because it avoids multiline secret formatting issues. |
| `DEPLOY_PATH` | Yes | Remote directory for static files (e.g. `/var/www/genesislearningacademyofkennesaw.com/public`) |
| `DEPLOY_PORT` | No | SSH port (default: `22`) |
| `DEPLOY_HEALTH_URL` | No | URL checked after deploy (default: `https://genesislearningacademyofkennesaw.com/gallery`) |
| `DEPLOY_API_HEALTH_URL` | No | API health URL (default: `https://genesislearningacademyofkennesaw.com/api/health`) |

## Server setup (one-time)

### 1. API environment

Create `/etc/glak-api.env` on the server (readable by the deploy/service user):

```bash
RESEND_API_KEY=re_your_key_here
STAFF_EMAIL=jay@brogrammers.agency
PORT=3001
```

`STAFF_EMAIL` is optional; it defaults to `jay@brogrammers.agency` when unset. Set it to the GLAK staff inbox when ready.

### 2. systemd service (recommended)

Adjust `WorkingDirectory` in [`deploy/glak-api.service`](../deploy/glak-api.service) to match `DEPLOY_PATH`, then on the server:

```bash
sudo cp /var/www/genesislearningacademyofkennesaw.com/public/glak-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now glak-api
```

### 3. nginx `/api` proxy

Add the snippet from [`deploy/nginx-api-proxy.conf`](../deploy/nginx-api-proxy.conf) inside the production `server { }` block, **before** the static `location /` block. Reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Static files continue to be served by nginx from `DEPLOY_PATH`. Only `/api/*` is proxied to `http://127.0.0.1:3001`.

### 4. SSH and permissions

- Install the matching **public** key for `DEPLOY_USER` on the server.
- Ensure `DEPLOY_PATH` exists and is writable by the deploy user.
- The deploy user needs permission to restart `glak-api` (`sudo systemctl restart glak-api` without password, or run the service as the deploy user).

## Local development

| Command | Purpose |
| --- | --- |
| `npm run dev:all` | Vite frontend + Express API (proxied via Vite) |
| `npm run server` | API only on port 3001 |
| `docker-compose up` | Vite + API + nginx with `/api` proxy |

## Health checks

After rsync, the workflow fetches the hashed JS bundle name from `dist/index.html` and confirms that fingerprint appears in the HTML served at `DEPLOY_HEALTH_URL`. If the live site still serves an older bundle after several retries, the job fails with a warning that the site may be stale or cached.

The API health check calls `GET /api/health` and expects `{"status":"ok"}`. A failure logs a warning but does not fail the deploy job, so the static site can ship while nginx/systemd are being configured.
