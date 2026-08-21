# Privacy model

Lingvilibrist's public edition is designed to perform its core proofreading locally in the browser.

## Default data flow

1. The user explicitly provides text by pasting it into the extension or asks the extension to read the active Google Docs tab.
2. The text is passed to local analyzers packaged with the extension.
3. Findings and the current session are stored in `chrome.storage.local` so closing the popup does not destroy the review state.
4. No mandatory remote service receives document text.

## Browser permissions

The public MVP requests only the permissions required for the visible product behavior:

- `storage` — persist the local review session;
- `activeTab` and `scripting` — read the active Google Docs page after an explicit user action;
- host access limited to `https://docs.google.com/document/d/*`.

No broad web host permission, background analytics endpoint, remote code loader, or private workplace API belongs in the public build.

## Future optional integrations

Optional NLP or editorial integrations must be adapters with an explicit user-visible enablement step. A remote adapter must document:

- what text is sent;
- where it is sent;
- retention expectations;
- failure and timeout behavior;
- whether the local engine remains usable when the integration is unavailable.

## Repository boundary

Public CI scans the repository for known private-infrastructure markers. Secrets, workplace identifiers, proprietary rule packs, production logs, private document links and user data must never be committed here.
