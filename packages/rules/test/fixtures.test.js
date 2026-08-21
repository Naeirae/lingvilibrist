import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generalRulesAnalyzer } from '../src/general.js';

const fixtures = JSON.parse(await readFile(new URL('../../../fixtures/russian/general.json', import.meta.url), 'utf8'));

for (const fixture of fixtures) {
  test(`fixture: ${fixture.id}`, async () => {
    const result = await generalRulesAnalyzer.analyze(fixture.text);
    const actual = [...new Set(result.findings.map((finding) => finding.ruleId))].sort();
    const expected = [...fixture.expectRuleIds].sort();
    assert.deepEqual(actual, expected);
  });
}
