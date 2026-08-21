# Contributing

Lingvilibrist is review-first. A rule is not accepted merely because it finds an example once.

## Development

```bash
npm install
npm test
npm run build:extension
```

Load `dist/chrome-extension` as an unpacked Manifest V3 extension for browser testing.

## Rule requirements

Every new deterministic rule should have:

1. a stable `ruleId`;
2. a narrow condition;
3. an explanation suitable for an editor;
4. positive regression tests;
5. negative tests for plausible false positives;
6. an explicit severity (`safe`, `review`, or `info`);
7. no silent whole-sentence rewrite when a smaller edit is possible.

Context-dependent grammar, style, semantics and disputed usage should normally be `review`, not `safe`.

## Architecture

Keep source acquisition, analysis, rule packs, UI and optional integrations separate. Core analyzers must be usable without Chrome and without network access.

## Public-repository hygiene

Do not commit private editorial documents, internal company rule sets, production URLs, credentials, user text, private logs or workplace-specific infrastructure.
