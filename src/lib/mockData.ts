// Mock-Daten für das Vertragsmanagement-Tool

export interface Contract {
  id: string;
  title: string;
  client: string;
  status: 'active' | 'pending' | 'expired' | 'draft';
  value: number;
  startDate: string;
  endDate: string;
  assignedTo: string;
  description: string;
  tags: string[];
  lastModified: string;
  progress: number;
}

export interface User {
  id: string;
  name: string;
  role: 'ae' | 'admin';
  email: string;
  avatar?: string;
}

export const mockContracts: Contract[] = [
  {
    id: '1',
    title: 'Software-Lizenzvertrag Microsoft',
    client: 'TechCorp GmbH',
    status: 'active',
    value: 150000,
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    assignedTo: 'Maria Schmidt',
    description: 'Jahresvertrag für Microsoft Office 365 Enterprise Lizenzen für 500 Mitarbeiter',
    tags: ['Software', 'Microsoft', 'Enterprise'],
    lastModified: '2024-12-15',
    progress: 75
  },
  {
    id: '2',
    title: 'Cloud Infrastructure AWS',
    client: 'StartupXYZ',
    status: 'pending',
    value: 85000,
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    assignedTo: 'Thomas Müller',
    description: 'AWS Cloud Services für Skalierung der E-Commerce Plattform',
    tags: ['Cloud', 'AWS', 'Infrastructure'],
    lastModified: '2024-12-10',
    progress: 25
  },
  {
    id: '3',
    title: 'Consulting Agreement Q1',
    client: 'Industrie AG',
    status: 'active',
    value: 75000,
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    assignedTo: 'Lisa Weber',
    description: 'Strategische IT-Beratung für Digitalisierungsprojekt',
    tags: ['Consulting', 'Strategy', 'Digital'],
    lastModified: '2024-12-12',
    progress: 90
  },
  {
    id: '4',
    title: 'Hardware Liefervertrag',
    client: 'Manufacturing Ltd.',
    status: 'expired',
    value: 45000,
    startDate: '2023-06-01',
    endDate: '2023-12-31',
    assignedTo: 'Stefan Bauer',
    description: 'Lieferung von 100 Workstations und Server-Hardware',
    tags: ['Hardware', 'Workstations', 'Server'],
    lastModified: '2024-01-05',
    progress: 100
  },
  {
    id: '5',
    title: 'Security Services Jahresvertrag',
    client: 'FinTech Solutions',
    status: 'draft',
    value: 120000,
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    assignedTo: 'Anna Hofmann',
    description: 'Umfassende IT-Security Services inkl. Monitoring und Incident Response',
    tags: ['Security', 'Monitoring', 'FinTech'],
    lastModified: '2024-12-14',
    progress: 10
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Maria Schmidt',
    role: 'ae',
    email: 'maria.schmidt@company.de'
  },
  {
    id: '2',
    name: 'Thomas Müller',
    role: 'ae',
    email: 'thomas.mueller@company.de'
  },
  {
    id: '3',
    name: 'Lisa Weber',
    role: 'admin',
    email: 'lisa.weber@company.de'
  },
  {
    id: '4',
    name: 'Stefan Bauer',
    role: 'ae',
    email: 'stefan.bauer@company.de'
  },
  {
    id: '5',
    name: 'Anna Hofmann',
    role: 'ae',
    email: 'anna.hofmann@company.de'
  }
];

export const mockStats = {
  totalContracts: mockContracts.length,
  activeContracts: mockContracts.filter(c => c.status === 'active').length,
  pendingContracts: mockContracts.filter(c => c.status === 'pending').length,
  totalValue: mockContracts.reduce((sum, contract) => sum + contract.value, 0),
  avgContractValue: mockContracts.reduce((sum, contract) => sum + contract.value, 0) / mockContracts.length
};