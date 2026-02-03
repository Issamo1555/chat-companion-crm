import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isAdmin={true} />
      <main className="pl-64">
        <div className="min-h-screen p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
