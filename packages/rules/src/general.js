import { makeFinding } from '../../core/src/finding.js';

export const generalRulesAnalyzer = Object.freeze({
  id: 'general-rules',
  version: '0.1.0',
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
  const tokenRe = /[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё0-9_-]*/g;
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
  const re = /\b([A-Za-zА-Яа-яЁё]{2,})(\s+)\1\b/giu;
  for (const match of text.matchAll(re)) {
    findings.push(makeFinding(text, {
      id: `general.immediate-duplicate-word@${match.index}`,
      ruleId: 'general.immediate-duplicate-word',
      kind: 'notice',
      severity: 'review',
      confidence: 0.9,
      start: match.index,
      end: match.index + match[0].length,
      before: match[0],
      explanation: 'The same word appears twice in a row. Check whether the repetition is accidental.',
      origin: 'deterministic'
    }));
  }
  return findings;
}
