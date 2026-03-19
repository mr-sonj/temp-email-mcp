#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTempMailTools } from "./tools/temp-mail.js";
import { registerTempGmailTools } from "./tools/temp-gmail.js";
import { registerTempOutlookTools } from "./tools/temp-outlook.js";

const server = new McpServer({
  name: "temp-email-mcp",
  version: "1.0.0",
  description:
    "MCP server for SmailPro — access temporary Gmail, Outlook, and custom-domain email via AI assistants",
});

// Register all 12 tools
registerTempMailTools(server);    // 4 tools: TempMailAPI (custom domains)
registerTempGmailTools(server);   // 5 tools: TempGmailAPI (5000+ Gmail pool)
registerTempOutlookTools(server); // 3 tools: TempOutlookAPI (3000+ Outlook pool)

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SmailPro MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
