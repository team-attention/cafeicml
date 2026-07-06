import { GUESTBOOK_CONFIG } from './guestbook-config.js';
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
const DELETION_ISSUE_URL = GUESTBOOK_CONFIG.deletionIssueUrl
  || GUESTBOOK_CONFIG.deletion_issue_url
  || GUESTBOOK_CONFIG.githubIssueUrl
  || GUESTBOOK_CONFIG.deleteRequestUrl
  || 'https://github.com/team-attention/cafeicml/issues/new?title=Guestbook%20deletion%20request';

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
    name: 'Minds'
  },
  {
    id: 'dalpa',
    name: 'Dalpa'
  }
];

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

function getEntryMessage(entry) {
  const message = String(entry.message || '').trim();
  return message || getIntentConfig(getEntryIntent(entry)).label;
}

export function getEntryInitials(name) {
  const normalizedName = String(name || 'Cafe visitor').trim();
  const parts = normalizedName.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CV';
  return parts
    .slice(0, 2)
    .map(part => Array.from(part)[0])
    .join('')
    .toUpperCase();
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

  return `
    <div class="sponsor-card${sponsor.logo ? '' : ' text-card'}" aria-label="${escapeHtml(sponsor.name)} sponsor">
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

function renderEntries(entries, state = 'ready') {
  const container = document.querySelector('#entryList');
  if (!container) return;

  if (state === 'error') {
    container.innerHTML = `<p class="entry-state" role="status">${escapeHtml(ERROR_MESSAGE)}</p>`;
    return;
  }

  if (!entries.length) {
    container.innerHTML = `<p class="entry-state" role="status">${escapeHtml(EMPTY_MESSAGE)}</p>`;
    return;
  }

  container.innerHTML = entries.map(entry => {
    const intentConfig = getIntentConfig(getEntryIntent(entry));
    const profileUrl = getEntryProfileUrl(entry);
    const visitorName = entry.name || 'Cafe visitor';
    const timeLabel = getEntryTimeLabel(entry);

    return `
      <article class="entry" role="listitem" aria-label="${escapeHtml(visitorName)} guestbook note">
        <div class="entry-top">
          <span class="entry-avatar" aria-hidden="true">${escapeHtml(getEntryInitials(visitorName))}</span>
          <div class="entry-identity">
            <div class="entry-head">
              <span class="entry-name">${escapeHtml(visitorName)}</span>
              <span class="entry-intent">${escapeHtml(intentConfig.label)}</span>
            </div>
            <div class="entry-meta">
              ${profileUrl ? `<a class="entry-profile" href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer nofollow ugc">Open profile</a>` : ''}
              ${timeLabel ? `<span class="entry-time">${escapeHtml(timeLabel)}</span>` : ''}
            </div>
          </div>
        </div>
        <p class="entry-message">${escapeHtml(getEntryMessage(entry))}</p>
      </article>
    `;
  }).join('');
}

async function refreshEntries() {
  try {
    const entries = await fetchGuestbookEntries(VISIT_ENTRY_LIMIT);
    renderEntries(entries.slice(0, VISIT_ENTRY_LIMIT));
  } catch (_) {
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

function configureDeletionLink() {
  const link = document.querySelector('#deletionIssueLink');
  if (!link) return;
  link.href = DELETION_ISSUE_URL;
}

function bindIntentPlaceholders(form) {
  updateMessagePlaceholder(form?.querySelector('input[name="intent"]:checked')?.value || DEFAULT_INTENT);
  form?.querySelectorAll('input[name="intent"]').forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked) updateMessagePlaceholder(input.value);
    });
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
  configureDeletionLink();
  renderSponsorCarousel();
  bindForm();
  bindSuccessActions();
  await refreshEntries();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initVisitPage();
}
