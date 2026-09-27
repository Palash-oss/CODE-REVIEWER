export function buildPerformancePrompt(code: string): string {
  return `You are a performance-focused code reviewer. Analyze the following code for:
- Slow or blocking operations
- Inefficient rendering (unnecessary re-renders, large loops in render paths)
- Unnecessary or repeated database queries (N+1 patterns)
- Unbounded loops or recursion

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