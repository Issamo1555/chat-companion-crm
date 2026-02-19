import MainLayout from '@/components/layout/MainLayout';
import ClientList from '@/components/clients/ClientList';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const Clients = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agentId') || undefined;

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: api.getClients,
  });

  return (
    <MainLayout>
      {isLoading ? (
        <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ClientList clients={clients} agentId={agentId} />
      )}
    </MainLayout>
  );
};

export default Clients;
