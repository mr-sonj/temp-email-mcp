import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get } from "../client.js";

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
      const result = await get<ListTempOutlookResponse>(
        "/v1/temp_outlook/list",
        { page, limit, type }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Tool 2: Get Outlook inbox
  server.tool(
    "temp_outlook_get_inbox",
    "Retrieve messages in a temporary Outlook inbox after a given timestamp. Cost: 0.05 credit.",
    {
      email: z.string().describe("The temporary Outlook email address to check"),
      timestamp: z
        .number()
        .int()
        .describe(
          "Unix timestamp — only messages received after this time will be returned. Use the 'timestamp' field from temp_outlook_list response."
        ),
    },
    async ({ email, timestamp }) => {
      const result = await get<InboxResponse>("/v1/temp_outlook/inbox", {
        email,
        timestamp,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Tool 3: Get specific Outlook message content
  server.tool(
    "temp_outlook_get_message",
    "Retrieve the full body content of a specific Outlook message. Cost: 2.00 credits.",
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
      const result = await get<MessageResponse>("/v1/temp_outlook/message", {
        email,
        mid,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
