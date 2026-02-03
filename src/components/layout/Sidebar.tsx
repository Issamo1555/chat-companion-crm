import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  UserCog,
  Settings,
  LogOut,
  Phone,
} from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
}

const Sidebar = ({ isAdmin = true }: SidebarProps) => {
  const location = useLocation();

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, adminOnly: true },
    { name: 'Clients', href: '/clients', icon: Users, adminOnly: false },
    { name: 'Conversations', href: '/conversations', icon: MessageSquare, adminOnly: false },
    { name: 'Agents', href: '/agents', icon: UserCog, adminOnly: true },
    { name: 'Paramètres', href: '/settings', icon: Settings, adminOnly: false },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <Phone className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">WhatsApp CRM</h1>
          <p className="text-xs text-sidebar-foreground/60">Gestion clients</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-foreground">
            SB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              Sophie Bernard
            </p>
            <p className="text-xs text-sidebar-foreground/60">Admin</p>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
