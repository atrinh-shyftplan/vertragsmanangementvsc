import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Globe } from 'lucide-react';
import type { Contract, ContractTemplate } from '@/lib/mockData';

interface ContractViewerProps {
  contract: Contract;
  template: ContractTemplate;
  language?: 'de' | 'en';
  onClose?: () => void;
}

const ContractViewer: React.FC<ContractViewerProps> = ({
  contract,
  template,
  language = 'de',
  onClose
}) => {
  // Replace template variables with actual values
  const replaceVariables = (text: string): string => {
    let result = text;
    
    // Replace global variables
    contract.globalVariables?.forEach(variable => {
      const placeholder = `{{${variable.id}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), variable.value || '');
    });
    
    // Replace template-specific variables
    contract.templateVariables?.forEach(variable => {
      const placeholder = `{{${variable.id}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), variable.value || '');
    });
    
    return result;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderModule = (moduleKey: string, moduleData: any) => {
    if (!moduleData) return null;

    const title = language === 'de' ? moduleData.title_de : moduleData.title_en;
    
    return (
      <div key={moduleKey} className="mb-8">
        {title && (
          <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">
            {title}
          </h2>
        )}
        
        {/* Handle different module types */}
        {moduleData.content_de && (
          <div className="whitespace-pre-line text-muted-foreground leading-relaxed mb-4">
            {replaceVariables(language === 'de' ? moduleData.content_de : moduleData.content_en)}
          </div>
        )}
        
        {moduleData.paragraphs_de && (
          <div className="space-y-3">
            {(language === 'de' ? moduleData.paragraphs_de : moduleData.paragraphs_en).map((paragraph: any, index: number) => (
              <div key={index} className="flex gap-3">
                {paragraph.number && (
                  <span className="text-sm font-medium text-muted-foreground min-w-[20px]">
                    ({paragraph.number})
                  </span>
                )}
                <p className="text-muted-foreground leading-relaxed">
                  {replaceVariables(paragraph.text)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContractConditions = () => {
    const contractType = contract.contractType;
    if (!contractType || !template.modules) return null;

    if (contractType === 'ep_standard') {
      return renderModule('conditions_ep_standard', template.modules.conditions_ep_standard);
    } else if (contractType === 'ep_rollout') {
      return (
        <div>
          {renderModule('conditions_title_rollout', template.modules.conditions_title_rollout)}
          {renderModule('conditions_ep_rollout_poc', template.modules.conditions_ep_rollout_poc)}
          {renderModule('conditions_ep_rollout_rollout', template.modules.conditions_ep_rollout_rollout)}
          {renderModule('conditions_ep_rollout_prod', template.modules.conditions_ep_rollout_prod)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {contract.title}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {contract.client} • {formatDate(contract.startDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                {contract.status}
              </Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  {language === 'de' ? 'EN' : 'DE'}
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  PDF Export
                </Button>
                {onClose && (
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Schließen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Vertragswert:</span>
              <p className="font-semibold">{formatCurrency(contract.value)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Laufzeit:</span>
              <p className="font-semibold">{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Vertragstyp:</span>
              <p className="font-semibold">
                {template.contractTypes?.[contract.contractType || 'ep_standard']}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Content */}
      <Card>
        <CardContent className="p-8">
          <div className="prose prose-slate max-w-none">
            
            {/* Preamble */}
            {template.modules.preamble && renderModule('preamble', template.modules.preamble)}
            
            <Separator className="my-8" />
            
            {/* Object of Agreement */}
            {template.modules.object_of_agreement && renderModule('object_of_agreement', template.modules.object_of_agreement)}
            
            <Separator className="my-8" />
            
            {/* Contract Conditions */}
            {renderContractConditions()}
            
            {/* Further Contract Conditions */}
            {template.modules.further_contract_conditions && renderModule('further_contract_conditions', template.modules.further_contract_conditions)}
            
            <Separator className="my-8" />
            
            {/* Training & Support */}
            {template.modules.training_support && renderModule('training_support', template.modules.training_support)}
            
            <Separator className="my-8" />
            
            {/* System Integration */}
            {template.modules.system_integration && renderModule('system_integration', template.modules.system_integration)}
            
            <Separator className="my-8" />
            
            {/* Other Agreements */}
            {template.modules.other_agreements && renderModule('other_agreements', template.modules.other_agreements)}
            
            <Separator className="my-8" />
            
            {/* Final Provisions */}
            {template.modules.final_provisions && renderModule('final_provisions', template.modules.final_provisions)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractViewer;
