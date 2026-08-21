import { makeFinding } from '../../core/src/finding.js';

export const generalRulesAnalyzer = Object.freeze({
  id: 'general-rules',
  version: '0.1.2',
  async analyze(text) {
    const findings = [];
    findings.push(...doubleSpaceFindings(text));
    findings.push(...spaceBeforePunctuationFindings(text));
    findings.push(...spaceAfterOpeningFindings(text));
    findings.push(...mixedScriptFindings(text));
    findings.push(...immediateDuplicateWordFindings(text));
    return { findings, version: this.version };
  }
});

function doubleSpaceFindings(text) {
  const findings = [];
  for (const match of text.matchAll(/ {2,}/g)) {
    findings.push(makeFinding(text, {
      id: `general.double-space@${match.index}`,
      ruleId: 'general.double-space',
      kind: 'replace',
      severity: 'safe',
      confidence: 1,
      start: match.index,
      end: match.index + match[0].length,
      before: match[0],
      after: ' ',
      explanation: 'Several ordinary spaces occur in a row.',
      origin: 'deterministic'
    }));
  }
  return findings;
}

function spaceBeforePunctuationFindings(text) {
  const findings = [];
  for (const match of text.matchAll(/ +([,.;:!?])/g)) {
    findings.push(makeFinding(text, {
      id: `general.space-before-punctuation@${match.index}`,
      ruleId: 'general.space-before-punctuation',
      kind: 'replace',
      severity: 'safe',
      confidence: 1,
      start: match.index,
      end: match.index + match[0].length,
      before: match[0],
      after: match[1],
      explanation: 'An ordinary space appears immediately before punctuation.',
      origin: 'deterministic'
    }));
  }
  return findings;
}

function spaceAfterOpeningFindings(text) {
  const findings = [];
  for (const match of text.matchAll(/([«„(]) +/g)) {
    findings.push(makeFinding(text, {
      id: `general.space-after-opening@${match.index}`,
      ruleId: 'general.space-after-opening',
      kind: 'replace',
      severity: 'safe',
      confidence: 1,
      start: match.index,
      end: match.index + match[0].length,
      before: match[0],
      after: match[1],
      explanation: 'An ordinary space appears immediately after an opening quote or bracket.',
      origin: 'deterministic'
    }));
  }
  return findings;
}

function mixedScriptFindings(text) {
  const findings = [];
  // Deliberately stop at hyphens/underscores. Editorial compounds such as
  // "IT-команда" contain two legitimate script-specific parts and should not
  // be treated like a homoglyph typo inside one lexical token.
  const tokenRe = /[\p{L}\p{N}]+/gu;
  for (const match of text.matchAll(tokenRe)) {
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
