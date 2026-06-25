export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 64) || 'export';
}

export function safeFileName(projectName: string, format: string): string {
  const slug = sanitizeFileName(projectName);
  return `origina-${slug}-report.${format}`;
}

export const INPUT_LIMITS = {
  projectName: { maxLength: 200 },
  idea: { maxLength: 10000 },
  problemDescription: { maxLength: 5000 },
  chatMessage: { maxLength: 5000 },
  refineInstruction: { maxLength: 2000 },
  artifactPrompt: { maxLength: 500 },
} as const;

export function validateLength(value: string, field: string, max: number): string | null {
  if (value.length > max) {
    return `${field} must be ${max} characters or fewer.`;
  }
  return null;
}
