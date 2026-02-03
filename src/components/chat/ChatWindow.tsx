import { useRef, useEffect, useState } from 'react';
import { Message, Client } from '@/types/crm';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatWindowProps {
  client: Client;
  onSendMessage: (content: string) => void;
}

const ChatWindow = ({ client, onSendMessage }: ChatWindowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(client.messages);

  useEffect(() => {
    setMessages(client.messages);
  }, [client.messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    const newMessage: Message = {
      id: `m${Date.now()}`,
      clientId: client.id,
      content,
      direction: 'outbound',
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, newMessage]);
    onSendMessage(content);
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(message.timestamp, 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-whatsapp-light/30 to-background rounded-2xl border border-border overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{client.name}</h3>
          <p className="text-sm text-muted-foreground">{client.phoneNumber}</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
      >
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex justify-center mb-4">
              <span className="px-3 py-1 rounded-full bg-secondary text-xs text-muted-foreground">
                {format(new Date(date), 'EEEE d MMMM', { locale: fr })}
              </span>
            </div>
            <div className="space-y-2">
              {dateMessages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Aucun message pour le moment
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default ChatWindow;
