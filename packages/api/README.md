# FastAPI Backend for AI SDK v6

This backend implements the **AI SDK v6 UI Message Stream Protocol** for streaming AI responses to a React frontend using `@ai-sdk/react`.

## AI SDK v6 Streaming Protocol

AI SDK v6 uses **Server-Sent Events (SSE)** with a specific JSON format. Each event is sent as:

```
data: {"type":"event-type",...}\n\n
```

### Required Headers

```python
response.headers["x-vercel-ai-ui-message-stream"] = "v1"
response.headers["Cache-Control"] = "no-cache"
response.headers["Connection"] = "keep-alive"
response.headers["X-Accel-Buffering"] = "no"
```

### Event Types

#### 1. Stream Lifecycle Events

```python
# Start the message stream (required first event)
yield format_sse({"type": "start", "messageId": "msg-unique-id"})

# Finish the stream (required last event before [DONE])
yield format_sse({"type": "finish"})

# Final marker
yield "data: [DONE]\n\n"
```

#### 2. Text Streaming

Text content uses a start/delta/end pattern:

```python
# Begin text block
yield format_sse({"type": "text-start", "id": "text-1"})

# Stream text chunks (call multiple times)
yield format_sse({"type": "text-delta", "id": "text-1", "delta": "Hello "})
yield format_sse({"type": "text-delta", "id": "text-1", "delta": "world!"})

# End text block
yield format_sse({"type": "text-end", "id": "text-1"})
```

**Non-streaming (full message):** The start/delta/end pattern is still required even if you have a complete message. The "delta" name is misleading - it just means "content to append". Send the full text in a single delta:

```python
# Get full response (no streaming from LLM)
response = await client.chat.completions.create(
    model=request.model,
    messages=messages,
    stream=False,
)
full_text = response.choices[0].message.content

# Send as single delta - pattern is still required
yield format_sse({"type": "text-start", "id": text_id})
yield format_sse({"type": "text-delta", "id": text_id, "delta": full_text})
yield format_sse({"type": "text-end", "id": text_id})
```

#### 3. Reasoning Streaming

For models that support reasoning/thinking (o1, Claude with extended thinking, DeepSeek R1):

```python
# Begin reasoning block
yield format_sse({"type": "reasoning-start", "id": "reasoning-1"})

# Stream reasoning chunks
yield format_sse({"type": "reasoning-delta", "id": "reasoning-1", "delta": "Let me think..."})

# End reasoning block
yield format_sse({"type": "reasoning-end", "id": "reasoning-1"})
```

#### 4. Tool Calls

Tool calls create a `tool-{toolName}` part in the frontend. The flow is:

```python
tool_call_id = "call-abc123"
tool_name = "get_weather"

# 1. Start tool input streaming
yield format_sse({
    "type": "tool-input-start",
    "toolCallId": tool_call_id,
    "toolName": tool_name
})

# 2. Stream input as it's being generated (optional, for streaming tool args)
yield format_sse({
    "type": "tool-input-delta",
    "toolCallId": tool_call_id,
    "inputTextDelta": '{"location": "San'
})
yield format_sse({
    "type": "tool-input-delta",
    "toolCallId": tool_call_id,
    "inputTextDelta": ' Francisco"}'
})

# 3. Signal input is complete with parsed input object
yield format_sse({
    "type": "tool-input-available",
    "toolCallId": tool_call_id,
    "toolName": tool_name,
    "input": {"location": "San Francisco", "units": "celsius"}
})

# 4. After executing tool, send output
yield format_sse({
    "type": "tool-output-available",
    "toolCallId": tool_call_id,
    "output": {"temperature": 18, "conditions": "Sunny"}
})

# Or send error if tool failed
yield format_sse({
    "type": "tool-output-error",
    "toolCallId": tool_call_id,
    "errorText": "Failed to fetch weather data"
})
```

**Non-streaming tool input:** If you have the complete input, you can skip `tool-input-start` and `tool-input-delta`, and just send `tool-input-available` followed by `tool-output-available`.

The frontend will render this as a `tool-get_weather` part that can be displayed with the `Tool` component from AI Elements.

#### 5. Error Handling

```python
# Send error - note: field is "errorText" not "error"
yield format_sse({"type": "error", "errorText": "Error message here"})
```

### Complete Stream Sequence

A typical response follows this sequence:

```
1. start              → Initialize message
2. reasoning-start    → Begin thinking (optional)
3. reasoning-delta    → Stream thinking tokens (multiple)
4. reasoning-end      → End thinking
5. tool-input-start   → Begin tool call (optional)
6. tool-input-delta   → Stream tool args (optional)
7. tool-input-available → Tool input complete
8. tool-output-available → Tool result
9. text-start         → Begin response
10. text-delta        → Stream response tokens (multiple)
11. text-end          → End response
12. finish            → Finalize message
13. [DONE]            → Close stream
```

## Implementation Example

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json
import uuid

def format_sse(data: dict) -> str:
    return f"data: {json.dumps(data, separators=(',', ':'))}\n\n"

@app.post("/api/chat")
async def chat(request: ChatRequest):
    async def generate():
        message_id = f"msg-{uuid.uuid4().hex}"
        text_id = "text-1"
        reasoning_id = "reasoning-1"

        # 1. Start
        yield format_sse({"type": "start", "messageId": message_id})

        try:
            # 2. Optional: Reasoning
            yield format_sse({"type": "reasoning-start", "id": reasoning_id})
            yield format_sse({"type": "reasoning-delta", "id": reasoning_id, "delta": "Thinking..."})
            yield format_sse({"type": "reasoning-end", "id": reasoning_id})

            # 3. Stream from LLM
            stream = await client.chat.completions.create(
                model=request.model,
                messages=messages,
                stream=True,
            )

            text_started = False
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    if not text_started:
                        yield format_sse({"type": "text-start", "id": text_id})
                        text_started = True

                    yield format_sse({
                        "type": "text-delta",
                        "id": text_id,
                        "delta": chunk.choices[0].delta.content
                    })

            if text_started:
                yield format_sse({"type": "text-end", "id": text_id})

            # 4. Finish
            yield format_sse({"type": "finish"})

        except Exception as e:
            yield format_sse({"type": "error", "errorText": str(e)})

        # 5. Done marker
        yield "data: [DONE]\n\n"

    response = StreamingResponse(generate(), media_type="text/event-stream")
    response.headers["x-vercel-ai-ui-message-stream"] = "v1"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"
    return response
```

## Frontend Integration

The frontend uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport`:

```tsx
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: 'http://localhost:8000/api/chat',
    credentials: 'include',
  }),
});
```

### Message Parts

Messages contain `parts` array with different types:

```tsx
import { type ToolUIPart } from 'ai';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';

message.parts.map((part) => {
  switch (part.type) {
    case 'text':
      return <div>{part.text}</div>;
    case 'reasoning':
      return <div>{part.text}</div>;
    case 'source-url':
      return <a href={part.url}>{part.title}</a>;
    default:
      // Handle tool-* types (tool-get_weather, tool-search, etc.)
      if (part.type.startsWith('tool-')) {
        const toolPart = part as ToolUIPart;
        const toolName = toolPart.type.replace('tool-', '');
        return (
          <Tool>
            <ToolHeader title={toolName} type={toolPart.type} state={toolPart.state} />
            <ToolContent>
              <ToolInput input={toolPart.input} />
              <ToolOutput output={toolPart.output} errorText={toolPart.errorText} />
            </ToolContent>
          </Tool>
        );
      }
      return null;
  }
});
```

## Key Differences from AI SDK v4/v5

| Aspect | Old Protocol | AI SDK v6 |
|--------|-------------|-----------|
| Format | Custom data stream | SSE with JSON |
| Text | Single event | start/delta/end pattern |
| Errors | `error` field | `errorText` field |
| Header | None | `x-vercel-ai-ui-message-stream: v1` |
| IDs | Optional | Required for each block |

## Common Pitfalls

1. **Missing header**: Must include `x-vercel-ai-ui-message-stream: v1`
2. **Missing IDs**: Each text/reasoning block needs a unique `id`
3. **Wrong sequence**: Must send `start` first and `finish` before `[DONE]`