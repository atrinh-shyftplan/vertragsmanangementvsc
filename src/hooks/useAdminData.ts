import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];
type ContractCategory = Database['public']['Tables']['contract_categories']['Row'];
type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];
type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];
type ContractTemplate = Database['public']['Tables']['contract_templates']['Row'];

type ContractTypeInsert = Database['public']['Tables']['contract_types']['Insert'];
type ContractModuleInsert = Database['public']['Tables']['contract_modules']['Insert'];
type ContractCategoryInsert = Database['public']['Tables']['contract_categories']['Insert'];
type GlobalVariableInsert = Database['public']['Tables']['global_variables']['Insert'];
type ContractCompositionInsert = Database['public']['Tables']['contract_compositions']['Insert'];
type ContractTemplateInsert = Database['public']['Tables']['contract_templates']['Insert'];

export function useAdminData() {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [contractModules, setContractModules] = useState<ContractModule[]>([]);
  const [contractCategories, setContractCategories] = useState<ContractCategory[]>([]);
  const [globalVariables, setGlobalVariables] = useState<GlobalVariable[]>([]);
  const [contractCompositions, setContractCompositions] = useState<ContractComposition[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [typesResult, modulesResult, categoriesResult, variablesResult, compositionsResult, templatesResult] = await Promise.all([
        supabase.from('contract_types').select('*').order('name_de'),
        supabase.from('contract_modules').select('*').order('title_de'),
        supabase.from('contract_categories').select('*').order('sort_order, name_de'),
        supabase.from('global_variables').select('*').order('name_de'),
        supabase.from('contract_compositions').select('*').order('contract_type_key, sort_order'),
        supabase.from('contract_templates').select('*').order('name')
      ]);

      if (typesResult.error) throw typesResult.error;
      if (modulesResult.error) throw modulesResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (variablesResult.error) throw variablesResult.error;
      if (compositionsResult.error) throw compositionsResult.error;
      if (templatesResult.error) throw templatesResult.error;

      setContractTypes(typesResult.data || []);
      setContractModules(modulesResult.data || []);
      setContractCategories(categoriesResult.data || []);
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

  const cloneContractModule = async (moduleId: string) => {
    try {
      // Get the original module
      const originalModule = contractModules.find(m => m.id === moduleId);
      if (!originalModule) throw new Error('Modul nicht gefunden');

      // Create clone data
      const cloneData: ContractModuleInsert = {
        key: `${originalModule.key}_copy`,
        title_de: `${originalModule.title_de} (Kopie)`,
        title_en: originalModule.title_en ? `${originalModule.title_en} (Copy)` : '',
        content_de: originalModule.content_de,
        content_en: originalModule.content_en || '',
        category: originalModule.category || 'general',
        is_active: originalModule.is_active,
        sort_order: originalModule.sort_order || 0,
        name: ''
      };

      const { error } = await supabase
        .from('contract_modules')
        .insert([cloneData]);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Modul wurde kopiert.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error cloning contract module:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht kopiert werden.',
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

  // Contract Categories CRUD
  const createContractCategory = async (data: ContractCategoryInsert) => {
    try {
      const { error } = await supabase
        .from('contract_categories')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Kategorie wurde erstellt.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error creating contract category:', error);
      toast({
        title: 'Fehler',
        description: 'Kategorie konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  };

  const updateContractCategory = async (id: string, data: Partial<ContractCategory>) => {
    try {
      const { error } = await supabase
        .from('contract_categories')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Kategorie wurde aktualisiert.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating contract category:', error);
      toast({
        title: 'Fehler',
        description: 'Kategorie konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const deleteContractCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contract_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Kategorie wurde gelöscht.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting contract category:', error);
      toast({
        title: 'Fehler',
        description: 'Kategorie konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    // Data
    contractTypes,
    contractModules,
    setContractModules, // Export setter for live updates
    contractCategories,
    globalVariables,
    contractCompositions,
    contractTemplates,
    loading,
    
    // Actions
    fetchData,
    
    // Contract Types
    createContractType,
    updateContractType,
    deleteContractType,
    
    // Contract Modules
    createContractModule,
    updateContractModule,
    cloneContractModule,
    deleteContractModule,
    
    // Contract Categories
    createContractCategory,
    updateContractCategory,
    deleteContractCategory,
    
    // Global Variables
    createGlobalVariable,
    updateGlobalVariable,
    deleteGlobalVariable
  };
}