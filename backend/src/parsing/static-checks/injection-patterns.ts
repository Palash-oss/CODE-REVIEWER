export interface StaticFinding {
  line: number;
  message: string;
  pattern: string;
}

const PATTERNS: { regex: RegExp; message: string }[] = [
  { regex: /eval\s*\(/, message: 'Use of eval() — code injection risk' },
  { regex: /exec\s*\(\s*["'`].*\$\{/, message: 'Possible command injection via string interpolation' },
  { regex: /(SELECT|INSERT|UPDATE|DELETE)\s.*\+\s*[a-zA-Z_]/i, message: 'Possible SQL injection — string concatenation in query' },
  { regex: /child_process/, message: 'Uses child_process — review for unsanitized input' },
  { regex: /dangerouslySetInnerHTML/, message: 'React dangerouslySetInnerHTML — XSS risk if input is unsanitized' },
];

export function findInjectionRisks(content: string): StaticFinding[] {
  const lines = content.split('\n');
  const findings: StaticFinding[] = [];

  lines.forEach((line, index) => {
    for (const { regex, message } of PATTERNS) {
      if (regex.test(line)) {
        findings.push({ line: index + 1, message, pattern: regex.source });
      }
    }
  });

  return findings;
}