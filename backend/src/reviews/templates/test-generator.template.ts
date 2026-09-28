export function buildTestGeneratorPrompt(code: string): string {
  return `You are an automated testing and QA engineer. Analyze the following code and design a comprehensive unit and integration test strategy:
- Critical edge cases, nullability, boundary values
- Missing branch coverage and error handling tests
- Mocking boundaries and external dependency isolation
- Concrete test specifications and sample test cases

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
