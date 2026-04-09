import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ChatWindow from '@/components/chat/ChatWindow';
import StatusBadge from '@/components/clients/StatusBadge';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { socketService } from '@/services/socket';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, User as UserIcon } from 'lucide-react';

const Conversations = () => {
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: api.getClients,
  });

  // Select first client valid when data loads if none selected
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Listen for real-time messages
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      console.log('📨 New message received via Socket.IO:', data);
      // Invalidate clients query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    };

    socketService.on('message:new', handleNewMessage);

    return () => {
      socketService.off('message:new', handleNewMessage);
    };
  }, [queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string | File) => {
      if (!selectedClientId) return;
      return api.sendMessage(selectedClientId, content, 'outbound');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const privateClients = clients.filter(
    (client) => !client.phoneNumber.includes('@g.us') && !client.phoneNumber.includes('@broadcast')
  );

  const groupClients = clients.filter(
    (client) => client.phoneNumber.includes('@g.us') || client.phoneNumber.includes('@broadcast')
  );

  const filterBySearch = (list: any[]) =>
    list.filter(
      (client) =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.phoneNumber.includes(search)
    );

  const filteredPrivate = filterBySearch(privateClients);
  const filteredGroups = filterBySearch(groupClients);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleSendMessage = (content: string | File) => {
    sendMessageMutation.mutate(content);
  };

  const renderClientList = (list: any[]) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
          Aucune conversation trouvée
        </div>
      );
    }

    return list.map((client) => {
      const lastMessage = client.messages && client.messages.length > 0
        ? client.messages[client.messages.length - 1]
        : null;
      const isSelected = client.id === selectedClientId;

      return (
        <button
          key={client.id}
          onClick={() => setSelectedClientId(client.id)}
          className={cn(
            'w-full text-left p-4 border-b border-border transition-colors',
            isSelected
              ? 'bg-accent/10 border-l-2 border-l-accent'
              : 'hover:bg-secondary/50'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-accent font-semibold shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-foreground truncate">
                  {client.name}
                </h3>
                {lastMessage && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(lastMessage.timestamp), {
                      addSuffix: false,
                      locale: fr,
                    })}
                  </span>
                )}
              </div>
              {lastMessage && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {lastMessage.direction === 'outbound' && 'Vous: '}
                  {lastMessage.content}
                </p>
              )}
              <StatusBadge status={client.status} size="sm" />
            </div>
          </div>
        </button>
      );
    });
  };

  return (
    <>
      <div className="flex h-[calc(100vh-5rem)] gap-6">
        {/* Conversations List */}
        <div className="w-80 flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Conversations
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="private" className="w-full h-full flex flex-col">
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="private" className="text-xs">
                  <UserIcon className="h-3.5 w-3.5 mr-2" />
                  Privés
                </TabsTrigger>
                <TabsTrigger value="groups" className="text-xs">
                  <Users className="h-3.5 w-3.5 mr-2" />
                  Groupes
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="private" className="h-full m-0 overflow-y-auto scrollbar-thin">
                {renderClientList(filteredPrivate)}
              </TabsContent>
              <TabsContent value="groups" className="h-full m-0 overflow-y-auto scrollbar-thin">
                {renderClientList(filteredGroups)}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className="flex-1">
          {selectedClient ? (
            <ChatWindow
              client={selectedClient}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full rounded-2xl border border-dashed border-border">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Sélectionnez une conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Conversations;
