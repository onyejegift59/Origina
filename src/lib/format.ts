export function formatContentForCopy(content: Record<string, unknown>, label?: string): string {
  const lines: string[] = [];
  if (label) lines.push(label, '');

  for (const [key, value] of Object.entries(content)) {
    const heading = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
    if (Array.isArray(value)) {
      lines.push(`${heading}:`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          lines.push(formatContentForCopy(item as Record<string, unknown>));
        } else {
          lines.push(`  - ${item}`);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${heading}:`);
      const sub = formatContentForCopy(value as Record<string, unknown>);
      lines.push(sub.split('\n').map((l) => `  ${l}`).join('\n'));
    } else {
      lines.push(`${heading}: ${value}`);
    }
  }
  return lines.join('\n');
}
