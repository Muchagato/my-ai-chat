from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import chat_router, mcp_router

app = FastAPI(
    title="AI Chat API",
    description="OpenAI-compatible chat API with MCP server support",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(mcp_router)


@app.get("/")
async def root():
    return {"message": "AI Chat API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
