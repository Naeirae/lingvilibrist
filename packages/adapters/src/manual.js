export function createManualSource(text, metadata = {}) {
  const value = String(text ?? '').replace(/\r/g, '').trim();
  return {
    source: {
      kind: 'manual',
      reliability: 'high',
      title: String(metadata.title || ''),
      url: '',
      readMode: 'manual'
    },
    text: value,
    blocks: value
      .split(/\n{2,}/)
      .map((block, index) => ({
        id: `b${index + 1}`,
        type: 'paragraph',
        text: block.trim(),
        sourceOrder: index + 1
      }))
      .filter((block) => block.text)
  };
}
