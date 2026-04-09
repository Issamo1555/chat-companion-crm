import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile, Zap } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface ChatInputProps {
  onSend: (content: string | File) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: api.getTemplates,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSend(file as any); // Pass file object, parent component needs to handle it
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertTemplate = (content: string) => {
    setMessage((prev) => (prev ? `${prev}\n${content}` : content));
    setOpen(false);
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*"
      />
      <div className="flex items-end gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <Zap className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[300px]" side="top" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un modèle..." />
              <CommandList>
                <CommandEmpty>Aucun modèle trouvé.</CommandEmpty>
                <CommandGroup heading="Modèles">
                  {templates.map((template) => (
                    <CommandItem
                      key={template.id}
                      onSelect={() => insertTemplate(template.content)}
                      className="flex flex-col items-start gap-1 p-2 cursor-pointer"
                    >
                      <span className="font-medium text-sm">{template.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-2 w-full">
                        {template.content}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <Smile className="h-5 w-5" />
        </Button>
        <Textarea
          placeholder="Tapez votre message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="min-h-[44px] max-h-32 resize-none rounded-xl bg-secondary border-0"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="shrink-0 rounded-xl bg-accent hover:bg-accent/90"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
