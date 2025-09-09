#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

class TailscaleMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "tailscale-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tailnet = process.env.TAILNET;
    this.apiKey = process.env.TAILSCALE_TOKEN;

    if (!this.tailnet || !this.apiKey) {
      throw new Error("TAILNET and TAILSCALE_TOKEN environment variables are required");
    }

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_devices",
          description: "List all devices in the Tailscale network",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_device_info",
          description: "Get detailed information about a specific device",
          inputSchema: {
            type: "object",
            properties: {
              device_id: {
                type: "string",
                description: "The device ID to get information for",
              },
            },
            required: ["device_id"],
          },
        },
        {
          name: "enable_device",
          description: "Enable a device in the Tailscale network",
          inputSchema: {
            type: "object",
            properties: {
              device_id: {
                type: "string",
                description: "The device ID to enable",
              },
            },
            required: ["device_id"],
          },
        },
        {
          name: "disable_device",
          description: "Disable a device in the Tailscale network",
          inputSchema: {
            type: "object",
            properties: {
              device_id: {
                type: "string",
                description: "The device ID to disable",
              },
            },
            required: ["device_id"],
          },
        },
        {
          name: "get_acl",
          description: "Get the current ACL (Access Control List) configuration",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_dns_settings",
          description: "Get DNS settings for the tailnet",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_devices":
            return await this.listDevices();
          case "get_device_info":
            return await this.getDeviceInfo(args.device_id);
          case "enable_device":
            return await this.enableDevice(args.device_id);
          case "disable_device":
            return await this.disableDevice(args.device_id);
          case "get_acl":
            return await this.getACL();
          case "get_dns_settings":
            return await this.getDNSSettings();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async makeAPICall(endpoint, method = "GET", body = null) {
    const url = `https://api.tailscale.com/api/v2/tailnet/${this.tailnet}${endpoint}`;
    
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async listDevices() {
    const data = await this.makeAPICall("/devices");
    
    const devicesList = data.devices.map(device => ({
      id: device.id,
      name: device.name,
      hostname: device.hostname,
      clientVersion: device.clientVersion,
      os: device.os,
      addresses: device.addresses,
      enabled: device.enabled,
      online: device.online,
      lastSeen: device.lastSeen,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(devicesList, null, 2),
        },
      ],
    };
  }

  async getDeviceInfo(deviceId) {
    const data = await this.makeAPICall(`/devices/${deviceId}`);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async enableDevice(deviceId) {
    await this.makeAPICall(`/devices/${deviceId}/authorized`, "POST", { authorized: true });
    
    return {
      content: [
        {
          type: "text",
          text: `Device ${deviceId} has been enabled`,
        },
      ],
    };
  }

  async disableDevice(deviceId) {
    await this.makeAPICall(`/devices/${deviceId}/authorized`, "POST", { authorized: false });
    
    return {
      content: [
        {
          type: "text",
          text: `Device ${deviceId} has been disabled`,
        },
      ],
    };
  }

  async getACL() {
    const data = await this.makeAPICall("/acl");
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getDNSSettings() {
    const data = await this.makeAPICall("/dns/preferences");
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Tailscale MCP server running on stdio");
  }
}

async function main() {
  const server = new TailscaleMCPServer();
  await server.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
