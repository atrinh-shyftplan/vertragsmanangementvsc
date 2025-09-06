import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ContractHeaderProps {
  variableValues: Record<string, any>;
  contractType: string;
  offerNumber?: string;
  date?: string;
}

export function ContractHeader({ variableValues, contractType, offerNumber, date }: ContractHeaderProps) {
  const getContractTitle = () => {
    switch (contractType) {
      case 'service_contract':
        return 'Dienstleistungsvertrag / Service Contract';
      default:
        return 'Vertrag / Contract';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return new Date().toLocaleDateString('de-DE');
    }
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Header with Logo and Basic Info */}
      <div className="flex justify-between items-start">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">shyftplan</div>
        </div>
        
        <div className="text-right space-y-2">
          <div>
            <span className="text-sm font-medium">Angebot Nr.: </span>
            <span className="bg-amber-100 px-2 py-1 rounded text-sm">
              {offerNumber || variableValues.angebots_nr || 'Q-2025-1234'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium">Datum: </span>
            <span className="bg-amber-100 px-2 py-1 rounded text-sm">
              {formatDate(date || variableValues.datum)}
            </span>
          </div>
          <div className="text-sm">
            <div className="font-medium">Ansprechpartner:in shyftplan</div>
            <div>{variableValues.ansprechpartner || 'Max Mustermann, xxx@shyftplan.com, +49 xxx'}</div>
          </div>
          <div className="text-sm">
            <div className="font-medium">Bankverbindung</div>
            <div>Berliner Sparkasse</div>
            <div>IBAN: DE41 1005 0000 0190 5628 97</div>
            <div>BIC: BELADEBEXXX</div>
          </div>
        </div>
      </div>

      {/* Contract Title */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-foreground">
          {getContractTitle()}
        </h1>
      </div>

      {/* Contract Parties */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-4 text-muted-foreground">
            zwischen / between
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side - shyftplan */}
            <div className="text-center">
              <div className="font-bold text-lg mb-2">shyftplan GmbH</div>
              <div>Ritterstraße 26</div>
              <div>10969 Berlin</div>
              <div className="mt-2 text-sm text-muted-foreground italic">
                - nachfolgend "shyftplan" bezeichnet / hereinafter referred to as "shyftplan" -
              </div>
            </div>

            {/* Right Side - Customer */}
            <div className="text-center">
              <div className="text-center mb-4 text-muted-foreground">
                und / and
              </div>
              
              <div className="space-y-2">
                <div className="font-bold">
                  Firma: <span className="bg-amber-100 px-2 py-1 rounded">
                    {variableValues.firma || '[Firma]'}
                  </span>
                </div>
                <div>
                  Ansprechpartner:in: <span className="bg-amber-100 px-2 py-1 rounded">
                    {variableValues.ansprechpartner_kunde || '[Ansprechpartner:in]'}
                  </span>
                </div>
                <div>
                  Straße, Nr.: <span className="bg-amber-100 px-2 py-1 rounded">
                    {variableValues.strasse || '[Straße, Nr.]'}
                  </span>
                </div>
                <div>
                  PLZ, Stadt: <span className="bg-amber-100 px-2 py-1 rounded">
                    {variableValues.plz_stadt || '[PLZ, Stadt]'}
                  </span>
                </div>
                <div>
                  Rechnungs-E-Mail: <span className="bg-amber-100 px-2 py-1 rounded">
                    {variableValues.rechnungs_email || '[Rechnungs-E-Mail]'}
                  </span>
                </div>
                <div>
                  USt-ID: <span className="bg-amber-100 px-2 py-1 rounded">
                    {variableValues.ust_id || '[USt-ID]'}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground italic">
                - nachfolgend "Kunde" bezeichnet / hereinafter referred to as "customer" -
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Convenience Translation Notice */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-bold mb-2">Convenience Translation</h3>
            <p className="text-sm text-muted-foreground">
              Only the German version of the contract (left bracket) is legally binding. The English version (right bracket) is solely provided for the convenience of shyftplan's English speaking customers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}