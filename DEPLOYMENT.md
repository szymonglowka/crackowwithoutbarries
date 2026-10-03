# BezProgu — deployment produkcyjny

```text
Project:            BezProgu (Kraków bez barier, hackathon)
Production domain:  https://bezprogu.hackyeah.site
VPS:                179.198.221.186 (Ubuntu 24.04, Docker 29.8.1)
Reverse proxy:      Nginx Proxy Manager (kontener `npm`, terminuje TLS)
Docker network:     proxy (zewnętrzna, współdzielona z NPM)
```

## Architektura PROD

```text
Internet → NPM (80/443, LE, Force SSL) → http://project1-app:80
                                                       │
                                          project1-app (nginx: Vite build + /api/ → backend)
                                                       │ project1-internal
                          ┌────────────────────────────┼────────────────────────────┐
                          ▼                            ▼                            ▼
                   project1-backend              project1-db                project1-graphhopper
                   (Django :8000,                (PostGIS, tylko             (OSM Małopolska,
                    migrate+seed w starcie)       wewnętrznie)                tylko wewnętrznie)
```

GraphHopper jest wymagany: `/api/route/` zwraca `503` bez niego (fallback
zaprojektowany w `backend/routing/gh.py`). Pusty GH = działająca reszta apki.

## Kontenery i porty

| Kontener | Port wewnętrzny | Sieci | Uwagi |
|---|---|---|---|
| `project1-app` | 80 (`expose`, BEZ `ports:`) | `proxy` + `project1-internal` | jedyny cel NPM |
| `project1-backend` | 8000 (`expose`) | `project1-internal` | Django runserver (demo) |
| `project1-db` | 5432 (bez `ports:`) | `project1-internal` | volume `project1-pgdata` |
| `project1-gh` | 8989 (bez `ports:`) | `project1-internal` | volume `project1-ghdata` (~200 MB PBF + cache) |

Compose: `/opt/infrastructure/projects/project1/docker-compose.yml`
Źródła na VPS: `/opt/infrastructure/projects/project1/src/{backend,frontend,routing}/`
Sekrety: `/opt/infrastructure/projects/project1/.env` (chmod 600, poza Git).
Nginx (`frontend/nginx.prod.conf`) używa `resolver 127.0.0.11` — re-create
backendu NIE powoduje 502 (statyczny `proxy_pass` na nazwę cache'ował IP).

## Pliki produkcyjne w repo

- `frontend/Dockerfile.prod` — build Vite → nginx:alpine (osobny plik, dev `Dockerfile` nietknięty)
- `frontend/nginx.prod.conf` — SPA fallback + `/api/` → `project1-backend:8000`
- `backend/Dockerfile` wspólny dla dev/prod (entrypoint: migrate + seed_demo, idempotentny)

## Deployment (nowa wersja kodu)

```bash
# 1. Spakuj lokalnie (bez node_modules/dist) i wyślij na VPS:
tar -czf /tmp/bp-src.tar.gz --exclude=node_modules --exclude=dist backend frontend routing
scp /tmp/bp-src.tar.gz root@179.198.221.186:/tmp/
ssh root@179.198.221.186 'cd /opt/infrastructure/projects/project1/src && tar -xzf /tmp/bp-src.tar.gz && rm /tmp/bp-src.tar.gz'
# 2. Na VPS:
cd /opt/infrastructure/projects/project1
docker compose up -d --build app backend   # sam odtworzy zmienione serwisy
docker compose ps
docker compose logs --tail=50 backend
```

## Restart / logi / healthcheck

```bash
cd /opt/infrastructure/projects/project1
docker compose restart            # restart wszystkiego
docker compose restart backend    # restart jednego serwisu
docker compose logs -f --tail=100 app backend
docker logs --tail=100 npm        # logi reverse proxy
docker inspect project1-backend --format "{{.State.Health.Status}}"  # backend: GET /api/meta/
docker inspect project1-app --format "{{.State.Health.Status}}"      # app: GET /
docker inspect project1-db --format "{{.State.Health.Status}}"       # db: pg_isready
```

Weryfikacja przez łańcuch NPM (z VPS):
`docker exec npm node -e "fetch('http://project1-app:80/api/meta/').then(r=>console.log(r.status))"`
→ oczekiwane `200`. Publicznie: `curl -sI https://bezprogu.hackyeah.site/` → `200`.

## NPM

Proxy host (id 1): `bezprogu.hackyeah.site` → `http`, `project1-app`, port `80`;
Block Common Exploits ON, Force SSL ON, HTTP/2 ON, HSTS OFF, cert LE
(wazny do 2027-01-01, auto-renew przez NPM). Panel tylko lokalnie:
`ssh -L 8181:127.0.0.1:81 root@179.198.221.186` → `http://localhost:8181`.

## Rollback

Obrazy budowane są lokalnie ze źródeł (`build:`), więc rollback = poprzednie
źródła + rebuild:

```bash
cd /opt/infrastructure/projects/project1
# odtwórz poprzednie src/ z backupu lub git, potem:
docker compose up -d --build app backend
docker compose ps && docker compose logs --tail=50 backend
```

Baza: przed deployem zrób dump
(`docker exec project1-db pg_dump -U bezprogu bezprogu | gzip > backup.sql.gz`);
rollback kodu NIE cofa migracji. Dane: volumes `project1-pgdata`,
`project1-ghdata` przetrwają `down` (giną dopiero przy `down -v` — zakazane
bez backupu).

## Czego NIE robić

Bez `ports:` na hosta; baza/GH nigdy do sieci `proxy`; brak drugiego reverse
proxy; brak zmian firewalla; brak sekretów w repo; `down -v` tylko z backupem.
Pełny kontrakt: `/opt/infrastructure/DEPLOYMENT.md` na VPS.
