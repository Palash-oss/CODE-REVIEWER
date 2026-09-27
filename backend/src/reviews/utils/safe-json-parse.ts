export function safeParseReviewJson(raw: string): {
  summary: string;
  issues: any[];
  recommendations: string[];
} {
  let cleaned = raw.trim();
  // strip markdown fences if the model added them despite instructions
  cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary ?? '',
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch {
    return { summary: 'Could not parse AI response.', issues: [], recommendations: [] };
  }
}