import { analyzeText } from './vendor/packages/core/src/index.js';
import { generalRulesAnalyzer } from './vendor/packages/rules/src/index.js';

const $ = (id) => document.getElementById(id);
const SESSION_KEY = 'lingvilibristSessionV01';
let currentSource = { kind: 'manual', reliability: 'high', readMode: 'manual' };
let currentFindings = [];
let currentRunId = 0;
let localNlpAvailable = false;

const localNlpAnalyzer = {
  id: 'local-morphology',
  version: 'native-v1',
  async analyze(text) {
    const response = await chrome.runtime.sendMessage({ type: 'LOCAL_NLP_ANALYZE', text }).catch((error) => ({
      ok: false,
      error: 'native_message_failed',
      detail: String(error?.message || error)
    }));
    if (!response?.ok) {
      const error = new Error(response?.detail || response?.error || 'Local NLP is unavailable.');
      error.code = response?.error || 'native_unavailable';
      throw error;
    }
    localNlpAvailable = true;
    const analysis = response.analysis || {};
    return {
      findings: Array.isArray(analysis.findings) ? analysis.findings : [],
      version: response.serviceVersion || localNlpAnalyzer.version,
      degraded: false
    };
  }
};

$('version').textContent = `v${chrome.runtime.getManifest().version}`;
restoreState();
refreshLocalNlp();

$('text').addEventListener('input', () => {
  currentRunId += 1;
  $('run').disabled = false;
  currentSource = { kind: 'manual', reliability: 'high', readMode: 'manual' };
  currentFindings = [];
  renderSource();
  renderFindings();
  updateExport();
  setStatus($('text').value.trim() ? 'Текст изменён. Запустите проверку заново.' : 'Источник не выбран.');
  saveState();
});

$('readActive').addEventListener('click', async () => {
  currentRunId += 1;
  $('run').disabled = false;
  setStatus('Считываю активный документ…');
  const result = await chrome.runtime.sendMessage({ type: 'READ_ACTIVE_SOURCE' }).catch((error) => ({ ok: false, error: String(error) }));
  if (!result?.ok) return setStatus(result?.error || 'Не удалось считать документ.', 'error');
  $('text').value = result.text || '';
  currentSource = result.source || { kind: 'google_docs', reliability: 'degraded' };
  currentFindings = [];
  renderSource();
  renderFindings();
  updateExport();
  await saveState();
  setStatus(`Считано ${$('text').value.length} символов. Запустите проверку.`, 'ok');
});

$('retryLocalNlp').addEventListener('click', () => refreshLocalNlp(true));
$('run').addEventListener('click', runCheck);
$('clear').addEventListener('click', async () => {
  currentRunId += 1;
  $('run').disabled = false;
  $('text').value = '';
  currentSource = { kind: 'manual', reliability: 'high', readMode: 'manual' };
  currentFindings = [];
  renderSource();
  renderFindings();
  $('output').value = '';
  await chrome.storage.local.remove(SESSION_KEY);
  setStatus('Очищено.');
});

$('copy').addEventListener('click', async () => {
  updateExport();
  await navigator.clipboard.writeText($('output').value || '');
  setStatus('JSON скопирован.', 'ok');
});

async function refreshLocalNlp(force = false) {
  if (force) $('localNlpState').textContent = 'Локальная морфология: проверяю Native Messaging host…';
  const response = await chrome.runtime.sendMessage({ type: 'LOCAL_NLP_PING' }).catch((error) => ({
    ok: false,
    error: 'native_message_failed',
    detail: String(error?.message || error)
  }));
  localNlpAvailable = Boolean(response?.ok);
  if (response?.ok) {
    const version = response.serviceVersion ? ` v${response.serviceVersion}` : '';
    $('localNlpState').textContent = `Локальная морфология: доступна${version}. Текст не отправляется в облако.`;
    $('localNlpState').className = 'muted ok';
  } else {
    $('localNlpState').textContent = `Локальная морфология: host не подключён. Детерминированные проверки продолжат работать. ${response?.detail || ''}`.trim();
    $('localNlpState').className = 'muted warn';
  }
  return response;
}

async function runCheck() {
  const text = $('text').value;
  if (!text.trim()) return setStatus('Сначала вставьте или считайте текст.', 'warn');
  const runId = ++currentRunId;
  $('run').disabled = true;
  setStatus('Проверяю…');
  try {
    const analyzers = [generalRulesAnalyzer, localNlpAnalyzer];
    const result = await analyzeText(text, { analyzers, analyzerTimeoutMs: 35000 });
    if (runId !== currentRunId || text !== $('text').value) return;
    currentFindings = result.findings.map((finding) => ({ ...finding, approved: finding.severity === 'safe' }));
    renderFindings();
    updateExport();
    await saveState();
    const failed = result.analyzers.filter((item) => !item.ok);
    const localStatus = result.analyzers.find((item) => item.id === 'local-morphology');
    localNlpAvailable = Boolean(localStatus?.ok);
    if (localStatus?.ok) {
      $('localNlpState').textContent = `Локальная морфология: анализ выполнен${localStatus.version ? ` v${localStatus.version}` : ''}.`;
      $('localNlpState').className = 'muted ok';
    } else if (localStatus) {
      $('localNlpState').textContent = `Локальная морфология недоступна: ${localStatus.error}. Детерминированные правила выполнены независимо.`;
      $('localNlpState').className = 'muted warn';
    }
    setStatus(`Проверено ${result.textLength} символов. Находок: ${result.findings.length}${failed.length ? `; недоступно анализаторов: ${failed.length}` : ''}.`, result.degraded ? 'warn' : 'ok');
  } finally {
    $('run').disabled = false;
  }
}

function renderFindings() {
  $('count').textContent = String(currentFindings.length);
  const sourceText = $('text').value;
  $('findings').replaceChildren(...currentFindings.map((finding) => {
    const card = document.createElement('article');
    card.className = 'finding';
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(finding.approved);
    checkbox.addEventListener('change', () => {
      finding.approved = checkbox.checked;
      updateExport();
      saveState();
    });
    const title = document.createElement('strong');
    title.textContent = `${finding.severity} · ${finding.ruleId}`;
    label.append(checkbox, title);

    const change = document.createElement('div');
    change.className = 'change';
    change.textContent = finding.kind === 'replace' ? `${finding.before} → ${finding.after}` : finding.before;
    const explanation = document.createElement('p');
    explanation.textContent = finding.explanation || '';
    const context = document.createElement('code');
    context.textContent = sourceText.slice(Math.max(0, finding.start - 70), Math.min(sourceText.length, finding.end + 70));
    card.append(label, change, explanation, context);
    return card;
  }));
}

function updateExport() {
  const selected = currentFindings.filter((finding) => finding.approved);
  $('output').value = JSON.stringify({
    schemaVersion: 1,
    product: 'lingvilibrist',
    source: currentSource,
    findings: selected.map(({ approved, ...finding }) => finding)
  }, null, 2);
}

function renderSource() {
  const source = currentSource || {};
  const title = source.title ? ` · ${source.title}` : '';
  $('sourceState').textContent = `${source.kind || 'manual'} · ${source.reliability || 'unknown'}${title}`;
}

function setStatus(text, kind = '') {
  $('status').className = `muted ${kind}`.trim();
  $('status').textContent = text;
}

async function saveState() {
  await chrome.storage.local.set({
    [SESSION_KEY]: {
      schemaVersion: 1,
      text: $('text').value,
      source: currentSource,
      findings: currentFindings,
      savedAt: new Date().toISOString()
    }
  });
}

async function restoreState() {
  const state = (await chrome.storage.local.get(SESSION_KEY))[SESSION_KEY];
  if (!state || state.schemaVersion !== 1) return renderSource();
  $('text').value = String(state.text || '');
  currentSource = state.source || currentSource;
  currentFindings = Array.isArray(state.findings) ? state.findings.filter((finding) => {
    return Number.isInteger(finding.start) && Number.isInteger(finding.end) && $('text').value.slice(finding.start, finding.end) === finding.before;
  }) : [];
  renderSource();
  renderFindings();
  updateExport();
  setStatus(state.savedAt ? `Восстановлена сессия ${new Date(state.savedAt).toLocaleString()}.` : 'Сессия восстановлена.');
}
