import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Search,
  Filter,
  Plus,
  Calendar,
  User,
  Euro,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { mockContracts, type Contract } from '@/lib/mockData';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ContractEditModal } from '@/components/ContractEditModal';
import { useToast } from '@/hooks/use-toast';

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const { toast } = useToast();

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || contract.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setIsEditModalOpen(true);
  };

  const handleSaveContract = (updatedContract: Contract) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === updatedContract.id ? updatedContract : contract
      )
    );
    toast({
      title: "Vertrag aktualisiert",
      description: "Die Änderungen wurden erfolgreich gespeichert.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-status-active border-status-active/20 bg-status-active/10';
      case 'pending': return 'text-status-pending border-status-pending/20 bg-status-pending/10';
      case 'expired': return 'text-status-expired border-status-expired/20 bg-status-expired/10';
      case 'draft': return 'text-status-draft border-status-draft/20 bg-status-draft/10';
      default: return 'text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const statusLabels = {
    active: 'Aktiv',
    pending: 'Ausstehend',
    expired: 'Abgelaufen',
    draft: 'Entwurf'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verträge</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Ihre Verträge an einem Ort
          </p>
        </div>
        <Button className="sm:w-auto w-full">
          <Plus className="mr-2 h-4 w-4" />
          Neuer Vertrag
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Verträge durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Alle
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                Aktiv
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                Ausstehend
              </Button>
              <Button
                variant={filterStatus === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('draft')}
              >
                Entwurf
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContracts.map((contract) => (
          <Card key={contract.id} className="hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg leading-tight line-clamp-2">
                    {contract.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {contract.client}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      Anzeigen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditContract(contract)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Bearbeiten
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(contract.status)}>
                  {statusLabels[contract.status as keyof typeof statusLabels]}
                </Badge>
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(contract.value)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fortschritt</span>
                  <span className="font-medium">{contract.progress}%</span>
                </div>
                <Progress value={contract.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Start</p>
                  <p className="font-medium">{formatDate(contract.startDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ende</p>
                  <p className="font-medium">{formatDate(contract.endDate)}</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Zugewiesen an</p>
                <p className="text-sm font-medium">{contract.assignedTo}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="mr-2 h-3 w-3" />
                  Details
                </Button>
                <Button size="sm" className="flex-1" onClick={() => handleEditContract(contract)}>
                  <Edit className="mr-2 h-3 w-3" />
                  Bearbeiten
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Verträge gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Passen Sie Ihre Suchkriterien an oder erstellen Sie einen neuen Vertrag.
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Vertrag
            </Button>
          </CardContent>
        </Card>
      )}
      
      <ContractEditModal
        contract={editingContract}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveContract}
      />
    </div>
  );
}