import { useRef, useEffect } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { type Message, ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { FileUpload } from './FileUpload';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  hasFiles: boolean;
  onUpload?: (file: File, collectionId: string) => void;
}

export function ChatArea({ messages, isLoading, onSendMessage, hasFiles, onUpload }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome to NotebookLM Clone
            </h2>
            <p className="text-muted-foreground max-w-md mb-8">
              {hasFiles 
                ? "You've added your sources. Start asking questions to get insights and summaries grounded in your documents."
                : "Upload a document below to start asking questions."}
            </p>
            {!hasFiles && onUpload && (
              <div className="w-full max-w-md">
                <FileUpload onUpload={onUpload} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col pb-6 max-w-4xl mx-auto w-full">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            
            {isLoading && (
              <div className="flex w-full gap-4 py-6 px-4 md:px-8 bg-card shadow-sm rounded-xl border border-border/50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="flex-1 flex items-center">
                  <span className="text-muted-foreground text-sm font-medium animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <ChatInput onSend={onSendMessage} disabled={isLoading || !hasFiles} />
    </div>
  );
}
