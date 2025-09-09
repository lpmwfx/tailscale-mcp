# Tailscale MCP Server

A Model Context Protocol (MCP) server that provides Tailscale network management capabilities for Warp terminal integration.

## Features

- List all devices in your Tailscale network
- Get detailed device information
- Enable/disable devices
- View ACL (Access Control List) configurations
- Check DNS settings
- Full integration with Warp terminal via MCP

## Installation

### Via Homebrew (Recommended)

```bash
brew install lpmwfx/tap/tailscale-mcp
```

### Manual Installation

```bash
git clone https://github.com/lpmwfx/tailscale-mcp.git
cd tailscale-mcp
npm install
npm link
```

## Configuration

### Environment Variables

You need to set the following environment variables:

- `TAILNET`: Your Tailscale tailnet name (e.g., "tail2d448.ts.net")
- `TAILSCALE_TOKEN`: Your Tailscale API token

### Warp Terminal Configuration

Add this configuration to your Warp MCP settings:

```json
{
  "tailscale": {
    "command": "node",
    "args": [
      "/opt/homebrew/bin/tailscale-mcp"
    ],
    "env": {
      "TAILNET": "your-tailnet.ts.net",
      "TAILSCALE_TOKEN": "tskey-auth-your-token-here"
    },
    "working_directory": null
  }
}
```

## API Token Setup

1. Go to [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys)
2. Generate a new API key with appropriate permissions
3. Set the `TAILSCALE_TOKEN` environment variable

## Available Tools

### list_devices
Lists all devices in your Tailscale network with basic information including:
- Device ID, name, and hostname
- Client version and OS
- IP addresses
- Online/offline status
- Last seen timestamp

### get_device_info
Get detailed information about a specific device by providing its device ID.

### enable_device / disable_device
Enable or disable a device in your Tailscale network by device ID.

### get_acl
Retrieve the current Access Control List configuration for your tailnet.

### get_dns_settings
Get DNS configuration and preferences for your tailnet.

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run tests
npm test
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/lpmwfx/tailscale-mcp/issues) page.
