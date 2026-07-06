import {
  DEFAULT_INTENT,
  INTENTS,
  INTENT_ORDER,
  LANDING_ENTRY_LIMIT,
  VISIT_ENTRY_LIMIT,
  EMPTY_MESSAGE,
  ERROR_MESSAGE,
  buildShareUrl,
  createGuestbookEntry as createSharedGuestbookEntry,
  escapeHtml,
  fetchGuestbookEntries,
  getIntentConfig,
  insertGuestbookEntry,
  normalizeProfileUrl as normalizeSharedProfileUrl
} from './guestbook-client.js';

export {
  DEFAULT_INTENT,
  INTENTS,
  INTENT_ORDER,
  LANDING_ENTRY_LIMIT,
  VISIT_ENTRY_LIMIT,
  EMPTY_MESSAGE,
  ERROR_MESSAGE,
  buildShareUrl,
  escapeHtml,
  getIntentConfig
};

export function normalizeProfileUrl(value) {
  return normalizeSharedProfileUrl(value) || null;
}

export function createGuestbookEntry(formValues) {
  if (formValues && typeof formValues.get === 'function') {
    return createSharedGuestbookEntry({
      name: formValues.get('name'),
      profile_url: formValues.get('profile_url') ?? formValues.get('profileUrl') ?? formValues.get('profile'),
      intent: formValues.get('intent'),
      message: formValues.get('message')
    });
  }

  return createSharedGuestbookEntry({
    ...formValues,
    profile_url: formValues?.profile_url ?? formValues?.profileUrl ?? formValues?.profile
  });
}

const SUCCESS_TITLE = 'Free Drink unlocked';
const DEFAULT_MESSAGE_PLACEHOLDER = 'I am working on agent evaluations and would love to meet collaborators.';
const SUBMIT_TEXT = 'Sign guestbook and unlock free drink';
const SUBMITTING_TEXT = 'Submitting...';
const ALL_INTENTS_FILTER = 'all';
const FILTER_EMPTY_MESSAGE = 'No notes for this reason yet.';
const SEARCH_EMPTY_MESSAGE = 'No notes match this search yet.';
export const ENTRY_PAGE_SIZE = 8;

let currentEntries = [];
let activeIntentFilter = ALL_INTENTS_FILTER;
let activeEntrySearch = '';
let visibleEntryCount = ENTRY_PAGE_SIZE;
let entryLazyObserver = null;

export const SPONSORS = [
  {
    id: 'arize',
    name: 'Arize',
    logo: 'assets/logos/arize-logo.png'
  },
  {
    id: 'ironclaw',
    name: 'IronClaw',
    logo: 'assets/logos/ironclaw-official-text-logo.png'
  },
  {
    id: 'minds',
    name: 'Minds',
    logo: 'assets/logos/minds-logo.png'
  },
  {
    id: 'dalpha',
    name: 'Dalpha',
    logo: 'assets/logos/dalpha-logo.png'
  }
];

function shuffleInPlace(items, rng) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function assignSponsorsToEntries(entryCount, sponsors = SPONSORS, rng = Math.random) {
  const count = Math.max(0, Math.trunc(Number(entryCount) || 0));
  if (count === 0) return [];

  const eligibleSponsors = Array.isArray(sponsors)
    ? sponsors.filter(sponsor => sponsor && sponsor.name)
    : [];
  if (!eligibleSponsors.length) return Array.from({ length: count }, () => null);
  if (eligibleSponsors.length === 1) return Array.from({ length: count }, () => eligibleSponsors[0]);

  const sponsorOrder = shuffleInPlace([...eligibleSponsors], rng);
  const assignments = [];

  while (assignments.length < count) {
    for (const sponsor of sponsorOrder) {
      if (assignments.length === count) break;
      assignments.push(sponsor);
    }
  }

  return shuffleInPlace(assignments, rng);
}

function getIntentPlaceholder(intent) {
  const config = getIntentConfig(intent);
  return config.placeholder || config.messagePlaceholder || DEFAULT_MESSAGE_PLACEHOLDER;
}

export function getEntryProfileUrl(entry) {
  const hasPrimaryProfile = Object.prototype.hasOwnProperty.call(entry ?? {}, 'profile_url');
  const profileUrl = hasPrimaryProfile ? entry.profile_url : entry?.profileUrl;
  return normalizeSharedProfileUrl(profileUrl);
}

function getEntryIntent(entry) {
  return entry.intent || DEFAULT_INTENT;
}

function normalizeSearchQuery(value) {
  return String(value || '').trim().toLowerCase();
}

function getEntrySearchText(entry) {
  const intentConfig = getIntentConfig(getEntryIntent(entry));
  return [
    entry.name,
    intentConfig.label,
    getEntryMessage(entry),
    entry.profile_url,
    entry.profileUrl
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function sortEntriesByNewest(entries) {
  return [...entries].sort((firstEntry, secondEntry) => {
    const firstTime = new Date(firstEntry.created_at || firstEntry.createdAt || 0).getTime() || 0;
    const secondTime = new Date(secondEntry.created_at || secondEntry.createdAt || 0).getTime() || 0;
    return secondTime - firstTime;
  });
}

function isIntentFilter(value) {
  return value === ALL_INTENTS_FILTER || Object.prototype.hasOwnProperty.call(INTENTS, value);
}

function getVisibleEntries() {
  return currentEntries.filter(entry => {
    const matchesIntent = activeIntentFilter === ALL_INTENTS_FILTER || getEntryIntent(entry) === activeIntentFilter;
    const matchesSearch = !activeEntrySearch || getEntrySearchText(entry).includes(activeEntrySearch);
    return matchesIntent && matchesSearch;
  });
}

function getEntryMessage(entry) {
  const message = String(entry.message || '').trim();
  return message || getIntentConfig(getEntryIntent(entry)).label;
}

function getEntryTimeLabel(entry) {
  const rawDate = entry.created_at || entry.createdAt;
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function setSubmitStatus(message = '', tone = 'neutral') {
  const status = document.querySelector('#submitStatus');
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function setSubmitPending(isPending) {
  const button = document.querySelector('#submitButton');
  if (!button) return;
  button.disabled = isPending;
  button.textContent = isPending ? SUBMITTING_TEXT : SUBMIT_TEXT;
}

function setDefaultIntent(form) {
  const defaultIntent = form?.querySelector(`input[name="intent"][value="${DEFAULT_INTENT}"]`);
  if (defaultIntent) defaultIntent.checked = true;
}

function updateMessagePlaceholder(intent) {
  const textarea = document.querySelector('#visitorMessage');
  if (!textarea) return;
  textarea.placeholder = getIntentPlaceholder(intent);
}

function renderSponsorCard(sponsor) {
  const content = sponsor.logo
    ? `<img src="${escapeHtml(sponsor.logo)}" alt="${escapeHtml(sponsor.name)} logo">`
    : `<span>${escapeHtml(sponsor.name)}</span>`;
  const logoClass = sponsor.logo ? ' has-logo' : ' text-card';

  return `
    <div class="sponsor-card${logoClass}" data-sponsor="${escapeHtml(sponsor.id)}" aria-label="${escapeHtml(sponsor.name)} sponsor">
      ${content}
    </div>
  `;
}

function renderSponsorCarousel() {
  const container = document.querySelector('#sponsorCarousel');
  if (!container) return;

  const cards = SPONSORS.map(sponsor => renderSponsorCard(sponsor)).join('');
  const duplicateCards = SPONSORS.map(sponsor => renderSponsorCard(sponsor)).join('');
  container.innerHTML = `
    <div class="sponsor-track" aria-live="off">
      <div class="sponsor-set">${cards}</div>
      <div class="sponsor-set" aria-hidden="true">${duplicateCards}</div>
    </div>
  `;
}

function disconnectEntryLazyObserver() {
  entryLazyObserver?.disconnect();
  entryLazyObserver = null;
}

function loadMoreEntries() {
  visibleEntryCount += ENTRY_PAGE_SIZE;
  renderCurrentEntries();
}

function observeEntryLazySentinel() {
  disconnectEntryLazyObserver();
  const sentinel = document.querySelector('#entryLazySentinel');
  if (!sentinel || typeof IntersectionObserver !== 'function') return;

  entryLazyObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      loadMoreEntries();
    }
  }, { rootMargin: '240px 0px' });
  entryLazyObserver.observe(sentinel);
}

function renderEntryLazyControls(renderedCount, totalCount) {
  const controls = document.querySelector('#entryLazyControls');
  if (!controls) return;

  disconnectEntryLazyObserver();

  if (!totalCount) {
    controls.innerHTML = '';
    return;
  }

  if (renderedCount >= totalCount) {
    controls.innerHTML = `<p class="entry-load-status">Showing all ${totalCount} latest notes.</p>`;
    return;
  }

  controls.innerHTML = `
    <button class="entry-load-more" type="button" data-load-more-entries>
      Load more latest notes
    </button>
    <p class="entry-load-status">Showing ${renderedCount} of ${totalCount} latest notes.</p>
    <span class="entry-lazy-sentinel" id="entryLazySentinel" aria-hidden="true"></span>
  `;
  observeEntryLazySentinel();
}

function renderEntries(entries, state = 'ready', totalEntryCount = entries.length) {
  const container = document.querySelector('#entryList');
  if (!container) return;

  if (state === 'error') {
    container.innerHTML = `<p class="entry-state" role="status">${escapeHtml(ERROR_MESSAGE)}</p>`;
    renderEntryLazyControls(0, 0);
    return;
  }

  if (!entries.length) {
    const message = state === 'search-empty'
      ? SEARCH_EMPTY_MESSAGE
      : state === 'filtered-empty' ? FILTER_EMPTY_MESSAGE : EMPTY_MESSAGE;
    container.innerHTML = `<p class="entry-state" role="status">${escapeHtml(message)}</p>`;
    renderEntryLazyControls(0, 0);
    return;
  }

  const sponsorAssignments = assignSponsorsToEntries(entries.length, SPONSORS);

  container.innerHTML = entries.map((entry, index) => {
    const entryIntent = getEntryIntent(entry);
    const intentConfig = getIntentConfig(entryIntent);
    const profileUrl = getEntryProfileUrl(entry);
    const visitorName = entry.name || 'Cafe visitor';
    const timeLabel = getEntryTimeLabel(entry);
    const sponsor = sponsorAssignments[index];

    return `
      <article class="entry" role="listitem" data-intent="${escapeHtml(getEntryIntent(entry))}" aria-label="${escapeHtml(visitorName)} guestbook note">
        <div class="entry-top">
          ${sponsor ? `
            <div class="entry-support">
              <span class="entry-supported-by" aria-label="Supported by ${escapeHtml(sponsor.name)}">Supported by ${escapeHtml(sponsor.name)}</span>
            </div>
          ` : ''}
          <div class="entry-person-row">
            <span class="entry-name">${escapeHtml(visitorName)}</span>
            <span class="entry-intent">${escapeHtml(intentConfig.label)}</span>
          </div>
        </div>
        <p class="entry-message">${escapeHtml(getEntryMessage(entry))}</p>
        ${profileUrl || timeLabel ? `
          <div class="entry-meta">
            ${profileUrl ? `<a class="entry-profile" href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer nofollow ugc">LinkedIn profile</a>` : ''}
            ${timeLabel ? `<span class="entry-time">${escapeHtml(timeLabel)}</span>` : ''}
          </div>
        ` : ''}
      </article>
    `;
  }).join('');
  renderEntryLazyControls(entries.length, totalEntryCount);
}

function renderCurrentEntries() {
  const visibleEntries = getVisibleEntries();
  const hasActiveFilter = activeIntentFilter !== ALL_INTENTS_FILTER;
  const hasActiveSearch = Boolean(activeEntrySearch);
  const state = currentEntries.length > 0 && visibleEntries.length === 0
    ? hasActiveSearch ? 'search-empty' : hasActiveFilter ? 'filtered-empty' : 'ready'
    : 'ready';
  renderEntries(visibleEntries.slice(0, visibleEntryCount), state, visibleEntries.length);
}

async function refreshEntries() {
  try {
    const entries = await fetchGuestbookEntries(VISIT_ENTRY_LIMIT);
    currentEntries = sortEntriesByNewest(entries).slice(0, VISIT_ENTRY_LIMIT);
    visibleEntryCount = ENTRY_PAGE_SIZE;
    renderCurrentEntries();
  } catch (_) {
    currentEntries = [];
    renderEntries([], 'error');
  }
}

function renderSubmittedSummary(entry) {
  const container = document.querySelector('#submittedSummary');
  if (!container) return;

  const intentConfig = getIntentConfig(entry.intent);
  container.innerHTML = `
    <div class="submitted-row"><span>Name</span><strong>${escapeHtml(entry.name)}</strong></div>
    <div class="submitted-row"><span>Reason</span><strong>${escapeHtml(intentConfig.label)}</strong></div>
    ${entry.profile_url ? `<div class="submitted-row"><span>Link</span><strong>${escapeHtml(entry.profile_url)}</strong></div>` : ''}
    ${entry.message ? `<p>${escapeHtml(entry.message)}</p>` : ''}
  `;
}

function getReducedMotionAwareScrollBehavior() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function showSuccess(entry) {
  renderSubmittedSummary(entry);
  document.querySelector('#formScreen')?.setAttribute('hidden', '');
  document.querySelector('#successScreen')?.removeAttribute('hidden');
  const scrollBehavior = getReducedMotionAwareScrollBehavior();
  document.querySelector('#successScreen')?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
}

function showForm() {
  document.querySelector('#successScreen')?.setAttribute('hidden', '');
  document.querySelector('#formScreen')?.removeAttribute('hidden');
  document.querySelector('#visitorName')?.focus();
}

function bindIntentPlaceholders(form) {
  updateMessagePlaceholder(form?.querySelector('input[name="intent"]:checked')?.value || DEFAULT_INTENT);
  form?.querySelectorAll('input[name="intent"]').forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked) updateMessagePlaceholder(input.value);
    });
  });
}

function setActiveFilterButtonState(filterBar) {
  filterBar.querySelectorAll('[data-intent-filter]').forEach(button => {
    const isActive = button.dataset.intentFilter === activeIntentFilter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function bindEntryFilters() {
  const filterBar = document.querySelector('#entryFilters');
  if (!filterBar) return;

  setActiveFilterButtonState(filterBar);
  filterBar.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('[data-intent-filter]');
    if (!button) return;

    const nextFilter = button.dataset.intentFilter || ALL_INTENTS_FILTER;
    if (!isIntentFilter(nextFilter) || nextFilter === activeIntentFilter) return;

    activeIntentFilter = nextFilter;
    visibleEntryCount = ENTRY_PAGE_SIZE;
    setActiveFilterButtonState(filterBar);
    renderCurrentEntries();
  });
}

function bindEntrySearch() {
  const searchInput = document.querySelector('#entrySearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', event => {
    activeEntrySearch = normalizeSearchQuery(event.currentTarget?.value);
    visibleEntryCount = ENTRY_PAGE_SIZE;
    renderCurrentEntries();
  });
}

function bindEntryLazyControls() {
  const controls = document.querySelector('#entryLazyControls');
  if (!controls) return;

  controls.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('[data-load-more-entries]');
    if (!button) return;
    loadMoreEntries();
  });
}

function bindForm() {
  const form = document.querySelector('#guestbookForm');
  if (!form) return;

  bindIntentPlaceholders(form);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setSubmitStatus();
    setSubmitPending(true);

    const formData = new FormData(form);
    const entry = createGuestbookEntry({
      name: formData.get('name'),
      profile: formData.get('profile'),
      intent: formData.get('intent'),
      message: formData.get('message')
    });

    try {
      await insertGuestbookEntry(entry);
      form.reset();
      setDefaultIntent(form);
      updateMessagePlaceholder(DEFAULT_INTENT);
      setSubmitStatus(`${SUCCESS_TITLE}. Your note is public on the guestbook.`, 'success');
      showSuccess(entry);
      await refreshEntries();
    } catch (_) {
      setSubmitStatus(ERROR_MESSAGE, 'error');
    } finally {
      setSubmitPending(false);
    }
  });
}

function bindSuccessActions() {
  const shareUrl = buildShareUrl(window.location.href);
  const shareButton = document.querySelector('#shareButton');
  const copyButton = document.querySelector('#copyButton');
  const backButton = document.querySelector('#backButton');

  shareButton?.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Cafe @ICML free drink guestbook',
          text: 'Sign the Cafe @ICML guestbook and unlock a free drink.',
          url: shareUrl
        });
        return;
      }
      if (!navigator.clipboard?.writeText) {
        shareButton.textContent = 'Share unavailable';
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      shareButton.textContent = 'Link copied';
    } catch (error) {
      if (error?.name === 'AbortError') return;
      shareButton.textContent = 'Share unavailable';
    }
  });

  copyButton?.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        copyButton.textContent = 'Copy unavailable';
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      copyButton.textContent = 'Copied';
      setTimeout(() => {
        copyButton.textContent = 'Copy link';
      }, 1400);
    } catch (_) {
      copyButton.textContent = 'Copy unavailable';
    }
  });

  backButton?.addEventListener('click', showForm);
}

export async function initVisitPage() {
  renderSponsorCarousel();
  bindEntrySearch();
  bindEntryFilters();
  bindEntryLazyControls();
  bindForm();
  bindSuccessActions();
  await refreshEntries();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initVisitPage();
}
