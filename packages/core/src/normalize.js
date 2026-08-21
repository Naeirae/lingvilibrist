import { validateFinding } from './finding.js';

export function normalizeFindings(source, findings) {
  const valid = [];
  const rejected = [];

  for (const finding of findings ?? []) {
    try {
      valid.push(validateFinding(source, { ...finding }));
    } catch (error) {
      rejected.push({ finding, error: String(error?.message || error) });
    }
  }

  const byKey = new Map();
  for (const finding of valid) {
    const key = dedupeKey(finding);
    const previous = byKey.get(key);
    if (!previous || preferFinding(finding, previous)) {
      byKey.set(key, finding);
    }
  }

  const normalized = [...byKey.values()].sort(compareFindings);
  return { findings: normalized, rejected };
}

export function dedupeKey(finding) {
  return [
    finding.start,
    finding.end,
    finding.kind,
    finding.before,
    finding.after ?? ''
  ].join('\u0001');
}

function originPriority(origin) {
  const value = String(origin || '').toLowerCase();
  if (value.startsWith('deterministic')) return 0;
  if (value.includes('morph')) return 10;
  if (value.includes('syntax') || value.includes('dependency')) return 20;
  if (value.includes('external')) return 30;
  if (value.includes('ai')) return 40;
  return 100;
}

function preferFinding(candidate, current) {
  const candidatePriority = originPriority(candidate.origin);
  const currentPriority = originPriority(current.origin);
  if (candidatePriority !== currentPriority) return candidatePriority < currentPriority;
  if (candidate.confidence !== current.confidence) return candidate.confidence > current.confidence;
  return String(candidate.ruleId).localeCompare(String(current.ruleId), 'en') < 0;
}

function compareFindings(a, b) {
  if (a.start !== b.start) return a.start - b.start;
  if (a.end !== b.end) return a.end - b.end;
  const severity = { safe: 0, review: 1, info: 2 };
  if (severity[a.severity] !== severity[b.severity]) return severity[a.severity] - severity[b.severity];
  return String(a.ruleId).localeCompare(String(b.ruleId), 'en');
}
