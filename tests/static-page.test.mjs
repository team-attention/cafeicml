import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

const requiredSections = ['home', 'menu', 'events', 'notes', 'map'];
for (const id of requiredSections) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id} section`);
}

assert.match(html, /CAFE @ICML/, 'header brand should show CAFE @ICML');
assert.match(html, /Cafe @ ICML/, 'hero title should remain visible');
assert.match(html, /Free coffee for ICML ticket holders in Seoul/i, 'hero must emphasize free coffee for ICML ticket holders');
assert.match(html, /Show your ICML ticket\. Coffee is free\./i, 'ticket/free coffee source copy must remain');
assert.match(html, /I-Park Tower 2, 5 Yeongdong-daero 106-gil, Gangnam-gu, Seoul/, 'English location address must remain');

assert.equal(countMatches(html, /class=["'][^"']*\bmenu-card\b/g), 6, 'menu should render six drink cards');
assert.match(html, /Exclusive Drinks/, 'menu should use the exclusive drinks heading');
assert.match(html, /menu-panel/, 'menu should use the Corgi-inspired rounded panel');
assert.match(html, /#d8dec8/i, 'menu panel should use the muted pistachio khaki background');
assert.match(html, /By Arize/, 'Arize card should use the sponsor line');
assert.match(html, /Arize Grapefruit Ade/, 'Arize main sponsor drink must remain');
assert.match(html, /assets\/menu\/arize-grapefruit-ade-cutout\.png/, 'Arize card should include the generated drink image');
assert.match(html, /Arize Grapefruit Ade with a navy-to-purple Arize cup sleeve/, 'Arize drink image needs useful alt text');
assert.equal(countMatches(html, /By Sponsor wanted/g), 5, 'five non-Arize exclusive drinks should say Sponsor wanted');
assert.equal(countMatches(html, /<strong class=["']price["']>\$0<\/strong>/g), 6, 'all drink cards should show $0 pricing');
assert.equal(countMatches(html, /class=["']drink-spacer["']/g), 5, 'sponsor-wanted rows should reserve source-style drink image space without fake cups');
assert.match(html, /drink-name-group/, 'menu should use Corgi-style drink title and sponsor grouping');
assert.match(html, /price-mobile/, 'menu should split mobile and desktop prices like the source section');

assert.equal(countMatches(html, /class=["']cup\b/g), 0, 'exclusive drink cards should not use awkward initial cup markers');
assert.equal(countMatches(html, /class=["']logo-dot\b/g), 0, 'exclusive drink cards should not use decorative symbol prefixes');
assert.doesNotMatch(html, />\s*add\s*</, 'menu cards should not include plus/add icon buttons');
assert.doesNotMatch(html, /<cite\b/i, 'removed cite labels should not return');

const pinkCityPopTokens = [
  /--accent-primary:\s*#ffaedc/i,
  /--accent-primary-strong:\s*#ff71ce/i,
  /--accent-secondary:\s*#98e1ff/i,
  /--accent-tertiary:\s*#dfb7ff/i,
  /aurora-canvas/,
  /hero-visual/,
  /glass-panel/,
  /menu-card/,
  /text-shadow/i,
  /backdrop-filter/i,
  /radial-gradient/i,
  /linear-gradient/i,
  /THREE\.Scene/,
  /SphereGeometry/,
  /webgl/i
];
for (const token of pinkCityPopTokens) {
  assert.match(html, token, `missing pink city-pop visual token ${token}`);
}

assert.match(html, /@media \(prefers-reduced-motion: reduce\)/, 'must respect reduced motion');
assert.match(html, /<form class=["']guestbook-form["'] action=["']#["'] method=["']post["']>/, 'guestbook form should remain');
assert.match(html, /<label for=["']guest-name["']>Name and affiliation<\/label>/, 'guestbook name label should remain');
assert.match(html, /<label for=["']guest-message["']>What do you want to talk about\?<\/label>/, 'guestbook message label should remain');
assert.match(html, /aria-current/, 'navigation should expose the active section state');

console.log('static-page tests passed');
