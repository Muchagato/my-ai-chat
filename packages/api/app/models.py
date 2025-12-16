from pydantic import BaseModel
from typing import Optional, Union, Any


class ChatMessage(BaseModel):
    role: str
    content: Union[str, list[Any]]


class ChatCompletionRequest(BaseModel):
    model: str = "meta-llama/llama-3.1-8b-instruct:free"
    messages: list[ChatMessage]
    stream: bool = True
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    web_search: Optional[bool] = False
    mcp_servers: Optional[list[str]] = None  # List of enabled MCP server names


class MCPServerToggle(BaseModel):
    name: str
    enabled: bool
