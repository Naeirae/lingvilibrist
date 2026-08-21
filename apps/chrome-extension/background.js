const GOOGLE_DOC_RE = /^https:\/\/docs\.google\.com\/document\/d\/([\w-]+)/i;

chrome.runtime.onMessage.addListener((message, _sender, reply) => {
  if (message?.type !== 'READ_ACTIVE_SOURCE') return false;
  readActiveSource().then(reply).catch((error) => reply({ ok: false, error: String(error?.message || error) }));
  return true;
});

async function readActiveSource() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { ok: false, error: 'No active tab.' };
  const match = String(tab.url || '').match(GOOGLE_DOC_RE);
  if (!match) return { ok: false, error: 'Open a Google Docs document or paste text manually.' };

  const visible = await readVisibleGoogleDoc(tab.id).catch(() => ({ text: '', title: '' }));
  if (visible.text.length >= 20) {
    return {
      ok: true,
      text: visible.text,
      source: {
        kind: 'google_docs',
        reliability: 'visible',
        documentId: match[1],
        url: `https://docs.google.com/document/d/${match[1]}/edit`,
        title: visible.title || '',
        readMode: 'visible_dom'
      }
    };
  }

  const exported = await readFlatExport(match[1]);
  if (exported.text.length >= 20) {
    return {
      ok: true,
      text: exported.text,
      source: {
        kind: 'google_docs',
        reliability: 'degraded',
        documentId: match[1],
        url: `https://docs.google.com/document/d/${match[1]}/edit`,
        title: visible.title || cleanDocTitle(tab.title || ''),
        readMode: 'flat_export',
        warning: 'Flat export may not preserve comments, suggestions, or document structure.'
      }
    };
  }

  return {
    ok: false,
    error: `Google Docs could not be read safely. Visible adapter: ${visible.text.length} chars; export: ${exported.text.length} chars${exported.error ? ` (${exported.error})` : ''}. Use manual paste for this document.`,
    source: {
      kind: 'google_docs',
      reliability: 'degraded',
      documentId: match[1],
      url: `https://docs.google.com/document/d/${match[1]}/edit`
    }
  };
}

async function readVisibleGoogleDoc(tabId) {
  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const clean = (value) => String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      const candidates = [
        ...document.querySelectorAll('.kix-appview-editor [role="textbox"], .kix-page-content-wrapper, .kix-appview-editor')
      ];
      const texts = candidates.map((node) => clean(node.innerText || node.textContent || '')).filter((text) => text.length > 20);
      texts.sort((a, b) => b.length - a.length);
      return {
        text: texts[0] || '',
        title: clean(document.title).replace(/\s*[-–—]\s*Google (?:Docs|Документы).*$/i, '')
      };
    }
  });
  return { text: String(result?.text || '').trim(), title: String(result?.title || '').trim() };
}

async function readFlatExport(documentId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), 6000);
  try {
    const response = await fetch(`https://docs.google.com/document/d/${encodeURIComponent(documentId)}/export?format=txt`, {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) return { text: '', error: `HTTP ${response.status}` };
    return { text: normalizeText(await response.text()), error: '' };
  } catch (error) {
    return { text: '', error: error?.name === 'AbortError' ? 'timeout' : String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeText(value) {
  return String(value || '').replace(/\r/g, '').replace(/\u200b|\ufeff/g, '').replace(/\n{4,}/g, '\n\n\n').trim();
}

function cleanDocTitle(value) {
  return String(value || '').replace(/\s*[-–—]\s*Google (?:Docs|Документы).*$/i, '').trim();
}
