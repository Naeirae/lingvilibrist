# Local NLP via Chrome Native Messaging

Lingvilibrist can run its optional Russian morphology layer locally. The Chrome extension talks to the `lingvilibrist-native-host` process through Chrome Native Messaging; the analyzed text does not need to be sent to a remote service.

## Current scope

The local package currently provides:

- Razdel segmentation;
- pymorphy3 morphology;
- conservative unknown-word review;
- multiple-parse-aware adjective/participle + noun agreement candidates.

These findings are review signals. Unknown words and agreement candidates are not automatic corrections.

The deterministic browser rules remain independent: if the native host is absent or fails, the extension still returns deterministic findings and marks the NLP layer as degraded.

## Windows development install

Requirements:

- Python 3.11+;
- Chrome;
- the unpacked Lingvilibrist extension loaded from `dist/chrome-extension`.

Install the Python package from the repository root:

```powershell
py -m pip install .\python\nlp
```

Open `chrome://extensions`, find Lingvilibrist, and copy its extension ID. Then register the native host for the current Windows user:

```powershell
powershell -ExecutionPolicy Bypass -File .\python\nlp\native-host\install-windows.ps1 -ExtensionId YOUR_EXTENSION_ID
```

Reload the extension and press `Проверить локальный NLP` in the popup.

The installer writes the host manifest under `%LOCALAPPDATA%\Lingvilibrist\native-host` and registers it under the current user's Chrome Native Messaging registry key. Administrator rights are not required for the HKCU registration.

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File .\python\nlp\native-host\uninstall-windows.ps1
```

This removes the Chrome registration and generated host manifest. It does not uninstall the Python package itself.

## Protocol

Host name:

```text
com.lingvilibrist.local_nlp
```

Protocol version: `1`.

Supported messages:

- `ping` — capability and version probe;
- `analyze` — analyze one text payload.

Each request may include `requestId`; responses echo it. The browser-facing response intentionally omits full token lattices and sentence arrays to stay below Chrome's native-host response-size limit. It returns findings plus summary counts instead.

## Security boundary

The host manifest uses `allowed_origins` and must contain the exact Chrome extension ID. Do not publish a local manifest that allows arbitrary extension origins.

The host accepts only JSON objects, enforces input size limits, validates the optional allowlist shape, writes protocol data only to stdout, and sends diagnostics to stderr.
