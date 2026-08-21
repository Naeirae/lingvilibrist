# Security and trust boundaries

Lingvilibrist treats proofreading output as advice, not executable truth.

## Trust model

- Deterministic rules may be marked `safe` only when they produce a bounded, explainable edit with regression coverage.
- Context-dependent linguistic checks remain `review` findings.
- A failed analyzer must degrade independently instead of breaking the whole review pipeline.
- Source adapters are untrusted input boundaries: ranges and `before` fragments are validated against the exact analyzed text before a finding is accepted.
- The public extension does not execute remote code.

## Extension constraints

- Manifest V3 only.
- No `eval`, dynamically downloaded scripts, or remote script tags.
- Host permissions stay narrow.
- Text leaves the browser only through future adapters that are explicitly enabled and documented.

## Reporting a vulnerability

Do not include private documents, credentials, access tokens or production user text in a public issue. A private reporting channel will be added before the first public release intended for general installation.
