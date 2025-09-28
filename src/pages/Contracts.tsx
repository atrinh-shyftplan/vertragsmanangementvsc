import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AttachmentWithModule } from '@/integrations/supabase/types';
// import { ContractEditModal } from '@/components/ContractEditModal'; // Veraltet
import ContractViewer from '@/components/ContractViewer';
import NewContractEditor from '@/components/NewContractEditor';
import { useToast } from '@/hooks/use-toast';

// A more specific type for template variables
interface TemplateVariables {
  [key: string]: any;
}

// UI contract type (compatible with existing components)
interface Contract {
  id: string;
  title: string;
  client: string;
  status: 'draft' | 'ready_for_review' | 'active' | 'archived';
  value: number;
  startDate: string | null;
  endDate: string | null;
  assignedTo: string;
  assignedUser?: {
    display_name: string | null;
  };
  description: string;
  tags: string[];
  lastModified: string;
  progress: number;
  contractType?: 'ep_standard' | 'ep_rollout';
  templateVariables?: TemplateVariables;
  globalVariables?: Record<string, any>;
  contract_attachments: {
    attachments: AttachmentWithModule | null;
  }[];
  contract_types: {
    name_de: string;
  } | null;
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
    status: dbContract.status as Contract['status'],
    value: dbContract.variables?.value || dbContract.value,
    startDate: dbContract.variables?.start_date || dbContract.start_date || null,
    endDate: dbContract.variables?.end_date || dbContract.end_date || null,
    assignedTo: dbContract.assigned_user?.display_name || dbContract.assigned_to || 'Unassigned',
    assignedUser: dbContract.assigned_user || undefined,
    description: dbContract.description || '',
    tags: dbContract.tags || [],
    lastModified: dbContract.updated_at,
    progress: dbContract.progress || 0,
    contractType: dbContract.contract_types?.key as 'ep_standard' | 'ep_rollout' | undefined,
    // Korrektur: Lade alle Variablen aus dem einzelnen 'variables'-Feld.
    templateVariables: dbContract.variables || {},
    globalVariables: dbContract.variables || {},
    contract_attachments: dbContract.contract_attachments || [],
    contract_types: dbContract.contract_types || null,
  });

  // Load contracts from database with assigned user data
  const loadContracts = async () => {
    try {
      setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*, assigned_user:profiles!assigned_to_profile_id(*), contract_attachments(attachments(*, contract_modules(*))), contract_types(name_de, key)')
      .order('created_at', { ascending: false });

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

  const handleEditContractClose = () => {
    setIsEditModalOpen(false);
    setEditingContract(null);
    loadContracts(); // Wichtig: Lade die Liste neu, um Änderungen zu sehen!
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

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'draft': return 'text-status-draft border-status-draft/20 bg-status-draft/10';
      case 'ready_for_review': return 'text-blue-600 border-blue-600/20 bg-blue-600/10';
      case 'active': return 'text-status-active border-status-active/20 bg-status-active/10';
      case 'archived': return 'text-gray-500 border-gray-500/20 bg-gray-500/10';
      default: return 'text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const statusLabels = {
    draft: 'Entwurf',
    ready_for_review: 'Zur Prüfung',
    active: 'Aktiv',
    archived: 'Archiviert'
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Alle
              </Button>
              <Button
                variant={filterStatus === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('draft')}
              >
                Entwurf
              </Button>
              <Button
                variant={filterStatus === 'ready_for_review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('ready_for_review')}
              >
                Zur Prüfung
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                Aktiv
              </Button>
              <Button
                variant={filterStatus === 'archived' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('archived')}
              >
                Archiviert
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContracts.map((contract) => {
          const productAttachments = contract.contract_attachments
            .map(ca => ca.attachments)
            .filter((att): att is AttachmentWithModule => !!att && att.type === 'produkt');
          const productNames: string[] = productAttachments.map(att => att.name).filter(Boolean);

          return (
            <Card key={contract.id} className="flex flex-col hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-2 pr-2">{contract.title}</CardTitle>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">{contract.client}</p>
                  </div>
                  <Badge className={getStatusColor(contract.status)} variant="outline">
                    {statusLabels[contract.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <div>
                  <p className="text-xs text-muted-foreground">Zugewiesen an</p>
                  <p className="text-sm font-medium">{contract.assignedTo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vertragstyp</p>
                  <p className="text-sm font-medium">{contract.contract_types?.name_de || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Produkte</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {productNames.length > 0 ? (
                      productNames.map((name) => (
                        <Badge key={name} variant="secondary">{name}</Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Keine</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleEditContract(contract)}>
                  <Edit className="mr-2 h-3 w-3" />
                  Bearbeiten
                </Button>
              </CardFooter>
            </Card>
          );
        })}
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

      {/* Neues, einheitliches Modal für die Bearbeitung */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <NewContractEditor
            existingContract={editingContract}
            onClose={handleEditContractClose}
          />
        </DialogContent>
      </Dialog>

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