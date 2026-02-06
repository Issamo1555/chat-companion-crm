import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      <main className="pl-64">
        <div className="min-h-screen p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
