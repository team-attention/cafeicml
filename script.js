import {
  EMPTY_MESSAGE,
  ERROR_MESSAGE,
  LANDING_ENTRY_LIMIT,
  escapeHtml,
  fetchGuestbookEntries,
  getIntentConfig,
  normalizeProfileUrl
} from './guestbook-client.js';

const ADDRESS = 'I-Park Tower 2, 5 Yeongdong-daero 106-gil, Gangnam-gu, Seoul';
const VISIT_URL = './visit.html';
const EMPTY_STATE = `${escapeHtml(EMPTY_MESSAGE).replace(
  'sign the guestbook',
  `<a href="${VISIT_URL}">sign the guestbook</a>`
)}`;
const ERROR_STATE = `${escapeHtml(ERROR_MESSAGE)} <a href="${VISIT_URL}">Sign the guestbook</a>.`;

function renderState(container, message) {
  container.innerHTML = `<li class="note guestbook-state">${message}</li>`;
}

function renderEntries(container, entries) {
  if (!entries.length) {
    renderState(container, EMPTY_STATE);
    return;
  }

  container.innerHTML = entries.map((entry) => {
    const intent = getIntentConfig(entry.intent);
    const profileUrl = normalizeProfileUrl(entry.profile_url);
    const profileLink = profileUrl
      ? `<a class="note-profile" href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer nofollow ugc">Profile</a>`
      : '';
    const visitorName = entry.name || 'Cafe visitor';

    return `
      <li class="note">
        <div class="note-meta">
          <strong>${escapeHtml(visitorName)}</strong>
          <span class="note-intent">${escapeHtml(intent.label)}</span>
        </div>
        <p class="muted">${escapeHtml(entry.message)}</p>
        ${profileLink}
      </li>
    `;
  }).join('');
}

async function renderLandingGuestbook() {
  const container = document.querySelector('#landingGuestbookEntries');
  if (!container) return;

  try {
    const entries = await fetchGuestbookEntries(LANDING_ENTRY_LIMIT);
    renderEntries(container, entries);
  } catch (_) {
    renderState(container, ERROR_STATE);
  }
}

document.querySelector('#copyAddress')?.addEventListener('click', async (event) => {
  try {
    await navigator.clipboard.writeText(ADDRESS);
    event.currentTarget.textContent = 'Copied!';
    setTimeout(() => { event.currentTarget.textContent = 'Copy address'; }, 1400);
  } catch (_) {
    event.currentTarget.textContent = ADDRESS;
  }
});

renderLandingGuestbook();
