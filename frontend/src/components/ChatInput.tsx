import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-background border-t border-border/50">
      <form 
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto relative flex items-end gap-2 bg-card border border-border rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all p-2"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message NotebookLM..."
          className="w-full max-h-[200px] bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-foreground placeholder:text-muted-foreground"
          rows={1}
          disabled={disabled}
        />
        <div className="flex-shrink-0 p-1">
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
              input.trim() && !disabled
                ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                : "bg-accent text-muted-foreground cursor-not-allowed"
            )}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </form>
      <div className="text-center mt-2 text-xs text-muted-foreground">
        NotebookLM can make mistakes. Check important info.
      </div>
    </div>
  );
}
