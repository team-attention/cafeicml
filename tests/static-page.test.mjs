import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../script.js', import.meta.url), 'utf8');

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

const requiredSections = ['hero', 'menu', 'location', 'guestbook', 'events'];
for (const id of requiredSections) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id} section`);
}

assert.match(html, /cafe @icml/i, 'title/brand should remain cafe @icml');
assert.match(html, /Free coffee/i, 'hero must emphasize Free coffee');
assert.match(html, /ICML ticket holders/i, 'hero must name ICML ticket holders');
assert.match(html, /서울 강남구 영동대로106길 5 아이파크타워2/, 'exact address must remain');
assert.match(html, /https:\/\/naver\.me\/GXADQcFI/, 'Naver Map link must remain');
assert.match(html, /Running with Researchers/i, 'event must remain');
assert.match(html, /codex .{0,20}goal/i, 'codex /goal workshop must remain');
assert.match(html, /Claude Code/i, 'Claude Code event must remain');
assert.match(html, /Arize/i, 'Arize main sponsor drink must remain');
assert.equal(countMatches(html, /Sponsor wanted/g), 5, 'five non-Arize exclusive drinks should say Sponsor wanted');
assert.ok(countMatches(html, /<strong>\$0<\/strong>/g) >= 12, 'menu and drinks should all show $0 pricing');

const retroTokens = [
  /88\s?mph/i,
  /flux/i,
  /time[- ]?circuit/i,
  /neon/i,
  /future/i,
  /retro/i,
  /radial-gradient/i,
  /linear-gradient/i,
  /skew/i,
  /clip-path/i,
  /text-shadow/i,
  /filter:\s*drop-shadow/i
];
let retroScore = 0;
for (const token of retroTokens) {
  if (token.test(html) || token.test(css)) retroScore += 1;
}
assert.ok(retroScore >= 10, `retro-futurist Back-to-the-Future-inspired visual system too weak; score=${retroScore}/12`);

assert.match(css, /#ffb000|#ffd34d|#ff4d1f|#0b1b4d|#00d4ff|#07204d/i, 'must use dark blue / neon cyan / flame yellow-orange palette');
assert.match(css, /\.speed-lines|\.light-rays|\.flux-grid|\.time-circuit|\.neon-sign/, 'must include named retro-futurist visual components');
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, 'must respect reduced motion');
assert.match(js, /escapeHtml/, 'guestbook should keep escaping user input');

console.log('static-page tests passed');
