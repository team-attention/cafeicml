import { existsSync, readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const visitHtmlUrl = new URL('../visit.html', import.meta.url);
const visitCssUrl = new URL('../visit.css', import.meta.url);
const visitJsUrl = new URL('../visit.js', import.meta.url);

assert.ok(existsSync(visitHtmlUrl), 'visit.html should exist for QR guestbook visits');
assert.ok(existsSync(visitCssUrl), 'visit.css should exist for the visit page layout');
assert.ok(existsSync(visitJsUrl), 'visit.js should exist for query-string and guestbook behavior');

const html = readFileSync(visitHtmlUrl, 'utf8');
const css = readFileSync(visitCssUrl, 'utf8');
const js = readFileSync(visitJsUrl, 'utf8');

assert.match(html, /<title>Visit cafe @icml<\/title>/i, 'visit page should have a dedicated title');
assert.match(html, /<link rel=["']stylesheet["'] href=["']\.\/visit\.css["']>/, 'visit page should load its own CSS');
assert.match(html, /<script type=["']module["'] src=["']\.\/visit\.js["']><\/script>/, 'visit page should load visit.js as a module');
assert.match(html, /id=["']sponsorCarousel["']/, 'visit page should expose sponsor logos as a carousel');
assert.match(html, /id=["']drinkSponsorLine["']/, 'visit page should show which sponsor is buying the drink');
assert.doesNotMatch(html, /You came through/, 'visit page should not use menu-specific QR source copy');
assert.doesNotMatch(html, /id=["']sourceMenuName["']|id=["']sourceLogo["']|id=["']sourceSponsorLink["']/, 'visit page should not reserve menu-specific source slots');
assert.match(html, /id=["']sponsorCta["']/, 'sponsor carousel should include a CTA for future sponsors');
assert.match(html, /id=["']guestbookForm["']/, 'visit page should include a guestbook form');
assert.match(html, /name=["']name["'][^>]+required/, 'visitor name should be required');
assert.match(html, /name=["']profile["']/, 'visitor profile link should be optional');
assert.match(html, /name=["']intent["'][^>]+value=["']collab["']/, 'guestbook should offer a collaboration intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']hiring["']/, 'guestbook should offer a hiring intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']open-to-work["']/, 'guestbook should offer an open-to-work intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']business["']/, 'guestbook should offer a business intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']special-request["']/, 'guestbook should offer a special-request intent badge');
assert.match(html, /<details class=["']optional-message["']>/, 'extra ask-me-about message should be collapsed by default');
assert.doesNotMatch(html, /name=["']message["'][\s\S]*required/, 'visitor message should be optional to keep submit fast');
assert.match(html, /id=["']successScreen["']/, 'visit page should include a post-submit success screen');
assert.match(html, /id=["']submittedSummary["']/, 'success screen should show what the visitor submitted');
assert.match(html, /id=["']entryList["']/, 'visit page should show existing guestbook entries below the form');

assert.match(css, /\.visit-hero/, 'visit CSS should style the compact top sponsor hero');
assert.match(css, /\.sponsor-carousel/, 'visit CSS should style the sponsor carousel');
assert.match(css, /scroll-snap-type:\s*x\s+mandatory/, 'sponsor carousel should support swipeable snapping');
assert.match(css, /min-height:\s*100svh/, 'visit page should be mobile-first and fill the viewport');
assert.match(css, /@media\s+\(max-width:\s*640px\)/, 'visit CSS should include a mobile breakpoint');
assert.match(css, /\.guestbook-grid/, 'visit CSS should keep the form and entries in a clear one-page flow');
assert.doesNotMatch(css, /orb|blob|bokeh/i, 'visit CSS should avoid generic decorative blobs');

const module = await import(visitJsUrl.href);

assert.deepEqual(module.SPONSORS.map(sponsor => sponsor.name), ['Arize', 'IronClaw', 'Minds', 'Dalpa']);
assert.ok(module.SPONSORS.some(sponsor => sponsor.name === 'Minds'), 'sponsor rail should include Minds');
assert.ok(module.SPONSORS.some(sponsor => sponsor.name === 'Dalpa'), 'sponsor rail should include Dalpa');
assert.equal(module.SPONSOR_CTA.label, 'Sponsor this menu', 'sponsor rail should include sponsor CTA');
assert.equal(module.pickSponsor(() => 0).name, 'Arize');
assert.equal(module.pickSponsor(() => 0.26).name, 'IronClaw');
assert.equal(module.pickSponsor(() => 0.51).name, 'Minds');
assert.equal(module.pickSponsor(() => 0.99).name, 'Dalpa');

const shareUrl = module.buildShareUrl('https://cafeicml.com/visit.html?drink=arize-grapefruit-ade');
assert.equal(shareUrl, 'https://cafeicml.com/visit.html', 'share URL should remove legacy menu query strings');

assert.equal(module.normalizeProfileUrl('linkedin.com/in/researcher'), 'https://linkedin.com/in/researcher');
assert.equal(module.normalizeProfileUrl(''), '');

const entry = module.createGuestbookEntry({
  name: 'Grace Hopper',
  profile: 'x.com/grace',
  intent: 'business',
  message: ''
}, module.pickSponsor(() => 0));

assert.equal(entry.name, 'Grace Hopper');
assert.equal(entry.profileUrl, 'https://x.com/grace');
assert.equal(entry.intent, 'business');
assert.equal(entry.intentLabel, 'Business opportunities');
assert.equal(entry.message, 'Business opportunities');
assert.equal(entry.sponsorName, 'Arize');
assert.equal(entry.sponsorBadge, 'By Arize');

assert.equal(module.getIntentConfig('special-request').label, 'Special request');
assert.equal(module.getIntentConfig('unknown').label, 'Collab');
assert.doesNotMatch(js, /URLSearchParams\(window\.location\.search\)|searchParams\.set\(["']drink["']|DRINK_SOURCES|getSourceConfig/, 'visit page should not depend on menu query strings');
assert.match(js, /localStorage/, 'mock guestbook should persist locally before Supabase is connected');
assert.match(js, /navigator\.share|navigator\.clipboard/, 'success screen should support sharing or copying the source link');
assert.match(js, /Free Drink unlocked/, 'submit success state should tell visitors they unlocked a free drink');
assert.match(js, /submittedSummary/, 'success state should render submitted visitor values before sharing');
assert.doesNotMatch(js, /spam|moderation|moderation_status/i, 'first mock should stay simple without spam or moderation logic');

console.log('visit-page tests passed');
