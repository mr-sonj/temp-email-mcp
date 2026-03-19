import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get } from "../client.js";
import { formatResponse, extractOTPAndLinks } from "./formatter.js";

interface DomainsOut {
  domains: string[];
}

interface InboxItem {
  mid: string;
  textTo: string;
  textFrom: string;
  textSubject: string;
  textDate: string;
}

interface InboxOut {
  messages: InboxItem[];
}

interface MessageOut {
  body: string;
}

export function registerTempMailTools(server: McpServer): void {
  // Tool 1: Get allowed domains
  server.tool(
    "temp_mail_get_domains",
    "Get the list of allowed domains for temporary email service. Cost: 1.00 credit.",
    {},
    async () => {
      const { data, remainingCredit } = await get<DomainsOut>("/v1/temp_email/domains");
      const body = `Allowed domains:\n` + data.domains.map((d) => `- ${d}`).join("\n");
      const nextSteps = `Use 'temp_mail_create' with one of these domains to create a new temporary email.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Allowed Domains", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 2: Create temporary email
  server.tool(
    "temp_mail_create",
    "Create a temporary email address with an optional expiration time. Cost: 1.00 credit.",
    {
      email: z
        .string()
        .describe(
          "The email address to create (use a domain from temp_mail_get_domains)"
        ),
      expiry_minutes: z
        .number()
        .int()
        .min(0)
        .max(20160)
        .optional()
        .default(0)
        .describe("Expiration time in minutes (max 20160, 0 = no expiry)"),
    },
    async ({ email, expiry_minutes }) => {
      const { remainingCredit } = await get<unknown>("/v1/temp_email/create", {
        email,
        expiry_minutes,
      });
      const body = `Temporary email '${email}' created successfully!`;
      const nextSteps = `Use 'temp_mail_get_inbox' with this email address to check for incoming messages.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Create Temporary Email", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 3: Get inbox
  server.tool(
    "temp_mail_get_inbox",
    "Retrieve all messages in a temporary email inbox. Cost: 0.05 credit.",
    {
      email: z
        .string()
        .describe("The temporary email address to check the inbox for"),
    },
    async ({ email }) => {
      const { data, remainingCredit } = await get<InboxOut>("/v1/temp_email/inbox", { email });
      let body = `Messages found: ${data.messages.length}\n`;
      data.messages.forEach((m) => {
        body += `- Date: ${m.textDate} | From: ${m.textFrom} | ID: ${m.mid}\n  Subject: ${m.textSubject}\n`;
      });
      const nextSteps = data.messages.length > 0
        ? `Use 'temp_mail_get_message' with a message ID (mid) from above to read its full content.`
        : `No new messages found. Wait a bit and check again.`;
        
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Generic Inbox", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 4: Get specific message
  server.tool(
    "temp_mail_get_message",
    "Retrieve the full content, OTP codes, and links of a specific message. Cost: 1.00 credit.",
    {
      email: z
        .string()
        .describe("The temporary email address whose message to retrieve"),
      mid: z
        .string()
        .describe(
          "The message ID (from temp_mail_get_inbox response) to retrieve"
        ),
    },
    async ({ email, mid }) => {
      const { data, remainingCredit } = await get<MessageOut>("/v1/temp_email/message", {
        email,
        mid,
      });
      
      const extracted = extractOTPAndLinks(data.body);
      let body = `Message ID: ${mid}\n\n`;
      body += `[Extracted Data]\n`;
      body += `- OTP Codes: ${extracted.otpCodes.join(", ") || "None found"}\n`;
      body += `- Verification Links: \n${extracted.links.map(l => "  " + l).join("\n") || "  None found"}\n\n`;
      body += `[Full Body]\n${data.body.substring(0, 1500)}${data.body.length > 1500 ? "\n...(truncated)" : ""}`;
      
      const nextSteps = `If you found the verification link or OTP, proceed with your task.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Generic Message Content", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );
}
