import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Euro,
  Plus,
  ArrowRight
} from 'lucide-react';
import { mockContracts, mockStats } from '@/lib/mockData';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const recentContracts = mockContracts.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-status-active';
      case 'pending': return 'text-status-pending';
      case 'expired': return 'text-status-expired';
      case 'draft': return 'text-status-draft';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-status-active" />;
      case 'pending': return <Clock className="h-4 w-4 text-status-pending" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-status-expired" />;
      case 'draft': return <FileText className="h-4 w-4 text-status-draft" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Überblick über Ihre Verträge und wichtige Kennzahlen
          </p>
        </div>
        <Button className="sm:w-auto w-full" style={{ backgroundColor: '#8C5AF5', color: 'white' }}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Vertrag
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Verträge</CardTitle>
            <CheckCircle className="h-4 w-4 text-status-active" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeContracts}</div>
            <p className="text-xs text-muted-foreground">
              von {mockStats.totalContracts} Verträgen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtwert</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockStats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Durchschnitt: {formatCurrency(mockStats.avgContractValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Clock className="h-4 w-4 text-status-pending" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.pendingContracts}</div>
            <p className="text-xs text-muted-foreground">
              Benötigen Aufmerksamkeit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+18%</div>
            <p className="text-xs text-muted-foreground">
              vs. letzter Monat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contracts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Aktuelle Verträge</CardTitle>
                <CardDescription>
                  Ihre wichtigsten Verträge im Überblick
                </CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link to="/contracts">
                  Alle anzeigen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentContracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    {getStatusIcon(contract.status)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium leading-none">{contract.title}</h4>
                    <p className="text-sm text-muted-foreground">{contract.client}</p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(contract.status)}
                      >
                        {contract.status === 'active' && 'Aktiv'}
                        {contract.status === 'pending' && 'Ausstehend'}
                        {contract.status === 'expired' && 'Abgelaufen'}
                        {contract.status === 'draft' && 'Entwurf'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(contract.value)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2 min-w-[120px]">
                  <div className="text-sm font-medium">{contract.progress}%</div>
                  <Progress value={contract.progress} className="w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}