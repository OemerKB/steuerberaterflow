# Deployment (Vercel)

Zwei eigenständige Vercel-Projekte aus demselben Repository:

| Projekt | Root Directory | Build Command (Standard) | Output |
| --- | --- | --- | --- |
| `steuerberaterflow-app` | `apps/app` | `npm run build` (ruft `prisma generate && next build`) | Next.js SSR |
| `steuerberaterflow-landing` | `apps/landing` | `npm run build` | Next.js (statisch/SSR) |

## Setup (einmalig)

1. **Repository verbinden** (GitHub `OemerKB/steuerberaterflow`) in beiden Vercel-Projekten.
2. **Root Directory** wie oben setzen (Vercel erkennt Next.js automatisch).
3. **Environment Variables** (Production + Preview):

   Für `steuerberaterflow-app`:
   - `DATABASE_URL` (Neon pooled, EU-Region)
   - `DATABASE_URL_UNPOOLED` (für Migrationen)
   - `AUTH_SECRET` (32+ Zeichen)
   - `NEXT_PUBLIC_APP_URL` (produktive App-URL)
   - `NEXT_PUBLIC_LANDING_URL`
   - optional: `RESEND_API_KEY`, `EMAIL_FROM`, `DAILY_API_KEY`, `OPENAI_API_KEY`, `STORAGE_DRIVER=db`

   Für `steuerberaterflow-landing`:
   - `NEXT_PUBLIC_APP_URL` (Login-Buttons zielen auf die App)

4. **Migrationen**: nach dem ersten Deployment einmalig lokal gegen die Produktions-DB ausführen:
   ```bash
   DATABASE_URL="<prod-url>" npm run db:migrate
   DATABASE_URL="<prod-url>" npm run db:seed   # NUR für Demo-Umgebung!
   ```
5. **Redirect Landing → App-Login**: Die Landingpage verlinkt direkt `${NEXT_PUBLIC_APP_URL}/login`; ein `vercel.json`-Redirect ist nicht nötig.

## CLI-Variante (ausgeführt, falls Zugriff vorhanden)

```bash
vercel link --project steuerberaterflow-app   --cwd apps/app
vercel env add DATABASE_URL production        --cwd apps/app
vercel env add AUTH_SECRET production         --cwd apps/app
vercel --prod --cwd apps/app
```

## CI/CD

- GitHub Actions (`.github/workflows/ci.yml`): Lint → Unit-Tests → Migrationen + Seed (CI-Postgres) → Builds beider Apps; separater E2E-Job mit Playwright.
- Vercel baut auf jeden Push; Preview-Deployments pro Pull Request.

## Datenschutz-Hinweis

- Neon-Projekt in einer EU-Region betreiben (Region beim Anlegen wählen).
- Vor produktivem Mandantenbetrieb: AVV mit Vercel/Neon/Resend abschließen (siehe `docs/security.md`).
