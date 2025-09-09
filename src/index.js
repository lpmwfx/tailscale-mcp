#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from 'child_process';

class TailscaleMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "tailscale-mcp",
        version: "2.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "tailscale_status",
          description: "Show current Tailscale status and connected devices",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "tailscale_ping",
          description: "Ping a device on your tailnet",
          inputSchema: {
            type: "object",
            properties: {
              device: {
                type: "string",
                description: "Device name or IP to ping",
              },
            },
            required: ["device"],
          },
        },
        {
          name: "tailscale_ssh",
          description: "Get SSH command to connect to a device",
          inputSchema: {
            type: "object",
            properties: {
              device: {
                type: "string",
                description: "Device name or IP to SSH to",
              },
            },
            required: ["device"],
          },
        },
        {
          name: "tailscale_ip",
          description: "Show Tailscale IP addresses",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "tailscale_netcheck",
          description: "Check network connectivity and NAT traversal",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "tailscale_whois",
          description: "Show information about a Tailscale IP address",
          inputSchema: {
            type: "object",
            properties: {
              ip: {
                type: "string",
                description: "Tailscale IP address to look up",
              },
            },
            required: ["ip"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;
        switch (name) {
          case "tailscale_status":
            result = await this.runTailscaleCommand(["status"]);
            break;
          case "tailscale_ping":
            if (!args?.device) {
              throw new Error('device parameter is required');
            }
            result = await this.runTailscaleCommand(["ping", args.device]);
            break;
          case "tailscale_ssh":
            if (!args?.device) {
              throw new Error('device parameter is required');
            }
            result = {
              content: [{
                type: "text",
                text: `To SSH to ${args.device}, run:\n\ntailscale ssh ${args.device}\n\nOr use the standard SSH command:\nssh ${args.device}`
              }]
            };
            break;
          case "tailscale_ip":
            result = await this.runTailscaleCommand(["ip"]);
            break;
          case "tailscale_netcheck":
            result = await this.runTailscaleCommand(["netcheck"]);
            break;
          case "tailscale_whois":
            if (!args?.ip) {
              throw new Error('ip parameter is required');
            }
            result = await this.runTailscaleCommand(["whois", args.ip]);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        return result;
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true
        };
      }
    });
  }

  async runTailscaleCommand(args) {
    return new Promise((resolve, reject) => {
      const process = spawn('tailscale', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`tailscale ${args.join(' ')} failed with code ${code}: ${stderr}`));
          return;
        }

        resolve({
          content: [
            {
              type: "text",
              text: stdout.trim() || "(no output)",
            },
          ],
        });
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to run tailscale command: ${error.message}`));
      });
    });
  }

  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("Tailscale CLI MCP server running");
    } catch (error) {
      console.error("Failed to start MCP server:", error.message);
      process.exit(1);
    }
  }
}

async function main() {
  try {
    const server = new TailscaleMCPServer();
    await server.start();
  } catch (error) {
    console.error("Failed to initialize server:", error.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Unhandled server error:", error);
    process.exit(1);
  });
}
