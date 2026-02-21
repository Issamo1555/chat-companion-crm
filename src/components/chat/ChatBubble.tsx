import { Message } from '@/types/crm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import PlatformIcon from '../clients/PlatformIcon';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble = ({ message }: ChatBubbleProps) => {
  const isOutbound = message.direction === 'outbound';

  return (
    <div
      className={cn(
        'flex animate-fade-in',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
          isOutbound
            ? 'bg-whatsapp-bubble-out rounded-tr-sm'
            : 'bg-whatsapp-bubble-in border border-border rounded-tl-sm'
        )}
      >
        {message.mediaType === 'image' && message.mediaUrl && (
          <img
            src={`http://localhost:3000${message.mediaUrl}`}
            alt={message.content || 'Image'}
            className="mb-2 max-w-full rounded-lg"
          />
        )}
        {message.mediaType === 'video' && message.mediaUrl && (
          <video
            src={`http://localhost:3000${message.mediaUrl}`}
            controls
            className="mb-2 max-w-full rounded-lg"
          />
        )}
        {message.mediaType === 'audio' && message.mediaUrl && (
          <audio
            src={`http://localhost:3000${message.mediaUrl}`}
            controls
            className="mb-2 max-w-full"
          />
        )}
        {message.mediaType === 'document' && message.mediaUrl && (
          <a
            href={`http://localhost:3000${message.mediaUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 flex items-center gap-2 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <span className="text-sm font-medium underline">
              {message.content || 'Document'}
            </span>
          </a>
        )}
        <p className="text-sm text-foreground whitespace-pre-wrap break-all">
          {message.content}
        </p>
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOutbound ? 'justify-end' : 'justify-start'
          )}
        >
          {!isOutbound && message.platform && (
            <PlatformIcon platform={message.platform} size={10} className="opacity-50" />
          )}
          <span className="text-xs text-muted-foreground">
            {format(message.timestamp, 'HH:mm', { locale: fr })}
          </span>
          {isOutbound && (
            <span className="text-muted-foreground">
              {message.status === 'read' ? (
                <CheckCheck className="h-3.5 w-3.5 text-status-new" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
