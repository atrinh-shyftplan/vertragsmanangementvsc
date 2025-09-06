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
  onVariableChange: (key: string, value: string) => void;
}

export function VariableInputRenderer({ 
  selectedModules, 
  globalVariables, 
  variableValues, 
  onVariableChange 
}: VariableInputRendererProps) {
  
  // Extract all variables from selected modules
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

  // Get all unique variables from selected modules
  const allVariablesInModules = React.useMemo(() => {
    const moduleVariables = new Set<string>();
    
    selectedModules.forEach(module => {
      // Extract from German content
      if (module.content_de) {
        extractVariablesFromContent(module.content_de).forEach(v => moduleVariables.add(v));
      }
      
      // Extract from English content
      if (module.content_en) {
        extractVariablesFromContent(module.content_en).forEach(v => moduleVariables.add(v));
      }
      
      // Extract from module variables
      if (module.variables) {
        try {
          const moduleVars = JSON.parse(module.variables as string);
          if (Array.isArray(moduleVars)) {
            moduleVars.forEach(v => {
              if (v.id) moduleVariables.add(v.id);
            });
          }
        } catch (e) {
          console.warn('Failed to parse module variables:', e);
        }
      }
    });
    
    return Array.from(moduleVariables);
  }, [selectedModules]);

  // Filter global variables that are actually used
  const relevantGlobalVariables = React.useMemo(() => {
    return globalVariables.filter(gv => 
      allVariablesInModules.includes(gv.key)
    );
  }, [globalVariables, allVariablesInModules]);

  // Get module-specific variables
  const moduleSpecificVariables = React.useMemo(() => {
    const variables: Array<{
      id: string;
      label: string;
      module: string;
      value?: string;
    }> = [];
    
    selectedModules.forEach(module => {
      if (module.variables) {
        try {
          const moduleVars = JSON.parse(module.variables as string);
          if (Array.isArray(moduleVars)) {
            moduleVars.forEach(v => {
              if (v.id && allVariablesInModules.includes(v.id)) {
                variables.push({
                  id: v.id,
                  label: v.label || v.id,
                  module: module.title_de,
                  value: v.value
                });
              }
            });
          }
        } catch (e) {
          console.warn('Failed to parse module variables:', e);
        }
      }
    });
    
    return variables;
  }, [selectedModules, allVariablesInModules]);

  if (relevantGlobalVariables.length === 0 && moduleSpecificVariables.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vertragsdaten eingeben</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Global Variables */}
        {relevantGlobalVariables.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Allgemeine Daten
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relevantGlobalVariables.map((variable) => (
                <div key={variable.key} className="space-y-2">
                  <Label htmlFor={variable.key}>
                    {variable.name_de}
                    {variable.is_required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    id={variable.key}
                    value={variableValues[variable.key] || variable.default_value || ''}
                    onChange={(e) => onVariableChange(variable.key, e.target.value)}
                    placeholder={variable.description || `${variable.name_de} eingeben`}
                    className="bg-amber-50 border-amber-200 focus:border-amber-400"
                    required={variable.is_required}
                  />
                  {variable.description && (
                    <p className="text-xs text-muted-foreground">{variable.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module-specific Variables */}
        {moduleSpecificVariables.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Modul-spezifische Daten
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moduleSpecificVariables.map((variable) => (
                <div key={variable.id} className="space-y-2">
                  <Label htmlFor={variable.id}>
                    {variable.label}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({variable.module})
                    </span>
                  </Label>
                  <Input
                    id={variable.id}
                    value={variableValues[variable.id] || variable.value || ''}
                    onChange={(e) => onVariableChange(variable.id, e.target.value)}
                    placeholder={`${variable.label} eingeben`}
                    className="bg-blue-50 border-blue-200 focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}