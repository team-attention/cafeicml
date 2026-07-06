const STORAGE_KEY = 'cafe-icml-visit-guestbook';
const SUCCESS_TITLE = 'Free Drink unlocked';
const DEFAULT_INTENT = 'collab';

export const SPONSORS = [
  {
    id: 'arize',
    name: 'Arize',
    badge: 'By Arize',
    logo: 'assets/logos/arize-logo.png',
    url: 'https://arize.com/?utm_source=cafeicml_visit'
  },
  {
    id: 'ironclaw',
    name: 'IronClaw',
    badge: 'By IronClaw',
    logo: 'assets/logos/ironclaw-official-text-logo.png',
    url: 'https://ironclaw.com/?utm_source=cafeicml_visit'
  },
  {
    id: 'minds',
    name: 'Minds',
    badge: 'By Minds',
    logo: '',
    url: './index.html#menu'
  },
  {
    id: 'dalpa',
    name: 'Dalpa',
    badge: 'By Dalpa',
    logo: '',
    url: './index.html#menu'
  }
];

export const SPONSOR_CTA = {
  label: 'Sponsor this menu',
  url: 'https://github.com/team-attention/cafeicml/issues/new?title=Sponsor%20Cafe%20%40ICML'
};

const INTENTS = {
  collab: {
    label: 'Collab'
  },
  hiring: {
    label: 'Hiring'
  },
  'open-to-work': {
    label: 'Open to work'
  },
  business: {
    label: 'Business opportunities'
  },
  'special-request': {
    label: 'Special request'
  }
};

const SEED_ENTRIES = [
  {
    id: 'seed-1',
    name: 'Mina Park',
    profileUrl: 'https://linkedin.com',
    intent: 'collab',
    intentLabel: 'Collab',
    message: 'I am working on evals for agentic systems and want to meet people thinking about trustworthy deployment.',
    sponsorName: 'Arize',
    sponsorBadge: 'By Arize',
    createdAt: '2026-07-01T09:00:00.000Z'
  },
  {
    id: 'seed-2',
    name: 'A visiting researcher',
    profileUrl: '',
    intent: 'hiring',
    intentLabel: 'Hiring',
    message: 'Ask me about efficient inference, Seoul food, and where to find a quiet hallway conversation.',
    sponsorName: 'IronClaw',
    sponsorBadge: 'By IronClaw',
    createdAt: '2026-07-01T09:04:00.000Z'
  },
  {
    id: 'seed-3',
    name: 'Team Attention',
    profileUrl: './index.html',
    intent: 'special-request',
    intentLabel: 'Special request',
    message: 'Show your ICML ticket. Coffee is free. Good conversations are strongly encouraged.',
    sponsorName: 'Minds',
    sponsorBadge: 'By Minds',
    createdAt: '2026-07-01T09:08:00.000Z'
  }
];

export function pickSponsor(random = Math.random) {
  const value = Number(random());
  const normalized = Number.isFinite(value) && value >= 0 && value < 1 ? value : 0;
  const index = Math.min(SPONSORS.length - 1, Math.floor(normalized * SPONSORS.length));
  return SPONSORS[index];
}

export function getIntentConfig(intent) {
  return INTENTS[intent] || INTENTS[DEFAULT_INTENT];
}

export function buildShareUrl(currentUrl) {
  const url = new URL(currentUrl);
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function normalizeProfileUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function createGuestbookEntry(formValues, sponsor) {
  const intent = String(formValues.intent || DEFAULT_INTENT);
  const intentConfig = getIntentConfig(intent);
  const message = String(formValues.message || '').trim() || intentConfig.label;

  return {
    id: `entry-${Date.now()}`,
    name: String(formValues.name || '').trim(),
    profileUrl: normalizeProfileUrl(formValues.profile),
    intent: intentConfig === INTENTS[DEFAULT_INTENT] ? DEFAULT_INTENT : intent,
    intentLabel: intentConfig.label,
    message,
    sponsorName: sponsor.name,
    sponsorBadge: sponsor.badge,
    createdAt: new Date().toISOString()
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function getStoredEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) && parsed.length ? parsed : SEED_ENTRIES;
  } catch (_) {
    return SEED_ENTRIES;
  }
}

function setStoredEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 24)));
}

function renderDrinkSponsor(sponsor) {
  const line = document.querySelector('#drinkSponsorLine');
  if (!line) return;
  line.textContent = `${sponsor.badge} is buying this free drink.`;
}

function renderSponsorCarousel(selectedSponsor) {
  const container = document.querySelector('#sponsorCarousel');
  if (!container) return;

  container.innerHTML = SPONSORS.map(sponsor => `
    <a
      class="sponsor-card${sponsor.logo ? '' : ' logo-missing'}${sponsor.id === selectedSponsor.id ? ' active' : ''}"
      href="${escapeHtml(sponsor.url)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="${escapeHtml(sponsor.name)} sponsor page"
    >
      ${sponsor.logo ? `<img src="${escapeHtml(sponsor.logo)}" alt="${escapeHtml(sponsor.name)} logo">` : ''}
      <span>${escapeHtml(sponsor.name)}</span>
    </a>
  `).join('');

  const cta = document.querySelector('#sponsorCta');
  if (cta) {
    cta.textContent = SPONSOR_CTA.label;
    cta.href = SPONSOR_CTA.url;
  }
}

function renderEntries() {
  const container = document.querySelector('#entryList');
  if (!container) return;
  const intentLabel = entry => entry.intentLabel || getIntentConfig(entry.intent).label;
  const sponsorBadge = entry => entry.sponsorBadge || `By ${entry.sponsorName || 'Cafe @ICML'}`;

  container.innerHTML = getStoredEntries().map(entry => `
    <article class="entry">
      <div class="entry-head">
        <span class="entry-name">${escapeHtml(entry.name)}</span>
        <span class="entry-source">${escapeHtml(sponsorBadge(entry))}</span>
      </div>
      <span class="entry-intent">${escapeHtml(intentLabel(entry))}</span>
      <p class="entry-message">${escapeHtml(entry.message)}</p>
      ${entry.profileUrl ? `<a class="entry-profile" href="${escapeHtml(entry.profileUrl)}" target="_blank" rel="noopener noreferrer">Profile link</a>` : ''}
    </article>
  `).join('');
}

function renderSubmittedSummary(entry) {
  const container = document.querySelector('#submittedSummary');
  if (!container) return;
  container.innerHTML = `
    <div class="submitted-row"><span>Name</span><strong>${escapeHtml(entry.name)}</strong></div>
    <div class="submitted-row"><span>Reason</span><strong>${escapeHtml(entry.intentLabel)}</strong></div>
    <div class="submitted-row"><span>Sponsor</span><strong>${escapeHtml(entry.sponsorBadge)}</strong></div>
    ${entry.profileUrl ? `<div class="submitted-row"><span>Link</span><strong>${escapeHtml(entry.profileUrl)}</strong></div>` : ''}
    ${entry.message !== entry.intentLabel ? `<p>${escapeHtml(entry.message)}</p>` : ''}
  `;
}

function showSuccess(entry) {
  renderSubmittedSummary(entry);
  document.querySelector('#formScreen')?.setAttribute('hidden', '');
  document.querySelector('#successScreen')?.removeAttribute('hidden');
  document.querySelector('#successScreen')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showForm() {
  document.querySelector('#successScreen')?.setAttribute('hidden', '');
  document.querySelector('#formScreen')?.removeAttribute('hidden');
  document.querySelector('#visitorName')?.focus();
}

function bindForm(selectedSponsor) {
  const form = document.querySelector('#guestbookForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const entry = createGuestbookEntry({
      name: formData.get('name'),
      profile: formData.get('profile'),
      intent: formData.get('intent'),
      message: formData.get('message')
    }, selectedSponsor);

    if (!entry.name) return;

    setStoredEntries([entry, ...getStoredEntries()]);
    form.reset();
    const defaultIntent = form.querySelector(`input[name="intent"][value="${DEFAULT_INTENT}"]`);
    if (defaultIntent) defaultIntent.checked = true;
    renderEntries();
    showSuccess(entry);
  });
}

function bindSuccessActions() {
  const shareUrl = buildShareUrl(window.location.href);
  const shareButton = document.querySelector('#shareButton');
  const copyButton = document.querySelector('#copyButton');
  const backButton = document.querySelector('#backButton');

  shareButton?.addEventListener('click', async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Cafe @ICML free drink guestbook',
        text: 'Sign the Cafe @ICML guestbook and unlock a free drink.',
        url: shareUrl
      });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    shareButton.textContent = 'Link copied';
  });

  copyButton?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(shareUrl);
    copyButton.textContent = 'Copied';
    setTimeout(() => {
      copyButton.textContent = 'Copy link';
    }, 1400);
  });

  backButton?.addEventListener('click', showForm);
}

export function initVisitPage() {
  const selectedSponsor = pickSponsor();
  renderDrinkSponsor(selectedSponsor);
  renderSponsorCarousel(selectedSponsor);
  renderEntries();
  bindForm(selectedSponsor);
  bindSuccessActions();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initVisitPage();
}
