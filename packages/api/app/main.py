from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_ai_sdk import AIStreamBuilder, ai_endpoint
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os

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


@app.get("/")
async def root():
    return {"message": "AI Chat API is running"}


@app.post("/api/chat")
@ai_endpoint()
async def chat(request: ChatRequest):
    """
    Chat endpoint that returns AI responses.
    Compatible with Vercel AI SDK on the frontend.
    """
    builder = AIStreamBuilder()

    try:
        # Convert AI SDK v6 message format to OpenAI format
        messages_dict = []
        for msg in request.messages:
            # Extract text from parts array
            content = ""
            for part in msg.parts:
                if part.type == "text":
                    content += part.text
            messages_dict.append({"role": msg.role, "content": content})

        # Get the complete AI response (no streaming)
        response = await client.chat.completions.create(
            model=request.model,
            messages=messages_dict,
            stream=False,
        )

        # Get the response text
        full_response = response.choices[0].message.content

        # Send the complete response
        builder.text(full_response)

    except Exception as e:
        builder.error(f"Error processing request: {str(e)}")

    return builder


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}
