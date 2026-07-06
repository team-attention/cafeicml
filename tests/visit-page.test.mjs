import { existsSync, readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const visitHtmlUrl = new URL('../visit.html', import.meta.url);
const visitCssUrl = new URL('../visit.css', import.meta.url);
const visitJsUrl = new URL('../visit.js', import.meta.url);
const designSystemUrl = new URL('../DESIGN.md', import.meta.url);
const landingHtmlUrl = new URL('../index.html', import.meta.url);

assert.ok(existsSync(visitHtmlUrl), 'visit.html should exist for guestbook visits');
assert.ok(existsSync(visitCssUrl), 'visit.css should exist for the visit page layout');
assert.ok(existsSync(visitJsUrl), 'visit.js should exist for guestbook behavior');
assert.ok(existsSync(designSystemUrl), 'DESIGN.md should exist as the shared design-system contract');
assert.ok(existsSync(landingHtmlUrl), 'index.html should exist as the landing-page visual source');

const html = readFileSync(visitHtmlUrl, 'utf8');
const css = readFileSync(visitCssUrl, 'utf8');
const js = readFileSync(visitJsUrl, 'utf8');
const designSystem = readFileSync(designSystemUrl, 'utf8');
const landingHtml = readFileSync(landingHtmlUrl, 'utf8');
const visitModule = await import(visitJsUrl);

function getCssRuleBody(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'm'));
  assert.ok(match, `${selector} should have a CSS rule`);
  return match[1];
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function seededRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sponsorNames(assignments) {
  return assignments.map(sponsor => sponsor?.name ?? null);
}

function sponsorCounts(assignments, sponsors) {
  return sponsors.map(sponsor =>
    assignments.filter(assignment => assignment?.id === sponsor.id).length
  );
}

function assertBalanced(assignments, sponsors) {
  const counts = sponsorCounts(assignments, sponsors);
  assert.equal(assignments.length, counts.reduce((sum, count) => sum + count, 0));
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `sponsor counts should stay balanced: ${counts.join(', ')}`);
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

assert.match(designSystem, /Visit Landing Visual Parity/i, 'DESIGN.md should document how visit inherits the home landing visual system');
assert.match(html, /class=["']site-header visit-header["']/, 'visit page should include the same fixed glass header primitive as the landing page');
assert.match(html, /class=["']brand-link["']/, 'visit page brand link should reuse the landing brand primitive');
assert.match(html, /class=["']visit-hero page_grid_content stack glass-panel["']/, 'visit hero should be a glass-panel landing surface');
assert.match(html, /<h1>Meet the cafe crowd\.<\/h1>/, 'visit hero headline should use a short high-impact phrase');
assert.doesNotMatch(html, /Meet who is in the cafe before the next session\./, 'visit hero should not keep the taller original headline');
assert.match(html, /class=["']hero-actions["'][\s\S]*Sign guestbook[\s\S]*Browse notes/, 'visit hero should keep sign and browse CTAs together');
assert.match(css, /\.hero-actions\b[\s\S]*flex-wrap:\s*nowrap/, 'visit hero CTAs should stay in one horizontal row');
assert.match(css, /\.hero-button\b[\s\S]*flex:\s*1 1 0/, 'visit hero CTAs should share a single row on mobile');
assert.doesNotMatch(css, /@media\s+\(max-width:\s*640px\)[\s\S]*\.hero-actions\s*\{[^}]*display:\s*grid/, 'mobile hero CTAs should not stack into a vertical grid');
assert.match(css, /\.hero-pass\b[\s\S]*display:\s*grid[\s\S]*overflow:\s*visible/, 'hero pass should be a visible flow component instead of a hidden horizontal scroller');
assert.doesNotMatch(css, /\.hero-pass\b[\s\S]*overflow-x:\s*auto/, 'hero pass should not rely on horizontal scrolling');
assert.match(css, /\.hero-pass ol\b[\s\S]*display:\s*flex[\s\S]*flex-wrap:\s*wrap/, 'hero pass steps should wrap like a fluid flow row');
assert.match(css, /\.hero-pass li:not\(:last-child\)::after[\s\S]*linear-gradient/, 'hero pass flow should visually connect steps across the row');
assert.match(html, /class=["'][^"']*guestbook-card[^"']*glass-panel[^"']*["'][^>]+id=["']formScreen["']/, 'visit form should reuse the shared glass-panel primitive');
assert.match(html, /class=["'][^"']*guestbook-card[^"']*glass-panel[^"']*["'][^>]+id=["']successScreen["']/, 'visit success state should reuse the shared glass-panel primitive');
assert.match(html, /class=["'][^"']*entries-card[^"']*glass-panel[^"']*["']/, 'visit guestbook wall should reuse the shared glass-panel primitive');
assert.match(html, /class=["']button button-primary/, 'visit CTAs should reuse landing button classes');
assert.match(html, /class=["']button button-secondary/, 'visit secondary CTAs should reuse landing button classes');
assert.match(css, /body::before[\s\S]*radial-gradient\(circle at 18% 20%[\s\S]*radial-gradient\(circle at 84% 12%/, 'visit page should inherit the landing aurora background atmosphere');
assert.match(css, /\.visit-header[\s\S]*position:\s*fixed[\s\S]*backdrop-filter:\s*blur\(18px\)\s+saturate\(135%\)/, 'visit header should match the landing fixed glass header');
assert.equal(
  countMatches(css, /(^|[^-])backdrop-filter:/g),
  countMatches(css, /-webkit-backdrop-filter:/g),
  'glass surfaces should include Safari -webkit-backdrop-filter parity'
);
assert.match(css, /\.visit-hero::before[\s\S]*repeating-radial-gradient[\s\S]*repeating-conic-gradient/, 'visit hero should carry the landing wireframe orb focal object');
assert.match(css, /h1[\s\S]*text-transform:\s*uppercase[\s\S]*text-shadow:\s*0 0 16px rgba\(255, 174, 220, 0\.74\)/, 'visit hero title should use the landing uppercase neon display treatment');
assert.match(css, /\.button[\s\S]*border-radius:\s*var\(--radius-md\)/, 'visit buttons should use the landing square-radius button primitive');
assert.doesNotMatch(css, /\.primary-button[\s\S]*linear-gradient\(135deg, var\(--accent-primary\), var\(--accent-secondary\)\)/, 'visit primary CTA should not use a separate pink-to-cyan pill gradient');
assert.match(landingHtml, /class=["']site-header["']/, 'landing page should continue to expose the source header primitive');

assert.match(html, /<html lang=["']en["']>/, 'visit page language should be English');
assert.match(html, /<title>Visit cafe @icml<\/title>/i, 'visit page should have a dedicated title');
assert.match(html, /<link rel=["']stylesheet["'] href=["']\.\/visit\.css["']>/, 'visit page should load its own CSS');
assert.match(html, /<script type=["']module["'] src=["']\.\/visit\.js["']><\/script>/, 'visit page should load visit.js as a module');
assert.match(html, /id=["']sponsorCarousel["']/, 'visit page should expose a page-level sponsor carousel');
assert.doesNotMatch(html, /id=["']drinkSponsorLine["']|buying this free drink|A Cafe @ICML sponsor will buy/i, 'visit page should not promise a random per-drink sponsor');
assert.doesNotMatch(html, /You came through|drink=|sourceMenuName|sourceLogo|sourceSponsorLink/, 'visit page should not use drink/source/query UI');
assert.match(html, /id=["']guestbookForm["']/, 'visit page should include a guestbook form');
assert.match(html, /id=["']submitStatus["'][^>]+aria-live=["']polite["']|aria-live=["']polite["'][^>]+id=["']submitStatus["']/, 'form should include an inline aria-live submit status');
assert.match(html, /name=["']name["'][^>]+required[^>]+maxlength=["']80["']|name=["']name["'][^>]+maxlength=["']80["'][^>]+required/, 'visitor name should be required and capped to the DB limit');
assert.match(html, /name=["']profile["'][^>]+maxlength=["']240["']/, 'visitor profile link should be optional and capped to the DB limit');
assert.match(html, /<label for=["']visitorProfile["']>LinkedIn profile/i, 'profile field should steer visitors toward LinkedIn');
assert.match(html, /placeholder=["']linkedin\.com\/in\/you["']/, 'profile placeholder should show a LinkedIn profile format');
assert.match(html, /name=["']intent["'][^>]+value=["']collab["']/, 'guestbook should offer a collaboration intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']hiring["']/, 'guestbook should offer a hiring intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']open-to-work["']/, 'guestbook should offer an open-to-work intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']business["']/, 'guestbook should offer a business intent badge');
assert.match(html, /name=["']intent["'][^>]+value=["']special-request["']/, 'guestbook should offer a special-request intent badge');
assert.doesNotMatch(html, /<details class=["']optional-message["']>/, 'ask-me-about message should stay visible instead of collapsing behind a toggle');
assert.match(html, /class=["']field message-field["'][\s\S]*id=["']visitorMessage["']/, 'ask-me-about message field should be visible in the form flow');
assert.match(html, /id=["']visitorMessage["'][\s\S]*maxlength=["']500["']/, 'visitor message should be capped to the DB limit');
assert.match(css, /\.message-field label[\s\S]*flex-wrap:\s*wrap/, 'message field optional label should wrap instead of visually sticking to the question');
assert.doesNotMatch(html, /name=["']message["'][\s\S]*required/, 'visitor message should be optional to keep submit fast');
assert.match(html, /Sign guestbook and unlock free drink/, 'form CTA should clearly connect signing with the free drink unlock');
assert.match(html, /id=["']successScreen["']/, 'visit page should include a post-submit success screen');
assert.match(html, /id=["']submittedSummary["']/, 'success screen should show what the visitor submitted');
assert.match(html, /id=["']entryList["']/, 'visit page should show existing guestbook entries below the form');
assert.match(html, /id=["']entrySearch["'][^>]+placeholder=["']Find people by interests["']/, 'guestbook wall should include an interest search field');
assert.match(css, /\.entry-search\b[\s\S]*inline-size:\s*100%/, 'guestbook search parent should span the full card width');
assert.match(css, /\.entry-search\b[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/, 'guestbook search should override label grid sizing so the input can stretch');
assert.match(css, /\.entry-search\b[\s\S]*justify-content:\s*stretch/, 'guestbook search should override the global label space-between layout');
assert.match(css, /\.entry-search input\b[\s\S]*inline-size:\s*100%/, 'guestbook search input should span its parent width');
assert.match(html, /id=["']entryLazyControls["'][^>]+aria-live=["']polite["']/, 'guestbook wall should expose lazy-loading controls outside the note list');
assert.doesNotMatch(html, /id=["']deletionIssueLink["']|GitHub issue/i, 'deletion copy should not send visitors to GitHub issues');
assert.doesNotMatch(html, /<form[\s\S]*privacy-notice[\s\S]*<\/form>/i, 'privacy notice should not make the mobile note form taller');
assert.match(html, /class=["']visit-disclosure[^"']*["'][\s\S]*Guestbook notes are public/i, 'bottom disclosure should explain public guestbook notes');
assert.match(html, /class=["']visit-disclosure[^"']*["'][\s\S]*contact the Cafe @ICML admin/i, 'bottom disclosure should route deletion requests to an admin');
assert.equal(typeof visitModule.assignSponsorsToEntries, 'function', 'entry sponsor assignment helper should be exported');
assert.ok(Array.isArray(visitModule.SPONSORS), 'visit sponsors should be exported for balanced entry badges');
assert.ok(visitModule.SPONSORS.length >= 2, 'balanced entry badges should have at least two sponsor choices');
assert.equal(visitModule.ENTRY_PAGE_SIZE, 8, 'guestbook notes should render in lazy chunks of eight');
assert.ok(visitModule.VISIT_ENTRY_LIMIT >= 96, 'visit page should fetch enough latest notes for a busy guestbook');
assert.deepEqual(
  visitModule.assignSponsorsToEntries(0, visitModule.SPONSORS, seededRng(1)),
  [],
  'zero entries should not receive sponsor assignments'
);
assert.deepEqual(
  visitModule.assignSponsorsToEntries(3, [], seededRng(1)),
  [null, null, null],
  'empty sponsor lists should produce nullable assignments instead of failing'
);
assert.deepEqual(
  sponsorNames(visitModule.assignSponsorsToEntries(3, [visitModule.SPONSORS[0]], seededRng(1))),
  [visitModule.SPONSORS[0].name, visitModule.SPONSORS[0].name, visitModule.SPONSORS[0].name],
  'a single sponsor should be used for every entry'
);
const shortAssignments = visitModule.assignSponsorsToEntries(2, visitModule.SPONSORS, seededRng(7));
assert.equal(shortAssignments.length, 2, 'short guestbook batches should assign one badge per entry');
assertBalanced(shortAssignments, visitModule.SPONSORS);
const tenAssignments = visitModule.assignSponsorsToEntries(10, visitModule.SPONSORS, seededRng(123));
assert.equal(tenAssignments.length, 10, 'entry assignment length should match the rendered batch length');
assertBalanced(tenAssignments, visitModule.SPONSORS);
const longAssignments = visitModule.assignSponsorsToEntries(101, visitModule.SPONSORS, seededRng(7));
assertBalanced(longAssignments, visitModule.SPONSORS);
assert.ok(sponsorCounts(longAssignments, visitModule.SPONSORS).every(count => count === 25 || count === 26), 'long batches should differ by at most one sponsor appearance');
assert.notDeepEqual(
  sponsorNames(visitModule.assignSponsorsToEntries(10, visitModule.SPONSORS, seededRng(1))),
  sponsorNames(visitModule.assignSponsorsToEntries(10, visitModule.SPONSORS, seededRng(2))),
  'different random seeds should produce different sponsor orderings'
);
assert.match(js, /assignSponsorsToEntries\(entries\.length,\s*SPONSORS\)/, 'renderEntries should assign sponsors once per visible batch');
assert.match(js, /activeEntrySearch/, 'visit JS should keep an active guestbook search state');
assert.match(js, /function getEntrySearchText/, 'visit JS should search guestbook cards by rendered people and interest text');
assert.match(js, /function sortEntriesByNewest/, 'visit JS should keep latest registrations as the default order');
assert.match(js, /sortEntriesByNewest\(entries\)\.slice\(0,\s*VISIT_ENTRY_LIMIT\)/, 'refreshEntries should sort fetched notes newest-first before rendering');
assert.match(js, /visibleEntryCount/, 'visit JS should render guestbook cards lazily by visible count');
assert.match(js, /data-load-more-entries/, 'lazy-loading controls should include a load-more action');
assert.match(js, /IntersectionObserver/, 'lazy-loading controls should auto-load as visitors approach the sentinel');
assert.doesNotMatch(js, /class=["']entry-avatar["']/, 'guestbook cards should not render the old standalone avatar element');
assert.doesNotMatch(css, /\.entry-avatar\b|--entry-avatar-size/, 'visit CSS should remove the old standalone avatar layout');
assert.doesNotMatch(js, /class=["']entry-initials["']|getEntryInitials/, 'guestbook cards should not render initials');
assert.doesNotMatch(css, /\.entry-initials\b|--entry-initials-size/, 'visit CSS should remove the initials badge layout');
assert.doesNotMatch(designSystem, /name, initials, and intent/i, 'design system should not describe initials in guestbook note cards');
assert.doesNotMatch(js, /class=["']entry-sponsor-badge["']|By\s+\$\{escapeHtml\(sponsor\.name\)\}/, 'entry sponsor attribution should not read as a By badge');
assert.match(js, /class=["']entry-supported-by["'][\s\S]*Supported by\s+\$\{escapeHtml\(sponsor\.name\)\}/, 'entry cards should render top-right Supported by attribution');
assert.match(js, /data-intent=["']\$\{escapeHtml\(getEntryIntent\(entry\)\)\}["']/, 'entry cards should expose their intent for filtering and QA');
assert.match(js, /class=["']entry-profile["'][\s\S]*LinkedIn profile/, 'entry profile links should be labeled as LinkedIn profiles');
assert.doesNotMatch(js, />Open profile<\/a>/, 'entry profile links should not use the generic Open profile label');
assert.doesNotMatch(js, /seededRng|mulberry32|Math\.random\s*=/, 'production sponsor assignment should not hard-code a test RNG');
assert.match(css, /\.entry-supported-by\b/, 'visit CSS should style the per-entry sponsor attribution');
assert.match(css, /\.entry-supported-by\b[\s\S]*text-shadow:/, 'entry sponsor attribution should receive stronger visual emphasis without changing placement');
assert.match(css, /\.entry-supported-by::before[\s\S]*var\(--accent-primary\)[\s\S]*var\(--accent-secondary\)/, 'entry sponsor attribution divider should use the pink/cyan visual system');
assert.match(css, /\.entry-support\b[\s\S]*justify-self:\s*end/, 'sponsor attribution should sit at the top-right of each note card');
assert.match(css, /\.entry-person-row\b[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/, 'name and intent should share one row below sponsor attribution');
assert.match(css, /\.entry-profile\b[\s\S]*display:\s*inline-flex[\s\S]*border-bottom:/, 'entry profile links should look visibly clickable');
assert.match(css, /\.entry-profile::after[\s\S]*content:\s*["']↗["']/, 'entry profile links should show an external-link cue');
assert.match(css, /\.entry-profile:hover[\s\S]*transform:\s*translateY\(-1px\)/, 'entry profile links should have an interactive hover affordance');

assert.match(css, /min-height:\s*100svh/, 'visit page should be mobile-first and fill the viewport');
assert.match(css, /\.intent-option:has\(input:focus-visible\)/, 'intent radios should have a visible focus ring');
assert.match(css, /\[hidden\][\s\S]*display:\s*none\s*!important/, 'hidden success/form panels should not occupy guestbook grid space');
assert.match(html, /class=["']sponsor-rail sponsor-rail--bottom["']/, 'sponsor carousel should render as a bottom landing-page band');
assert.match(html, /class=["']intent-filter-bar["'][\s\S]*data-intent-filter=["']all["']/i, 'guestbook wall should offer an all-notes intent filter');
for (const intent of ['collab', 'hiring', 'open-to-work', 'business', 'special-request']) {
  assert.match(html, new RegExp(`data-intent-filter=["']${intent}["']`), `guestbook wall should offer a ${intent} filter`);
}
assert.match(js, /activeIntentFilter/, 'visit JS should keep an active intent filter state');
assert.match(js, /aria-pressed/, 'intent filter buttons should expose pressed state');
assert.match(js, /FILTER_EMPTY_MESSAGE/, 'filtered empty state should explain no notes for a selected reason');
const htmlRuleBody = getCssRuleBody('html');
const bodyRuleBody = getCssRuleBody('body');
const sponsorRailBody = getCssRuleBody('.sponsor-rail--bottom');
assert.match(htmlRuleBody, /scroll-padding-bottom:\s*calc\(var\(--sponsor-rail-height\)\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\s*\+\s*1rem\)/, 'fixed sponsor footer should reserve safe-area scroll padding for anchor targets');
assert.match(bodyRuleBody, /padding-bottom:\s*calc\(var\(--sponsor-rail-height\)\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)/, 'fixed sponsor footer should reserve safe-area document space instead of covering the form');
assert.match(sponsorRailBody, /position:\s*fixed/, 'sponsor rail should stick to the viewport bottom edge');
assert.match(sponsorRailBody, /right:\s*0[\s\S]*bottom:\s*0[\s\S]*left:\s*0/, 'sponsor rail should span the viewport bottom edge');
assert.match(sponsorRailBody, /z-index:\s*30/, 'sponsor rail should sit below modal-level UI but above page content');
assert.match(sponsorRailBody, /background:\s*linear-gradient/, 'sponsor rail should use the landing glass material instead of a flat footer fill');
assert.match(css, /\.sponsor-track[\s\S]*animation:\s*sponsor-scroll/, 'sponsor carousel should use a CSS-only infinite track animation');
assert.match(js, /<div class=["']sponsor-track["'] aria-live=["']off["']>/, 'dynamic sponsor carousel should preserve aria-live off after render');
assert.ok(visitModule.SPONSORS.every(sponsor => sponsor.logo), 'footer sponsors should render from real logo image assets');
for (const sponsor of visitModule.SPONSORS) {
  assert.ok(existsSync(new URL(`../${sponsor.logo}`, import.meta.url)), `${sponsor.name} footer logo should exist`);
}
assert.match(js, /id:\s*['"]dalpha['"][\s\S]*logo:\s*['"]assets\/logos\/dalpha-logo\.png['"]/, 'Dalpha should use the supplied footer logo image');
assert.match(js, /id:\s*['"]minds['"][\s\S]*logo:\s*['"]assets\/logos\/minds-logo\.png['"]/, 'Minds should use the supplied footer logo image');
assert.match(css, /\.sponsor-card\[data-sponsor=["']arize["']\] img[\s\S]*border-radius:/, 'Arize logo image should receive a rounded image edge');
assert.match(css, /\.sponsor-card\.has-logo\b/, 'sponsor logo cards should expose a logo-specific style hook');
assert.match(css, /sponsor-mobile-cycle[\s\S]*8s[\s\S]*100vw/, 'mobile sponsor carousel should rotate one full-viewport brand asset every two seconds');
assert.match(css, /\.sponsor-carousel:hover \.sponsor-track|\.sponsor-carousel:focus-within \.sponsor-track/, 'sponsor carousel should pause on hover or focus');
assert.doesNotMatch(css, /\.sponsor-carousel\s*\{[^}]*\b(?:display|overflow(?:-x)?)\s*:/, 'sponsor carousel should not override the StyleGallery reel scroll-owner contract');
assert.match(css, /@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none/, 'reduced motion should disable sponsor animation');
assert.match(css, /@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*scroll-behavior:\s*auto/, 'reduced motion should disable smooth scrolling');
assert.match(css, /@media\s+\(max-width:\s*640px\)\s+and\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none[\s\S]*transform:\s*none/, 'mobile sponsor animation should not override reduced-motion preferences');
assert.match(js, /prefers-reduced-motion:\s*reduce/, 'success scroll should respect reduced-motion preferences');
assert.doesNotMatch(js, /scrollIntoView\(\{\s*behavior:\s*['"]smooth['"]/, 'success scroll should not force smooth scrolling');
assert.match(js, /scrollIntoView\(\{\s*behavior:\s*\w+,\s*block:\s*['"]start['"]\s*\}\)/, 'success scroll should pass a reduced-motion-aware scroll behavior');
assert.match(js, /AbortError/, 'share cancellation should not be shown as a share failure');
assert.match(css, /@media\s+\(max-width:\s*640px\)/, 'visit CSS should include a mobile breakpoint');
assert.match(css, /\.guestbook-grid/, 'visit CSS should keep the form and entries in a clear one-page flow');
assert.match(css, /\.entry-top[\s\S]*grid-template-columns/, 'guestbook notes should use a structured note-card layout');
assert.match(css, /\.guestbook-wall\b[\s\S]*grid-template-columns:\s*repeat\(auto-fit/, 'guestbook notes should render as a responsive wall, not a narrow rail list');
assert.match(css, /\.entry-search\b/, 'guestbook search should have a dedicated style hook');
assert.match(css, /\.entry-lazy-controls\b[\s\S]*justify-items:\s*center/, 'lazy-loading controls should sit below the note grid');
assert.match(css, /\.sponsor-rail-head[\s\S]*justify-content:\s*center/, 'sponsor rail label should be horizontally centered');
assert.doesNotMatch(css, /\.rail-label\s*\{[^}]*border-radius/, 'sponsor rail label should not look like a badge');
assert.match(css, /\.rail-label::before[\s\S]*linear-gradient/, 'sponsor rail label should use a divider-style pattern instead of a dot badge');
assert.match(css, /@media\s+\(max-width:\s*640px\)[\s\S]*\.guestbook-card\s*\{[\s\S]*padding:\s*0\.72rem/, 'mobile guestbook form should be compact enough to keep the note flow in one viewport');
assert.match(css, /@media\s+\(max-width:\s*640px\)[\s\S]*\.hero-copy > p:not\(\.eyebrow\)\s*\{[\s\S]*display:\s*none/, 'mobile hero should hide long supporting copy so the guestbook card appears before scrolling');
assert.match(css, /@media\s+\(max-width:\s*640px\)[\s\S]*textarea\s*\{[\s\S]*min-height:\s*5\.25rem/, 'mobile note textarea should not force the CTA below the first viewport');
assert.match(css, /\.form-cta-row \.primary-button[\s\S]*white-space:\s*nowrap/, 'submit CTA text should stay on one line');
assert.doesNotMatch(css, /\bmasonry\b/, 'guestbook wall should avoid masonry behavior that can disrupt keyboard order');
assert.match(css, /\.submitted-row strong[\s\S]*overflow-wrap:\s*anywhere/, 'submitted summary values should wrap long profile URLs');
assert.match(css, /@media\s+\(max-width:\s*640px\)[\s\S]*\.submitted-row\s*\{[\s\S]*display:\s*grid/, 'mobile submitted summary rows should stack long label/value content');
assert.doesNotMatch(css, /orb|blob|bokeh/i, 'visit CSS should avoid generic decorative effects');

assert.equal(typeof visitModule.getEntryProfileUrl, 'function', 'fetched guestbook profile URLs should use an exported sanitizer');
for (const [value, expected] of [
  ['https://example.com/researcher', 'https://example.com/researcher'],
  ['http://example.com/researcher', 'http://example.com/researcher'],
  ['example.com/researcher', 'https://example.com/researcher'],
  ['example.com:3000/researcher', 'https://example.com:3000/researcher'],
  ['javascript:alert(1)', ''],
  ['data:text/html,<script>alert(1)</script>', ''],
  ['mailto:hello@example.com', ''],
  ['" onmouseover="alert(1)', '']
]) {
  assert.equal(visitModule.getEntryProfileUrl({ profile_url: value }), expected, `profile_url ${value} should normalize safely`);
}
assert.equal(visitModule.getEntryProfileUrl({ profileUrl: 'example.org/profile' }), 'https://example.org/profile', 'legacy profileUrl values should normalize safely');
assert.equal(visitModule.getEntryProfileUrl({ profile_url: 'javascript:alert(1)', profileUrl: 'example.org/fallback' }), '', 'unsafe primary profile_url should not fall back to another field');
assert.equal(visitModule.normalizeProfileUrl('example.com:3000/researcher'), 'https://example.com:3000/researcher', 'profile URLs with ports should be accepted as URL-like values');
assert.equal(visitModule.normalizeProfileUrl('javascript:alert(1)'), null, 'unsafe explicit schemes should be rejected for submitted profiles');

console.log('visit-page tests passed');
