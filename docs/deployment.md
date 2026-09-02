# Deployment (Vercel)

Zwei eigenständige Vercel-Projekte aus demselben Repository:

| Projekt | Produktions-URL | Root Directory (Dashboard-Variante) |
| --- | --- | --- |
| `steuerberaterflow-app` | https://steuerberaterflow-live.vercel.app | `apps/app` |
| `steuerberaterflow-landing` | https://steuerberaterflow-home.vercel.app | `apps/landing` |

> Hinweis zu den Domains: Die kurzen Standard-Domains `steuerberaterflow-app.vercel.app` /
> `steuerberaterflow-landing.vercel.app` sind global von anderen Konten belegt, daher verwenden
> wir die Aliase `-live` und `-home`. Beide Projekte sind zusätzlich über die team-scoped
> URLs erreichbar (z. B. `steuerberaterflow-app-<team>.vercel.app`).

## Environment Variables (Production)

Für `steuerberaterflow-app`:
- `DATABASE_URL` – Neon PostgreSQL (pooled, EU-Region), Datenbank `steuerberaterflow`
- `DATABASE_URL_UNPOOLED` – für Migrationen
- `AUTH_SECRET` – Session-Secret (32+ Zeichen)
- `NEXT_PUBLIC_APP_URL` – `https://steuerberaterflow-live.vercel.app`
- `NEXT_PUBLIC_LANDING_URL` – `https://steuerberaterflow-home.vercel.app`

Für `steuerberaterflow-landing`:
- `NEXT_PUBLIC_APP_URL` – App-URL (für alle „Demo ansehen“/Login-Buttons)

## Verwendeter Deploy-Weg (CLI, monorepo-sicher)

Da die npm-Workspaces über Repositority-Ebene aufgelöst werden und Vercel bei gesetztem
Root Directory nur dieses Verzeichnis in die Build-Umgebung kopiert, wird pro Projekt ein
Deployment-Kontext verwendet, der das gesamte Repository enthält. Die Konfiguration
(vercel.json mit Legacy-`builds` + `rewrites`) lässt die Builder das jeweilige App-Paket
bauen und die Routen auf `/` mappen:

```json
{
  "builds": [{ "src": "apps/app/package.json", "use": "@vercel/next" }],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/apps/app/api/$1" },
    { "source": "/apps/app/api/(.*)", "destination": "/apps/app/api/$1" },
    { "source": "/(.*)", "destination": "/apps/app/$1" }
  ]
}
```

Deployment (Vereinfachung: sauberer Kontext ohne `.git`, damit keine Git-Autor-Metadaten
die Erstellung blockieren):

```bash
rsync -a --exclude node_modules --exclude .next --exclude .vercel --exclude .git \
  --exclude "*.log" ./ /tmp/sf-deploy-app/
cat > /tmp/sf-deploy-app/vercel.json   # Konfiguration wie oben
mkdir -p /tmp/sf-deploy-app/.vercel
cp apps/app/.vercel/project.json /tmp/sf-deploy-app/.vercel/
cd /tmp/sf-deploy-app && vercel --prod --yes
```

Anschließend Alias setzen:

```bash
vercel alias set <deployment-url> steuerberaterflow-live.vercel.app
```

## Dashboard-Variante (empfohlen für Git-basierte Deployments)

1. Repository in beiden Vercel-Projekten verbinden.
2. **Root Directory** jeweils auf `apps/app` bzw. `apps/landing` setzen.
3. Im Projekt `apps/app` ein `package-lock.json` auf App-Ebene erzeugen
   (`npm install --package-lock-only --workspaces=false`) oder die Workspace-Abhängigkeiten
   über die Repository-Wurzel installieren lassen.
4. Environment Variables wie oben setzen.

## Datenbankmigration & Seed (Produktion/Demo)

```bash
DATABASE_URL="<prod-url>" npm run db:migrate
DATABASE_URL="<prod-url>" npm run db:seed    # NUR für Demo-Umgebungen!
```

## Deployment Protection

Die Vercel-Team-Einstellung „Vercel Authentication“ (`ssoProtection`) schützt
`*.vercel.app`-Deployments standardmäßig per SSO. Für öffentlich erreichbare Demo-URLs muss
die Protection im Dashboard pro Projekt deaktiviert werden
(Project → Settings → Deployment Protection → Vercel Authentication → Off)
oder es wird eine eigene Domain angehängt (diese ist von der Protection ausgenommen).
