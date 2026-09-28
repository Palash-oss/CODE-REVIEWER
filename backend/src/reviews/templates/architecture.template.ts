export function buildArchitecturePrompt(code: string): string {
  return `You are a software architecture expert. Analyze the following code for:
- Modular design and separation of concerns
- Architectural coupling, cohesion, and potential circular dependencies
- State management and side-effect isolation
- Scalability bottlenecks and domain boundary violations

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
