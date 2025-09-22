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
  X,
  ChevronDown
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { session, profile, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: 'Verträge', href: '/', icon: FileText },
    ...(profile?.role === 'admin' ? [
      { name: 'Admin Dashboard', href: '/admin', icon: Settings },
      { name: 'Benutzerverwaltung', href: '/users', icon: Users }
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
            {session && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 text-sm">
                      <UserIcon className="h-4 w-4" />
                      <span>{profile.display_name || profile.email}</span>
                      <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                        {profile.role === 'admin' ? 'Admin' : 'AE'}
                      </Badge>
                    </div>
                    <div className="sm:hidden">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2 sm:hidden">
                    <UserIcon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{profile.display_name || profile.email}</span>
                      <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="w-fit mt-1">
                        {profile.role === 'admin' ? 'Admin' : 'AE'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="sm:hidden" />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Mein Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); }} className="text-destructive">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

            {/* Mobile User Info */}
            {profile && (
              <div className="border-t p-4 sm:hidden">
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4" />
                  <span>{profile.display_name || profile.email}</span>
                  <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                    {profile.role === 'admin' ? 'Admin' : 'AE'}
                  </Badge>
                </div>
              </div>
            )}
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