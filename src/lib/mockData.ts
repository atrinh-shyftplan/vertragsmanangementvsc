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
  // Neue Template-Felder
  contractType?: 'ep_standard' | 'ep_rollout';
  templateVariables?: Record<string, any>;
  globalVariables?: Record<string, any>;
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
  },
  {
    id: '6',
    title: 'shyftplan Enterprise Standard',
    client: 'AutoMotive AG',
    status: 'draft',
    value: 25000,
    startDate: '2025-01-01',
    endDate: '2027-12-31',
    assignedTo: 'Maria Schmidt',
    description: 'Enterprise Standard Vertrag mit shyftconnect Integration',
    tags: ['SaaS', 'Enterprise', 'Template'],
    lastModified: '2025-01-15',
    progress: 0,
    contractType: 'ep_standard',
    globalVariables: {
      angebot_nr: 'Q-2025-5678',
      datum: '2025-01-15',
      firma: 'AutoMotive AG',
      ansprechpartner: 'Dr. Klaus Weber',
      strasse_nr: 'Industriestraße 42',
      plz_stadt: '80335 München'
    },
    templateVariables: {
      std_vertragsbeginn: '2025-01-01',
      std_vertragslaufzeit: 3,
      std_lizenzen: 1000,
      std_basispreis: 25000,
      std_zusatzlizenz: 25
    }
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

// Contract Template System
export interface ContractTemplate {
  contractTypes: Record<string, string>;
  globalVariables: Array<{
    id: string;
    label: string;
    type: 'text' | 'date' | 'email' | 'number' | 'currency';
    value: string | number;
  }>;
  modules: Record<string, any>;
}

export const contractTemplate: ContractTemplate = {
  contractTypes: {
    ep_standard: "Enterprise Standard",
    ep_rollout: "Enterprise mit Rollout"
  },
  globalVariables: [
    { id: "angebot_nr", label: "Angebots-Nr.", type: "text", value: "Q-2025-1234" },
    { id: "datum", label: "Datum", type: "date", value: "2025-08-31" },
    { id: "firma", label: "Firma", type: "text", value: "" },
    { id: "ansprechpartner", label: "Ansprechpartner:in", type: "text", value: "" },
    { id: "strasse_nr", label: "Straße, Nr.", type: "text", value: "" },
    { id: "plz_stadt", label: "PLZ, Stadt", type: "text", value: "" },
    { id: "rechnungs_email", label: "Rechnungs-E-Mail", type: "email", value: "" },
    { id: "ust_id", label: "USt-ID (EU)", type: "text", value: "" },
    { id: "zusatzinfo", label: "Zusatzinformation (Referenznr., etc.)", type: "text", value: "" },
    { id: "lieferantennr", label: "Lieferantennummer/BANF/PO", type: "text", value: "" },
    { id: "invoice_strasse_nr", label: "Rechnungsadresse: Straße, Nr.", type: "text", value: "" },
    { id: "invoice_plz_stadt", label: "Rechnungsadresse: PLZ, Stadt", type: "text", value: "" }
  ],
  modules: {
    conditions_ep_standard: {
      title_de: "(3) Vertragskonditionen",
      variables: [
        { id: "std_vertragsbeginn", label: "Vertragsbeginn", type: "date", value: "2025-01-01" },
        { id: "std_vertragslaufzeit", label: "Vertragslaufzeit (Jahre)", type: "number", value: 3 },
        { id: "std_lizenzen", label: "Anzahl User-Lizenzen", type: "number", value: 1000 },
        { id: "std_basispreis", label: "Jährlicher Basispreis", type: "currency", value: 25000 },
        { id: "std_zusatzlizenz", label: "Preis pro zusätzlicher Lizenz p.a.", type: "currency", value: 25 }
      ]
    },
    conditions_ep_rollout_poc: {
      title_de: "(a) Proof of concept (POC):",
      variables: [
        { id: "poc_beginn", label: "Vertragsbeginn POC", type: "date", value: "2025-10-01" },
        { id: "poc_laufzeit", label: "Laufzeit POC (Monate)", type: "number", value: 3 },
        { id: "poc_lizenzen", label: "Max. Lizenzen POC", type: "number", value: 50 },
        { id: "poc_pauschale", label: "Pauschale POC", type: "currency", value: 1500 }
      ]
    },
    other_agreements: {
      title_de: "§4 Sonstige Vereinbarungen",
      variables: [
        { id: "gueltig_bis", label: "Angebot gültig bis", type: "date", value: "2025-09-30" }
      ]
    }
  }
};