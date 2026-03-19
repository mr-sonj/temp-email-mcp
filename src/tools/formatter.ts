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
  // 1. Context-aware OTP extraction
  const otpCodesRegex = /(?:code|otp|pin|token|verify|verification|passcode)[\s\S]{0,40}?\b(\d{4,8})\b|\b(\d{4,8})\b[\s\S]{0,40}?(?:code|otp|pin|token|verify|verification|passcode)/gi;
  
  const otpCodes = Array.from(new Set(
    Array.from(text.matchAll(otpCodesRegex))
      .map(m => m[1] || m[2])
      .filter(m => {
        if (!m) return false;
        if (m.length === 4 && (m.startsWith("19") || m.startsWith("20"))) return false;
        if (["8080", "8000", "443", "3306", "5432", "27017"].includes(m)) return false;
        return true;
      })
  ));

  // 2. Filtered and sorted links extraction
  const rawLinks = Array.from(new Set(text.match(/https?:\/\/[^\s"'<>\n\]\)]+/g) || []));
  const filteredLinks = rawLinks.filter(link => {
    const l = link.toLowerCase();
    
    // Ignore static assets
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)(\?.*)?(#.*)?$/.test(l)) return false;
    
    // Ignore schemas
    if (l.includes('w3.org') || l.includes('schema.org') || l.includes('xmlns.com')) return false;
    
    try {
      const url = new URL(link);
      const host = url.hostname;
      
      const socialHosts = ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'pinterest.com', 'apple.com', 'play.google.com'];
      if (socialHosts.some(h => host.includes(h) || host === h)) return false;
      
      // Filter out root homepages without query parameters unless they have verify/auth in the domain
      if ((url.pathname === '/' || url.pathname === '') && !url.search) {
        if (!host.includes('auth') && !host.includes('verify')) {
           return false;
        }
      }
    } catch {
      // Keep if invalid URL parsing
    }
    return true;
  });

  filteredLinks.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const keywords = /verify|confirm|auth|token|reset|magic|activate|setup|login|signup/;
    const aMatch = keywords.test(aLower);
    const bMatch = keywords.test(bLower);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return b.length - a.length;
  });

  const links = filteredLinks.slice(0, 10);

  return { otpCodes, links };
}
