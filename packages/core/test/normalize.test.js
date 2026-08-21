import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFindings } from '../src/normalize.js';

const source = 'Привет , мир.';

function finding(overrides = {}) {
  return {
    id: 'x',
    ruleId: 'rule.x',
    kind: 'replace',
    severity: 'safe',
    confidence: 1,
    start: 6,
    end: 8,
    before: ' ,',
    after: ',',
    explanation: 'Example.',
    origin: 'deterministic-rule-pack',
    ...overrides
  };
}

test('dedupe prefers deterministic rule-pack result over morphology duplicate', () => {
  const result = normalizeFindings(source, [
    finding({ id: 'm', ruleId: 'morph.x', origin: 'local-morphology', confidence: 1 }),
    finding({ id: 'd', ruleId: 'general.space-before-punctuation', origin: 'deterministic-rule-pack', confidence: 1 })
  ]);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].ruleId, 'general.space-before-punctuation');
});

test('different replacements are not silently merged', () => {
  const result = normalizeFindings(source, [
    finding(),
    finding({ id: 'other', ruleId: 'rule.other', after: ';', severity: 'review' })
  ]);
  assert.equal(result.findings.length, 2);
});
