import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get } from "../client.js";
import { formatResponse, extractOTPAndLinks } from "./formatter.js";

interface GmailData {
  email: string;
  timestamp: number;
}

interface Pagination {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
}

interface ListGmailOut {
  data: GmailData[];
  pagination: Pagination;
}

interface RandomGmailOut {
  email: string;
  timestamp: number;
  type: "real" | "alias";
}

interface InboxGmailItem {
  mid: string;
  textTo: string;
  textFrom: string;
  textSubject: string;
  textDate: string;
}

interface InboxGmailOut {
  messages: InboxGmailItem[];
}

interface MessageGmailOut {
  body: string;
}

export function registerTempGmailTools(server: McpServer): void {
  // Tool 1: List temporary gmail accounts
  server.tool(
    "temp_gmail_list",
    "List available temporary Gmail addresses from the pool of 5000+. Cost: 2.00 credits. Next step: use temp_gmail_get_inbox",
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
        .describe("Type of Gmail — 'real' or 'alias' (default: alias)"),
      password: z
        .string()
        .optional()
        .describe(
          "Optional password to protect others from checking your message list"
        ),
    },
    async ({ page, limit, type, password }) => {
      const { data, remainingCredit } = await get<ListGmailOut>("/v1/temp_gmail/list", {
        page,
        limit,
        type,
        password,
      });
      let body = `Total emails available: ${data.pagination.total_count}\n`;
      data.data.forEach((g) => {
        body += `- Email: ${g.email} | Timestamp: ${g.timestamp}\n`;
      });
      const nextSteps = `Use 'temp_gmail_get_inbox' with an email and its timestamp to check for messages.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("List Temporary Gmails", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 2: Get a random temporary Gmail
  server.tool(
    "temp_gmail_random",
    "Get a random temporary Gmail address from the pool. Cost: 0.50 credit. Next step: use temp_gmail_get_inbox",
    {
      type: z
        .enum(["real", "alias"])
        .optional()
        .default("alias")
        .describe("Type of Gmail — 'real' or 'alias' (default: alias)"),
      password: z
        .string()
        .optional()
        .describe(
          "Optional password to protect others from checking your message list"
        ),
    },
    async ({ type, password }) => {
      const { data, remainingCredit } = await get<RandomGmailOut>("/v1/temp_gmail/random", {
        type,
        password,
      });
      const body = `Email: ${data.email}\nTimestamp: ${data.timestamp}\nType: ${data.type}`;
      const nextSteps = `Use 'temp_gmail_get_inbox' with email '${data.email}' and timestamp '${data.timestamp}' to check for incoming messages.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Random Temporary Gmail", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 3: Get Gmail inbox
  server.tool(
    "temp_gmail_get_inbox",
    "Retrieve messages in a temporary Gmail inbox after a given timestamp. Cost: 0.05 credit. Next step: use temp_gmail_get_message",
    {
      email: z.string().describe("The temporary Gmail address to check"),
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
      const { data, remainingCredit } = await get<InboxGmailOut>("/v1/temp_gmail/inbox", {
        email,
        timestamp,
      });
      let body = `Messages found: ${data.messages.length}\n`;
      data.messages.forEach((m) => {
        body += `- Date: ${m.textDate} | From: ${m.textFrom} | ID: ${m.mid}\n  Subject: ${m.textSubject}\n`;
      });
      const nextSteps = data.messages.length > 0
        ? `Use 'temp_gmail_get_message' with a message ID (mid) from above to read its full content and extract OTP/links.`
        : `No new messages found. Wait a bit and check again.`;
        
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Gmail Inbox", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 4: Get specific Gmail message content
  server.tool(
    "temp_gmail_get_message",
    "Retrieve the full body content, OTP codes, and links of a specific message. Cost: 1.50 credits.",
    {
      email: z
        .string()
        .describe("The temporary Gmail address that received the message"),
      mid: z
        .string()
        .describe(
          "The message ID (from temp_gmail_get_inbox response) to retrieve"
        ),
    },
    async ({ email, mid }) => {
      const { data, remainingCredit } = await get<MessageGmailOut>("/v1/temp_gmail/message", {
        email,
        mid,
      });
      
      const extracted = extractOTPAndLinks(data.body);
      let body = `Message ID: ${mid}\n\n`;
      body += `[Extracted Data]\n`;
      body += `- OTP Codes: ${extracted.otpCodes.join(", ") || "None found"}\n`;
      body += `- Verification Links: \n${extracted.links.map(l => "  " + l).join("\n") || "  None found"}\n\n`;
      body += `[Full Body]\n${data.body.substring(0, 1500)}${data.body.length > 1500 ? "\n...(truncated)" : ""}`;
      
      const nextSteps = `If you found the verification link or OTP, proceed with your task. Otherwise, use 'temp_gmail_remove_message' to clean up.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Gmail Message Content", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );

  // Tool 5: Remove Gmail message (beta, free)
  server.tool(
    "temp_gmail_remove_message",
    "Remove a specific message from a temporary Gmail inbox. Cost: free.",
    {
      email: z
        .string()
        .describe("The temporary Gmail address that owns the message"),
      mid: z
        .string()
        .describe("The message ID (from temp_gmail_get_inbox) to remove"),
    },
    async ({ email, mid }) => {
      const { remainingCredit } = await get<unknown>("/v1/temp_gmail/remove_message", {
        email,
        mid,
      });
      
      const body = `Message '${mid}' for email '${email}' has been removed successfully.`;
      const nextSteps = `None.`;
      
      return {
        content: [
          {
            type: "text",
            text: formatResponse("Remove Gmail Message", body, nextSteps, remainingCredit),
          },
        ],
      };
    }
  );
}
