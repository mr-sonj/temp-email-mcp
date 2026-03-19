import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get } from "../client.js";
import { formatResponse, extractOTPAndLinks } from "./formatter.js";

interface TempOutlookItem {
  emails: string[];
  timestamp: number;
}

interface Pagination {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
}

interface ListTempOutlookResponse {
  data: TempOutlookItem[];
  pagination: Pagination;
}

interface RandomTempOutlookResponse {
  email: string;
  timestamp: number;
  type: "real" | "alias";
}

interface InboxMessage {
  mid: string;
  textDate: string;
  textTo: string;
  textFrom: string;
  textSubject: string;
}

interface InboxResponse {
  messages: InboxMessage[];
}

interface MessageResponse {
  body: string;
}

export function registerTempOutlookTools(server: McpServer): void {
  // Tool 1: List temporary Outlook accounts
  server.tool(
    "temp_outlook_list",
    "List available temporary Outlook email addresses from the pool of 3000+. Cost: 2.00 credits.",
    {
      page: z
        .number()
        .int()
        .min(1)
        .optional()
        .default(1)
        .describe("Page number (default: 1)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .describe("Number of results per page (default: 10)"),
      type: z
        .enum(["real", "alias"])
        .optional()
        .default("alias")
        .describe("Type of Outlook email — 'real' or 'alias' (default: alias)"),
    },
    async ({ page, limit, type }) => {
      const { data, remainingCredit } = await get<ListTempOutlookResponse>(
        "/v1/temp_outlook/list",
        { page, limit, type }
      );
      
      let body = `Total emails available: ${data.pagination.total_count}\n`;
      data.data.forEach((item) => {
        body += `- Emails: ${item.emails.join(", ")} | Timestamp: ${item.timestamp}\n`;
      });
      const nextSteps = `Use 'temp_outlook_get_inbox' with an email and its timestamp to check for messages.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("List Temporary Outlooks", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 2: Get a random temporary Outlook
  server.tool(
    "temp_outlook_random",
    "Get a random temporary Outlook address from the pool. Cost: 0.50 credit.",
    {
      type: z
        .enum(["real", "alias"])
        .optional()
        .default("alias")
        .describe("Type of Outlook email — 'real' or 'alias' (default: alias)"),
      password: z
        .string()
        .optional()
        .describe("Optional password to protect others from checking your message list (if supported)"),
    },
    async ({ type, password }) => {
      const { data, remainingCredit } = await get<RandomTempOutlookResponse>(
        "/v1/temp_outlook/random",
        { type, password }
      );
      
      const body = `Email: ${data.email}\nTimestamp: ${data.timestamp}\nType: ${data.type}`;
      const nextSteps = `Use 'temp_outlook_get_inbox' with email '${data.email}' and timestamp '${data.timestamp}' to check for incoming messages.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Random Temporary Outlook", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 3: Get Outlook inbox
  server.tool(
    "temp_outlook_get_inbox",
    "Retrieve messages in a temporary Outlook inbox after a given timestamp. Cost: 0.05 credit.",
    {
      email: z.string().describe("The temporary Outlook email address to check"),
      timestamp: z
        .number()
        .int()
        .optional()
        .default(0)
        .describe(
          "Unix timestamp — only messages received after this time will be returned. Default 0 brings all messages."
        ),
    },
    async ({ email, timestamp }) => {
      const { data, remainingCredit } = await get<InboxResponse>("/v1/temp_outlook/inbox", {
        email,
        timestamp,
      });
      
      let body = `Messages found: ${data.messages.length}\n`;
      data.messages.forEach((m) => {
        body += `- Date: ${m.textDate} | From: ${m.textFrom} | ID: ${m.mid}\n  Subject: ${m.textSubject}\n`;
      });
      const nextSteps = data.messages.length > 0
        ? `Use 'temp_outlook_get_message' with a message ID (mid) from above to read its full content.`
        : `No new messages found. Wait a bit and check again.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Outlook Inbox", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 4: Get specific Outlook message content
  server.tool(
    "temp_outlook_get_message",
    "Retrieve the full body content, OTP codes, and links of a specific message. Cost: 2.00 credits.",
    {
      email: z
        .string()
        .describe("The temporary Outlook email address that received the message"),
      mid: z
        .string()
        .describe(
          "The message ID (from temp_outlook_get_inbox response) to retrieve"
        ),
    },
    async ({ email, mid }) => {
      const { data, remainingCredit } = await get<MessageResponse>("/v1/temp_outlook/message", {
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
            text: formatResponse("Outlook Message Content", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );
}
