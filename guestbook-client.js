import { GUESTBOOK_CONFIG } from './guestbook-config.js';

export const DEFAULT_INTENT = 'collab';

export const INTENTS = {
  collab: {
    label: 'Collab',
    placeholder:
      'Working on agents, evals, multimodal/VLA, RL, diffusion, or theory? Tell people what you want to explore together.',
  },
  hiring: {
    label: 'Hiring',
    placeholder:
      'Hiring for agents, evals, post-training, multimodal, systems, or research infra? Say who should find you.',
  },
  'open-to-work': {
    label: 'Open to work',
    placeholder:
      'Exploring roles around ML research, agents, evals, multimodal, infra, or product deployment.',
  },
  business: {
    label: 'Business opportunities',
    placeholder:
      'Looking for pilots, eval/observability problems, agent workflows, or deployment partners?',
  },
  'special-request': {
    label: 'Special request',
    placeholder:
      'Dietary needs, meetup ideas, Seoul logistics, or something the Cafe team should know.',
  },
};

export const INTENT_ORDER = [
  'collab',
  'hiring',
  'open-to-work',
  'business',
  'special-request',
];

export const LANDING_ENTRY_LIMIT = 3;
export const VISIT_ENTRY_LIMIT = 24;
export const EMPTY_MESSAGE = 'No notes yet — sign the guestbook.';
export const ERROR_MESSAGE = 'Guestbook unavailable right now.';
export const REQUEST_TIMEOUT_MS = 8000;

export function getIntentConfig(intent) {
  return INTENTS[intent] ?? INTENTS[DEFAULT_INTENT];
}

export function normalizeProfileUrl(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    return '';
  }
  return `https://${trimmed}`;
}

function getFormValue(formValues, key) {
  if (formValues && typeof formValues.get === 'function') {
    return formValues.get(key);
  }
  return formValues?.[key];
}

export function createGuestbookEntry(formValues) {
  const intentValue = String(getFormValue(formValues, 'intent') ?? DEFAULT_INTENT).trim();
  const intent = INTENTS[intentValue] ? intentValue : DEFAULT_INTENT;
  const message = String(getFormValue(formValues, 'message') ?? '').trim();
  const profileUrl = normalizeProfileUrl(getFormValue(formValues, 'profile_url') ?? getFormValue(formValues, 'profileUrl'));

  return {
    name: String(getFormValue(formValues, 'name') ?? '').trim(),
    profile_url: profileUrl || null,
    intent,
    message: message || getIntentConfig(intent).label,
  };
}

export function buildShareUrl(currentUrl) {
  const url = new URL(String(currentUrl));
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function buildSupabaseHeaders({ prefer } = {}) {
  const headers = {
    apikey: GUESTBOOK_CONFIG.supabaseKey,
  };

  if (GUESTBOOK_CONFIG.supabaseKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${GUESTBOOK_CONFIG.supabaseKey}`;
  }

  if (prefer) {
    headers['Content-Type'] = 'application/json';
    headers.Prefer = prefer;
  }

  return headers;
}

function buildGuestbookTableUrl() {
  const tablePath = encodeURIComponent(GUESTBOOK_CONFIG.tableName);
  return new URL(`/rest/v1/${tablePath}`, GUESTBOOK_CONFIG.supabaseUrl).toString();
}

export function buildGuestbookUrl({ limit } = {}) {
  const url = new URL(buildGuestbookTableUrl());
  url.searchParams.set('select', 'id,created_at,name,profile_url,intent,message');
  url.searchParams.set('order', 'created_at.desc');
  if (limit != null) {
    url.searchParams.set('limit', String(limit));
  }
  return url.toString();
}
function shouldUseRequestTimeout(fetcher) {
  return (
    typeof globalThis.AbortController === 'function'
    && typeof globalThis.fetch === 'function'
    && fetcher === globalThis.fetch
  );
}

async function fetchWithRequestTimeout(fetcher, url, options) {
  if (!shouldUseRequestTimeout(fetcher)) {
    return fetcher(url, options);
  }

  const controller = new globalThis.AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetcher(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (timedOut) {
      throw new Error('Guestbook request timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchGuestbookEntries(limit, fetcher = globalThis.fetch) {
  if (typeof fetcher !== 'function') {
    throw new TypeError('fetchGuestbookEntries requires a fetch implementation.');
  }

  const response = await fetchWithRequestTimeout(fetcher, buildGuestbookUrl({ limit }), {
    method: 'GET',
    headers: buildSupabaseHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Guestbook fetch failed with status ${response.status}.`);
  }

  return response.json();
}

export async function insertGuestbookEntry(payload, fetcher = globalThis.fetch) {
  if (typeof fetcher !== 'function') {
    throw new TypeError('insertGuestbookEntry requires a fetch implementation.');
  }

  const response = await fetchWithRequestTimeout(fetcher, buildGuestbookTableUrl(), {
    method: 'POST',
    headers: buildSupabaseHeaders({ prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Guestbook insert failed with status ${response.status}.`);
  }

  return response.json();
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
