export function buildSecurityPrompt(code: string, staticFindings: string[]): string {
  const findingsBlock = staticFindings.length
    ? `\nAutomated pattern scan already flagged these (verify, don't just repeat them blindly):\n${staticFindings.join('\n')}`
    : '';

  return `You are a security-focused code reviewer. Analyze the following code for:
- Hardcoded credentials
- Authentication issues
- Input validation gaps
- Injection risks (SQL, command, XSS)
${findingsBlock}

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