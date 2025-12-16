from typing import Any
from .base import MCPServer, MCPTool
from .servers import FilesystemMCPServer, WebSearchMCPServer, CalculatorMCPServer


class MCPRegistry:
    """Registry for managing MCP servers."""

    def __init__(self):
        self._servers: dict[str, MCPServer] = {}
        self._initialize_default_servers()

    def _initialize_default_servers(self):
        """Initialize default MCP servers."""
        self.register(FilesystemMCPServer())
        self.register(WebSearchMCPServer())
        self.register(CalculatorMCPServer())

    def register(self, server: MCPServer):
        """Register an MCP server."""
        self._servers[server.name] = server

    def unregister(self, name: str):
        """Unregister an MCP server."""
        if name in self._servers:
            del self._servers[name]

    def get(self, name: str) -> MCPServer | None:
        """Get an MCP server by name."""
        return self._servers.get(name)

    def list_servers(self) -> list[dict]:
        """List all registered MCP servers."""
        return [server.to_dict() for server in self._servers.values()]

    def get_enabled_servers(self) -> list[MCPServer]:
        """Get all enabled MCP servers."""
        return [server for server in self._servers.values() if server.enabled]

    def enable_server(self, name: str) -> bool:
        """Enable an MCP server."""
        server = self._servers.get(name)
        if server:
            server.enabled = True
            return True
        return False

    def disable_server(self, name: str) -> bool:
        """Disable an MCP server."""
        server = self._servers.get(name)
        if server:
            server.enabled = False
            return True
        return False

    def get_enabled_tools(self) -> list[dict]:
        """Get all tools from enabled servers in OpenAI function format."""
        tools = []
        for server in self.get_enabled_servers():
            for tool in server.get_tools():
                tools.append({
                    "type": "function",
                    "function": {
                        "name": f"{server.name}__{tool.name}",
                        "description": f"[{server.name}] {tool.description}",
                        "parameters": tool.parameters
                    }
                })
        return tools

    async def execute_tool(self, full_tool_name: str, arguments: dict[str, Any]) -> Any:
        """Execute a tool by its full name (server__tool)."""
        if "__" not in full_tool_name:
            raise ValueError(f"Invalid tool name format: {full_tool_name}")

        server_name, tool_name = full_tool_name.split("__", 1)
        server = self._servers.get(server_name)

        if not server:
            raise ValueError(f"Unknown server: {server_name}")

        if not server.enabled:
            raise ValueError(f"Server is not enabled: {server_name}")

        return await server.execute_tool(tool_name, arguments)


# Global registry instance
mcp_registry = MCPRegistry()
