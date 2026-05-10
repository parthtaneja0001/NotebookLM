
import ReactMarkdown from 'react-markdown';
import { User, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 py-6 px-4 md:px-8",
        isUser ? "bg-transparent" : "bg-card shadow-sm rounded-xl border border-border/50"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-zinc-700 to-zinc-900 text-white shadow-md"
      )}>
        {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
      </div>
      
      <div className="flex-1 min-w-0 prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-accent prose-pre:border prose-pre:border-border">
        {isUser ? (
          <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-foreground text-[15px] leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
