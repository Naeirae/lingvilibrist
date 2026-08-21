import test from 'node:test';
import assert from 'node:assert/strict';
import { runDeclarativeRules, validateRule } from '../src/rule-engine.js';

test('literal rule emits bounded replacement findings', () => {
  const findings = runDeclarativeRules('тест тест', [{
    id: 'demo.literal',
    kind: 'literal_replace',
    find: 'тест',
    replacement: 'пример',
    explanation: 'Demo rule.'
  }]);
  assert.equal(findings.length, 2);
  assert.equal(findings[0].start, 0);
  assert.equal(findings[1].start, 5);
});

test('regex replacement supports capture groups', () => {
  const findings = runDeclarativeRules('Привет , мир.', [{
    id: 'demo.regex',
    kind: 'regex_replace',
    pattern: ' +([,.;:!?])',
    flags: 'g',
    replacement: '$1',
    explanation: 'Remove space before punctuation.'
  }]);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].before, ' ,');
  assert.equal(findings[0].after, ',');
});

test('no-op declarative matches are not emitted', () => {
  const findings = runDeclarativeRules('abc', [{
    id: 'demo.noop',
    kind: 'literal_replace',
    find: 'abc',
    replacement: 'abc',
    explanation: 'No-op.'
  }]);
  assert.equal(findings.length, 0);
});

test('invalid rule kind fails before analysis', () => {
  assert.throws(() => validateRule({ id: 'bad', kind: 'magic', replacement: '', explanation: 'Bad.' }));
});
