import { normalizeFindings } from './normalize.js';

export async function analyzeText(text, options = {}) {
  if (typeof text !== 'string') throw new TypeError('text must be a string');

  const analyzers = Array.isArray(options.analyzers) ? options.analyzers : [];
  const timeoutMs = normalizeTimeout(options.analyzerTimeoutMs);
  const statuses = [];
  const collected = [];

  for (const analyzer of analyzers) {
    const id = String(analyzer?.id || analyzer?.name || 'anonymous-analyzer');
    const startedAt = Date.now();
    try {
      if (!analyzer || typeof analyzer.analyze !== 'function') {
        throw new TypeError('analyzer must expose analyze(text, context)');
      }
      const result = await runAnalyzer(analyzer, text, {
        profile: options.profile ?? null,
        signal: options.signal ?? null,
        timeoutMs
      });
      const findings = Array.isArray(result?.findings) ? result.findings : Array.isArray(result) ? result : [];
      collected.push(...findings);
      statuses.push({
        id,
        ok: true,
        findingCount: findings.length,
        durationMs: Date.now() - startedAt,
        degraded: Boolean(result?.degraded),
        version: result?.version ?? analyzer.version ?? null
      });
    } catch (error) {
      statuses.push({
        id,
        ok: false,
        findingCount: 0,
        durationMs: Date.now() - startedAt,
        degraded: true,
        code: error?.code || 'analyzer_failed',
        error: String(error?.message || error),
        version: analyzer?.version ?? null
      });
    }
  }

  const normalized = normalizeFindings(text, collected);
  return {
    schemaVersion: 1,
    textLength: text.length,
    findings: normalized.findings,
    rejectedFindings: normalized.rejected,
    analyzers: statuses,
    degraded: statuses.some(status => !status.ok || status.degraded)
  };
}

function normalizeTimeout(value) {
  if (value === undefined || value === null) return 10000;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new TypeError('analyzerTimeoutMs must be a positive finite number');
  return number;
}

async function runAnalyzer(analyzer, text, context) {
  const timeoutController = new AbortController();
  const signal = mergeAbortSignals(context.signal, timeoutController.signal);
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      timeoutController.abort('timeout');
      const error = new Error(`analyzer timed out after ${context.timeoutMs} ms`);
      error.code = 'analyzer_timeout';
      reject(error);
    }, context.timeoutMs);
  });

  try {
    return await Promise.race([
      Promise.resolve(analyzer.analyze(text, { profile: context.profile, signal })),
      timeout
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function mergeAbortSignals(outer, timeoutSignal) {
  if (!outer) return timeoutSignal;
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([outer, timeoutSignal]);
  }

  const controller = new AbortController();
  const abort = (event) => {
    if (!controller.signal.aborted) controller.abort(event?.target?.reason);
  };
  if (outer.aborted) controller.abort(outer.reason);
  else outer.addEventListener('abort', abort, { once: true });
  if (timeoutSignal.aborted) controller.abort(timeoutSignal.reason);
  else timeoutSignal.addEventListener('abort', abort, { once: true });
  return controller.signal;
}
