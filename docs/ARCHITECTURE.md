# Architecture

Lingvilibrist is split into a browser-independent analysis core and thin adapters around it. The architecture is intentionally designed to keep language logic testable and to prevent browser integration, cloud services or workplace-specific workflows from becoming hidden dependencies.

## System overview

```text
Source
  |
  v
Source adapter
  |
  v
Normalized document/text
  |
  +--> deterministic rules
  |
  +--> optional morphology adapter
  |
  +--> optional dependency syntax adapter
  |
  v
Finding normalization
  |
  +--> validation
  +--> no-op filtering
  +--> deduplication
  +--> stable ordering
  |
  v
Review UI
  |
  v
Approved findings
  |
  v
Neutral export adapter
```

The core has no permission to mutate the source document.

## Public package boundaries

### `packages/core`

Owns:

- the finding contract;
- validation and normalization;
- analyzer orchestration;
- deduplication;
- deterministic ordering;
- degraded-mode handling.

Must not import Chrome APIs, Google Docs code or private service URLs.

### `packages/rules`

Owns public deterministic rule packs. Rules produce candidate findings but do not render UI and do not directly edit text.

### `packages/adapters`

Owns contracts for source input, optional linguistic services and finding export. Integrations should depend on core contracts, not the other way around.

### `apps/chrome-extension`

Owns browser permissions, source acquisition, popup/panel UI and persistent extension state. It consumes the core API.

### `python/nlp`

Optional local process for morphology and, later, dependency syntax. It is an adapter implementation, not the source of truth for core behavior.

## Analysis contract

The first stable public API is intended to be conceptually equivalent to:

```js
const result = await analyzeText(text, {
  analyzers,
  profile,
  signal
});
```

The result contains findings plus analyzer status information. One failed optional analyzer must not discard findings from successful analyzers.

## Finding model

A finding represents one observation about an immutable source string.

Required properties:

- `id` — unique within one analysis run;
- `ruleId` — stable rule/analyzer identifier;
- `kind` — `replace`, `insert`, `delete`, or `notice`;
- `severity` — `safe`, `review`, or `info`;
- `confidence` — numeric value from 0 through 1;
- `start`, `end` — absolute offsets in the source string;
- `before` — exact source slice for the range;
- `after` — replacement text when applicable;
- `explanation` — human-readable rationale;
- `origin` — analyzer family.

Optional properties may carry evidence, analyzer metadata, block identity or source provenance.

## Core invariants

### Immutable input

Analyzers receive source text and return findings. They do not mutate the text while analysis is running.

### Range integrity

For non-insert findings:

```text
source.slice(start, end) === before
```

A finding that fails this invariant is invalid and must not reach the review UI.

### No-op protection

A replacement where `before === after` is discarded. Review-only observations should use `kind: notice` instead of fake replacement findings.

### Conservative severity

`safe` means a deterministic correction with low ambiguity. Statistical, morphological or syntactic uncertainty defaults to `review` unless a rule-specific contract proves a safe correction.

### Stable output

Given the same source, profile and analyzer versions, deterministic analyzers should produce the same ordered findings.

### Failure isolation

Each analyzer runs behind an error boundary. Optional NLP failure is represented in analyzer status and does not disable the deterministic engine.

## Deduplication

Findings may overlap because different analyzers detect the same issue. Deduplication should prefer:

1. exact same range + same replacement;
2. deterministic rule over heuristic analyzer when both express the same correction;
3. higher-confidence evidence only when semantics are equivalent;
4. preservation of provenance metadata where useful.

Deduplication must not silently merge two findings that propose different replacements.

## Severity semantics

### `safe`

A suggested correction is considered safe enough to be preselected in UI only when the rule is deterministic and covered by positive/negative regression cases.

### `review`

The system sees a plausible issue, but context or linguistic ambiguity matters. Review findings are never silently applied.

### `info`

Informational diagnostics that do not imply an error.

## Source adapters

Source adapters must return a normalized source object and must clearly report read reliability.

Example:

```json
{
  "kind": "google_docs",
  "url": "https://docs.google.com/document/d/.../edit",
  "reliability": "visible",
  "text": "...",
  "blocks": []
}
```

If a fallback extraction can lose comments, suggestions, formatting or hidden structure, the adapter must mark the result degraded rather than pretending it is authoritative.

## Browser state

The popup is a view, not the state owner. Analysis sessions must survive popup close/reopen through extension storage or a background-owned state model.

A session should eventually include:

- schema version;
- source identity;
- source fingerprint;
- read reliability;
- text snapshot or recoverable reference;
- analyzer versions;
- findings;
- approval state;
- timestamps.

## Optional local NLP

The browser core talks to linguistic tooling through an adapter. The public target is local-first:

```text
Chrome extension -> localhost adapter -> Python NLP service
```

Initial morphology stack:

- Razdel;
- pymorphy3.

Dependency syntax is not advertised until a real parser provides head/dependency relations and regression-tested syntax rules consume them.

## Security boundary

The public product should default to no remote text transmission. If a remote adapter is ever added, it must be opt-in, documented and separable from the base extension.

Secrets, private infrastructure endpoints and proprietary rule packs are outside this repository by design.

## Migration from prototype code

The internal prototype contains useful behavior implemented across popup patches, service-worker scripts and cloud bridges. Public migration follows this rule:

> copy behavior, not coupling.

Before code is moved here, it is reviewed for:

- private URLs/identifiers;
- company-specific rules;
- hidden global dependencies;
- popup-owned business logic;
- reliance on remote services;
- missing regression tests.

Only sanitized, modular behavior is promoted into the public packages.
