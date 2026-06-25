# cafe @icml Back-to-the-Future retro redesign brief

Created: 2026-06-25

## Product job

Make `cafe @icml` feel like a memorable ICML hallway-track destination rather than a generic cafe page.

Core offer stays brutally clear:

> Free coffee for ICML ticket holders.

Audience: AI researchers in Seoul for ICML who need somewhere comfortable to meet peers, ask locals about Korea, talk with hiring/company teams, and attend casual side rituals.

Required section order:

1. Hero with the free-coffee value prop.
2. Menu immediately after hero, all prices `$0`.
3. Address/location: `서울 강남구 영동대로106길 5 아이파크타워2`, Naver map `https://naver.me/GXADQcFI`.
4. Guestbook form.
5. Events: Running with Researchers, codex `/goal` workshop, Claude Code cafe hours.

Content constraints:

- Title/brand/domain: `cafe @icml`, `cafeicml.com`.
- Arize remains the main sponsor drink.
- Other exclusive drinks are general cafe/research-themed drinks, not company names, and must say `Sponsor wanted`.
- Do not imply unconfirmed sponsors beyond Arize.

## Reference image analysis

The attached Back to the Future reference suggests:

- Dark midnight/space-blue background.
- Electric cyan/blue light rays and radial bursts behind subjects.
- Huge italic/skewed block typography with chrome/white outline and yellow → orange → red flame gradients.
- Diagonal motion: text and car angle forward, speed lines trail to the right.
- Fire trail / glowing baseline.
- Sci-fi dashboard motifs: time circuits, grid, gauges, neon panels.
- High contrast: dark background + bright poster typography + luminous glows.

Translate the style without copying copyrighted art/assets/logos. Use original CSS shapes, gradients, copy, and simple inline SVG/CSS effects.

## Web research notes

Sources checked:

- OpenAI Codex docs, `Follow a goal`: meta description says use `/goal` when a task needs Codex to keep working across turns toward a verifiable stopping condition. Source: https://developers.openai.com/codex/use-cases/follow-goals
- Claude Code docs, `Keep Claude working toward a goal`: meta description says set a completion condition with `/goal` and Claude keeps working across turns until the condition is met. Source: https://code.claude.com/docs/en/goal
- Eknoji Studio, `Retro Futurism Design`: headings identify practical characteristics: vibrant neon color palettes, geometric shapes and retro grids, glow effects and chrome highlights, classic sci-fi elements, retro-futuristic typography. Source: https://eknojistudio.com/retro-futurism-design/
- Envato Tuts+, `How to Make the Back to the Future Logo`: confirms the relevant visual target is an 80s logo style; useful application details include heavy italic vector lettering, outline/extrusion, and warm gradients. Source: https://design.tutsplus.com/tutorials/how-to-make-the-back-to-the-future-logo--cms-93630

Design synthesis for this page:

- Keep conversion clarity first; the retro treatment should amplify, not hide, “free coffee.”
- Use neon cyan and deep navy for research/future energy, flame yellow-orange for free-coffee/DeLorean fire-trail excitement, and warm coffee cream only inside cards/forms for hospitality.
- Use diagonal/skewed hero title and buttons, but keep body text legible.
- Use speed lines, star/ray bursts, grid/time-circuit panels, and glow effects as background layers.
- Apply reduced-motion rules so animated glow/speed effects do not hurt usability.

## TDD acceptance criteria

`npm test` must pass. Tests verify:

- All required sections and exact address/map/event/menu requirements remain.
- Hero keeps `Free coffee` and `ICML ticket holders` visible.
- Menu/drink prices are `$0`.
- Sponsor language is correct.
- Back-to-the-Future-inspired visual tokens are present: 88mph, flux/time-circuit/neon/retro/future language, radial and linear gradients, skew/clip-path/text-shadow/drop-shadow, dark blue/neon/flame palette, named visual components, reduced motion.
- Guestbook escaping remains.
