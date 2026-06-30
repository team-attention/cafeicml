# CAFE@ICML Design System

## 1. Atmosphere & Identity

CAFE@ICML is a Seoul city-pop micro-site for researchers during ICML week. The signature is a layered neon night scene: a soft aurora shader, a rotating wireframe orb, glossy panels, and compact conference-cafe content that still feels social and warm.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --surface-primary | #10102b | #10102b | Page canvas |
| Surface/base | --surface-base | #0b0b25 | #0b0b25 | Deep background |
| Surface/raised | --surface-raised | rgba(28, 29, 56, 0.72) | rgba(28, 29, 56, 0.72) | Glass cards, nav |
| Surface/strong | --surface-strong | #272743 | #272743 | Field fills, timeline nodes |
| Text/primary | --text-primary | #e1dfff | #e1dfff | Headings, body |
| Text/secondary | --text-secondary | #dabfcc | #dabfcc | Descriptions |
| Text/inverse | --text-inverse | #3b002c | #3b002c | Text on pink surfaces |
| Accent/primary | --accent-primary | #ffaedc | #ffaedc | Primary controls, brand |
| Accent/primary-strong | --accent-primary-strong | #ff71ce | #ff71ce | Strong CTA, highlights |
| Accent/secondary | --accent-secondary | #98e1ff | #98e1ff | Secondary navigation, metadata |
| Accent/tertiary | --accent-tertiary | #dfb7ff | #dfb7ff | Expert items, alternate emphasis |
| Border/subtle | --border-subtle | rgba(255, 255, 255, 0.12) | rgba(255, 255, 255, 0.12) | Glass borders |
| Border/primary | --border-primary | rgba(255, 174, 220, 0.36) | rgba(255, 174, 220, 0.36) | Focus and active outlines |

### Rules

- Use the accent colors only for state, hierarchy, and section identity.
- The aurora background supplies atmosphere; content surfaces must remain readable over it.
- No pure black background. The darkest value is `--surface-base`.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | clamp(2.5rem, 8vw, 5.5rem) | 800 | 0.95 | 0 | Hero title |
| H1 | clamp(2rem, 6vw, 4rem) | 800 | 1 | 0 | Page title |
| H2 | clamp(1.75rem, 4vw, 2.75rem) | 700 | 1.15 | 0 | Section headers |
| H3 | 1.25rem | 700 | 1.3 | 0 | Card titles |
| Body/lg | 1.125rem | 400 | 1.6 | 0 | Hero copy |
| Body | 1rem | 400 | 1.6 | 0 | Default text |
| Body/sm | 0.875rem | 400 | 1.55 | 0 | Secondary text |
| Caption | 0.75rem | 600 | 1.35 | 0.08em | Badges, metadata |

### Font Stack

- Display: Sora, system-ui, sans-serif
- Body: Be Vietnam Pro, system-ui, sans-serif
- Label: Space Grotesk, system-ui, sans-serif

### Rules

- Korean copy must wrap by phrase naturally. Keep display containers wide enough to avoid orphaned final syllables.
- Body copy uses a comfortable max width of 38rem.
- Use uppercase labels only for short English metadata.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a 4px base.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 0.25rem | Hairline gaps |
| --space-2 | 0.5rem | Icon-to-label |
| --space-3 | 0.75rem | Tight groups |
| --space-4 | 1rem | Default gaps |
| --space-5 | 1.25rem | Field padding |
| --space-6 | 1.5rem | Card padding |
| --space-8 | 2rem | Section inner rhythm |
| --space-10 | 2.5rem | Large groups |
| --space-12 | 3rem | Section headers |
| --space-16 | 4rem | Section spacing |
| --space-20 | 5rem | Hero spacing |

### Grid

- Max content width: 1120px.
- Breakpoints: mobile below 720px, desktop at 960px and above.
- Main sections use one-column mobile layouts and controlled two/three-column desktop grids.

### Rules

- Use CSS Grid for repeated content and cards.
- Bottom navigation is fixed and content gets enough bottom padding to avoid overlap.
- No horizontal page overflow on mobile.

## 5. Components

### Top Navigation
- **Structure**: `header` with brand link, primary section links, and account action.
- **Variants**: desktop links, compact mobile header.
- **States**: hover, focus-visible, active.
- **Accessibility**: `aria-label` on navigation and icon-only account button.

### Bottom Navigation
- **Structure**: fixed `nav` with anchor links.
- **States**: active section, hover, focus-visible, pressed.
- **Accessibility**: current link receives `aria-current="page"`.

### Glass Panel
- **Structure**: reusable elevated section/card surface.
- **Variants**: primary, secondary, tertiary border accents.
- **States**: hover lift for interactive cards only.
- **Motion**: transform/opacity only.

### Menu Card
- **Structure**: `article`, centered sponsor badge, title, description, price.
- **States**: hover lift and border glow.
- **Accessibility**: card copy is plain text with no decorative controls.

### Guestbook Form
- **Structure**: `form`, labels, input, textarea, submit button, sample notes.
- **States**: focus, invalid, submit feedback placeholder.
- **Accessibility**: labels tied to controls; helper text remains visible.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 140ms | ease-out | Button press |
| Standard | 240ms | ease-in-out | Hover, focus |
| Emphasis | 700ms | cubic-bezier(0.16, 1, 0.3, 1) | Section reveal |

- Respect `prefers-reduced-motion`: stop the orb rotation, section reveal, particle loop, and smooth scrolling.
- WebGL and Three.js canvases are decorative and hidden from assistive tech.
- Active navigation is driven by `IntersectionObserver`, not scroll polling.

## 7. Depth & Surface

### Strategy

Mixed depth: tonal-shift surfaces plus glass blur, subtle borders, and restrained neon text glow.

| Level | Value | Usage |
|-------|-------|-------|
| Glass | inset 0 0 24px rgba(152,225,255,0.05), 0 16px 44px rgba(0,0,0,0.22) | Cards and panels |
| Brand glow | 0 0 18px rgba(255,113,206,0.35) | Primary CTA and logo accents |
| Secondary glow | 0 0 18px rgba(0,203,252,0.28) | Active nav and secondary accents |

Depth must never reduce text contrast or hide focus rings.
