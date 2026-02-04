'use client';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type ToolUIPart } from 'ai';
import { CopyIcon, GlobeIcon, RefreshCcwIcon, SettingsIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { UITreeRenderer, isUITree } from '@/components/ai-elements/ui-tree-renderer';
import { Loader } from '@/components/ai-elements/loader';
import { AuthForm, checkAuthStatus } from '@/components/auth/auth-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

// Claude models available with your account
// Note: claude-max-api-proxy uses short model names
const models = [
  {
    name: 'Claude Sonnet 4',
    value: 'claude-sonnet-4',
  },
  {
    name: 'Claude Opus 4',
    value: 'claude-opus-4',
  },
  {
    name: 'Claude Haiku 3.5',
    value: 'claude-haiku-3.5',
  },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus().then((status) => {
      setIsAuthenticated(status.authenticated);
    });
  }, []);

  const { messages, sendMessage, status, regenerate, error } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:8000/api/chat',
      credentials: 'include',
    }),
    onError: (error) => {
      console.error('Chat error:', error);
      // Check if it's an auth error
      if (error.message.includes('401') || error.message.includes('authenticated')) {
        setIsAuthenticated(false);
      }
    },
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    );
    setInput('');
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  // Not authenticated - show auth form
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <AuthForm
          onAuthenticated={() => setIsAuthenticated(true)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message, messageIndex) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            <MessageResponse>
                              {part.text}
                            </MessageResponse>
                          </MessageContent>
                          {message.role === 'assistant' && messageIndex === messages.length - 1 && (
                            <MessageActions>
                              <MessageAction
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </MessageAction>
                              <MessageAction
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Message>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      // Handle tool-* types (tool-weather, tool-search, etc.)
                      if (part.type.startsWith('tool-')) {
                        const toolPart = part as ToolUIPart;
                        const toolName = toolPart.type.replace('tool-', '');

                        // If output is a UI tree, render it directly in chat (not in collapsible)
                        if (isUITree(toolPart.output)) {
                          return (
                            <div key={`${message.id}-${i}`} className="my-4">
                              <UITreeRenderer tree={toolPart.output} />
                            </div>
                          );
                        }

                        // Regular tool output - show in collapsible
                        return (
                          <Tool key={`${message.id}-${i}`}>
                            <ToolHeader
                              title={toolName}
                              type={toolPart.type}
                              state={toolPart.state}
                            />
                            <ToolContent>
                              <ToolInput input={toolPart.input} />
                              <ToolOutput
                                output={toolPart.output}
                                errorText={toolPart.errorText}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader />}
            {error && (
              <Message from="assistant">
                <MessageContent>
                  <MessageResponse className="text-red-500">
                    {`Error: ${error.message}`}
                  </MessageResponse>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
              {/* Settings button to manage authentication */}
              <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <SettingsIcon size={16} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <AuthForm
                    onAuthenticated={() => {
                      setIsAuthenticated(true);
                      setAuthDialogOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
export default ChatBotDemo;
