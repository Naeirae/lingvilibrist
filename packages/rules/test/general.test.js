import test from 'node:test';
import assert from 'node:assert/strict';
import { generalRulesAnalyzer } from '../src/general.js';

async function findings(text) {
  return (await generalRulesAnalyzer.analyze(text)).findings;
}

test('detects multiple ordinary spaces', async () => {
  const result = await findings('Это  тест.');
  assert.ok(result.some(item => item.ruleId === 'general.double-space' && item.after === ' '));
});

test('detects space before punctuation', async () => {
  const result = await findings('Привет , мир.');
  assert.ok(result.some(item => item.ruleId === 'general.space-before-punctuation'));
});

test('detects mixed Cyrillic and Latin token', async () => {
  const result = await findings('В слове cлово первая буква латинская.');
  assert.ok(result.some(item => item.ruleId === 'general.mixed-script-token'));
});

test('does not flag ordinary Latin technical token as mixed script', async () => {
  const result = await findings('Используйте TypeScript и Node.js.');
  assert.equal(result.filter(item => item.ruleId === 'general.mixed-script-token').length, 0);
});

test('does not flag a hyphenated Latin-Cyrillic editorial compound', async () => {
  const result = await findings('В компании работает IT-команда.');
  assert.equal(result.filter(item => item.ruleId === 'general.mixed-script-token').length, 0);
});

test('detects immediate repeated word without proposing a blind edit', async () => {
  const result = await findings('Это очень очень важно.');
  const duplicate = result.find(item => item.ruleId === 'general.immediate-duplicate-word');
  assert.ok(duplicate);
  assert.equal(duplicate.kind, 'notice');
  assert.equal(duplicate.severity, 'review');
});

test('does not report a normal sentence as a deterministic error', async () => {
  const result = await findings('Это обычное русское предложение.');
  assert.equal(result.length, 0);
});
