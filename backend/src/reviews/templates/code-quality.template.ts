export function buildCodeQualityPrompt(code: string): string {
  return `You are a code-quality-focused reviewer. Analyze the following code for:
- Naming clarity
- Structure and separation of concerns
- Readability
- Maintainability (duplication, overly complex functions)

Code:
\`\`\`
${code}
\`\`\`

Respond ONLY with valid JSON in this exact shape, no markdown fences, no preamble:
{
  "summary": "string",
  "issues": [{"line": number, "message": "string", "severity": "critical"|"high"|"medium"|"low"}],
  "recommendations": ["string"]
}`;
}