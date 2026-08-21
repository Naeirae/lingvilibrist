# Product status

Last updated: 2026-08-21.

This file distinguishes implemented code from planned capability. A feature is not called production-ready until it has code, regression coverage and a reproducible build path.

## Implemented in the public repository

- standalone public repository with no mandatory private backend;
- browser-independent finding contract and validator;
- no-op rejection and source-range validation;
- finding normalization/deduplication;
- analyzer orchestration with independent failure reporting;
- declarative deterministic rule engine (`literal_replace`, `regex_replace`);
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
- optional local Python morphology package with Razdel + pymorphy3;
- multiple morphology parses retained per token;
- conservative unknown-word review in the Python package;
- JSON CLI for the local morphology package;
- separate JavaScript and Python CI jobs;
- CI build/manifest validation/private-marker scan/artifact upload;
- privacy, security, NLP, rule and contribution documentation.

## Implemented but still requiring live/integration verification

- active Google Docs acquisition across current Docs UI variants;
- popup persistence after close/reopen in a real extension install;
- extension artifact installation from CI output;
- long-document behavior in Chrome;
- browser-to-local-NLP transport (morphology exists, but is not yet wired into the extension).

## Not implemented yet

- secure packaged transport between Chrome and local morphology;
- user dictionaries/allowlists UI;
- dependency syntax;
- rule-profile system;
- packaged ZIP release workflow;
- final icon set;
- performance benchmark suite;
- public source license/commercial model.

## Current quality rule

A capability is described as integrated only when it exists end-to-end. Morphology is implemented as an optional local package but is not yet an extension capability. Dependency syntax remains roadmap material until a real parser and integration contract land in the public repository.
