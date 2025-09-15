import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { 
  FileText, 
  Search,
  Filter,
  Plus,
  Calendar,
  User,
  Euro,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { contractTemplate } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ContractEditModal } from '@/components/ContractEditModal';
import ContractViewer from '@/components/ContractViewer';
import NewContractEditor from '@/components/NewContractEditor';
import { useToast } from '@/hooks/use-toast';

// UI contract type (compatible with existing components)
interface Contract {
  id: string;
  title: string;
  client: string;
  status: 'active' | 'pending' | 'expired' | 'draft';
  value: number;
  startDate: string;
  endDate: string;
  assignedTo: string;
  assignedUser?: {
    display_name: string | null;
    email: string | null;
    phone_number: string | null;
  };
  creator?: {
    display_name: string | null;
  };
  description: string;
  tags: string[];
  lastModified: string;
  progress: number;
  contractType?: 'ep_standard' | 'ep_rollout';
  templateVariables?: Record<string, any>;
  globalVariables?: Record<string, any>;
}

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Convert database contract to UI contract format
  const convertDbContract = (dbContract: any): Contract => ({
    id: dbContract.id,
    title: dbContract.title,
    client: dbContract.client,
    status: dbContract.status as 'active' | 'pending' | 'expired' | 'draft',
    value: dbContract.value,
    startDate: dbContract.start_date,
    endDate: dbContract.end_date,
    assignedTo: dbContract.assigned_user?.display_name || dbContract.assigned_to || 'Unassigned',
    assignedUser: dbContract.assigned_user || undefined,
    creator: dbContract.creator || undefined,
    description: dbContract.description || '',
    tags: dbContract.tags || [],
    lastModified: dbContract.updated_at,
    progress: dbContract.progress || 0,
    contractType: dbContract.contract_type_key as 'ep_standard' | 'ep_rollout' | undefined,
    templateVariables: dbContract.template_variables || undefined,
    globalVariables: dbContract.global_variables || undefined,
  });

  // Load contracts from database with assigned user data
  const loadContracts = async () => {
    try {
      setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*, assigned_user:profiles(display_name), creator:profiles(display_name)')
      .order('updated_at', { ascending: false });

      if (error) throw error;

      // Defensiv prüfen, ob die Daten ein Array sind und fehlerhafte Einträge (null) filtern.
      if (Array.isArray(data)) {
        const convertedContracts = data.filter(Boolean).map(convertDbContract);
        setContracts(convertedContracts);
      } else {
        setContracts([]); // Fallback auf ein leeres Array, wenn keine Daten kommen.
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast({
        title: "Fehler beim Laden",
        description: "Die Verträge konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load contracts on component mount
  useEffect(() => {
    loadContracts();
  }, []);

  // Refresh contracts when new contract modal closes
  const handleNewContractClose = () => {
    setIsNewContractModalOpen(false);
    loadContracts(); // Refresh the list
  };

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

  const handleNewContract = () => {
    setIsNewContractModalOpen(true);
  };

  const handleViewContract = (contract: Contract) => {
    setViewingContract(contract);
    setIsViewerOpen(true);
  };

  const handleSaveContract = (updatedContract: Contract) => {
    setContracts(prev => {
      const existingIndex = prev.findIndex(contract => contract.id === updatedContract.id);
      if (existingIndex >= 0) {
        // Update existing
        return prev.map(contract => 
          contract.id === updatedContract.id ? updatedContract : contract
        );
      } else {
        // Add new
        return [...prev, updatedContract];
      }
    });
    toast({
      title: updatedContract.id ? "Vertrag aktualisiert" : "Vertrag erstellt",
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
    active: 'Final/Aktiv',
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
        <Button className="sm:w-auto w-full" onClick={handleNewContract}>
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
                Final/Aktiv
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                Ausstehend
              </Button>
              <Button
                variant={filterStatus === 'expired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('expired')}
              >
                Abgelaufen
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
                    {contract.status !== 'active' && (
                      <DropdownMenuItem onClick={() => handleEditContract(contract)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleEditContract(contract)}>
                      <FileText className="mr-2 h-4 w-4" />
                      PDF exportieren
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

              <div className="pt-2 border-t space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Zuständiger</p>
                  <p className="text-sm font-medium">
                    {contract.assignedUser?.display_name || contract.assignedTo || 'Nicht zugewiesen'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Erstellt von</p>
                  <p className="text-sm font-medium">
                    {contract.creator?.display_name || 'Unbekannt'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Zuletzt geändert</p>
                  <p className="text-sm font-medium">
                    {formatDate(contract.lastModified)}
                  </p>
                </div>
              </div>

              {contract.status !== 'active' && (
                <Button size="sm" className="w-full" onClick={() => handleEditContract(contract)}>
                  <Edit className="mr-2 h-3 w-3" />
                  Bearbeiten
                </Button>
              )}
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
            <Button onClick={handleNewContract}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Vertrag
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* New Contract Modal */}
      <Dialog open={isNewContractModalOpen} onOpenChange={setIsNewContractModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <NewContractEditor onClose={handleNewContractClose} />
        </DialogContent>
      </Dialog>

      {/* Contract Edit Modal */}
      {editingContract && isEditModalOpen && (
        <ContractEditModal
          contract={editingContract}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingContract(null);
          }}
          onSave={handleSaveContract}
        />
      )}

      {/* Contract Viewer Modal */}
      {viewingContract && isViewerOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen py-4">
            <ContractViewer
              contract={viewingContract}
              template={contractTemplate}
              onClose={() => {
                setIsViewerOpen(false);
                setViewingContract(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}