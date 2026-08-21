export const generalDeclarativeRules = Object.freeze([
  Object.freeze({
    id: 'general.double-space',
    kind: 'regex_replace',
    pattern: ' {2,}',
    flags: 'g',
    replacement: ' ',
    severity: 'safe',
    confidence: 1,
    explanation: 'Several ordinary spaces occur in a row.'
  }),
  Object.freeze({
    id: 'general.space-before-punctuation',
    kind: 'regex_replace',
    pattern: ' +([,.;:!?])',
    flags: 'g',
    replacement: '$1',
    severity: 'safe',
    confidence: 1,
    explanation: 'An ordinary space appears immediately before punctuation.'
  }),
  Object.freeze({
    id: 'general.space-after-opening',
    kind: 'regex_replace',
    pattern: '([«„(]) +',
    flags: 'g',
    replacement: '$1',
    severity: 'safe',
    confidence: 1,
    explanation: 'An ordinary space appears immediately after an opening quote or bracket.'
  })
]);
