const ADDRESS = '서울 강남구 영동대로106길 5 아이파크타워2';
const STORAGE_KEY = 'cafe-icml-guestbook';
const ISSUE_URL = 'https://github.com/team-attention/cafeicml/issues/new';

const seedEntries = [
  { name: 'Team Attention', affiliation: 'host', note: 'Welcome to cafe @icml. Show your ICML badge and the drinks are $0.' },
  { name: 'A visiting researcher', affiliation: 'ICML attendee', note: 'Looking for people to run with, talk evals, and find the best Korean food nearby.' }
];

function getEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return parsed.length ? parsed : seedEntries;
  } catch (_) {
    return seedEntries;
  }
}

function setEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 12)));
}

function renderEntries() {
  const container = document.querySelector('#guestbookEntries');
  if (!container) return;
  container.innerHTML = getEntries().map(entry => `
    <div class="entry">
      <strong>${escapeHtml(entry.name)}</strong>
      ${entry.affiliation ? `<span> · ${escapeHtml(entry.affiliation)}</span>` : ''}
      <div>${escapeHtml(entry.note)}</div>
    </div>
  `).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

document.querySelector('#copyAddress')?.addEventListener('click', async event => {
  try {
    await navigator.clipboard.writeText(ADDRESS);
    event.currentTarget.textContent = 'Copied!';
    setTimeout(() => { event.currentTarget.textContent = 'Copy address'; }, 1400);
  } catch (_) {
    event.currentTarget.textContent = ADDRESS;
  }
});

document.querySelector('#guestbookForm')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const entry = {
    name: form.get('name')?.toString().trim(),
    affiliation: form.get('affiliation')?.toString().trim(),
    note: form.get('note')?.toString().trim()
  };
  if (!entry.name || !entry.note) return;
  setEntries([entry, ...getEntries()]);
  event.currentTarget.reset();
  renderEntries();
  const params = new URLSearchParams({
    title: `Guestbook: ${entry.name}`,
    body: [`Name: ${entry.name}`, `Affiliation: ${entry.affiliation || '-'}`, '', entry.note].join('\n')
  });
  window.open(`${ISSUE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');
});

renderEntries();
