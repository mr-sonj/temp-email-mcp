import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get } from "../client.js";

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
    "List available temporary Gmail addresses from the pool of 5000+. Cost: 2.00 credits.",
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
      const result = await get<ListGmailOut>("/v1/temp_gmail/list", {
        page,
        limit,
        type,
        password,
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

  // Tool 2: Get a random temporary Gmail
  server.tool(
    "temp_gmail_random",
    "Get a random temporary Gmail address from the pool. Cost: 0.50 credit.",
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
      const result = await get<RandomGmailOut>("/v1/temp_gmail/random", {
        type,
        password,
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

  // Tool 3: Get Gmail inbox
  server.tool(
    "temp_gmail_get_inbox",
    "Retrieve messages in a temporary Gmail inbox after a given timestamp. Cost: 0.05 credit.",
    {
      email: z.string().describe("The temporary Gmail address to check"),
      timestamp: z
        .number()
        .int()
        .describe(
          "Unix timestamp — only messages received after this time will be returned. Use the 'timestamp' field from temp_gmail_random or temp_gmail_list response."
        ),
    },
    async ({ email, timestamp }) => {
      const result = await get<InboxGmailOut>("/v1/temp_gmail/inbox", {
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

  // Tool 4: Get specific Gmail message content
  server.tool(
    "temp_gmail_get_message",
    "Retrieve the full body content of a specific Gmail message. Cost: 1.50 credits.",
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
      const result = await get<MessageGmailOut>("/v1/temp_gmail/message", {
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

  // Tool 5: Remove Gmail message (beta, free)
  server.tool(
    "temp_gmail_remove_message",
    "Remove a specific message from a temporary Gmail inbox (beta feature). Cost: free.",
    {
      email: z
        .string()
        .describe("The temporary Gmail address that owns the message"),
      mid: z
        .string()
        .describe("The message ID (from temp_gmail_get_inbox) to remove"),
    },
    async ({ email, mid }) => {
      const result = await get<unknown>("/v1/temp_gmail/remove_message", {
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
