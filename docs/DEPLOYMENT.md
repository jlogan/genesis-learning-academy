# Deployment

Production deploys run automatically on pushes to `main` via [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

## Flow

1. `npm ci` and `npm run build`
2. Verify `dist/index.html` exists
3. Validate and load the SSH private key
4. `rsync` the contents of `dist/` to the remote web root (`--delete` removes old hashed assets)
5. Health check the gallery URL for the new Vite asset fingerprint

Concurrent pushes cancel in-progress deploys so only the latest commit reaches production.

## GitHub secrets

Configure these under **Settings → Secrets and variables → Actions**:

| Secret | Required | Description |
| --- | --- | --- |
| `DEPLOY_HOST` | Yes | Server hostname or IP |
| `DEPLOY_USER` | Yes | SSH user |
| `DEPLOY_SSH_KEY` | Yes | Private key (PEM). Paste with real newlines or escaped `\n`; CRLF is normalized |
| `DEPLOY_PATH` | Yes | Remote directory for static files (e.g. `/var/www/genesislearningacademyofkennesaw.com/public`) |
| `DEPLOY_PORT` | No | SSH port (default: `22`) |
| `DEPLOY_HEALTH_URL` | No | URL checked after deploy (default: `https://genesislearningacademyofkennesaw.com/gallery`) |

## Server setup

- Install the matching **public** key for `DEPLOY_USER` on the server.
- Ensure `DEPLOY_PATH` exists and is writable by the deploy user.
- The remote path should be the document root (or equivalent) served for the production domain.

## Health check

After rsync, the workflow fetches the hashed JS bundle name from `dist/index.html` and confirms that fingerprint appears in the HTML served at `DEPLOY_HEALTH_URL`. If the live site still serves an older bundle after several retries, the job fails with a warning that the site may be stale or cached.
