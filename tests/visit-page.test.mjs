import { existsSync, readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const visitHtmlUrl = new URL('../visit.html', import.meta.url);
const visitCssUrl = new URL('../visit.css', import.meta.url);
const visitJsUrl = new URL('../visit.js', import.meta.url);
const designSystemUrl = new URL('../DESIGN.md', import.meta.url);

assert.ok(existsSync(visitHtmlUrl), 'visit.html should exist for guestbook visits');
assert.ok(existsSync(visitCssUrl), 'visit.css should exist for the visit page layout');
assert.ok(existsSync(visitJsUrl), 'visit.js should exist for guestbook behavior');
assert.ok(existsSync(designSystemUrl), 'DESIGN.md should exist as the shared design-system contract');

const html = readFileSync(visitHtmlUrl, 'utf8');
const css = readFileSync(visitCssUrl, 'utf8');
const designSystem = readFileSync(designSystemUrl, 'utf8');

function getCssRuleBody(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'm'));
  assert.ok(match, `${selector} should have a CSS rule`);
  return match[1];
}

assert.match(designSystem, /StyleGallery layout-gallery/i, 'design system should name StyleGallery layout-gallery as the layout source');
assert.match(designSystem, /https:\/\/github\.com\/changeroa\/StyleGallery/, 'design system should cite the StyleGallery source repo');
assert.match(designSystem, /not a visual design system/i, 'design system should preserve StyleGallery scope instead of treating it as a visual theme');
for (const pattern of ['page_grid', 'main_with_rail', 'stack', 'wrap_row', 'feed', 'reel']) {
  assert.match(designSystem, new RegExp(`\\b${pattern}\\b`), `DESIGN.md should document the ${pattern} StyleGallery pattern`);
  assert.match(html, new RegExp(`class=["'][^"']*\\b${pattern}\\b`), `visit.html should use the ${pattern} StyleGallery class`);
  assert.match(css, new RegExp(`\\.${pattern}\\b`), `visit.css should implement the ${pattern} StyleGallery class`);
}
for (const token of ['--layout-content-max', '--layout-gutter', '--layout-section-gap', '--layout-stack-gap']) {
  assert.match(designSystem, new RegExp(token), `DESIGN.md should document ${token}`);
  assert.match(css, new RegExp(`${token}\\s*:`), `visit.css should define ${token}`);
}
for (const selector of ['.page_grid', '.main_with_rail', '.stack', '.wrap_row', '.feed', '.reel']) {
  const ruleBody = getCssRuleBody(selector);
  assert.doesNotMatch(ruleBody, /\b(?:background|border|box-shadow|color|font|text-shadow|animation|transform)\s*:/, `${selector} should stay structural rather than visual`);
}

assert.match(html, /<html lang=["']en["']>/, 'visit page language should be English');
assert.match(html, /<title>Visit cafe @icml<\/title>/i, 'visit page should have a dedicated title');
assert.match(html, /<link rel=["']stylesheet["'] href=["']\.\/visit\.css["']>/, 'visit page should load its own CSS');
assert.match(html, /<script type=["']module["'] src=["']\.\/visit\.js["']><\/script>/, 'visit page should load visit.js as a module');
assert.match(html, /id=["']sponsorCarousel["']/, 'visit page should expose a page-level sponsor carousel');
assert.doesNotMatch(html, /id=["']drinkSponsorLine["']|buying this free drink|A Cafe @ICML sponsor will buy/i, 'visit page should not promise a random per-drink sponsor');
assert.doesNotMatch(html, /You came through|drink=|sourceMenuName|sourceLogo|sourceSponsorLink/, 'visit page should not use drink/source/query UI');
assert.match(html, /id=["']guestbookForm["']/, 'visit page should include a guestbook form');
assert.match(html, /id=["']submitStatus["'][^>]+aria-live=["']polite["']|aria-live=["']polite["'][^>]+id=["']submitStatus["']/, 'form should include an inline aria-live submit status');
assert.match(html, /name=["']name["'][^>]+required/, 'visitor name should be required');
assert.match(html, /name=["']profile["']/, 'visitor profile link should be optional');
assert.match(html, /name=["']intent["'][^>]+value=["']collab["']/, 'guestbook should offer a collaboration intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']hiring["']/, 'guestbook should offer a hiring intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']open-to-work["']/, 'guestbook should offer an open-to-work intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']business["']/, 'guestbook should offer a business intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']special-request["']/, 'guestbook should offer a special-request intent badge');
assert.doesNotMatch(html, /<details class=["']optional-message["']>/, 'ask-me-about message should stay visible instead of collapsing behind a toggle');
assert.match(html, /class=["']field message-field["'][\s\S]*id=["']visitorMessage["']/, 'ask-me-about message field should be visible in the form flow');
assert.doesNotMatch(html, /name=["']message["'][\s\S]*required/, 'visitor message should be optional to keep submit fast');
assert.match(html, /Sign guestbook and unlock free drink/, 'form CTA should clearly connect signing with the free drink unlock');
assert.match(html, /id=["']successScreen["']/, 'visit page should include a post-submit success screen');
assert.match(html, /id=["']submittedSummary["']/, 'success screen should show what the visitor submitted');
assert.match(html, /id=["']entryList["']/, 'visit page should show existing guestbook entries below the form');
assert.match(html, /Submitting makes your name, link, reason, and message public/i, 'privacy notice should explain public submission');
assert.match(html, /deletion[\s\S]*GitHub issue/i, 'privacy notice should describe deletion through the configured GitHub issue');
assert.doesNotMatch(html, /sponsorName|sponsorBadge|per-entry sponsor/i, 'visit markup should not include per-entry sponsor fields');

assert.match(css, /min-height:\s*100svh/, 'visit page should be mobile-first and fill the viewport');
assert.match(css, /\.intent-option:has\(input:focus-visible\)/, 'intent radios should have a visible focus ring');
assert.match(css, /\[hidden\][\s\S]*display:\s*none\s*!important/, 'hidden success/form panels should not occupy guestbook grid space');
assert.match(html, /class=["']sponsor-rail sponsor-rail--bottom["']/, 'sponsor carousel should render as a bottom landing-page band');
assert.match(css, /\.sponsor-rail--bottom[\s\S]*width:\s*100%/, 'sponsor rail should span the bottom of the page without overlaying form content');
assert.doesNotMatch(css, /\.sponsor-rail--bottom[\s\S]*position:\s*fixed/, 'sponsor rail should not cover the form as a fixed overlay');
assert.match(css, /\.sponsor-track[\s\S]*animation:\s*sponsor-scroll/, 'sponsor carousel should use a CSS-only infinite track animation');
assert.match(css, /sponsor-mobile-cycle[\s\S]*8s[\s\S]*100vw/, 'mobile sponsor carousel should rotate one full-viewport brand asset every two seconds');
assert.match(css, /\.sponsor-carousel:hover \.sponsor-track|\.sponsor-carousel:focus-within \.sponsor-track/, 'sponsor carousel should pause on hover or focus');
assert.doesNotMatch(css, /\.sponsor-carousel\s*\{[^}]*\b(?:display|overflow(?:-x)?)\s*:/, 'sponsor carousel should not override the StyleGallery reel scroll-owner contract');
assert.match(css, /@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none/, 'reduced motion should disable sponsor animation');
assert.match(css, /@media\s+\(max-width:\s*640px\)\s+and\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none[\s\S]*transform:\s*none/, 'mobile sponsor animation should not override reduced-motion preferences');
assert.match(css, /@media\s+\(max-width:\s*640px\)/, 'visit CSS should include a mobile breakpoint');
assert.match(css, /\.guestbook-grid/, 'visit CSS should keep the form and entries in a clear one-page flow');
assert.match(css, /\.entry-top[\s\S]*grid-template-columns/, 'guestbook notes should use a structured note-card layout');
assert.match(css, /\.submitted-row strong[\s\S]*overflow-wrap:\s*anywhere/, 'submitted summary values should wrap long profile URLs');
assert.match(css, /@media\s+\(max-width:\s*640px\)[\s\S]*\.submitted-row\s*\{[\s\S]*display:\s*grid/, 'mobile submitted summary rows should stack long label/value content');
assert.doesNotMatch(css, /orb|blob|bokeh/i, 'visit CSS should avoid generic decorative effects');

console.log('visit-page tests passed');
