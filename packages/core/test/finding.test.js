import test from 'node:test';
import assert from 'node:assert/strict';
import { FindingValidationError, makeFinding, validateFinding } from '../src/finding.js';

const source = 'Пример текста.';

test('valid replacement finding passes validation', () => {
  const finding = makeFinding(source, {
    id: 'demo@0',
    ruleId: 'demo',
    kind: 'replace',
    severity: 'safe',
    confidence: 1,
    start: 0,
    end: 6,
    before: 'Пример',
    after: 'Образец',
    explanation: 'Test replacement.',
    origin: 'deterministic'
  });
  assert.equal(finding.after, 'Образец');
});

test('replacement no-op is rejected', () => {
  assert.throws(() => validateFinding(source, {
    id: 'demo@0',
    ruleId: 'demo',
    kind: 'replace',
    severity: 'safe',
    confidence: 1,
    start: 0,
    end: 6,
    before: 'Пример',
    after: 'Пример',
    explanation: 'No-op.',
    origin: 'deterministic'
  }), FindingValidationError);
});

test('range mismatch is rejected', () => {
  assert.throws(() => validateFinding(source, {
    id: 'demo@0',
    ruleId: 'demo',
    kind: 'notice',
    severity: 'review',
    confidence: 0.5,
    start: 0,
    end: 6,
    before: 'Ошибка',
    explanation: 'Range mismatch.',
    origin: 'morphology'
  }), /before does not match source range/);
});

test('notice cannot masquerade as safe correction', () => {
  assert.throws(() => validateFinding(source, {
    id: 'demo@0',
    ruleId: 'demo',
    kind: 'notice',
    severity: 'safe',
    confidence: 1,
    start: 0,
    end: 6,
    before: 'Пример',
    explanation: 'Unsafe severity.',
    origin: 'syntax'
  }), /notice findings cannot be safe/);
});
