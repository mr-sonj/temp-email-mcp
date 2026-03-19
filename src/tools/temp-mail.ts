import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get } from "../client.js";

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
      const result = await get<DomainsOut>("/v1/temp_email/domains");
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
      const result = await get<unknown>("/v1/temp_email/create", {
        email,
        expiry_minutes,
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
      const result = await get<InboxOut>("/v1/temp_email/inbox", { email });
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

  // Tool 4: Get specific message
  server.tool(
    "temp_mail_get_message",
    "Retrieve the full content of a specific message from a temporary email inbox. Cost: 1.00 credit.",
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
      const result = await get<MessageOut>("/v1/temp_email/message", {
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
