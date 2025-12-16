from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel


class MCPTool(BaseModel):
    """Represents a tool provided by an MCP server."""
    name: str
    description: str
    parameters: dict[str, Any]


class MCPServer(ABC):
    """Base class for MCP server implementations."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self._enabled = False

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, value: bool):
        self._enabled = value

    @abstractmethod
    def get_tools(self) -> list[MCPTool]:
        """Return list of tools provided by this MCP server."""
        pass

    @abstractmethod
    async def execute_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """Execute a tool with the given arguments."""
        pass

    def to_dict(self) -> dict:
        """Convert server info to dictionary."""
        return {
            "name": self.name,
            "description": self.description,
            "enabled": self.enabled,
            "tools": [tool.model_dump() for tool in self.get_tools()]
        }
