# Lingvilibrist — production roadmap

This roadmap is intentionally stricter than a prototype backlog. The goal is not merely to make the extension demonstrate a few checks, but to produce a repository that can be shown as a coherent engineering product: understandable architecture, deterministic behavior, visible failure modes, test coverage, reproducible builds and a credible path to 1.0.

## Product target

Lingvilibrist should become a standalone Russian proofreading and editorial review tool with three independently useful layers:

1. a reusable JavaScript core that can analyze plain text without a browser;
2. a Chrome extension that can read a source, present findings and export approved corrections;
3. an optional local linguistic sidecar for morphology and dependency syntax.

The public edition must not depend on private infrastructure. Workplace-specific behavior belongs in private adapters/rule packs and must not leak into the public repository.

---

## Phase 0 — repository hygiene and public boundary

### Goals

- establish a clean standalone repository;
- remove all private/cloud/workplace coupling;
- make project boundaries obvious to a reviewer;
- ensure the repository can be cloned and understood without external context.

### Work

- [x] create standalone public repository;
- [x] write product-facing README;
- [x] document long-form roadmap;
- [ ] define architecture document;
- [ ] define public finding schema and versioning policy;
- [ ] define rule DSL contract;
- [ ] add privacy/threat-model document;
- [ ] add contribution and development instructions;
- [ ] add `.gitignore`, editor config and package metadata;
- [ ] add repository-level scripts for test/lint/package;
- [ ] add CI workflow;
- [ ] audit source tree for private URLs, credentials, company names, proprietary rules and logs before any code copy;
- [ ] choose a source license only after commercial/open-source strategy is decided.

### Exit gate

A reviewer can open the repository and understand what the product is, what is public, how it is structured, and how to run the first tests without knowledge of the private prototype.

---

## Phase 1 — stable core contracts

### Goals

Move the valuable logic out of popup scripts and patches into a browser-independent core.

### Core modules

```text
packages/core/src/
  finding.js
  finding-schema.js
  normalize.js
  ranges.js
  dedupe.js
  rule-runner.js
  analyze.js
  errors.js
```

### Finding contract

Each finding must carry enough information to be rendered, tested and exported without hidden state:

- stable `ruleId`;
- run-local `id`;
- `kind`: `replace | insert | delete | notice`;
- `severity`: `safe | review | info`;
- `confidence` in `[0, 1]`;
- absolute source offsets `start`, `end`;
- `before`;
- optional `after`;
- short explanation;
- analyzer origin;
- optional evidence/provenance;
- optional block/source metadata.

### Invariants

- a replacement finding must have `before !== after`;
- source ranges must be valid against the analyzed text;
- a `safe` finding must have a deterministic replacement;
- ambiguous NLP findings must not be emitted as `safe` merely because a model returned one parse;
- duplicate findings from two analyzers must be normalized/deduplicated;
- no analyzer may modify the source text during analysis.

### Work

- [ ] implement finding validator;
- [ ] implement no-op filter;
- [ ] implement deterministic dedupe key;
- [ ] implement stable ordering by source position and priority;
- [ ] implement analyzer timeout/error envelope;
- [ ] add unit tests for every invariant;
- [ ] expose `analyzeText(text, profile)` as the first stable API.

### Exit gate

`npm test` can analyze plain text with no Chrome APIs and returns schema-valid findings in deterministic order.

---

## Phase 2 — deterministic public rule engine

### Goals

Build a useful offline checker before adding heavy NLP.

### First public rule pack

#### Whitespace and punctuation

- [ ] multiple spaces;
- [ ] spaces before punctuation;
- [ ] spaces after opening punctuation;
- [ ] missing spaces after punctuation where unambiguous;
- [ ] repeated NBSP/space anomalies;
- [ ] accidental spacing around em/en dashes where a deterministic rule is safe.

#### Character/script quality

- [ ] mixed Cyrillic/Latin characters inside one token;
- [ ] invisible zero-width characters;
- [ ] suspicious Unicode lookalikes;
- [ ] duplicated punctuation where deterministic.

#### Lexical surface checks

- [ ] immediate repeated word;
- [ ] repeated adjacent token with case normalization;
- [ ] conservative repeated lemma candidate when morphology is available.

### Rule DSL

Public rules should be data-driven wherever practical. Initial rule classes:

- `literal_replace`;
- `regex_replace`;
- `token_notice`;
- later: `morphology_rule`, `dependency_rule`, `structure_rule`.

Every rule changing text must include:

- ID;
- title;
- severity;
- explanation;
- positive fixtures;
- negative fixtures.

### Exit gate

The public deterministic engine produces useful results fully offline and has regression fixtures proving both catches and non-catches.

---

## Phase 3 — test corpus and regression discipline

### Goals

Treat editorial rules as software behavior, not a growing pile of regexes.

### Fixture format

```text
fixtures/regression/<rule-id>/
  positive.json
  negative.json
```

Each case stores:

- source text;
- expected findings or expected absence;
- optional note explaining the linguistic edge case.

### Test classes

- [ ] contract tests;
- [ ] deterministic rule unit tests;
- [ ] regression fixture tests;
- [ ] false-positive tests;
- [ ] dedupe tests;
- [ ] Unicode/range tests;
- [ ] long-text tests;
- [ ] analyzer failure/degradation tests;
- [ ] snapshot tests only where snapshots improve readability, not as a substitute for assertions.

### Quality policy

A rule that can alter text is not considered production-ready without at least one positive and one negative regression case.

### Exit gate

CI rejects a rule change that breaks a known negative fixture or violates the finding contract.

---

## Phase 4 — Chrome extension MVP

### Goals

Build a clean UI around the core rather than embedding logic into popup patches.

### UI flow

1. read current source or accept manually pasted text;
2. show source/reliability status;
3. run analysis;
4. render findings grouped by severity/type;
5. allow approve/reject per finding;
6. show `before → after → why`;
7. export approved findings to neutral JSON;
8. persist the current analysis outside transient popup state.

### Source adapters

#### Manual text

- [ ] always available;
- [ ] zero browser integration dependencies;
- [ ] used as smoke-test path.

#### Google Docs

- [ ] active-tab verification;
- [ ] bounded read timeout;
- [ ] primary visible-document read path;
- [ ] fallback export path marked `degraded`;
- [ ] preserve paragraph boundaries;
- [ ] surface uncertainty if suggestions/comments make flat export unreliable;
- [ ] never edit the document directly in the public checker MVP.

### State

Popup closure must not destroy the analyzed source/findings. State belongs in extension storage/service worker, with explicit schema versioning.

### Exit gate

A clean Chrome install can analyze manual text and a Google Doc, survive popup reopen, and export the same approved findings deterministically.

---

## Phase 5 — local morphology service

### Goals

Add useful Russian morphological evidence without making the browser extension depend on cloud services.

### Initial stack

- `razdel` for segmentation;
- `pymorphy3` for dictionary morphology and inflection support.

### Capabilities

- [ ] tokenization;
- [ ] sentence segmentation;
- [ ] lemma/POS/grammemes;
- [ ] unknown-word review;
- [ ] user/public dictionaries and allowlists;
- [ ] multiple-parse aware agreement checks;
- [ ] repeated-lemma review candidates.

### Safety rules

- unknown dictionary word = review signal, not spelling conviction;
- proper names and product names require conservative handling;
- morphology alone does not define syntactic role;
- ambiguity must be retained instead of collapsed to the first parse if it changes the verdict.

### Integration contract

The JS core talks to morphology through an adapter interface. The application must still run deterministic checks if the sidecar is absent or crashes.

### Exit gate

Starting/stopping the local NLP service changes only optional findings; deterministic analysis remains functional and UI reports the degraded state clearly.

---

## Phase 6 — dependency syntax

### Goals

Replace heuristic "syntax" with actual dependency analysis before advertising syntax as a product capability.

### Candidate stack

Primary target:

- Navec + SlovNet/Natasha-compatible dependency models for Russian.

Optional control path:

- Stanza for difficult or disputed constructions if packaging/runtime cost is acceptable.

### Required output

Per token:

- token text/range;
- lemma/POS where available;
- dependency head;
- dependency relation;
- sentence identity;
- analyzer confidence/metadata where available.

### First dependency-aware checks

- [ ] adjective/participle ↔ noun agreement with syntactic attachment;
- [ ] subject/predicate number candidates where sufficiently reliable;
- [ ] selected government/preposition patterns;
- [ ] repeated/clausal constructions that cannot be handled safely by regex.

### Safety gate

No dependency-derived automatic replacement until a rule has:

- an explicit syntactic condition;
- sufficient positive fixtures;
- adversarial negative fixtures;
- measured false-positive behavior on a realistic corpus.

### Exit gate

The UI may say "dependency syntax" only after real head/dependency relations are present in the analyzer contract and covered by tests.

---

## Phase 7 — spelling and external open tooling

### Goals

Broaden coverage without turning the product into an opaque aggregator.

### Options

- local/self-hosted LanguageTool as an optional analyzer;
- open dictionaries;
- curated typo dictionary;
- frequency/corpus evidence for review-only candidates.

### Integration rules

- normalize all external results into the same finding contract;
- retain source/origin metadata;
- deduplicate overlaps with built-in rules;
- do not turn third-party heuristic warnings into safe corrections automatically;
- keep the core usable without this layer.

### Exit gate

Third-party analyzers can be disabled without breaking the product, and users can tell which analyzer produced each finding.

---

## Phase 8 — editorial profiles and extensibility

### Goals

Make Lingvilibrist useful outside one editorial environment.

### Profile model

A profile may configure:

- enabled rule packs;
- dictionary/allowlist;
- severity overrides;
- typography preferences;
- source adapter behavior;
- export adapter behavior.

### Public examples

- `general-ru`;
- `technical-writing-ru` as a future neutral demonstration pack;
- user-defined local pack.

No private workplace profile is copied into this repository.

### Exit gate

Adding a new profile does not require modifying core engine code.

---

## Phase 9 — production hardening

### Reliability

- [ ] bounded timeouts for every external/local analyzer;
- [ ] cancellation when a new analysis supersedes an old one;
- [ ] stale-result protection via run IDs;
- [ ] structured error codes;
- [ ] no raw HTML/server dumps in user-facing UI;
- [ ] large-document limits and chunk strategy;
- [ ] telemetry remains absent by default unless explicitly designed/consented later.

### Security/privacy

- [ ] minimum Chrome permissions;
- [ ] content security policy review;
- [ ] no hard-coded secrets;
- [ ] no mandatory remote text processing;
- [ ] threat model for clipboard/document reading;
- [ ] clear privacy statement;
- [ ] dependency audit workflow.

### Performance

- [ ] benchmark deterministic analysis;
- [ ] benchmark sidecar startup;
- [ ] avoid re-running expensive NLP for unchanged text;
- [ ] stable behavior on long articles.

### Exit gate

Known failure modes are documented and tested, and the extension fails closed/visibly rather than silently corrupting state.

---

## Phase 10 — packaging and CI/CD

### CI

On every push/PR:

- [ ] install from lockfile;
- [ ] lint;
- [ ] unit tests;
- [ ] regression tests;
- [ ] schema checks;
- [ ] extension manifest validation;
- [ ] package smoke test;
- [ ] secret/private-string scan.

### Releases

- [ ] deterministic extension ZIP build;
- [ ] version sourced from one canonical location;
- [ ] changelog;
- [ ] GitHub release artifact;
- [ ] install instructions;
- [ ] optional sidecar package separately versioned.

### Exit gate

A tagged release can be reproduced from source and installed without manual file surgery.

---

## Phase 11 — portfolio/product presentation

### Repository presentation

- [ ] concise architecture diagram;
- [ ] screenshots/GIF of the review flow;
- [ ] sample input/output;
- [ ] engineering trade-offs document;
- [ ] test strategy document;
- [ ] release artifact;
- [ ] roadmap/status badges only when backed by actual automation.

### Demonstrable engineering themes

The repository should make these design decisions visible to a technical reviewer:

- separation of concerns;
- contract-driven integration;
- explainable language tooling;
- conservative handling of NLP uncertainty;
- deterministic regression testing;
- privacy-first architecture;
- graceful degradation;
- browser-extension state management;
- migration from prototype patching to maintainable modules.

### Exit gate

A hiring manager or engineer can evaluate the product without requiring a narrated explanation of the private system it originated from.

---

## Definition of public 0.1.0

The first release is intentionally smaller than the full roadmap. `0.1.0` is ready when all of the following are true:

- standalone Chrome extension installs;
- manual text analysis works;
- Google Docs reading has a bounded primary/fallback flow;
- deterministic whitespace/punctuation rules work;
- mixed-script and immediate duplicate detection work;
- findings conform to a tested public schema;
- findings survive popup reopen;
- approved findings export to neutral JSON;
- deterministic rule suite has positive and negative fixtures;
- CI passes on a clean clone;
- package/release artifact is reproducible;
- no private infrastructure, proprietary rules or credentials are present.

Morphology may ship in `0.1.x` if packaging is clean, but a missing morphology service must never prevent the base checker from working.

---

## Definition of public 1.0

`1.0` means more than "feature complete". It requires:

- stable versioned core API;
- stable finding schema;
- mature deterministic rule pack;
- real dependency-syntax integration or an explicit statement that syntax is out of scope;
- documented false-positive policy;
- regression corpus large enough to protect common editorial cases;
- stable Chrome packaging;
- privacy/security documentation;
- clear license/commercial model;
- release notes and migration policy;
- no known data-loss or silent-state-corruption bugs.

---

## Work order from the current state

The immediate implementation order is:

1. repository scaffolding and CI;
2. public finding schema + validator;
3. browser-independent core analyzer;
4. first deterministic rules + fixtures;
5. Chrome shell around the core;
6. persistent analysis state;
7. Google Docs adapter;
8. neutral JSON export;
9. local morphology adapter;
10. real dependency syntax;
11. larger rule packs and editorial profiles;
12. hardening, packaging and public release.

This ordering is deliberate: the project should become demonstrably reliable at the core before adding more language intelligence.
