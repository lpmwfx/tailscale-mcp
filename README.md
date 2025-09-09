# Tailscale MCP Server

A Model Context Protocol (MCP) server that provides Tailscale network management through CLI commands.

## Features

- **Simple CLI integration** - Uses `tailscale` CLI commands directly
- **No API tokens needed** - Leverages your existing Tailscale authentication
- **Real-time status** - Check network status and device connectivity
- **Device management** - Ping devices and get SSH connection info
- **Network diagnostics** - Check connectivity and troubleshoot issues

## Installation

```bash
cd /Users/lpm/Repo/tailscale-mcp
npm install
```

## Warp Terminal Configuration

Add this configuration to your Warp MCP settings:

```json
{
  "tailscale": {
    "command": "node",
    "args": [
      "/Users/lpm/Repo/tailscale-mcp/src/index.js"
    ],
    "working_directory": null
  }
}
```

## Available Tools

### `tailscale_status`
Show current Tailscale network status and all connected devices.

**Example usage in Warp:**
```
Show my Tailscale network status
```

### `tailscale_ping`
Ping a device on your tailnet to test connectivity.

**Parameters:**
- `device` (required): Device name or IP to ping

**Example usage in Warp:**
```
Ping my device named "server"
Ping device 100.87.235.37
```

### `tailscale_ssh` 
Get SSH connection information for a device.

**Parameters:**
- `device` (required): Device name or IP to SSH to

**Example usage in Warp:**
```
How do I SSH to my server device?
Get SSH info for 100.87.235.37
```

### `tailscale_ip`
Show your Tailscale IP addresses (IPv4 and IPv6).

**Example usage in Warp:**
```
Show my Tailscale IP addresses
```

### `tailscale_netcheck`
Check network connectivity and NAT traversal capabilities.

**Example usage in Warp:**
```
Check my Tailscale network connectivity
Run network diagnostics
```

### `tailscale_whois`
Look up information about a Tailscale IP address.

**Parameters:**
- `ip` (required): Tailscale IP address to look up

**Example usage in Warp:**
```
Who owns Tailscale IP 100.87.235.37?
Look up device info for 100.68.225.52
```

## Requirements

- **Tailscale CLI installed** - Must have `tailscale` command available
- **Authenticated** - Must be logged in to Tailscale (`tailscale status` should work)
- **Node.js** - Version 18 or higher

## Testing

Test the MCP server manually:

```bash
cd /Users/lpm/Repo/tailscale-mcp
npm start
```

Test individual tools:
```bash
# Test status
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tailscale_status","arguments":{}}}' | npm start

# Test ping
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tailscale_ping","arguments":{"device":"server"}}}' | npm start
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Test the server
npm test
```

## License

MIT License - see LICENSE file for details.
