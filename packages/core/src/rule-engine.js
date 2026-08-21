import { makeFinding } from './finding.js';

export const DECLARATIVE_RULE_KINDS = Object.freeze(['literal_replace', 'regex_replace']);

export function validateRule(rule) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) throw new TypeError('rule must be an object');
  for (const field of ['id', 'kind', 'replacement', 'explanation']) {
    if (typeof rule[field] !== 'string') throw new TypeError(`${field} must be a string`);
  }
  if (!rule.id.trim()) throw new TypeError('id must be non-empty');
  if (!DECLARATIVE_RULE_KINDS.includes(rule.kind)) throw new TypeError(`unsupported rule kind: ${rule.kind}`);
  if (rule.kind === 'literal_replace' && (typeof rule.find !== 'string' || rule.find.length === 0)) {
    throw new TypeError('literal_replace requires non-empty find');
  }
  if (rule.kind === 'regex_replace' && (typeof rule.pattern !== 'string' || rule.pattern.length === 0)) {
    throw new TypeError('regex_replace requires non-empty pattern');
  }
  if (rule.severity !== undefined && !['safe', 'review', 'info'].includes(rule.severity)) {
    throw new TypeError(`unsupported rule severity: ${rule.severity}`);
  }
  return rule;
}

export function runDeclarativeRules(text, rules) {
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  if (!Array.isArray(rules)) throw new TypeError('rules must be an array');
  const findings = [];
  for (const rawRule of rules) {
    const rule = validateRule(rawRule);
    if (rule.kind === 'literal_replace') findings.push(...runLiteral(text, rule));
    else findings.push(...runRegex(text, rule));
  }
  return findings;
}

function commonFinding(text, rule, start, before, after) {
  if (before === after) return null;
  return makeFinding(text, {
    id: `${rule.id}@${start}`,
    ruleId: rule.id,
    kind: 'replace',
    severity: rule.severity || 'safe',
    confidence: rule.confidence ?? 1,
    start,
    end: start + before.length,
    before,
    after,
    explanation: rule.explanation,
    origin: rule.origin || 'deterministic-rule-pack'
  });
}

function runLiteral(text, rule) {
  const findings = [];
  let offset = 0;
  while (offset <= text.length) {
    const start = text.indexOf(rule.find, offset);
    if (start < 0) break;
    const finding = commonFinding(text, rule, start, rule.find, rule.replacement);
    if (finding) findings.push(finding);
    offset = start + Math.max(rule.find.length, 1);
  }
  return findings;
}

function runRegex(text, rule) {
  const flags = new Set(String(rule.flags || 'g'));
  flags.add('g');
  const regex = new RegExp(rule.pattern, [...flags].join(''));
  const findings = [];
  for (const match of text.matchAll(regex)) {
    const before = match[0];
    const singleFlags = [...flags].filter((flag) => flag !== 'g' && flag !== 'y').join('');
    const replacer = new RegExp(rule.pattern, singleFlags);
    const after = before.replace(replacer, rule.replacement);
    const finding = commonFinding(text, rule, match.index, before, after);
    if (finding) findings.push(finding);
  }
  return findings;
}
