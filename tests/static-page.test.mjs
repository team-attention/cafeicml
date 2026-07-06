import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');


function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

const requiredSections = ['home', 'menu', 'events', 'notes', 'map'];
for (const id of requiredSections) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id} section`);
}

assert.match(html, /<html lang=["']en["']/, 'landing page language should be English');
assert.match(html, /<a class=["']skip-link["'] href=["']#main-content["']>Skip to main content<\/a>/, 'skip link text should be English');
assert.match(html, /CAFE @ICML/, 'header brand should show CAFE @ICML');
assert.match(html, /Cafe @ ICML/, 'hero title should remain visible');
assert.match(html, /Free coffee for ICML ticket holders in Seoul/i, 'hero must emphasize free coffee for ICML ticket holders');
assert.match(html, /Show your ICML ticket\. Coffee is free\./i, 'ticket/free coffee source copy must remain');
assert.match(html, /Google Maps link for the exact location\./, 'location section should keep the map link copy');
assert.match(html, /https:\/\/maps\.app\.goo\.gl\/RaefhMoRSksakyhv6/, 'location should use the provided Google Maps link');
assert.doesNotMatch(html, /I-Park Tower 2, 5 Yeongdong-daero 106-gil, Gangnam-gu, Seoul/, 'location section should not expose the address text');

assert.equal(countMatches(html, /<article class=["']menu-card\b/g), 6, 'menu should render six drink cards');
assert.match(html, /Exclusive Drinks/, 'menu should use the exclusive drinks heading');
assert.match(html, /menu-panel/, 'menu should use the production rounded glass panel');
assert.match(html, /rgba\(4, 5, 18, 0\.54\)/, 'menu panel should use the current dark glass background');
assert.match(html, /backdrop-filter:\s*blur\(22px\)/i, 'menu panel should blur the page background behind it');
assert.match(html, /aria-label=["']Free drink menu["']/, 'menu should describe the updated drink list');
assert.match(
  html,
  /ICML Cold Brew Americano[\s\S]*Ironclaw Iced Latte[\s\S]*Arize Grapefruit Ade[\s\S]*Minds Orange Juice[\s\S]*Dalpa Peach Iced Tea[\s\S]*Corona Extra/,
  'drink cards should render in the requested sponsor order'
);
assert.match(html, /ICML Cold Brew Americano/, 'ICML cold brew Americano should be the first menu item');
assert.match(html, /assets\/menu\/cafeicml-americano-cutout\.png/, 'ICML Americano card should include the CAFE@ICML drink image');
assert.match(html, /ICML Cold Brew Americano with a pastel city-pop CAFE@ICML cup sleeve/, 'ICML Americano image needs useful alt text');
assert.match(html, /By CAFE@ICML/, 'ICML Americano card should use the CAFE@ICML line');
assert.match(html, /cold brew, water,<br>ice, clean finish/, 'ICML Americano copy should match the new menu');
assert.match(html, /Ironclaw Iced Latte/, 'Ironclaw iced latte should be the second menu item');
assert.match(html, /assets\/menu\/ironclaw-latte-descent-cutout\.png/, 'Ironclaw card should include the iced latte image');
assert.match(html, /Ironclaw Iced Latte with a blue IronClaw cup sleeve/, 'Ironclaw image needs useful alt text');
assert.match(html, /By IronClaw/, 'Ironclaw card should use the sponsor line');
assert.match(html, /milk, espresso,<br>ice, smooth finish/, 'Ironclaw copy should match the new menu');
assert.match(html, /By Arize/, 'Arize card should use the sponsor line');
assert.match(html, /Arize Grapefruit Ade/, 'Arize main sponsor drink must remain');
assert.match(html, /assets\/menu\/arize-grapefruit-ade-cutout\.png/, 'Arize card should include the original grapefruit drink image');
assert.match(html, /Arize Grapefruit Ade with a navy-to-purple Arize cup sleeve/, 'Arize drink image needs useful alt text');
assert.match(html, /By Minds/, 'Minds card should use the sponsor line');
assert.match(html, /Minds Orange Juice/, 'Minds orange juice should be the fourth menu item');
assert.match(html, /assets\/menu\/minds-yuja-poster-session-cutout\.png/, 'Minds card should include the orange juice image');
assert.match(html, /Minds Orange Juice with a deep blue Minds cup sleeve/, 'Minds image needs useful alt text');
assert.match(html, /orange juice,<br>citrus, ice/, 'Minds copy should match the new menu');
assert.match(html, /By Dalpa/, 'Dalpa card should use the sponsor line');
assert.match(html, /Dalpa Peach Iced Tea/, 'Dalpa peach iced tea should be the fifth menu item');
assert.match(html, /assets\/menu\/dalpa-peach-iced-tea-cutout\.png/, 'Dalpa card should include the provided drink image');
assert.match(html, /Dalpa Peach Iced Tea with a Dalpa cup sleeve/, 'Dalpa image needs useful alt text');
assert.match(html, /peach iced tea,<br>ice, clean finish/, 'Dalpa copy should match the new menu');
assert.match(html, /Corona Extra/, 'Corona Extra should be the sixth menu item');
assert.match(html, /assets\/menu\/corona-extra-cutout\.png/, 'Corona card should include the bottle cutout image');
assert.match(html, /Corona Extra beer bottle with lime/, 'Corona image needs useful alt text');
assert.doesNotMatch(html, /By Corona/, 'Corona card should not show a sponsor line');
assert.match(html, /lager, lime,<br>cold bottle/, 'Corona copy should match the new menu');
assert.equal(countMatches(html, /class=["']drink-image["']/g), 6, 'six menu cards should include product photos');
assert.equal(countMatches(html, /class=["']drink-image placeholder-drink["']/g), 0, 'menu should not use sponsor-wanted placeholders');
assert.equal(countMatches(html, /By Sponsor wanted/g), 0, 'sponsor-wanted rows should be removed');
assert.equal(countMatches(html, /class=["']drink-placeholder["']/g), 0, 'sponsor-wanted rows should not use CSS-drawn cup placeholders');
assert.equal(countMatches(html, /<strong class=["']price["']>\$0<\/strong>/g), 6, 'all drink cards should show desktop $0 pricing');
assert.equal(countMatches(html, /<span class=["']price price-mobile["']>\$0<\/span>/g), 6, 'all drink cards should show mobile $0 pricing');
assert.match(html, /drink-name-group/, 'menu should use grouped drink title and sponsor layout');
assert.match(html, /price-mobile/, 'menu should split mobile and desktop prices like the source section');

assert.doesNotMatch(html, /Arize Espresso Trace/, 'incorrect Espresso Trace rename should not return');
assert.doesNotMatch(html, /IronClaw Latte<\/h3>/, 'incorrect standalone IronClaw Latte rename should not return');
assert.doesNotMatch(html, /CAFE@ICML Latte Descent/, 'incorrect CAFE@ICML Latte Descent rename should not return');
assert.doesNotMatch(html, /Gradient Matcha/, 'old Gradient Matcha item should not return');
assert.doesNotMatch(html, /Berry Benchmark/, 'old Berry Benchmark item should not return');
assert.doesNotMatch(html, /Team Attention Iced Tea/, 'old Team Attention menu item should not return');
assert.doesNotMatch(html, /Minds Yuja Poster Session/, 'old Minds menu name should not return');
assert.doesNotMatch(html, /IronClaw Latte Descent/, 'old IronClaw menu name should not return');
assert.doesNotMatch(html, /CAFE@ICML Americano/, 'old CAFE@ICML menu name should not return');
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
assert.match(html, /<a class=["']button button-primary["'] href=["']#menu["']>Get free coffee<\/a>/, 'coffee CTA should remain pink primary');
assert.match(html, /<a class=["']button button-primary button-primary-cyan["'] href=["']\.\/visit\.html["']>Leave a guestbook note<\/a>/, 'guestbook CTA should link to visit page with cyan primary styling');
assert.doesNotMatch(html, /<form class=["']guestbook-form["']/i, 'landing guestbook should not include a write form');
assert.match(html, /id=["']landingGuestbookEntries["']/, 'landing guestbook needs a stable dynamic entries container');
assert.match(html, /aria-label=["']Recent guestbook notes["']/, 'landing guestbook entries should have an accessible label');
assert.match(html, /<script type=["']module["'] src=["']\.\/script\.js["']><\/script>/, 'landing page should load script.js as a module');
assert.match(html, /No notes yet —\s*<a href=["']\.\/visit\.html["']>sign the guestbook<\/a>\./, 'empty guestbook copy should be present');
assert.match(html, /Guestbook unavailable right now\.\s*<a href=["']\.\/visit\.html["']>Sign the guestbook<\/a>\./, 'error guestbook copy should be present');
assert.doesNotMatch(script, /localStorage|STORAGE_KEY|issues\/new|window\.open|guestbookForm|setEntries|seedEntries/, 'landing script should not keep old localStorage or GitHub issue submit behavior');
assert.match(script, /fetchGuestbookEntries\(LANDING_ENTRY_LIMIT\)/, 'landing script should fetch the configured latest entries limit');
assert.match(script, /LANDING_ENTRY_LIMIT/, 'landing script should use the latest-three landing limit');
assert.match(script, /EMPTY_MESSAGE/, 'landing script should import/use shared empty copy');
assert.match(script, /ERROR_MESSAGE/, 'landing script should import/use shared error copy');
assert.match(script, /normalizeProfileUrl/, 'landing script should normalize fetched profile URLs before rendering links');
assert.match(script, /const profileUrl = normalizeProfileUrl\(entry\.profile_url\)/, 'landing guestbook links should use the shared profile URL sanitizer');
assert.doesNotMatch(script, /String\(entry\.profile_url\)|entry\.profile_url \? String\(entry\.profile_url\)/, 'landing guestbook should not render raw fetched profile URLs');
assert.doesNotMatch(script, /sponsor/i, 'landing guestbook entries should not render sponsor badges');
assert.match(html, /aria-current/, 'navigation should expose the active section state');

console.log('static-page tests passed');
