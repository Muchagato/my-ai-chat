import { useState, useCallback, useRef } from 'react';
import { streamText } from 'ai';
import { nanoid } from 'nanoid';
import { openai } from '@/lib/ai';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts: Array<{ type: 'text'; text: string }>;
}

export type ChatStatus = 'idle' | 'submitted' | 'streaming';

interface SendMessageOptions {
  model?: string;
}

export function useOpenAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    options: SendMessageOptions = {}
  ) => {
    if (!content.trim()) return;

    const model = options.model || 'meta-llama/llama-3.3-70b-instruct:free';

    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content: content.trim(),
      parts: [{ type: 'text', text: content.trim() }],
    };

    const assistantMessageId = nanoid();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      parts: [{ type: 'text', text: '' }],
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setStatus('submitted');

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const allMessages = [...messages, userMessage];

      const result = streamText({
        model: openai(model),
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        abortSignal: abortControllerRef.current.signal,
      });

      setStatus('streaming');
      let accumulatedContent = '';

      for await (const chunk of result.textStream) {
        accumulatedContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.id === assistantMessageId) {
            lastMessage.content = accumulatedContent;
            lastMessage.parts = [{ type: 'text', text: accumulatedContent }];
          }
          return [...newMessages];
        });
      }

      setStatus('idle');
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('Chat error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.id === assistantMessageId) {
          lastMessage.content = `Error: ${(error as Error).message}`;
          lastMessage.parts = [{ type: 'text', text: `Error: ${(error as Error).message}` }];
        }
        return [...newMessages];
      });
      setStatus('idle');
    }
  }, [messages]);

  const regenerate = useCallback(async (options: SendMessageOptions = {}) => {
    const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user');
    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];
    const messagesBeforeLastUser = messages.slice(0, lastUserMessageIndex);

    setMessages(messagesBeforeLastUser);

    // Need to wait for state update before sending
    setTimeout(() => {
      sendMessage(lastUserMessage.content, options);
    }, 0);
  }, [messages, sendMessage]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setStatus('idle');
  }, []);

  return {
    messages,
    status,
    sendMessage,
    regenerate,
    stop,
    clear,
  };
}
