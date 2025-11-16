import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Settings, 
  Users, 
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { session, profile, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: 'Verträge', href: '/' },
    ...(profile?.role === 'admin' ? [
      { name: 'Admin Dashboard', href: '/admin' },
      { name: 'Benutzerverwaltung', href: '/users' }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-md rounded-b-xl mx-auto max-w-5xl mt-4">
        <div className="flex h-20 items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="shyftcontract Logo" className="h-10 w-10" />
            <div className="hidden sm:block">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">shyftcontract</h1>
              <p className="text-xs text-muted-foreground font-light">Vertragsmanagement</p>
            </div>
          </div>

          {/* Centered Navigation */}
          <nav className="flex-1 flex justify-center">
            <div className="flex gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-full text-base font-normal transition-all
                    ${isActive(item.href)
                      ? 'bg-primary/90 text-primary-foreground shadow'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}
                  `}
                  style={{ letterSpacing: '0.01em' }}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          <div className="flex items-center gap-4">
            {session && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 rounded-full">
                    <UserIcon className="h-5 w-5" />
                    <span className="hidden md:inline text-base font-light">{profile.display_name || profile.email}</span>
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role === 'admin' ? 'Admin' : 'AE'}
                    </Badge>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                <Button size="sm" className="rounded-full px-5 py-2">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-5xl mt-8">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}