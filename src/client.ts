const BASE_URL = "https://app.sonjj.com";

function getApiKey(): string {
  const key = process.env.SMAILPRO_API_KEY;
  if (!key) {
    throw new Error(
      "SMAILPRO_API_KEY environment variable is not set. " +
        "Get your API key at https://my.sonjj.com"
    );
  }
  return key;
}

export async function get<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<{ data: T; remainingCredit: string | null }> {
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorCode = response.status;
    let message = `SmailPro API error: ${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body?.detail) {
        message = `SmailPro API error: ${body.detail}`;
      }
    } catch {
      // ignore JSON parse error, use default message
    }
    const remainingCredit = response.headers.get("x-remaining-credit");
    if (errorCode === 402 || message.toLowerCase().includes("credit")) {
      message += `\nInsufficient credits. Remaining: ${remainingCredit || "Unknown"}. Top up at my.sonjj.com`;
    }
    throw new Error(message);
  }

  return {
    data: (await response.json()) as T,
    remainingCredit: response.headers.get("x-remaining-credit"),
  };
}
