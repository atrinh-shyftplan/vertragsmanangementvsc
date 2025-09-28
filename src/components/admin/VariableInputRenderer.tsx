import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/integrations/supabase/types';

type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];

interface VariableInputRendererProps {
  selectedModules: ContractModule[];
  globalVariables: GlobalVariable[];
  variableValues: Record<string, any>;
  requiredFields: string[];
  onVariableChange: (key: string, value: string) => void;
}

export function VariableInputRenderer({ 
  selectedModules, 
  globalVariables, 
  requiredFields,
  variableValues, 
  onVariableChange 
}: VariableInputRendererProps) {
  
  // Extract all variables from content
  const extractVariablesFromContent = (content: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  };

  // Group variables by module - separate contract conditions
  const moduleVariableGroups = React.useMemo(() => {
    const regularGroups: Array<{
      moduleTitle: string;
      variables: Array<{
        id: string;
        label: string;
        value?: string;
        isGlobal: boolean;
        globalVar?: GlobalVariable;
      }>;
    }> = [];
    
    const contractConditionsGroups: Array<{
      moduleTitle: string;
      variables: Array<{
        id: string;
        label: string;
        value?: string;
        isGlobal: boolean;
        globalVar?: GlobalVariable;
      }>;
    }> = [];
    
    selectedModules.forEach(module => {
      const moduleVariables: Array<{
        id: string;
        label: string;
        value?: string;
        isGlobal: boolean;
        globalVar?: GlobalVariable;
      }> = [];
      
      // Get variables from module definition
      if (module.variables) {
        try {
          const moduleVars = Array.isArray(module.variables)
            ? module.variables
            : JSON.parse(module.variables as string);
          if (Array.isArray(moduleVars)) {
            moduleVars.forEach(v => {
              if (v.id) {
                // Check if this is a global variable
                const globalVar = globalVariables.find(gv => gv.key === v.id);
                
                moduleVariables.push({
                  id: v.id,
                  label: globalVar ? globalVar.name_de : (v.label || v.id),
                  value: v.value,
                  isGlobal: !!globalVar,
                  globalVar: globalVar
                });
              }
            });
          }
        } catch (e) {
          console.warn('Failed to parse module variables:', e);
        }
      }
      
      // Also extract from content if no explicit variables defined
      if (moduleVariables.length === 0) {
        const contentVars = new Set<string>();
        
        if (module.content_de) {
          extractVariablesFromContent(module.content_de).forEach(v => contentVars.add(v));
        }
        if (module.content_en) {
          extractVariablesFromContent(module.content_en).forEach(v => contentVars.add(v));
        }
        
        contentVars.forEach(varKey => {
          const globalVar = globalVariables.find(gv => gv.key === varKey);
          if (varKey !== 'gueltig_bis') moduleVariables.push({
            id: varKey,
            label: globalVar ? globalVar.name_de : varKey,
            isGlobal: !!globalVar,
            globalVar: globalVar
          });
        });
      }
      
      if (moduleVariables.length > 0) {
        const moduleGroup = {
          moduleTitle: module.title_de,
          variables: moduleVariables
        };
        
        // Check if this is a contract conditions module
        const isContractConditions = module.title_de?.toLowerCase().includes('vertragskonditionen') ||
                                   module.key?.toLowerCase().includes('conditions') ||
                                   module.key?.toLowerCase().includes('rollout');
        
        if (isContractConditions) {
          contractConditionsGroups.push(moduleGroup);
        } else {
          regularGroups.push(moduleGroup);
        }
      }
    });
    
    return { regularGroups, contractConditionsGroups };
  }, [selectedModules, globalVariables]);

  if (moduleVariableGroups.regularGroups.length === 0 && moduleVariableGroups.contractConditionsGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Regular Customer Data */}
      {moduleVariableGroups.regularGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kundendaten eingeben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {moduleVariableGroups.regularGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  {group.moduleTitle}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.variables.map((variable) => (
                    <div key={variable.id} className="space-y-2">
                      <Label htmlFor={variable.id}>
                        {variable.label}
                        {(variable.globalVar?.is_required || requiredFields.includes(variable.id)) && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Input
                        id={variable.id}
                        value={
                          variableValues[variable.id] || 
                          variable.globalVar?.default_value || 
                          variable.value || 
                          ''
                        }
                        onChange={(e) => onVariableChange(variable.id, e.target.value)}
                        placeholder={
                          variable.globalVar?.description || 
                          `${variable.label} eingeben`
                        }
                        required={variable.globalVar?.is_required}
                      />
                      {variable.globalVar?.description && (
                        <p className="text-xs text-muted-foreground">{variable.globalVar.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contract Conditions */}
      {moduleVariableGroups.contractConditionsGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vertragskonditionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {moduleVariableGroups.contractConditionsGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  {group.moduleTitle}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.variables.map((variable) => (
                    <div key={variable.id} className="space-y-2">
                      <Label htmlFor={variable.id}>
                        {variable.label}
                        {(variable.globalVar?.is_required || requiredFields.includes(variable.id)) && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Input
                        id={variable.id}
                        value={
                          variableValues[variable.id] || 
                          variable.globalVar?.default_value || 
                          variable.value || 
                          ''
                        }
                        onChange={(e) => onVariableChange(variable.id, e.target.value)}
                        placeholder={
                          variable.globalVar?.description || 
                          `${variable.label} eingeben`
                        }
                        required={variable.globalVar?.is_required}
                      />
                      {variable.globalVar?.description && (
                        <p className="text-xs text-muted-foreground">{variable.globalVar.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}