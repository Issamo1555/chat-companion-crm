import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  UserCircle,
  Settings,
  LogOut,
  UserCog,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SidebarProps {
  isAdmin?: boolean;
}

const Sidebar = ({ isAdmin = true }: SidebarProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, adminOnly: true },
    { name: 'Clients', href: '/clients', icon: Users, adminOnly: false },
    { name: 'Conversations', href: '/conversations', icon: MessageSquare, adminOnly: false },
    { name: 'Équipe', href: '/team', icon: UserCircle, adminOnly: true },
    { name: 'Utilisateurs', href: '/users', icon: UserCog, adminOnly: true },
    { name: 'Logs', href: '/logs', icon: ClipboardList, adminOnly: true },
    { name: 'Paramètres', href: '/settings', icon: Settings, adminOnly: false },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || isAdmin
  );

  // Get user initials
  const getUserInitials = () => {
    if (!user) return '??';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center">
          <img src="/beq-logo.png" alt="BEQ Logo" className="h-10 w-10 object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">BEQ CRM</h1>
          <p className="text-xs text-sidebar-foreground/60">WhatsApp Business</p>
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
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role || 'Agent'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
