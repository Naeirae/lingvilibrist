import { makeFinding } from '../../core/src/finding.js';
import { runDeclarativeRules } from '../../core/src/rule-engine.js';
import { generalDeclarativeRules } from './general-declarative.js';

export const generalRulesAnalyzer = Object.freeze({
  id: 'general-rules',
  version: '0.2.0',
  async analyze(text) {
    const findings = runDeclarativeRules(text, generalDeclarativeRules);
    findings.push(...mixedScriptFindings(text));
    findings.push(...immediateDuplicateWordFindings(text));
    return { findings, version: this.version };
  }
});

function mixedScriptFindings(text) {
  const findings = [];
  // Hyphens/underscores intentionally split tokens. Compounds such as IT-команда
  // contain legitimate script-specific parts and are not homoglyph mistakes.
  for (const match of text.matchAll(/[\p{L}\p{N}]+/gu)) {
    const token = match[0];
    if (!/[A-Za-z]/.test(token) || !/[А-Яа-яЁё]/.test(token)) continue;
    findings.push(makeFinding(text, {
      id: `general.mixed-script-token@${match.index}`,
      ruleId: 'general.mixed-script-token',
      kind: 'notice',
      severity: 'review',
      confidence: 0.95,
      start: match.index,
      end: match.index + token.length,
      before: token,
      explanation: 'The token contains both Cyrillic and Latin letters. This may be intentional, but it is also a common source of invisible typos.',
      origin: 'deterministic'
    }));
  }
  return findings;
}

function immediateDuplicateWordFindings(text) {
  const findings = [];
  const words = [...text.matchAll(/[\p{L}]+/gu)];
  for (let index = 0; index < words.length - 1; index += 1) {
    const left = words[index];
    const right = words[index + 1];
    if (left[0].length < 2 || right[0].length < 2) continue;
    if (left[0].toLocaleLowerCase('ru') !== right[0].toLocaleLowerCase('ru')) continue;
    const between = text.slice(left.index + left[0].length, right.index);
    if (!/^\s+$/.test(between)) continue;
    const start = left.index;
    const end = right.index + right[0].length;
    findings.push(makeFinding(text, {
      id: `general.immediate-duplicate-word@${start}`,
      ruleId: 'general.immediate-duplicate-word',
      kind: 'notice',
      severity: 'review',
      confidence: 0.9,
      start,
      end,
      before: text.slice(start, end),
      explanation: 'The same word appears twice in a row. Check whether the repetition is accidental.',
      origin: 'deterministic'
    }));
  }
  return findings;
}
