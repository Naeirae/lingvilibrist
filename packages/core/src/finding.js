export const FINDING_KINDS = Object.freeze(['replace', 'insert', 'delete', 'notice']);
export const FINDING_SEVERITIES = Object.freeze(['safe', 'review', 'info']);

export class FindingValidationError extends Error {
  constructor(message, finding) {
    super(message);
    this.name = 'FindingValidationError';
    this.finding = finding;
  }
}

export function validateFinding(source, finding) {
  if (typeof source !== 'string') {
    throw new TypeError('source must be a string');
  }
  if (!finding || typeof finding !== 'object' || Array.isArray(finding)) {
    throw new FindingValidationError('finding must be an object', finding);
  }

  const requiredStrings = ['id', 'ruleId', 'kind', 'severity', 'before', 'explanation', 'origin'];
  for (const field of requiredStrings) {
    if (typeof finding[field] !== 'string' || !finding[field].trim()) {
      throw new FindingValidationError(`${field} must be a non-empty string`, finding);
    }
  }

  if (!FINDING_KINDS.includes(finding.kind)) {
    throw new FindingValidationError(`unsupported kind: ${finding.kind}`, finding);
  }
  if (!FINDING_SEVERITIES.includes(finding.severity)) {
    throw new FindingValidationError(`unsupported severity: ${finding.severity}`, finding);
  }
  if (!Number.isFinite(finding.confidence) || finding.confidence < 0 || finding.confidence > 1) {
    throw new FindingValidationError('confidence must be a finite number between 0 and 1', finding);
  }
  if (!Number.isInteger(finding.start) || !Number.isInteger(finding.end)) {
    throw new FindingValidationError('start and end must be integers', finding);
  }
  if (finding.start < 0 || finding.end < finding.start || finding.end > source.length) {
    throw new FindingValidationError('finding range is outside source bounds', finding);
  }

  const slice = source.slice(finding.start, finding.end);
  if (finding.kind === 'insert') {
    if (finding.start !== finding.end || finding.before !== '') {
      throw new FindingValidationError('insert findings require an empty source range and empty before text', finding);
    }
    if (typeof finding.after !== 'string' || finding.after.length === 0) {
      throw new FindingValidationError('insert findings require non-empty after text', finding);
    }
  } else {
    if (slice !== finding.before) {
      throw new FindingValidationError('before does not match source range', finding);
    }
  }

  if (finding.kind === 'replace') {
    if (typeof finding.after !== 'string') {
      throw new FindingValidationError('replace findings require after text', finding);
    }
    if (finding.before === finding.after) {
      throw new FindingValidationError('replace findings cannot be no-ops', finding);
    }
  }

  if (finding.kind === 'delete') {
    if (finding.before.length === 0) {
      throw new FindingValidationError('delete findings require non-empty before text', finding);
    }
    if (finding.after !== undefined && finding.after !== '') {
      throw new FindingValidationError('delete findings may only omit after or use an empty string', finding);
    }
  }

  if (finding.kind === 'notice') {
    if (finding.after !== undefined && finding.after !== '') {
      throw new FindingValidationError('notice findings must not contain replacement text', finding);
    }
    if (finding.severity === 'safe') {
      throw new FindingValidationError('notice findings cannot be safe', finding);
    }
  }

  if (finding.severity === 'safe' && !['replace', 'insert', 'delete'].includes(finding.kind)) {
    throw new FindingValidationError('safe findings must contain a deterministic edit', finding);
  }

  return finding;
}

export function makeFinding(source, input) {
  const finding = {
    confidence: 1,
    severity: 'review',
    origin: 'deterministic',
    ...input
  };
  return validateFinding(source, finding);
}
