import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText } from '../src/analyze.js';

const source = 'Тест  текста.';

const deterministic = {
  id: 'deterministic',
  async analyze(text) {
    return {
      findings: [{
        id: 'space@4',
        ruleId: 'space',
        kind: 'replace',
        severity: 'safe',
        confidence: 1,
        start: 4,
        end: 6,
        before: text.slice(4, 6),
        after: ' ',
        explanation: 'Double space.',
        origin: 'deterministic'
      }]
    };
  }
};

const duplicateHeuristic = {
  id: 'heuristic',
  async analyze(text) {
    return {
      findings: [{
        id: 'space-review@4',
        ruleId: 'space-review',
        kind: 'replace',
        severity: 'review',
        confidence: 0.8,
        start: 4,
        end: 6,
        before: text.slice(4, 6),
        after: ' ',
        explanation: 'Heuristic duplicate.',
        origin: 'morphology'
      }]
    };
  }
};

test('optional analyzer failure does not discard successful findings', async () => {
  const broken = { id: 'broken', async analyze() { throw new Error('offline'); } };
  const result = await analyzeText(source, { analyzers: [deterministic, broken] });
  assert.equal(result.findings.length, 1);
  assert.equal(result.degraded, true);
  assert.equal(result.analyzers.find(item => item.id === 'broken').ok, false);
});

test('equivalent findings are deduplicated in favor of deterministic origin', async () => {
  const result = await analyzeText(source, { analyzers: [duplicateHeuristic, deterministic] });
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].origin, 'deterministic');
  assert.equal(result.findings[0].severity, 'safe');
});

test('timed-out optional analyzer is isolated and reported', async () => {
  const slow = {
    id: 'slow',
    async analyze(_text, context) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (context.signal?.aborted) return { findings: [] };
      return { findings: [] };
    }
  };
  const result = await analyzeText(source, { analyzers: [deterministic, slow], analyzerTimeoutMs: 10 });
  assert.equal(result.findings.length, 1);
  assert.equal(result.degraded, true);
  const status = result.analyzers.find(item => item.id === 'slow');
  assert.equal(status.ok, false);
  assert.equal(status.code, 'analyzer_timeout');
});
