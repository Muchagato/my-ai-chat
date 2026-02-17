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
    filter_panel,
    document_preview,
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
    {
        "name": "show_filter_panel",
        "description": "Display a filter panel for querying or filtering database records. Use this when the user wants to filter data, search a database, or set up query criteria.",
        "input_schema": {
            "type": "object",
            "properties": {
                "data_type": {
                    "type": "string",
                    "enum": ["users", "orders", "products", "custom"],
                    "description": "The type of data to filter.",
                },
                "title": {
                    "type": "string",
                    "description": "Optional custom title for the filter panel.",
                },
            },
            "required": ["data_type"],
        },
    },
    {
        "name": "generate_document",
        "description": "Generate a document preview such as an invoice, report, letter, or contract. Use this when the user wants to create, generate, or preview a document.",
        "input_schema": {
            "type": "object",
            "properties": {
                "doc_type": {
                    "type": "string",
                    "enum": ["invoice", "report", "letter", "contract", "receipt"],
                    "description": "The type of document to generate.",
                },
                "title": {
                    "type": "string",
                    "description": "Optional custom title for the document.",
                },
            },
            "required": ["doc_type"],
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

- show_filter_panel: Shows a filter/query panel for filtering database records.
  Input: {"data_type": "users" or "orders" or "products" or "custom", "title": "optional title"}. data_type is required.
  Use when: user wants to filter data, search a database, query records, or set up search criteria.

- generate_document: Generates a document preview (invoice, report, letter, contract, receipt).
  Input: {"doc_type": "invoice" or "report" or "letter" or "contract" or "receipt", "title": "optional title"}. doc_type is required.
  Use when: user wants to create, generate, or preview a document like an invoice, report, letter, contract, or receipt.

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

    # Try to find JSON object containing tool_call, even if there's text before it
    # Look for the start of the JSON object
    json_start = cleaned.find('{"tool_call"')
    if json_start == -1:
        json_start = cleaned.find('{ "tool_call"')
    if json_start != -1:
        cleaned = cleaned[json_start:]
        # Find the matching closing brace
        brace_count = 0
        json_end = 0
        for i, char in enumerate(cleaned):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    json_end = i + 1
                    break
        if json_end > 0:
            cleaned = cleaned[:json_end]

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

    elif tool_name == "show_filter_panel":
        data_type = tool_input.get("data_type", "users")
        title = tool_input.get("title")

        # Define filters based on data type
        if data_type == "users":
            filters = [
                {"id": "name", "label": "Name", "type": "text", "placeholder": "Search by name..."},
                {"id": "email", "label": "Email", "type": "text", "placeholder": "Search by email..."},
                {"id": "status", "label": "Status", "type": "select", "options": [
                    {"label": "All Statuses", "value": "all"},
                    {"label": "Active", "value": "active"},
                    {"label": "Inactive", "value": "inactive"},
                    {"label": "Pending", "value": "pending"},
                ]},
                {"id": "role", "label": "Role", "type": "select", "options": [
                    {"label": "All Roles", "value": "all"},
                    {"label": "Admin", "value": "admin"},
                    {"label": "User", "value": "user"},
                    {"label": "Guest", "value": "guest"},
                ]},
                {"id": "created_after", "label": "Created After", "type": "date"},
                {"id": "verified", "label": "Email Verified", "type": "checkbox", "placeholder": "Only verified users"},
            ]
            title = title or "Filter Users"
        elif data_type == "orders":
            filters = [
                {"id": "order_id", "label": "Order ID", "type": "text", "placeholder": "Search by order ID..."},
                {"id": "customer", "label": "Customer", "type": "text", "placeholder": "Search by customer..."},
                {"id": "status", "label": "Status", "type": "select", "options": [
                    {"label": "All Statuses", "value": "all"},
                    {"label": "Pending", "value": "pending"},
                    {"label": "Processing", "value": "processing"},
                    {"label": "Shipped", "value": "shipped"},
                    {"label": "Delivered", "value": "delivered"},
                    {"label": "Cancelled", "value": "cancelled"},
                ]},
                {"id": "min_total", "label": "Min Total ($)", "type": "number", "placeholder": "0"},
                {"id": "max_total", "label": "Max Total ($)", "type": "number", "placeholder": "10000"},
                {"id": "date_from", "label": "From Date", "type": "date"},
                {"id": "date_to", "label": "To Date", "type": "date"},
            ]
            title = title or "Filter Orders"
        elif data_type == "products":
            filters = [
                {"id": "name", "label": "Product Name", "type": "text", "placeholder": "Search products..."},
                {"id": "category", "label": "Category", "type": "select", "options": [
                    {"label": "All Categories", "value": "all"},
                    {"label": "Electronics", "value": "electronics"},
                    {"label": "Clothing", "value": "clothing"},
                    {"label": "Home & Garden", "value": "home"},
                    {"label": "Sports", "value": "sports"},
                ]},
                {"id": "min_price", "label": "Min Price ($)", "type": "number", "placeholder": "0"},
                {"id": "max_price", "label": "Max Price ($)", "type": "number", "placeholder": "1000"},
                {"id": "in_stock", "label": "In Stock", "type": "checkbox", "placeholder": "Only in-stock items"},
            ]
            title = title or "Filter Products"
        else:
            # Custom/generic filters
            filters = [
                {"id": "search", "label": "Search", "type": "text", "placeholder": "Search..."},
                {"id": "category", "label": "Category", "type": "select", "options": [
                    {"label": "All Categories", "value": "all"},
                    {"label": "Option A", "value": "a"},
                    {"label": "Option B", "value": "b"},
                ]},
                {"id": "date", "label": "Date", "type": "date"},
            ]
            title = title or "Filters"

        elements = {}
        fp_key, fp_elem = filter_panel("filter-panel", filters, title=title)
        elements[fp_key] = fp_elem

        return create_ui_tree("filter-panel", elements)

    elif tool_name == "generate_document":
        doc_type = tool_input.get("doc_type", "invoice")
        title = tool_input.get("title")

        elements = {}

        if doc_type == "invoice":
            doc_key, doc_elem = document_preview(
                "invoice-doc",
                title=title or "Invoice #INV-2024-001",
                doc_type="invoice",
                status="final",
                metadata={
                    "Invoice Date": "January 15, 2024",
                    "Due Date": "February 15, 2024",
                    "Invoice #": "INV-2024-001",
                    "Payment Terms": "Net 30",
                },
                sections=[
                    {"heading": "Bill To", "content": "Acme Corporation\n123 Business Ave\nNew York, NY 10001\ncontact@acme.com"},
                    {"heading": "From", "content": "Your Company Inc.\n456 Commerce St\nLos Angeles, CA 90001"},
                    {"heading": "Items", "content": "Web Development Services - $2,500.00\nUI/UX Design Package - $1,200.00\nMonthly Hosting (x3) - $150.00\nDomain Registration - $15.00", "type": "list"},
                    {"heading": "Summary", "content": "Subtotal: $3,865.00\nTax (8%): $309.20\nTotal Due: $4,174.20"},
                ]
            )
        elif doc_type == "report":
            doc_key, doc_elem = document_preview(
                "report-doc",
                title=title or "Q4 2024 Performance Report",
                doc_type="report",
                status="final",
                metadata={
                    "Period": "Q4 2024",
                    "Prepared By": "Analytics Team",
                    "Date": "January 10, 2024",
                },
                sections=[
                    {"heading": "Executive Summary", "content": "This report provides an overview of company performance for Q4 2024. Overall revenue increased by 15% compared to the previous quarter, with significant growth in the enterprise segment."},
                    {"heading": "Key Metrics", "content": "Revenue: $2.4M (+15%)\nNew Customers: 127 (+23%)\nChurn Rate: 2.1% (-0.5%)\nNPS Score: 72 (+8)", "type": "list"},
                    {"heading": "Highlights", "content": "Launched 3 new product features\nExpanded to 2 new markets\nAchieved SOC 2 compliance\nReduced support ticket volume by 18%", "type": "list"},
                    {"heading": "Recommendations", "content": "Based on Q4 performance, we recommend focusing on enterprise sales expansion and investing in customer success initiatives to maintain low churn rates."},
                ]
            )
        elif doc_type == "letter":
            doc_key, doc_elem = document_preview(
                "letter-doc",
                title=title or "Business Letter",
                doc_type="letter",
                status="draft",
                metadata={
                    "Date": "January 15, 2024",
                    "Ref": "BL-2024-001",
                },
                sections=[
                    {"content": "Dear Valued Partner,"},
                    {"content": "I am writing to express our sincere appreciation for your continued partnership over the past year. Your collaboration has been instrumental in our mutual success."},
                    {"content": "As we move into 2024, we are excited to announce several new initiatives that will strengthen our partnership and create new opportunities for growth."},
                    {"content": "We look forward to discussing these opportunities with you in our upcoming meeting scheduled for next month."},
                    {"content": "Best regards,"},
                    {"content": "John Smith, CEO", "type": "signature"},
                ]
            )
        elif doc_type == "contract":
            doc_key, doc_elem = document_preview(
                "contract-doc",
                title=title or "Service Agreement",
                doc_type="contract",
                status="pending",
                metadata={
                    "Contract #": "SA-2024-0042",
                    "Effective Date": "February 1, 2024",
                    "Term": "12 months",
                },
                sections=[
                    {"heading": "Parties", "content": "This Service Agreement ('Agreement') is entered into between Your Company Inc. ('Provider') and Client Corporation ('Client')."},
                    {"heading": "Scope of Services", "content": "Provider agrees to deliver:\nMonthly consulting services (40 hours)\nQuarterly strategy reviews\n24/7 technical support\nAccess to premium features", "type": "list"},
                    {"heading": "Compensation", "content": "Client agrees to pay Provider $5,000 per month, due on the 1st of each month. Late payments are subject to a 1.5% monthly fee."},
                    {"heading": "Term and Termination", "content": "This Agreement shall remain in effect for 12 months from the Effective Date. Either party may terminate with 30 days written notice."},
                    {"content": "Provider Signature", "type": "signature"},
                    {"content": "Client Signature", "type": "signature"},
                ]
            )
        elif doc_type == "receipt":
            doc_key, doc_elem = document_preview(
                "receipt-doc",
                title=title or "Payment Receipt",
                doc_type="receipt",
                status="final",
                metadata={
                    "Receipt #": "RCP-20240115-001",
                    "Date": "January 15, 2024",
                    "Payment Method": "Credit Card",
                },
                sections=[
                    {"heading": "Received From", "content": "John Doe\njohn.doe@email.com"},
                    {"heading": "Items Purchased", "content": "Premium Subscription (Annual) - $99.00\nSetup Fee - $25.00", "type": "list"},
                    {"heading": "Payment Details", "content": "Subtotal: $124.00\nDiscount (10%): -$12.40\nTotal Paid: $111.60"},
                    {"content": "Thank you for your purchase! This receipt confirms your payment has been processed successfully."},
                ]
            )
        else:
            doc_key, doc_elem = document_preview(
                "custom-doc",
                title=title or "Document",
                doc_type="custom",
                status="draft",
                sections=[
                    {"heading": "Content", "content": "Document content goes here."},
                ]
            )

        elements[doc_key] = doc_elem
        return create_ui_tree(doc_key, elements)

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
