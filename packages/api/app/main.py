from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os
import json
import uuid

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenRouter client (compatible with OpenAI SDK)
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)


class MessagePart(BaseModel):
    type: str
    text: str = ""


class ChatMessage(BaseModel):
    role: str
    parts: list[MessagePart]
    id: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str = "gpt-4o"
    webSearch: bool = False


def format_sse(data: dict) -> str:
    """Format data as Server-Sent Event"""
    return f"data: {json.dumps(data, separators=(',', ':'))}\n\n"


@app.get("/")
async def root():
    return {"message": "AI Chat API is running"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Chat endpoint that returns AI responses with streaming.
    Compatible with Vercel AI SDK v6 on the frontend.
    """
    # Convert AI SDK v6 message format to OpenAI format
    messages_dict = []
    for msg in request.messages:
        content = ""
        for part in msg.parts:
            if part.type == "text":
                content += part.text
        messages_dict.append({"role": msg.role, "content": content})

    async def generate():
        message_id = f"msg-{uuid.uuid4().hex}"
        text_id = "text-1"
        reasoning_id = "reasoning-1"

        # Send start event
        yield format_sse({"type": "start", "messageId": message_id})

        # Mock reasoning for testing
        mock_reasoning = "Let me think about this... I need to analyze the user's question and formulate a helpful response."
        yield format_sse({"type": "reasoning-start", "id": reasoning_id})
        yield format_sse({"type": "reasoning-delta", "id": reasoning_id, "delta": mock_reasoning})
        yield format_sse({"type": "reasoning-end", "id": reasoning_id})

        try:
            stream = await client.chat.completions.create(
                model=request.model,
                messages=messages_dict,
                stream=True,
            )

            text_started = False
            reasoning_started = False

            async for chunk in stream:
                if not chunk.choices:
                    continue

                delta = chunk.choices[0].delta

                # Handle reasoning content (for models that support it)
                # OpenRouter returns reasoning in different ways depending on model
                reasoning_content = getattr(delta, "reasoning_content", None) or getattr(delta, "reasoning", None)
                if reasoning_content:
                    if not reasoning_started:
                        yield format_sse({"type": "reasoning-start", "id": reasoning_id})
                        reasoning_started = True
                    yield format_sse({
                        "type": "reasoning-delta",
                        "id": reasoning_id,
                        "delta": reasoning_content
                    })

                # Handle regular text content
                if delta.content:
                    # Close reasoning if we were in it
                    if reasoning_started:
                        yield format_sse({"type": "reasoning-end", "id": reasoning_id})
                        reasoning_started = False

                    if not text_started:
                        yield format_sse({"type": "text-start", "id": text_id})
                        text_started = True

                    yield format_sse({
                        "type": "text-delta",
                        "id": text_id,
                        "delta": delta.content
                    })

            # Close any open streams
            if reasoning_started:
                yield format_sse({"type": "reasoning-end", "id": reasoning_id})
            if text_started:
                yield format_sse({"type": "text-end", "id": text_id})

            # Send finish event
            yield format_sse({"type": "finish"})

        except Exception as e:
            yield format_sse({"type": "error", "errorText": str(e)})

        # Send done marker
        yield "data: [DONE]\n\n"

    response = StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )

    # Required headers for AI SDK v6 streaming
    response.headers["x-vercel-ai-ui-message-stream"] = "v1"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"

    return response


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}