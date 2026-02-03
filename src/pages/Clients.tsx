import MainLayout from '@/components/layout/MainLayout';
import ClientList from '@/components/clients/ClientList';
import { mockClients } from '@/data/mockData';

const Clients = () => {
  return (
    <MainLayout>
      <ClientList clients={mockClients} />
    </MainLayout>
  );
};

export default Clients;
