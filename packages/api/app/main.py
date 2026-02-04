from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os
import json
import uuid
import sys

# Ensure stdout can handle UTF-8 (Windows defaults to cp1252)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Proxy URL for claude-max-api-proxy (uses setup tokens via Claude CLI)
CLAUDE_PROXY_URL = "http://localhost:3456/v1"

from app.ui_trees import (
    create_ui_tree,
    UITreeBuilder,
    card,
    grid,
    stack,
    metric,
    table,
    chart,
    progress,
    badge,
    button,
    alert,
    text,
    divider,
    list_items,
)
from app.auth import (
    validate_anthropic_setup_token,
    save_token,
    load_token,
    delete_token,
    get_token_preview,
    is_authenticated,
)

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Request/Response Models
# ============================================

class MessagePart(BaseModel):
    type: str
    text: str = ""


class ChatMessage(BaseModel):
    role: str
    parts: list[MessagePart]
    id: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str = "claude-sonnet-4-20250514"
    webSearch: bool = False


class TokenRequest(BaseModel):
    token: str
    profile_name: str = "default"


class TokenResponse(BaseModel):
    authenticated: bool
    preview: str | None = None
    error: str | None = None


# ============================================
# Helper Functions
# ============================================

def format_sse(data: dict) -> str:
    """Format data as Server-Sent Event"""
    return f"data: {json.dumps(data, separators=(',', ':'))}\n\n"


def is_setup_token(token: str) -> bool:
    """Check if the token is a setup token (requires proxy)."""
    return token.startswith("sk-ant-oat01-")


def get_anthropic_client() -> AsyncAnthropic:
    """Get an Anthropic client with the stored API key (not for setup tokens)."""
    token = load_token()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated. Please set up your Anthropic token.")
    return AsyncAnthropic(api_key=token)


def get_proxy_client() -> AsyncOpenAI:
    """Get an OpenAI client configured to use claude-max-api-proxy."""
    return AsyncOpenAI(
        base_url=CLAUDE_PROXY_URL,
        api_key="not-needed",  # Proxy doesn't require API key, it uses Claude CLI auth
    )


# Tool definitions for the Anthropic API
TOOLS = [
    {
        "name": "get_analytics_dashboard",
        "description": "Show an analytics dashboard with business metrics like revenue, active users, orders, and conversion rate. Use this when the user asks about analytics, metrics, or a dashboard.",
        "input_schema": {
            "type": "object",
            "properties": {
                "metrics": {
                    "type": "array",
                    "items": {"type": "string", "enum": ["revenue", "users", "orders", "conversion"]},
                    "description": "Which metrics to include. Defaults to all.",
                }
            },
        },
    },
    {
        "name": "show_data_table",
        "description": "Display a data table. Use this when the user asks to see tabular data like a list of users or orders.",
        "input_schema": {
            "type": "object",
            "properties": {
                "data_type": {
                    "type": "string",
                    "enum": ["users", "orders"],
                    "description": "The type of data to display.",
                },
                "title": {
                    "type": "string",
                    "description": "Optional custom title for the table.",
                },
            },
            "required": ["data_type"],
        },
    },
    {
        "name": "show_chart",
        "description": "Render a chart visualization. Use this when the user asks to see data as a chart or graph.",
        "input_schema": {
            "type": "object",
            "properties": {
                "chart_type": {
                    "type": "string",
                    "enum": ["bar", "line", "pie", "area"],
                    "description": "The type of chart to render.",
                },
                "title": {
                    "type": "string",
                    "description": "Title for the chart.",
                },
            },
            "required": ["chart_type"],
        },
    },
    {
        "name": "show_status",
        "description": "Show a system status panel with a progress indicator and status alert. Use this when the user asks about system status or progress.",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
]


# Prompt injected into proxy requests so Claude outputs tool calls as parseable JSON.
# Claude CLI doesn't support the native tool_use/tool_result loop, so we do it via prompt.
TOOL_PROMPT = """You have access to these tools that generate interactive UI components.

Tools:
- get_analytics_dashboard: Shows an analytics dashboard with metrics (revenue, users, orders, conversion rate).
  Input: {"metrics": ["revenue", "users", "orders", "conversion"]} — all optional, defaults to all four.
  Use when: user asks about analytics, metrics, a dashboard, or business data.

- show_data_table: Displays a data table.
  Input: {"data_type": "users" or "orders", "title": "optional title"}. data_type is required.
  Use when: user asks to see tabular data, a user list, or orders.

- show_chart: Renders a chart visualization.
  Input: {"chart_type": "bar" or "line" or "pie" or "area", "title": "optional title"}. chart_type is required.
  Use when: user asks for a chart, graph, or visualization.

- show_status: Shows a system status panel with a progress bar and alert.
  Input: {}
  Use when: user asks about system status or progress.

IMPORTANT: When you decide to call a tool, your ENTIRE response must be ONLY this JSON object with no other text before or after it — no explanation, no markdown, just the raw JSON:
{"tool_call": {"name": "<tool_name>", "input": {<input_object>}}}

If you are not calling a tool, respond normally."""


def parse_tool_call(text: str) -> dict | None:
    """Try to parse a tool call JSON from Claude's response. Returns None if not a tool call."""
    cleaned = text.strip()
    # Strip markdown code block wrapper if present
    if cleaned.startswith('```'):
        lines = cleaned.split('\n')
        end = len(lines) - 1 if lines[-1].strip() == '```' else len(lines)
        cleaned = '\n'.join(lines[1:end]).strip()
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict) and "tool_call" in parsed:
            tc = parsed["tool_call"]
            valid_tools = {t["name"] for t in TOOLS}
            if isinstance(tc, dict) and tc.get("name") in valid_tools:
                return tc
    except (json.JSONDecodeError, KeyError):
        pass
    return None


def execute_tool(tool_name: str, tool_input: dict) -> dict:
    """Execute a tool and return the result (potentially as a UI tree)."""

    if tool_name == "get_analytics_dashboard":
        elements = {}
        metric_keys = []

        metrics_data = {
            "revenue": ("revenue", "Total Revenue", 125000, "currency", "up", "+12.5%"),
            "users": ("users", "Active Users", 8432, "number", "up", "+5.2%"),
            "orders": ("orders", "Orders", 1247, "number", "down", "-2.1%"),
            "conversion": ("conversion", "Conversion Rate", 3.2, "percent", "neutral", None),
        }

        requested = tool_input.get("metrics", ["revenue", "users", "orders", "conversion"])
        for metric_name in requested:
            if metric_name in metrics_data:
                data = metrics_data[metric_name]
                key, elem = metric(*data)
                elements[key] = elem
                metric_keys.append(key)

        grid_key, grid_elem = grid("metrics-grid", columns=len(metric_keys), gap="md", children=metric_keys)
        elements[grid_key] = grid_elem

        btn_key, btn_elem = button("refresh-btn", "Refresh Data", "refresh", variant="secondary")
        elements[btn_key] = btn_elem

        card_key, card_elem = card(
            "dashboard",
            title="Analytics Dashboard",
            description="Real-time business metrics",
            children=["metrics-grid", "refresh-btn"]
        )
        elements[card_key] = card_elem

        return create_ui_tree("dashboard", elements)

    elif tool_name == "show_data_table":
        data_type = tool_input.get("data_type", "users")
        title = tool_input.get("title", f"{data_type.title()} Data")

        if data_type == "users":
            columns = [
                {"key": "name", "label": "Name"},
                {"key": "email", "label": "Email"},
                {"key": "status", "label": "Status"},
            ]
            data = [
                {"name": "Alice Johnson", "email": "alice@example.com", "status": "Active"},
                {"name": "Bob Smith", "email": "bob@example.com", "status": "Active"},
                {"name": "Carol White", "email": "carol@example.com", "status": "Inactive"},
                {"name": "David Brown", "email": "david@example.com", "status": "Active"},
            ]
        elif data_type == "orders":
            columns = [
                {"key": "id", "label": "Order ID"},
                {"key": "customer", "label": "Customer"},
                {"key": "total", "label": "Total", "format": "currency"},
                {"key": "status", "label": "Status"},
            ]
            data = [
                {"id": "#1001", "customer": "Alice", "total": 129.99, "status": "Shipped"},
                {"id": "#1002", "customer": "Bob", "total": 89.50, "status": "Processing"},
                {"id": "#1003", "customer": "Carol", "total": 245.00, "status": "Delivered"},
            ]
        else:
            columns = [{"key": "item", "label": "Item"}]
            data = [{"item": "No data available"}]

        elements = {}

        tbl_key, tbl_elem = table("data-table", columns, data, striped=True)
        elements[tbl_key] = tbl_elem

        card_key, card_elem = card("table-card", title=title, children=["data-table"])
        elements[card_key] = card_elem

        return create_ui_tree("table-card", elements)

    elif tool_name == "show_chart":
        chart_type = tool_input.get("chart_type", "bar")
        title = tool_input.get("title", "Monthly Sales")

        chart_data = [
            {"label": "Jan", "value": 120},
            {"label": "Feb", "value": 150},
            {"label": "Mar", "value": 180},
            {"label": "Apr", "value": 140},
            {"label": "May", "value": 200},
            {"label": "Jun", "value": 175},
        ]

        elements = {}

        chart_key, chart_elem = chart("main-chart", chart_type, chart_data, title=title, height=250)
        elements[chart_key] = chart_elem

        card_key, card_elem = card("chart-card", title=title, children=["main-chart"])
        elements[card_key] = card_elem

        return create_ui_tree("chart-card", elements)

    elif tool_name == "show_status":
        elements = {}

        prog_key, prog_elem = progress("task-progress", value=75, label="Task Completion", show_value=True)
        elements[prog_key] = prog_elem

        alert_key, alert_elem = alert("status-alert", "System Status", description="All services are running normally.", variant="default")
        elements[alert_key] = alert_elem

        stack_key, stack_elem = stack("status-stack", direction="vertical", gap="md", children=["task-progress", "status-alert"])
        elements[stack_key] = stack_elem

        card_key, card_elem = card("status-card", title="System Status", children=["status-stack"])
        elements[card_key] = card_elem

        return create_ui_tree("status-card", elements)

    return {"error": f"Unknown tool: {tool_name}"}


# ============================================
# Auth Endpoints
# ============================================

@app.get("/api/auth/status")
async def auth_status() -> TokenResponse:
    """Check authentication status."""
    token = load_token()
    if token and is_authenticated():
        return TokenResponse(
            authenticated=True,
            preview=get_token_preview(token)
        )
    return TokenResponse(authenticated=False)


@app.post("/api/auth/token")
async def set_token(request: TokenRequest) -> TokenResponse:
    """Set the Anthropic setup token."""
    error = validate_anthropic_setup_token(request.token)
    if error:
        return TokenResponse(authenticated=False, error=error)

    save_token(request.token, request.profile_name)
    return TokenResponse(
        authenticated=True,
        preview=get_token_preview(request.token)
    )


@app.delete("/api/auth/token")
async def remove_token() -> TokenResponse:
    """Remove the stored token."""
    delete_token()
    return TokenResponse(authenticated=False)


# ============================================
# Chat Endpoint
# ============================================

@app.get("/")
async def root():
    return {"message": "AI Chat API is running"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Chat endpoint that returns AI responses with streaming.
    Supports both:
    - Setup tokens (sk-ant-oat01-): Uses claude-max-api-proxy
    - API keys (sk-ant-api03-): Uses Anthropic API directly
    Compatible with Vercel AI SDK v6 on the frontend.
    """
    # Check authentication
    if not is_authenticated():
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please set up your Anthropic token first."
        )

    token = load_token()
    use_proxy = is_setup_token(token)

    # Convert AI SDK v6 message format to messages
    messages = []
    for msg in request.messages:
        content = ""
        for part in msg.parts:
            if part.type == "text":
                content += part.text
        if content:
            messages.append({"role": msg.role, "content": content})

    # Route to appropriate handler
    if use_proxy:
        return await chat_via_proxy(request, messages)
    else:
        return await chat_via_anthropic(request, messages)


async def chat_via_proxy(request: ChatRequest, messages: list) -> StreamingResponse:
    """
    Handle chat via claude-max-api-proxy (for setup tokens).
    Uses prompt-based tool calling since Claude CLI doesn't support native tool use API.
    Buffers first ~30 chars to detect tool calls; streams text normally otherwise.
    """
    client = get_proxy_client()

    # Prepend tool instructions as a system message
    proxy_messages = [{"role": "system", "content": TOOL_PROMPT}] + messages

    async def generate():
        message_id = f"msg-{uuid.uuid4().hex}"
        text_id = "text-1"

        yield format_sse({"type": "start", "messageId": message_id})

        try:
            buffer = ""
            is_tool_call = None  # None = undecided, True/False = decided
            text_started = False

            async for chunk in await client.chat.completions.create(
                model=request.model,
                messages=proxy_messages,
                stream=True,
            ):
                if not chunk.choices:
                    continue
                content = chunk.choices[0].delta.content
                if not content:
                    continue

                if is_tool_call is None:
                    # Buffer until we can determine if this is a tool call
                    buffer += content
                    if '"tool_call"' in buffer:
                        is_tool_call = True  # Keep buffering the full JSON
                    elif len(buffer) >= 30:
                        is_tool_call = False
                        # Flush buffer as text and start streaming
                        yield format_sse({"type": "text-start", "id": text_id})
                        yield format_sse({"type": "text-delta", "id": text_id, "delta": buffer})
                        text_started = True
                        buffer = ""
                elif is_tool_call:
                    buffer += content  # Continue buffering tool call JSON
                else:
                    # Stream text normally
                    yield format_sse({"type": "text-delta", "id": text_id, "delta": content})

            # Handle end of stream
            if is_tool_call is None and buffer.strip():
                # Short response - check if it's a tool call
                tc = parse_tool_call(buffer)
                is_tool_call = tc is not None
                if not is_tool_call:
                    yield format_sse({"type": "text-start", "id": text_id})
                    yield format_sse({"type": "text-delta", "id": text_id, "delta": buffer})
                    text_started = True

            if is_tool_call:
                tc = parse_tool_call(buffer)
                if tc:
                    tool_call_id = f"proxy-{uuid.uuid4().hex[:12]}"
                    tool_input = tc.get("input", {})

                    # AI SDK v6 streaming protocol for tool calls
                    yield format_sse({
                        "type": "tool-input-start",
                        "toolCallId": tool_call_id,
                        "toolName": tc["name"],
                    })
                    yield format_sse({
                        "type": "tool-input-delta",
                        "toolCallId": tool_call_id,
                        "inputTextDelta": json.dumps(tool_input),
                    })
                    yield format_sse({
                        "type": "tool-input-available",
                        "toolCallId": tool_call_id,
                        "toolName": tc["name"],
                        "input": tool_input,
                    })

                    # Execute tool and emit output
                    result = execute_tool(tc["name"], tool_input)
                    yield format_sse({
                        "type": "tool-output-available",
                        "toolCallId": tool_call_id,
                        "output": result,
                    })
                else:
                    # Detected tool_call keyword but failed to parse - fall back to text
                    yield format_sse({"type": "text-start", "id": text_id})
                    yield format_sse({"type": "text-delta", "id": text_id, "delta": buffer})
                    text_started = True

            if text_started:
                yield format_sse({"type": "text-end", "id": text_id})

            yield format_sse({"type": "finish"})

        except Exception as e:
            print(f"[Chat Error via Proxy] {type(e).__name__}: {e}", flush=True)
            yield format_sse({"type": "error", "errorText": str(e)})

        yield "data: [DONE]\n\n"

    response = StreamingResponse(generate(), media_type="text/event-stream")
    response.headers["x-vercel-ai-ui-message-stream"] = "v1"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"
    return response


async def chat_via_anthropic(request: ChatRequest, messages: list) -> StreamingResponse:
    """
    Handle chat via Anthropic API directly (for API keys).
    Supports tool calling.
    """
    client = get_anthropic_client()

    async def generate():
        message_id = f"msg-{uuid.uuid4().hex}"
        text_id = "text-1"

        yield format_sse({"type": "start", "messageId": message_id})

        try:
            current_messages = list(messages)

            while True:
                async with client.messages.stream(
                    model=request.model,
                    max_tokens=4096,
                    messages=current_messages,
                    tools=TOOLS,
                ) as stream:
                    text_started = False
                    tool_uses = []
                    current_tool = None

                    async for event in stream:
                        if event.type == "content_block_start":
                            if event.content_block.type == "tool_use":
                                current_tool = {
                                    "id": event.content_block.id,  # Anthropic's tool call ID
                                    "name": event.content_block.name,
                                    "input_str": "",
                                }
                                yield format_sse({
                                    "type": "tool-input-start",
                                    "toolCallId": current_tool["id"],
                                    "toolName": current_tool["name"],
                                })

                        elif event.type == "content_block_delta":
                            if hasattr(event.delta, "text"):
                                if not text_started:
                                    yield format_sse({"type": "text-start", "id": text_id})
                                    text_started = True
                                yield format_sse({
                                    "type": "text-delta",
                                    "id": text_id,
                                    "delta": event.delta.text,
                                })
                            elif event.delta.type == "input_json_delta" and current_tool:
                                current_tool["input_str"] += event.delta.partial_json
                                yield format_sse({
                                    "type": "tool-input-delta",
                                    "toolCallId": current_tool["id"],
                                    "inputTextDelta": event.delta.partial_json,
                                })

                        elif event.type == "content_block_stop":
                            if current_tool:
                                try:
                                    current_tool["input"] = json.loads(current_tool["input_str"]) if current_tool["input_str"] else {}
                                except json.JSONDecodeError:
                                    current_tool["input"] = {}
                                tool_uses.append(current_tool)
                                yield format_sse({
                                    "type": "tool-input-available",
                                    "toolCallId": current_tool["id"],
                                    "toolName": current_tool["name"],
                                    "input": current_tool["input"],
                                })
                                current_tool = None

                    if text_started:
                        yield format_sse({"type": "text-end", "id": text_id})

                    final_message = await stream.get_final_message()

                if not tool_uses or final_message.stop_reason != "tool_use":
                    break

                assistant_content = final_message.content
                tool_results = []

                for tool_call in tool_uses:
                    result = execute_tool(tool_call["name"], tool_call["input"])
                    yield format_sse({
                        "type": "tool-output-available",
                        "toolCallId": tool_call["id"],
                        "output": result,
                    })

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_call["id"],
                        "content": json.dumps(result),
                    })

                current_messages.append({"role": "assistant", "content": assistant_content})
                current_messages.append({"role": "user", "content": tool_results})

            yield format_sse({"type": "finish"})

        except Exception as e:
            error_message = str(e)
            print(f"[Chat Error via Anthropic] {type(e).__name__}: {error_message}")
            yield format_sse({"type": "error", "errorText": error_message})

        yield "data: [DONE]\n\n"

    response = StreamingResponse(generate(), media_type="text/event-stream")
    response.headers["x-vercel-ai-ui-message-stream"] = "v1"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"
    return response


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "authenticated": is_authenticated()}
