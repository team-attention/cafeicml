# cafe @icml

Static landing page for `cafeicml.com`: a Corgi Cafe-inspired page for an ICML-period cafe in Gangnam, Seoul.

## Structure

- Hero: short value proposition — ICML ticket holders get free coffee.
- Menu: all items priced at `$0`.
- Exclusive Drinks: Arize main drink + general cafe drinks marked `Sponsor wanted`.
- Location: exact pin via Google Maps link, without exposing the address text on the page.
- Sponsor logos: Arize and IronClaw assets live under `assets/logos/`.
- Guestbook: localStorage prototype guestbook.
- Events: Running with Researchers, codex `/goal` workshop, Claude Code cafe hours.

## Local preview

```bash
python3 -m http.server 5173
# open http://localhost:5173
```

## Continuous deployment

Pushes to `main` and manual `workflow_dispatch` runs execute `.github/workflows/cd.yml`.
The workflow runs `npm test`, `npm run build`, then deploys the prebuilt output to
the existing Vercel production project.

Required GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
