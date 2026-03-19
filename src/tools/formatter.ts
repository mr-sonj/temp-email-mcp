export function formatResponse(
  title: string,
  body: string,
  nextSteps: string,
  remainingCredit: string | null
): string {
  let text = `=== ${title} ===\n\n`;
  text += body;
  text += `\n\n=== Next Steps ===\n`;
  text += nextSteps;
  text += `\n\nCredits remaining: ${remainingCredit || "Unknown"}`;
  return text;
}

export function extractOTPAndLinks(text: string): {
  otpCodes: string[];
  links: string[];
} {
  const otpCodes = Array.from(new Set(text.match(/\b\d{4,8}\b/g) || []));
  const links = Array.from(new Set(text.match(/https?:\/\/[^\s"'<>\n]+/g) || []));
  return { otpCodes, links };
}
