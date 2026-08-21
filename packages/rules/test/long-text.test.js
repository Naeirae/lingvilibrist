import test from 'node:test';
import assert from 'node:assert/strict';
import { generalRulesAnalyzer } from '../src/general.js';

test('deterministic analyzer handles a long article-sized text without corrupting ranges', async () => {
  const paragraph = 'Это обычное предложение для длинного текста. ';
  const text = `${paragraph.repeat(600)}Финал  текста.`;
  const result = await generalRulesAnalyzer.analyze(text);
  const finding = result.findings.find((item) => item.ruleId === 'general.double-space');
  assert.ok(finding);
  assert.equal(text.slice(finding.start, finding.end), finding.before);
  assert.equal(finding.after, ' ');
});
