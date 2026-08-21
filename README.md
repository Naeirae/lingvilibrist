# Lingvilibrist

**Extensible Russian proofreading and editorial review tool with deterministic rules, morphology, and review-first findings.**

Lingvilibrist is a proofreading and editorial analysis tool for Russian text. Language tooling should explain what it found, show the exact affected fragment, and leave the final decision to the editor instead of silently rewriting prose.

The public edition is an **offline-first, production-oriented** product. Its core checks run without a private backend or workplace infrastructure. Optional linguistic components can be added behind adapters later, but the base review workflow does not depend on a cloud service.

## Current runnable MVP

The repository now builds an unpacked Manifest V3 Chrome extension with:

- manual text review;
- a narrow Google Docs source adapter;
- persistent local review state;
- deterministic whitespace and punctuation-spacing checks;
- immediate repeated-word review;
- mixed Cyrillic/Latin token review with false-positive protection for compounds such as `IT-команда`;
- structured `safe` / `review` findings;
- selection of approved findings;
- neutral JSON export;
- analyzer failure isolation;
- regression fixtures and CI packaging.

The Google Docs adapter is intentionally conservative. If the current Docs UI does not expose enough visible text, Lingvilibrist reports degraded acquisition and asks for manual input instead of pretending that it read the document correctly.

## Build and test

Requires Node.js 22+.

```bash
npm install
npm test
npm run build:extension
```

The unpacked browser build appears in:

```text
dist/chrome-extension/
```

In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select that directory.

CI runs tests, builds the extension, validates the MV3 manifest, scans the public tree for private-infrastructure markers, and publishes the unpacked extension as a workflow artifact.

## Why this project exists

Most writing assistants optimize for automatic rewriting. Lingvilibrist takes a different approach:

- deterministic checks first;
- structured findings instead of opaque rewrites;
- morphology and syntax as evidence, not unquestionable truth;
- explicit distinction between an error, a review candidate, and an informational notice;
- minimal edits that preserve the author's voice;
- adapters and rule packs separated from the engine;
- regression tests for every rule that can change text;
- graceful degradation when optional linguistic components are unavailable.

## Repository structure

```text
apps/
  chrome-extension/       Standalone MV3 UI and Google Docs adapter
packages/
  core/                   Finding model, validation, normalization, analyzer runner
  rules/                  Public deterministic Russian-language checks
  adapters/               Neutral source-adapter contracts
fixtures/
  russian/                Public regression corpus
docs/
  ARCHITECTURE.md
  ROADMAP.md
  BRANDING.md
  PRIVACY.md
  SECURITY.md
scripts/
  build-extension.mjs     Reproducible unpacked-extension build
```

## Finding contract

Every analyzer emits a **finding**. A finding does not edit text by itself.

```json
{
  "id": "rule.example@42",
  "ruleId": "rule.example",
  "kind": "replace",
  "severity": "safe",
  "confidence": 1,
  "start": 42,
  "end": 48,
  "before": "example",
  "after": "replacement",
  "explanation": "Human-readable rationale",
  "origin": "deterministic"
}
```

The core validates that a finding points to the exact analyzed range. No-op replacements are rejected. Context-dependent checks use `review`/`notice` semantics rather than pretending to be safe automatic corrections.

## Architecture principles

1. **Core before UI.** The rule engine is testable without Chrome.
2. **No silent mutation.** Analysis and editing are separate operations.
3. **Adapters at the edges.** Google Docs, browser UI and future integrations do not own linguistic logic.
4. **Rule provenance.** Every deterministic correction has an ID, rationale and regression coverage.
5. **Review-first NLP.** Morphological and syntactic models generate evidence and candidates; ambiguous results stay review-only.
6. **Offline-first.** Core usage does not require sending text to a mandatory remote service.
7. **Fail visibly.** Optional analyzers may fail independently without disabling deterministic checks.
8. **Public/private boundary.** CI guards against accidental inclusion of internal infrastructure markers.

## Next engineering milestones

The next product layers are:

- stronger source acquisition and block classification;
- public rule metadata and rule-pack contracts;
- a local morphology adapter;
- lexical review and user dictionaries;
- dependency syntax behind a replaceable analyzer interface;
- richer regression corpus and performance gates;
- final icon set and release packaging.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the implementation plan and quality gates.

## Privacy and security

See [docs/PRIVACY.md](docs/PRIVACY.md) and [docs/SECURITY.md](docs/SECURITY.md). The public MVP has no mandatory cloud text-processing path and does not load remote code.

## License

A public source license has **not been selected yet**. The repository is public for development and portfolio visibility; no reuse rights are granted beyond those required by GitHub's terms until a license is added explicitly.
