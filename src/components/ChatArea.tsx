import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../lib/supabase';
import MessageBubble from './MessageBubble';
import './ChatArea.css';

interface ChatAreaProps {
  chatId: string | null;
  onUpdateTitle: (chatId: string, title: string) => void;
  sidebarCollapsed: boolean;
}

function ChatArea({ chatId, onUpdateTitle, sidebarCollapsed }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!chatId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const { data: userMsgData, error: userMsgError } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          role: 'user',
          content: userMessage,
        },
      ])
      .select()
      .single();

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      setIsLoading(false);
      return;
    }

    if (userMsgData) {
      setMessages([...messages, userMsgData]);

      if (messages.length === 0) {
        const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
        onUpdateTitle(chatId, title);
      }
    }

    setTimeout(async () => {
      const assistantResponse = generateMockResponse(userMessage);

      const { data: assistantMsgData, error: assistantMsgError } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: chatId,
            role: 'assistant',
            content: assistantResponse,
          },
        ])
        .select()
        .single();

      if (assistantMsgError) {
        console.error('Error saving assistant message:', assistantMsgError);
      } else if (assistantMsgData) {
        setMessages(prev => [...prev, assistantMsgData]);
      }

      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      setIsLoading(false);
    }, 1000);
  };

  const generateMockResponse = (userMessage: string): string => {
    const responses = [
      `I understand you're asking about "${userMessage.slice(0, 30)}...". This is a demonstration of the D-admin AI chat platform. In a production environment, this would connect to an actual AI service.`,
      `That's an interesting question about "${userMessage.slice(0, 30)}...". The D-admin platform is designed to provide a clean, modern interface for AI conversations, similar to Claude, ChatGPT, and other leading platforms.`,
      `Thank you for your message. D-admin features a responsive design with chat history management, real-time messaging, and a clean user interface. Your question about "${userMessage.slice(0, 30)}..." would be processed by an AI model in production.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  if (!chatId) {
    return (
      <div className={`chat-area ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <h2>Welcome to D-admin</h2>
          <p>Start a new conversation to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-area ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="messages-container">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
              </svg>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatArea;
