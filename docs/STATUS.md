# Product status

Last updated: 2026-08-21.

This file distinguishes implemented code from planned capability. A feature is not called production-ready until it has code, regression coverage and a reproducible build path.

## Implemented in the public repository

- standalone public repository with no mandatory private backend;
- browser-independent finding contract and validator;
- no-op rejection and source-range validation;
- finding normalization/deduplication;
- analyzer orchestration with independent failure reporting;
- deterministic whitespace and punctuation-spacing checks;
- immediate repeated-word review;
- mixed Cyrillic/Latin token review;
- negative regression for legitimate `IT-команда` style compounds;
- public regression fixture seed;
- manual source adapter;
- Manifest V3 Chrome shell;
- local session persistence in `chrome.storage.local`;
- manual text review flow;
- conservative active Google Docs reader with visible degraded failure;
- neutral JSON export of approved findings;
- reproducible unpacked-extension build;
- CI tests/build/manifest validation/private-marker scan/artifact upload;
- privacy, security and contribution documentation.

## Implemented but still requiring live browser verification

- active Google Docs acquisition across current Docs UI variants;
- popup persistence after close/reopen in a real extension install;
- extension artifact installation from CI output;
- long-document behavior in Chrome.

## Not implemented yet

- local morphology process/adapter in the public product;
- lexical unknown-word analysis;
- user dictionaries/allowlists;
- dependency syntax;
- rule-profile system;
- packaged ZIP release workflow;
- final icon set;
- performance benchmark suite;
- public source license/commercial model.

## Current quality rule

A capability is described in the README as current only when it exists in this repository. Planned morphology/syntax remains roadmap material until its public implementation and tests land here.
