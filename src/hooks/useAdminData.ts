import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];
type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];
type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];
type ContractTemplate = Database['public']['Tables']['contract_templates']['Row'];

type ContractTypeInsert = Database['public']['Tables']['contract_types']['Insert'];
type ContractModuleInsert = Database['public']['Tables']['contract_modules']['Insert'];
type GlobalVariableInsert = Database['public']['Tables']['global_variables']['Insert'];
type ContractCompositionInsert = Database['public']['Tables']['contract_compositions']['Insert'];
type ContractTemplateInsert = Database['public']['Tables']['contract_templates']['Insert'];

export function useAdminData() {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [contractModules, setContractModules] = useState<ContractModule[]>([]);
  const [globalVariables, setGlobalVariables] = useState<GlobalVariable[]>([]);
  const [contractCompositions, setContractCompositions] = useState<ContractComposition[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [typesResult, modulesResult, variablesResult, compositionsResult, templatesResult] = await Promise.all([
        supabase.from('contract_types').select('*').order('name_de'),
        supabase.from('contract_modules').select('*').order('title_de'),
        supabase.from('global_variables').select('*').order('name_de'),
        supabase.from('contract_compositions').select('*').order('contract_type_key, sort_order'),
        supabase.from('contract_templates').select('*').order('name')
      ]);

      if (typesResult.error) throw typesResult.error;
      if (modulesResult.error) throw modulesResult.error;
      if (variablesResult.error) throw variablesResult.error;
      if (compositionsResult.error) throw compositionsResult.error;
      if (templatesResult.error) throw templatesResult.error;

      setContractTypes(typesResult.data || []);
      setContractModules(modulesResult.data || []);
      setGlobalVariables(variablesResult.data || []);
      setContractCompositions(compositionsResult.data || []);
      setContractTemplates(templatesResult.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Contract Types CRUD
  const createContractType = async (data: ContractTypeInsert) => {
    try {
      const { error } = await supabase
        .from('contract_types')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Vertragstyp wurde erstellt.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error creating contract type:', error);
      toast({
        title: 'Fehler',
        description: 'Vertragstyp konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  };

  const updateContractType = async (id: string, data: Partial<ContractType>) => {
    try {
      const { error } = await supabase
        .from('contract_types')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Vertragstyp wurde aktualisiert.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating contract type:', error);
      toast({
        title: 'Fehler',
        description: 'Vertragstyp konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const deleteContractType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contract_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Vertragstyp wurde gelöscht.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting contract type:', error);
      toast({
        title: 'Fehler',
        description: 'Vertragstyp konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  // Contract Modules CRUD
  const createContractModule = async (data: ContractModuleInsert) => {
    try {
      const { error } = await supabase
        .from('contract_modules')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Modul wurde erstellt.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error creating contract module:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  };

  const updateContractModule = async (id: string, data: Partial<ContractModule>) => {
    try {
      const { error } = await supabase
        .from('contract_modules')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Modul wurde aktualisiert.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating contract module:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const deleteContractModule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contract_modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Modul wurde gelöscht.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting contract module:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  // Global Variables CRUD
  const createGlobalVariable = async (data: GlobalVariableInsert) => {
    try {
      const { error } = await supabase
        .from('global_variables')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Variable wurde erstellt.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error creating global variable:', error);
      toast({
        title: 'Fehler',
        description: 'Variable konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  };

  const updateGlobalVariable = async (id: string, data: Partial<GlobalVariable>) => {
    try {
      const { error } = await supabase
        .from('global_variables')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Variable wurde aktualisiert.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating global variable:', error);
      toast({
        title: 'Fehler',
        description: 'Variable konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const deleteGlobalVariable = async (id: string) => {
    try {
      const { error } = await supabase
        .from('global_variables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Variable wurde gelöscht.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting global variable:', error);
      toast({
        title: 'Fehler',
        description: 'Variable konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Template Import
  const importTemplateData = async () => {
    try {
      const { default: templateData } = await import('@/lib/template.json');
      
      // Import contract types
      for (const [key, name] of Object.entries(templateData.contractTypes)) {
        const existingType = contractTypes.find(t => t.key === key);
        if (!existingType) {
          await supabase.from('contract_types').insert({
            key,
            name_de: name as string,
            name_en: name as string
          });
        }
      }
      
      // Import global variables
      for (const variable of templateData.global_variables) {
        const existingVar = globalVariables.find(v => v.key === variable.id);
        if (!existingVar) {
          await supabase.from('global_variables').insert({
            key: variable.id,
            name_de: variable.label,
            name_en: variable.label,
            default_value: variable.value?.toString() || '',
            is_required: true
          });
        }
      }
      
      // Import modules
      for (const [moduleKey, moduleData] of Object.entries(templateData.modules)) {
        const existingModule = contractModules.find(m => m.key === moduleKey);
        const data = moduleData as any;
        
        if (!existingModule) {
          await supabase.from('contract_modules').insert({
            key: moduleKey,
            title_de: data.title_de || moduleKey,
            title_en: data.title_en || data.title_de || moduleKey,
            content_de: data.content_de || data.paragraphs_de?.map((p: any) => p.text).join('\n\n') || '',
            content_en: data.content_en || data.paragraphs_en?.map((p: any) => p.text).join('\n\n') || '',
            category: 'general',
            variables: JSON.stringify(data.variables || [])
          });
        }
      }
      
      await fetchData();
      toast({
        title: 'Erfolg',
        description: 'Template-Daten wurden importiert.'
      });
    } catch (error) {
      console.error('Error importing template data:', error);
      toast({
        title: 'Fehler',
        description: 'Template-Daten konnten nicht importiert werden.',
        variant: 'destructive'
      });
    }
  };

  return {
    // Data
    contractTypes,
    contractModules,
    globalVariables,
    contractCompositions,
    contractTemplates,
    loading,
    
    // Actions
    fetchData,
    importTemplateData,
    
    // Contract Types
    createContractType,
    updateContractType,
    deleteContractType,
    
    // Contract Modules
    createContractModule,
    updateContractModule,
    deleteContractModule,
    
    // Global Variables
    createGlobalVariable,
    updateGlobalVariable,
    deleteGlobalVariable
  };
}