import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import type { Message } from './components/ChatBubble';

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const handleUpload = (file: File, collectionId: string) => {
    setFiles((prev) => [...prev, file]);
    setActiveCollectionId(collectionId);
    
    // Optional: Add an automatic AI greeting or notification
    const systemMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I've successfully processed **${file.name}**. What would you like to know about it?`
    };
    setMessages((prev) => [...prev, systemMsg]);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!activeCollectionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api';
      const response = await fetch(`${backendUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: content,
          collection: activeCollectionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || "I didn't receive a valid answer.",
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error fetching from backend:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error while trying to fetch the response. Make sure the backend server is running.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30 text-foreground">
      <Sidebar 
        files={files} 
        onClearChat={handleClearChat} 
      />
      
      <main className="flex-1 flex flex-col h-full relative">
        <ChatArea 
          messages={messages} 
          isLoading={isLoading} 
          onSendMessage={handleSendMessage}
          hasFiles={files.length > 0 && activeCollectionId !== null} 
          onUpload={handleUpload}
        />
      </main>
    </div>
  );
}
