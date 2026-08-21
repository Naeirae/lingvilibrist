import { normalizeFindings } from './normalize.js';

export async function analyzeText(text, options = {}) {
  if (typeof text !== 'string') throw new TypeError('text must be a string');

  const analyzers = Array.isArray(options.analyzers) ? options.analyzers : [];
  const statuses = [];
  const collected = [];

  for (const analyzer of analyzers) {
    const id = String(analyzer?.id || analyzer?.name || 'anonymous-analyzer');
    const startedAt = Date.now();
    try {
      if (!analyzer || typeof analyzer.analyze !== 'function') {
        throw new TypeError('analyzer must expose analyze(text, context)');
      }
      const result = await analyzer.analyze(text, {
        profile: options.profile ?? null,
        signal: options.signal ?? null
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
