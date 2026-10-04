# LeanIX MCP Integration

A Model Context Protocol (MCP) server that connects LeanIX to AI assistants. It exposes LeanIX's GraphQL API as MCP tools that AI assistants can use.

## Core Functionality

This integration provides three read-only MCP tools for LeanIX operations:

1. **Fact Sheet Overview**: Get counts and statistics of fact sheets in your workspace
2. **Search**: Find fact sheets by their names
3. **Subscriptions**: View who is subscribed to specific fact sheets

## Prerequisites

- A maintained Node.js LTS release; the locked MCP SDK requires Node.js 18 or newer
- A LeanIX workspace and API token
- Basic understanding of GraphQL and MCP

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm ci --ignore-scripts
   ```
3. Create a `.env` file in the root directory with your LeanIX credentials:
   ```
   LEANIX_SUBDOMAIN=your-workspace-subdomain
   LEANIX_TOKEN=your-api-token
   ```

## Project Structure

```
├── server.js            # Main MCP server setup and initialization
├── leanix-client.js     # LeanIX API client implementation
├── api                  # LeanIX API definitions and endpoints
├── mutation            # GraphQL mutation definitions
├── datamodel           # Data models and type definitions
├── .env                # Environment configuration
└── src/
    ├── config/
    │   └── config.js         # Loads and validates environment variables for LeanIX credentials
    ├── graphql/
    │   └── queries/         # GraphQL queries and mutations for LeanIX API
    │       ├── factSheetQueries.js     # Queries for fact sheet operations
    │       └── workspaceQueries.js     # Queries for workspace-level operations
    ├── tools/
    │   └── workspaceTools.js # Defines and registers the three read tools
    ├── types/
    │   └── schemas.js       # Zod schemas for validating tool parameters
    └── utils/
        └── responseHandler.js # Formats responses in MCP-compatible structure
```

## Common Pitfalls and Solutions

1. **GraphQL Schema Mismatch**: Always check the current LeanIX API schema in their documentation or GraphiQL interface. The schema may change over time.

2. **Response Formatting**: All MCP tool responses must follow this format:
   ```javascript
   {
     content: [{
       type: "text",
       text: "your response here"
     }]
   }
   ```

3. **Error Handling**: Always wrap your tool implementations with `withErrorHandling` to ensure proper error responses.

4. **Environment Variables**: Make sure to properly load and validate environment variables before making any API calls.

## Claude Desktop Configuration

To use this MCP server with Claude Desktop, you need to add the server configuration to Claude's config file. The config file is typically located at:
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following configuration:

```json
{
    "mcpServers": {
      "myserver": {
        "command": "node",
        "args": [
          "/path/to/your/lean/server.js"
        ]
      }
    }
}
```

Replace `/path/to/your/lean/server.js` with the absolute path to your server.js file. This tells Claude Desktop to:
1. Start this MCP server when needed
2. Connect to it for LeanIX operations
3. Run it using Node.js

## Testing Your Integration

1. Start the server:
   ```bash
   node server.js
   ```

2. The server will connect to your LeanIX workspace and make the tools available through MCP.

3. You can test your tools through any MCP-compatible client (like Claude).

## Debugging Tips

1. Check required environment variable names are present without printing their values. Never log API tokens.

2. Use the LeanIX GraphiQL interface to test your queries before implementing them in your tools.

3. Use the correlation ID from the safe error response. Detailed diagnostics require a separate operator-controlled, explicitly redacted sink.

## Resources

- [LeanIX API Documentation](https://docs-eam.leanix.net/reference/graphql-api)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs/getting-started/intro)

## License

MIT 
## Safe MCP tool failures

The response wrapper returns `isError: true` with a safe correlation ID. Raw remote errors, tokens, schemas and stacks are excluded from default logs and tool text. Run `node --test tests/responseHandler.test.js` to verify this contract; a live LeanIX tenant is not required. [Updated integration note](https://gist.github.com/renezander030/83ad49aeffa5f8749325a2b19617823f).

## Read-only tool boundary

`createFactSheet` and `updateFactSheet` are no longer registered. The previous handlers performed GraphQL writes without authenticated human consent. This is an intentional compatibility change: the public server now exposes only its three read tools. There is no environment flag or model-callable confirmation bypass. Add writes only through a reviewed, authenticated operator channel that binds the exact action/payload, current target/version and expiry, and checks permissions again at dispatch. A live tenant/version contract must be established before claiming conditional-write protection.

```bash
npm ci --ignore-scripts
node --test tests/*.test.js
```

Four tests cover safe success/error responses, static read registration, and a real in-memory MCP client/server handshake. The handshake lists only three read tools, executes a synthetic read and rejects both mutation tool names without calling the provider. No LeanIX API is contacted.

## Dependency maintenance

The lockfile now pins MCP SDK 1.32.0 and patched transitive dependencies within the existing declared version ranges. `npm audit --json` reported zero vulnerabilities on 4 October 2026 after this update; advisories can change. Install with `npm ci --ignore-scripts` to reproduce the tested lockfile.
