export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      artifical_persons: {
        Row: {
          aliases: string[]
          artifical_person_type: string | null
          created_at: string
          description: string | null
          is_corporate_entity: boolean
          is_human: boolean
          name: string
          updated_at: string
          uuid: string
        }
        Insert: {
          aliases: string[]
          artifical_person_type?: string | null
          created_at?: string
          description?: string | null
          is_corporate_entity: boolean
          is_human: boolean
          name: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          aliases?: string[]
          artifical_person_type?: string | null
          created_at?: string
          description?: string | null
          is_corporate_entity?: boolean
          is_human?: boolean
          name?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          attachment_file_extension: string
          attachment_file_name: string
          attachment_subtype: string | null
          attachment_title: string
          attachment_type: string | null
          attachment_url: string | null
          blake2b_hash: string
          created_at: string
          parent_filling_uuid: string
          updated_at: string
          uuid: string
        }
        Insert: {
          attachment_file_extension: string
          attachment_file_name: string
          attachment_subtype?: string | null
          attachment_title: string
          attachment_type?: string | null
          attachment_url?: string | null
          blake2b_hash: string
          created_at: string
          parent_filling_uuid: string
          updated_at: string
          uuid?: string
        }
        Update: {
          attachment_file_extension?: string
          attachment_file_name?: string
          attachment_subtype?: string | null
          attachment_title?: string
          attachment_type?: string | null
          attachment_url?: string | null
          blake2b_hash?: string
          created_at?: string
          parent_filling_uuid?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_parent_filling_uuid_fkey"
            columns: ["parent_filling_uuid"]
            isOneToOne: false
            referencedRelation: "fillings"
            referencedColumns: ["uuid"]
          },
        ]
      }
      dockets: {
        Row: {
          assigned_judge: string | null
          closed_date: string | null
          created_at: string
          current_status: string | null
          docket_description: string | null
          docket_govid: string
          docket_subtype: string | null
          docket_title: string | null
          hearing_officer: string | null
          industry: string | null
          opened_date: string
          petitioner: string | null
          updated_at: string
          uuid: string
        }
        Insert: {
          assigned_judge?: string | null
          closed_date?: string | null
          created_at?: string
          current_status?: string | null
          docket_description?: string | null
          docket_govid?: string
          docket_subtype?: string | null
          docket_title?: string | null
          hearing_officer?: string | null
          industry?: string | null
          opened_date: string
          petitioner?: string | null
          updated_at?: string
          uuid?: string
        }
        Update: {
          assigned_judge?: string | null
          closed_date?: string | null
          created_at?: string
          current_status?: string | null
          docket_description?: string | null
          docket_govid?: string
          docket_subtype?: string | null
          docket_title?: string | null
          hearing_officer?: string | null
          industry?: string | null
          opened_date?: string
          petitioner?: string | null
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      fillings: {
        Row: {
          created_at: string
          docket_govid: string
          docket_uuid: string
          filed_date: string
          filling_description: string | null
          filling_name: string | null
          filling_type: string | null
          individual_author_strings: string[]
          organization_author_strings: string[]
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          docket_govid: string
          docket_uuid: string
          filed_date: string
          filling_description?: string | null
          filling_name?: string | null
          filling_type?: string | null
          individual_author_strings: string[]
          organization_author_strings: string[]
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          docket_govid?: string
          docket_uuid?: string
          filed_date?: string
          filling_description?: string | null
          filling_name?: string | null
          filling_type?: string | null
          individual_author_strings?: string[]
          organization_author_strings?: string[]
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fillings_docket_uuid_fkey"
            columns: ["docket_uuid"]
            isOneToOne: false
            referencedRelation: "dockets"
            referencedColumns: ["uuid"]
          },
        ]
      }
      fillings_individual_authors_relation: {
        Row: {
          author_individual_uuid: string
          created_at: string
          filling_uuid: string
          relation_uuid: string
        }
        Insert: {
          author_individual_uuid?: string
          created_at?: string
          filling_uuid?: string
          relation_uuid?: string
        }
        Update: {
          author_individual_uuid?: string
          created_at?: string
          filling_uuid?: string
          relation_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fillings_individual_authors_relatio_author_individual_uuid_fkey"
            columns: ["author_individual_uuid"]
            isOneToOne: false
            referencedRelation: "artifical_persons"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "fillings_individual_authors_relation_filling_uuid_fkey"
            columns: ["filling_uuid"]
            isOneToOne: false
            referencedRelation: "fillings"
            referencedColumns: ["uuid"]
          },
        ]
      }
      fillings_organization_authors_relation: {
        Row: {
          author_organization_uuid: string
          created_at: string
          filling_uuid: string
          relation_uuid: string
        }
        Insert: {
          author_organization_uuid?: string
          created_at?: string
          filling_uuid?: string
          relation_uuid?: string
        }
        Update: {
          author_organization_uuid?: string
          created_at?: string
          filling_uuid?: string
          relation_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fillings_organization_authors_rel_author_organization_uuid_fkey"
            columns: ["author_organization_uuid"]
            isOneToOne: false
            referencedRelation: "artifical_persons"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "fillings_organization_authors_relation_filling_uuid_fkey"
            columns: ["filling_uuid"]
            isOneToOne: false
            referencedRelation: "fillings"
            referencedColumns: ["uuid"]
          },
        ]
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
