export function createNativeNlpAnalyzer(options = {}) {
  const send = options.sendMessage;
  if (typeof send !== 'function') throw new TypeError('sendMessage must be a function');
  const id = String(options.id || 'local-native-nlp');
  const version = String(options.version || '0.1.0');

  return Object.freeze({
    id,
    version,
    async analyze(text, context = {}) {
      if (context.signal?.aborted) throw abortError();
      const requestId = cryptoRandomId();
      const response = await send({
        type: 'analyze',
        requestId,
        text: String(text || ''),
        ...(Array.isArray(options.allowlist) ? { allowlist: options.allowlist } : {})
      }, context);
      if (context.signal?.aborted) throw abortError();
      if (!response?.ok) {
        const error = new Error(`local NLP failed: ${response?.error || 'unknown_error'}`);
        error.code = response?.error || 'local_nlp_failed';
        throw error;
      }
      if (response.requestId !== requestId) {
        const error = new Error('local NLP response requestId mismatch');
        error.code = 'local_nlp_request_mismatch';
        throw error;
      }
      const analysis = response.analysis || {};
      const rawFindings = Array.isArray(analysis.findings) ? analysis.findings : [];
      return {
        version: analysis.engine || version,
        findings: rawFindings.map((finding, index) => ({
          id: `${finding.ruleId || 'local-nlp'}@${finding.start ?? 0}:${index}`,
          ruleId: String(finding.ruleId || 'local-nlp'),
          kind: String(finding.kind || 'notice'),
          severity: String(finding.severity || 'review'),
          confidence: Number.isFinite(finding.confidence) ? finding.confidence : 0.5,
          start: Number(finding.start || 0),
          end: Number(finding.end ?? finding.start ?? 0),
          before: String(finding.before || ''),
          ...(finding.after !== undefined ? { after: String(finding.after) } : {}),
          explanation: String(finding.explanation || 'Local linguistic analysis.'),
          origin: String(finding.origin || 'local-morphology'),
          evidence: {
            engine: analysis.engine || '',
            protocolVersion: response.protocolVersion || null
          }
        }))
      };
    }
  });
}

function abortError() {
  const error = new Error('analysis aborted');
  error.name = 'AbortError';
  error.code = 'analysis_aborted';
  return error;
}

function cryptoRandomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
