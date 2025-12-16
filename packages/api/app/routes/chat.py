import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from ..config import settings
from ..models import ChatCompletionRequest
from ..mcp import mcp_registry

router = APIRouter(tags=["Chat"])

# Initialize OpenRouter client (OpenAI-compatible)
client = AsyncOpenAI(
    api_key=settings.openrouter_api_key,
    base_url=settings.openrouter_base_url,
)


async def generate_stream(request: ChatCompletionRequest):
    """Generate streaming chat completion."""

    # Temporarily enable requested MCP servers for this request
    original_states = {}
    if request.mcp_servers:
        for server_name in request.mcp_servers:
            server = mcp_registry.get(server_name)
            if server:
                original_states[server_name] = server.enabled
                server.enabled = True

    try:
        # Get tools from enabled MCP servers
        tools = mcp_registry.get_enabled_tools() if request.mcp_servers else None

        # Prepare messages
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        # Create chat completion
        stream_kwargs = {
            "model": request.model,
            "messages": messages,
            "stream": True,
            "temperature": request.temperature,
        }

        if request.max_tokens:
            stream_kwargs["max_tokens"] = request.max_tokens

        if tools:
            stream_kwargs["tools"] = tools

        stream = await client.chat.completions.create(**stream_kwargs)

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                # Format as SSE data
                data = {
                    "id": chunk.id,
                    "object": "chat.completion.chunk",
                    "created": chunk.created,
                    "model": chunk.model,
                    "choices": [
                        {
                            "index": 0,
                            "delta": {"content": chunk.choices[0].delta.content},
                            "finish_reason": chunk.choices[0].finish_reason,
                        }
                    ],
                }
                yield f"data: {json.dumps(data)}\n\n"

            # Handle tool calls if present
            if chunk.choices[0].delta.tool_calls:
                for tool_call in chunk.choices[0].delta.tool_calls:
                    data = {
                        "id": chunk.id,
                        "object": "chat.completion.chunk",
                        "created": chunk.created,
                        "model": chunk.model,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {
                                    "tool_calls": [
                                        {
                                            "index": tool_call.index,
                                            "id": tool_call.id,
                                            "type": "function",
                                            "function": {
                                                "name": tool_call.function.name if tool_call.function else None,
                                                "arguments": tool_call.function.arguments if tool_call.function else None,
                                            },
                                        }
                                    ]
                                },
                                "finish_reason": chunk.choices[0].finish_reason,
                            }
                        ],
                    }
                    yield f"data: {json.dumps(data)}\n\n"

        yield "data: [DONE]\n\n"

    finally:
        # Restore original MCP server states
        for server_name, was_enabled in original_states.items():
            server = mcp_registry.get(server_name)
            if server:
                server.enabled = was_enabled


@router.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    """OpenAI-compatible chat completions endpoint."""

    if request.stream:
        return StreamingResponse(
            generate_stream(request),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    # Non-streaming response
    tools = mcp_registry.get_enabled_tools() if request.mcp_servers else None
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    completion_kwargs = {
        "model": request.model,
        "messages": messages,
        "temperature": request.temperature,
    }

    if request.max_tokens:
        completion_kwargs["max_tokens"] = request.max_tokens

    if tools:
        completion_kwargs["tools"] = tools

    response = await client.chat.completions.create(**completion_kwargs)

    return response.model_dump()
