# Public rule model

Lingvilibrist distinguishes declarative deterministic rules from procedural analyzers. Both emit the same validated finding contract.

## Declarative rules

Current supported rule kinds:

- `literal_replace`
- `regex_replace`

Example:

```js
{
  id: 'general.space-before-punctuation',
  kind: 'regex_replace',
  pattern: ' +([,.;:!?])',
  flags: 'g',
  replacement: '$1',
  severity: 'safe',
  confidence: 1,
  explanation: 'An ordinary space appears immediately before punctuation.'
}
```

The rule engine validates rule shape before execution and validates every emitted finding against the exact analyzed source range. A declarative no-op is discarded.

## Procedural analyzers

Use procedural code when a check needs tokenization, Unicode/script logic, morphology, syntax or structural document context. Procedural output does not receive weaker validation: findings still pass through the shared core normalizer.

## Severity

### `safe`

Use only for bounded deterministic edits with low ambiguity. A `safe` finding must contain an edit (`replace`, `insert` or `delete`).

### `review`

Use when a human should inspect context. Morphology, lexical unknown-word signals, possible repetitions and most style checks belong here.

### `info`

Use for informational diagnostics that should not look like an error.

## Regression requirement

A rule capable of changing text is not production-ready without positive and negative fixtures. False-positive regressions are treated as product bugs, not as acceptable noise.

## Future rule classes

Planned extension points include `token_rule`, `morphology_rule`, `dependency_rule` and `structure_rule`. They will only be added when the underlying analyzer contract is present in the public repository.
