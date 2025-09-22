export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          id: string
          created_at: string
          name: string
          type: "fest" | "produkt" | "zusatz"
          description: string | null
          module_id: string | null
          sort_order: number | null
          contract_type_key: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          type: "fest" | "produkt" | "zusatz"
          description?: string | null
          module_id: string | null
          sort_order?: number | null
          contract_type_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          type?: "fest" | "produkt" | "zusatz"
          description?: string | null
          module_id?: string | null
          sort_order?: number | null
          contract_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "contract_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_attachments: {
        Row: {
          contract_id: string
          attachment_id: string
          created_at: string
        }
        Insert: {
          contract_id: string
          attachment_id: string
          created_at?: string
        }
        Update: {}
        Relationships: []
      }
      contract_categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          name_de: string
          name_en: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name_de: string
          name_en?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name_de?: string
          name_en?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      contract_compositions: {
        Row: {
          contract_type_id: string
          contract_type_key: string
          created_at: string
          id: string
          is_active: boolean | null
          module_id: string
          module_key: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          contract_type_id: string
          contract_type_key: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          module_id: string
          module_key: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          contract_type_id?: string
          contract_type_key?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          module_id?: string
          module_key?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_compositions_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_compositions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "contract_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_modules: {
        Row: {
          category: string | null
          content_de: string
          content_en: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          key: string
          name: string
          sort_order: number | null
          title_de: string
          title_en: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content_de: string
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name: string
          sort_order?: number | null
          title_de: string
          title_en?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content_de?: string
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name?: string
          sort_order?: number | null
          title_de?: string
          title_en?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contract_modules_category"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "contract_categories"
            referencedColumns: ["key"]
          },
        ]
      }
      contract_templates: {
        Row: {
          contract_type_key: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          contract_type_key: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          template_data: Json
          updated_at?: string
        }
        Update: {
          contract_type_key?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      contract_types: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          name_de: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name_de: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name_de?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          assigned_to: string | null
          client: string
          assigned_to_user_id: string | null
          contract_type_key: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          global_variables: Json | null
          id: string
          progress: number | null
          start_date: string
          status: string
          tags: string[] | null
          template_variables: Json | null
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          assigned_to?: string | null
          client: string
          assigned_to_user_id?: string | null
          contract_type_key?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          global_variables?: Json | null
          id?: string
          progress?: number | null
          start_date: string
          status?: string
          tags?: string[] | null
          template_variables?: Json | null
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          assigned_to?: string | null
          client?: string
          assigned_to_user_id?: string | null
          contract_type_key?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          global_variables?: Json | null
          id?: string
          progress?: number | null
          start_date?: string
          status?: string
          tags?: string[] | null
          template_variables?: Json | null
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      global_variables: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          default_value: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          key: string
          name_de: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          key: string
          name_de: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          key?: string
          name_de?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      template_configurations: {
        Row: {
          configuration: Json
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          configuration: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Raw database types
export type RawContractModule = Database["public"]["Tables"]["contract_modules"]["Row"];
export type RawAttachment = Database["public"]["Tables"]["attachments"]["Row"];
export type RawContractComposition = Database["public"]["Tables"]["contract_compositions"]["Row"];

// Processed types for frontend use (adjusted `variables` based on usage)
export interface ContractModule {
  id: string;
  key: string;
  name: string;
  content_de: string | null;
  content_en: string | null;
  category: string | null;
  variables: Array<{ key: string; name_de: string; [k: string]: any; }> | null; // Adjusted based on code usage
  created_at: string;
}
// Definiert die kombinierte Struktur eines Anhangs mit seinem optional verknüpften Textmodul
export interface AttachmentWithModule extends Attachment {
  contract_modules: ContractModule | null;
}

export interface CompositionWithModuleAndAttachment extends RawContractComposition {
  contract_modules: ContractModule | null;
  attachments: RawAttachment | null;
}

// Re-export original types for compatibility where needed
export type Attachment = RawAttachment;
export type AttachmentInsert = Database["public"]["Tables"]["attachments"]["Insert"];
export type ContractComposition = RawContractComposition;
