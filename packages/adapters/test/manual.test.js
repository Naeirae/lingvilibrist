import test from 'node:test';
import assert from 'node:assert/strict';
import { createManualSource } from '../src/manual.js';

test('manual adapter preserves paragraph boundaries and metadata', () => {
  const source = createManualSource('Первый абзац.\n\nВторой абзац.', { title: 'Демо' });
  assert.equal(source.source.kind, 'manual');
  assert.equal(source.source.title, 'Демо');
  assert.equal(source.blocks.length, 2);
  assert.equal(source.blocks[1].text, 'Второй абзац.');
});
