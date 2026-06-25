# /goal: Back-to-the-Future retro redesign for cafe @icml

Working directory: this repository/worktree.

Use the product brief at `docs/retro-redesign-brief.md` as the source of truth. The attached reference image lives at `/Users/bong/.hermes/image_cache/img_7279c3b9ae68.png` in the parent machine; do not copy copyrighted artwork. Translate its style into original HTML/CSS/JS only.

Goal completion condition:

- `npm test` passes.
- The landing page visibly becomes a Back-to-the-Future-inspired retro-futurist cafe page rather than a generic modern cafe page.
- Required content stays intact: cafe @icml title/domain, free coffee for ICML ticket holders, menu immediately after hero with `$0`, Arize main sponsor drink, other drinks `Sponsor wanted`, exact address/Naver link, guestbook, and the three events.
- Browser page should have no console errors.

Implementation requirements:

1. Follow TDD: run `npm test` first and observe the failing retro test, then edit until tests pass.
2. Build one polished static page using the existing `index.html`, `styles.css`, `script.js`, and `og-image.svg`.
3. Use a distinct original creative direction: dark navy space poster, cyan light rays, flame-yellow/orange typography accents, diagonal speed trails, time-circuit/dashboard panels, flux-grid motifs, coffee hospitality cards.
4. Preserve accessibility and readability; add `prefers-reduced-motion` handling.
5. Keep JavaScript guestbook escaping and copy-address behavior working.
6. Update OG/meta/theme color to match the new design.
7. Add a short implementation note to `docs/AGENT-NOTE.md` describing what you changed and which command you ran.

Do not:

- Do not remove required sections or hide the offer behind decorative copy.
- Do not add unconfirmed sponsors.
- Do not use external build tooling or CDN dependencies.
- Do not overwrite tests to make them weaker.

Final response should list changed files and command output summary.
