# temp-email-mcp

[![npm version](https://badge.fury.io/js/temp-email-mcp.svg)](https://www.npmjs.com/package/temp-email-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for [**SmailPro**](https://smailpro.com) — access [temporary Gmail](https://smailpro.com), [Temp Outlook](https://smailpro.com), and custom-domain [temporary email](https://smailpro.com) addresses seamlessly via AI assistants (Claude, Cursor, Windsurf, etc.).

## Features

- 🔴 **[Temp Gmail](https://smailpro.com)** — Instant access to a pool of 5,000+ real Gmail addresses
- 🔵 **[Temp Outlook](https://smailpro.com)** — Instant access to a pool of 3,000+ real Outlook addresses
- 📧 **[Temp Mail](https://smailpro.com)** — Instantly generate temporary emails with custom domains (20+ available)
- 🔑 API key authentication via [my.sonjj.com](https://my.sonjj.com)

---

## Prerequisites

1. Create an account at [my.sonjj.com](https://my.sonjj.com) to get your **API key**
2. Purchase credits: [SonjJ API Credits Guide](https://sonjj.com/sonjj-api-credits-system-guide/)

---

## Quick Start

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "smailpro": {
      "command": "npx",
      "args": ["-y", "temp-email-mcp"],
      "env": {
        "SMAILPRO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "smailpro": {
      "command": "npx",
      "args": ["-y", "temp-email-mcp"],
      "env": {
        "SMAILPRO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "smailpro": {
      "command": "npx",
      "args": ["-y", "temp-email-mcp"],
      "env": {
        "SMAILPRO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SMAILPRO_API_KEY` | ✅ Yes | Your API key from [my.sonjj.com](https://my.sonjj.com) |

---

## Available Tools (12)

### 📧 TempMailAPI — Custom Domain Email

| Tool | Description |
|------|-------------|
| `temp_mail_get_domains` | Get list of available email domains |
| `temp_mail_create` | Create a temporary email address |
| `temp_mail_get_inbox` | Check inbox for a temporary email |
| `temp_mail_get_message` | Read full content of a specific message |

### 🔴 TempGmailAPI — Gmail Pool

| Tool | Description |
|------|-------------|
| `temp_gmail_list` | List available Gmail addresses (paginated) |
| `temp_gmail_random` | Get a random Gmail address instantly |
| `temp_gmail_get_inbox` | Check Gmail inbox (filter by timestamp) |
| `temp_gmail_get_message` | Read full content of a Gmail message |
| `temp_gmail_remove_message` | Remove a message from Gmail inbox (beta) |

### 🔵 TempOutlookAPI — Outlook Pool

| Tool | Description |
|------|-------------|
| `temp_outlook_list` | List available Outlook addresses (paginated) |
| `temp_outlook_get_inbox` | Check Outlook inbox (filter by timestamp) |
| `temp_outlook_get_message` | Read full content of an Outlook message |

---

## Credits Cost Per Call

| Tool | Credits |
|------|---------|
| `temp_mail_get_domains` | 1.00 |
| `temp_mail_create` | 1.00 |
| `temp_mail_get_inbox` | 0.05 |
| `temp_mail_get_message` | 1.00 |
| `temp_gmail_list` | 2.00 |
| `temp_gmail_random` | 0.50 |
| `temp_gmail_get_inbox` | 0.05 |
| `temp_gmail_get_message` | 1.50 |
| `temp_gmail_remove_message` | free |
| `temp_outlook_list` | 2.00 |
| `temp_outlook_get_inbox` | 0.05 |
| `temp_outlook_get_message` | 2.00 |

---

## Example Usage in Claude

```
Create a temporary Gmail for me and check if any emails arrived.
```

Claude will automatically:
1. Call `temp_gmail_random` to get a Gmail address
2. Wait, then call `temp_gmail_get_inbox` with the returned timestamp
3. Call `temp_gmail_get_message` to read message content if any arrived

---

## Links

- 🌐 [smailpro.com](https://smailpro.com)
- 📖 [API Docs](https://sonjj.com/docs)
- 🔑 [Get API Key](https://my.sonjj.com)
- 💳 [Credits Guide](https://sonjj.com/sonjj-api-credits-system-guide/)
