#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { createDb } from "@local-review/db";
import { GitService, getGitService } from "./services/git.service.js";
import { gitTools, handleGitTool } from "./tools/git.js";
import { sessionsTools, handleSessionsTool } from "./tools/sessions.js";
import { commentsTools, handleCommentsTool } from "./tools/comments.js";
import { filesTools, handleFilesTool } from "./tools/files.js";

// Database initialization
const DATABASE_URL = process.env.DATABASE_URL || ".local-review.db";
const db = createDb(DATABASE_URL);

// Create MCP server
const server = new Server(
  {
    name: "local-review",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Return list of tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [...gitTools, ...sessionsTools, ...commentsTools, ...filesTools],
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Git tools
    if (name.startsWith("git:")) {
      return await handleGitTool(name, args as Record<string, unknown>);
    }

    // Sessions tools
    if (name.startsWith("sessions:")) {
      return await handleSessionsTool(name, args as Record<string, unknown>, db);
    }

    // Comments tools
    if (name.startsWith("comments:")) {
      return await handleCommentsTool(name, args as Record<string, unknown>, db);
    }

    // Files tools
    if (name.startsWith("files:") || name.startsWith("activities:")) {
      return await handleFilesTool(name, args as Record<string, unknown>, db);
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Local Review MCP Server running on stdio");
}

main().catch(console.error);
