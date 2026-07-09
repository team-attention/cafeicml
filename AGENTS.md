# AGENTS.md

This file is the project-local operating guide for `/Users/bong/team-attention/cafeicml`.
Keep this context isolated to this repository. Do not assume broader `deep-thought`
rules or Road to ICML automation behavior unless a task explicitly touches Luma or
the event hub described below.

## Project State

`cafeicml` is a static site for `https://cafeicml.com`, a Cafe @ICML page for
ICML ticket holders in Seoul. The current production state is good and should be
preserved unless the user asks for a deliberate redesign.

Current stable shape:

- Static site files live at repo root: `index.html`, `styles.css`, `script.js`.
- The site is deployed by Vercel from `main`.
- The design is a clean neon city-pop / glass-panel cafe page, not a marketing
  landing page.
- The drink menu intentionally mirrors the clean Corgi Cafe-style menu board:
  simple text, restrained colors, no AI-slop decoration.
- All drinks are free and display `$0`.
- Confirmed sponsor drinks:
  - `Arize Grapefruit Ade` with `assets/menu/arize-grapefruit-ade-cutout.png`.
  - `IronClaw Latte` with `assets/menu/ironclaw-latte-cutout.png`.
- The sponsor strip is now consolidated into one image:
  `assets/logos/sponsors-strip.png`.

## Commands

Use these checks before claiming completion:

```bash
npm test
npm run build
```

For local preview:

```bash
python3 -m http.server 4173
# open http://127.0.0.1:4173
```

For production deployment:

```bash
vercel deploy --prod --yes
```

After deployment, verify live output instead of assuming Vercel succeeded:

```bash
python3 - <<'PY'
import urllib.request
html = urllib.request.urlopen("https://cafeicml.com", timeout=20).read().decode("utf-8")
print("IronClaw Latte", "IronClaw Latte" in html)
print("Arize Grapefruit Ade", "Arize Grapefruit Ade" in html)
PY
```

## Visual Rules

Preserve the current visual direction:

- Avoid loud gradients, decorative blobs, overdone glows, or generic AI-looking
  composition.
- Text color should stay restrained and consistent inside the menu.
- Sponsor tags use `By ...` copy, not loud badges.
- Do not add unconfirmed sponsors.
- Do not use fake logos or model-generated logo text.
- Use real logo assets from `assets/logos/` and preserve aspect ratio.
- If a drink image needs generation, use an image model for the drink itself,
  then composite exact brand logos locally from source assets.

## Sponsor Strip

The Luma sponsor section should use a single combined sponsor image rather than
separate logo images. Source data lives in:

```text
data/sponsors.json
```

Build and verify the strip:

```bash
python3 scripts/build_sponsor_strip.py
python3 scripts/build_sponsor_strip.py --verify-only
```

The script enforces:

- max 3 logos per row;
- transparent padding trim via alpha bbox;
- shared visual logo height;
- max width per logo;
- no overlap;
- minimum same-row logo gap;
- bounded logo height ratio.

Current verified output:

```text
assets/logos/sponsors-strip.png
generated/sponsors-strip-report.json
```

When adding a sponsor, add it to `data/sponsors.json`, regenerate the strip, run
`--verify-only`, inspect the PNG visually, then update Luma if needed.

## Luma Event

The associated Luma event is:

```text
Road to ICML 2026 Seoul: Cafe @ICML
event_id: evt-CpDslpHDtaoauoG
url: https://luma.com/7iiqamt2
```

The current Luma description intentionally says:

- RSVP once to get a free drink.
- The side-event list is collected by us.
- Cafe @ICML gatherings are the part Team Attention is hosting.
- The sponsor section uses one combined sponsor image plus a short link line.

Do not make Luma edits directly in the browser unless explicitly asked. Use the
existing Deep Thought Luma skills/scripts:

```bash
python3 /Users/bong/team-attention/deep-thought/.claude/skills/luma-description-api/scripts/update_luma_description.py \
  --event evt-CpDslpHDtaoauoG --get
```

Operational ownership:

- Keep Cafe @ICML public-change artifacts in this repo: generated candidates,
  upload reports, and `versions/luma-description/` snapshots.
- Reuse the Deep Thought Luma API/versioning scripts as shared tooling; do not
  fork one-off API helpers into this repo unless the workflow becomes
  project-specific.
- The Luma API key should live only in macOS Keychain service
  `team-attention-luma-api-key` with account `luma`, or in a transient
  `LUMA_API_KEY` environment variable for a single shell. Never commit it or
  write it to generated files.

Before any Luma mutation, snapshot:

```bash
python3 /Users/bong/team-attention/deep-thought/.claude/skills/luma-description-versioning/scripts/snapshot_luma_description.py \
  --event evt-CpDslpHDtaoauoG \
  --versions-dir /Users/bong/team-attention/cafeicml/versions/luma-description \
  --label <short-label> \
  --stage before
```

Candidate snapshot:

```bash
python3 /Users/bong/team-attention/deep-thought/.claude/skills/luma-description-versioning/scripts/snapshot_luma_description.py \
  --event evt-CpDslpHDtaoauoG \
  --versions-dir /Users/bong/team-attention/cafeicml/versions/luma-description \
  --label <short-label> \
  --stage candidate \
  --from-file /Users/bong/team-attention/cafeicml/generated/<candidate>.md
```

Dry-run before apply:

```bash
python3 /Users/bong/team-attention/deep-thought/.claude/skills/luma-description-api/scripts/update_luma_description.py \
  --event evt-CpDslpHDtaoauoG \
  --file /Users/bong/team-attention/cafeicml/generated/<candidate>.md \
  --dry-run
```

Apply quietly:

```bash
python3 /Users/bong/team-attention/deep-thought/.claude/skills/luma-description-api/scripts/update_luma_description.py \
  --event evt-CpDslpHDtaoauoG \
  --file /Users/bong/team-attention/cafeicml/generated/<candidate>.md \
  --apply \
  --suppress-notifications
```

After apply, snapshot `after` and run `--get` to verify the exact live text.

For small hotfixes, start from the current live `description_md`, not an older
generated candidate, unless you explicitly diff the candidate against live
first. Preserve sections outside the intended change, especially `## Sponsors`
and its image/link block.

For Luma Markdown images, use `https://images.lumacdn.com/...` URLs. Upload
local PNGs through `/v1/images/create-upload-url`; keep upload metadata under
`generated/`.

## Versioning And Generated Files

Keep these committed when they document a real public Luma change:

- `generated/<candidate-description>.md`
- `generated/*upload*.json`
- `generated/*report*.json`
- `versions/luma-description/.../{before,candidate,after}*.md`
- `versions/luma-description/.../{before,candidate,after}*.json`
- `versions/luma-description/.../index.jsonl`

Do not commit API helper raw `snapshots/`; it is ignored.

## Git Workflow

The user usually wants changes carried through end to end. For this repo:

- make narrow edits;
- run `npm test` and `npm run build`;
- visually inspect generated images when relevant;
- commit the exact changed files;
- push `main` when the user asks for a saved production state or when the
  change has already been applied publicly.

Do not leave unrelated dirty files behind. Do not revert user changes.

## Current Known Good Commit

At the time this file was written:

```text
4b55c8b Add reusable sponsor logo strip
```
