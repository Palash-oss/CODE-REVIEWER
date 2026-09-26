export interface StaticFinding {
  line: number;
  message: string;
  pattern: string;
}

const PATTERNS: { regex: RegExp; message: string }[] = [
  { regex: /(api[_-]?key|apikey)\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/i, message: 'Possible hardcoded API key' },
  { regex: /(secret|password|passwd)\s*[:=]\s*["'][^"']{6,}["']/i, message: 'Possible hardcoded secret/password' },
  { regex: /AKIA[0-9A-Z]{16}/, message: 'Possible AWS access key' },
  { regex: /-----BEGIN (RSA|EC|DSA)? ?PRIVATE KEY-----/, message: 'Embedded private key' },
];

export function findSecrets(content: string): StaticFinding[] {
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