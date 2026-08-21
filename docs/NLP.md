# Local NLP architecture

The public product does not require cloud text processing. Linguistic analysis that is too heavy for a Manifest V3 service worker lives in an optional local Python package under `python/nlp`.

## Current implementation

`lingvilibrist-nlp` currently provides:

- Razdel sentence/token segmentation;
- pymorphy3 dictionary morphology;
- multiple morphological parses per token instead of collapsing immediately to one interpretation;
- conservative unknown-word review candidates;
- an allowlist boundary for editorial/technical vocabulary;
- a JSON CLI suitable for tests and future adapters.

Example:

```bash
python -m pip install ./python/nlp
printf 'Это тестовый текст.' | lingvilibrist-nlp
```

The CLI returns a versioned JSON document with sentences, token ranges, morphological features, alternative parses and review-only findings.

## Why the browser does not spawn Python directly

Chrome extensions cannot safely spawn arbitrary local processes. The public architecture therefore keeps the browser-independent linguistic engine separate from the transport used to reach it.

Candidate transports for a later packaged release are:

1. Chrome Native Messaging with an explicit host installer;
2. a localhost service bound to loopback with an authentication/bootstrap mechanism.

The transport will be selected on security, installation UX and portability grounds. The morphology package itself must not depend on that decision.

## Safety policy

- unknown dictionary word is not equivalent to typo;
- capitalized unknown words are suppressed by default to avoid flooding names and brands;
- multiple parses are retained when ambiguity matters;
- morphology is evidence, not syntax;
- dependency-based claims will not be advertised until a real dependency parser exists in the public repository.
