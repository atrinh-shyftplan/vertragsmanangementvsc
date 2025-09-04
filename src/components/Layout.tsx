import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  BarChart3,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { mockUsers, type User } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { session, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const roleSwitch = () => {
    const adminUser = mockUsers.find(u => u.role === 'admin');
    const aeUser = mockUsers.find(u => u.role === 'ae');
    setCurrentUser(currentUser.role === 'admin' ? aeUser! : adminUser!);
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Verträge', href: '/contracts', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ...(currentUser.role === 'admin' ? [
      { name: 'Admin Panel', href: '/admin', icon: Settings },
      { name: 'Benutzer', href: '/users', icon: Users },
      { name: 'Einstellungen', href: '/settings', icon: Settings }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">ContractFlow</h1>
                <p className="text-xs text-muted-foreground">Vertragsmanagement</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={roleSwitch}
              className="hidden sm:flex items-center gap-2"
            >
              <UserIcon className="h-4 w-4" />
              {currentUser.name}
              <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                {currentUser.role === 'admin' ? 'Admin' : 'AE'}
              </Badge>
            </Button>
            {session ? (
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); }}>
                Logout
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex h-full flex-col pt-16 lg:pt-0">
            <nav className="flex-1 space-y-1 p-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${isActive(item.href)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Role Switch */}
            <div className="border-t p-4 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={roleSwitch}
                className="w-full flex items-center gap-2"
              >
                <UserIcon className="h-4 w-4" />
                {currentUser.name}
                <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                  {currentUser.role === 'admin' ? 'Admin' : 'AE'}
                </Badge>
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:pl-0">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}