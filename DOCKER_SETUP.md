# Docker Setup Guide

This guide will help you set up the Genesis Learning Academy site locally using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

## Setup Steps

### 1. Add Local Domain to Hosts File

You need to add the custom domain to your system's hosts file so it resolves to localhost.

**On macOS/Linux:**
```bash
sudo nano /etc/hosts
```

Add this line:
```
127.0.0.1    genesislearningacademyofkennesaw.local
```

**On Windows:**
1. Open Notepad as Administrator
2. Open `C:\Windows\System32\drivers\etc\hosts`
3. Add this line:
```
127.0.0.1    genesislearningacademyofkennesaw.local
```

### 2. Clean Up Existing Containers (if any)

If you have existing containers from a previous setup, remove them first:

```bash
docker-compose down
docker rm -f github glak glak-nginx 2>/dev/null || true
```

### 3. Start the Docker Containers

From the project root directory, run:

```bash
docker-compose up --build
```

This will:
- Build the Node.js application container
- Start the Vite development server
- Start an nginx reverse proxy
- Make the site accessible at `http://genesislearningacademyofkennesaw.local`

### 4. Access the Site

Open your browser and navigate to:
```
http://genesislearningacademyofkennesaw.local:8000
```

**Note:** If port 80 is available, you can change the nginx port mapping in `docker-compose.yml` from `8000:80` to `80:80` to access the site without specifying a port.

## Useful Commands

**Start containers in detached mode (background):**
```bash
docker-compose up -d --build
```

**Stop containers:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f
```

**View logs for a specific service:**
```bash
docker-compose logs -f app
docker-compose logs -f nginx
```

**Rebuild containers:**
```bash
docker-compose up --build --force-recreate
```

**Access the app container shell:**
```bash
docker exec -it glak sh
```

## Troubleshooting

**Port already in use:**
If port 80 or 8080 is already in use, you can modify the ports in `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Change 8080 to 8081 on the left side
```

**Domain not resolving:**
- Make sure you've added the domain to your hosts file
- Try flushing DNS cache:
  - macOS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
  - Linux: `sudo systemd-resolve --flush-caches`
  - Windows: `ipconfig /flushdns`

**Changes not reflecting:**
- The code is mounted as a volume, so changes should hot-reload automatically
- If not, try restarting the containers: `docker-compose restart`

## Architecture

- **app**: Node.js container running Vite dev server on port 8080
- **nginx**: Reverse proxy that routes `genesislearningacademyofkennesaw.local` to the app container
- Both containers are on the same Docker network for communication

