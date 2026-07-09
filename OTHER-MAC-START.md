# Other Mac Start - Cafe ICML

Last updated: 2026-07-09 KST

## Clone / Pull

```bash
mkdir -p ~/team-attention

if [ ! -d ~/team-attention/cafeicml/.git ]; then
  git clone https://github.com/team-attention/cafeicml.git ~/team-attention/cafeicml
else
  git -C ~/team-attention/cafeicml fetch --all --prune
fi

git -C ~/team-attention/cafeicml switch codex/qr-guestbook-visit 2>/dev/null || \
  git -C ~/team-attention/cafeicml switch -c codex/qr-guestbook-visit origin/codex/qr-guestbook-visit
git -C ~/team-attention/cafeicml pull --ff-only
```

## Read First

```bash
sed -n '1,260p' ~/team-attention/cafeicml/AGENTS.md
sed -n '1,220p' ~/team-attention/cafeicml/README.md
```

## Verify

```bash
cd ~/team-attention/cafeicml
npm test
npm run build
```

## Current State

- Static site production shape should be preserved unless the task explicitly
  asks for a redesign.
- Public-change artifacts belong in this repo: generated Luma candidates, upload
  metadata, reports, and `versions/luma-description/` snapshots.
- Shared Luma scripts live in Deep Thought; do not fork new API helpers into this
  repo unless the workflow becomes project-specific.
- The Luma API key belongs only in macOS Keychain service
  `team-attention-luma-api-key`, account `luma`, or a one-shell `LUMA_API_KEY`.
  Never commit key material.

## Next Actions

1. Confirm the canonical live Luma event state before any mutation.
2. Snapshot the live Luma description before/candidate/after for every public
   edit.
3. Keep generated/versioned artifacts committed when they explain a real public
   Luma change.
4. Run `npm test` and `npm run build` before pushing.
