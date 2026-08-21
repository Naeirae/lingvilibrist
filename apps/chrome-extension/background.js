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

  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const clean = (value) => String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      const candidates = [
        ...document.querySelectorAll('.kix-appview-editor [role="textbox"], .kix-page-content-wrapper, .kix-appview-editor')
      ];
      const texts = candidates.map((node) => clean(node.innerText || node.textContent || '')).filter((text) => text.length > 20);
      texts.sort((a, b) => b.length - a.length);
      return { text: texts[0] || '', title: clean(document.title).replace(/\s*[-–—]\s*Google (?:Docs|Документы).*$/i, '') };
    }
  });

  const text = String(result?.text || '').trim();
  if (text.length < 20) {
    return {
      ok: false,
      error: 'Google Docs did not expose enough text to the page adapter. Use manual paste for this document.',
      source: { kind: 'google_docs', reliability: 'degraded', documentId: match[1], url: tab.url }
    };
  }
  return {
    ok: true,
    text,
    source: {
      kind: 'google_docs',
      reliability: 'visible',
      documentId: match[1],
      url: `https://docs.google.com/document/d/${match[1]}/edit`,
      title: result?.title || '',
      readMode: 'visible_dom'
    }
  };
}
