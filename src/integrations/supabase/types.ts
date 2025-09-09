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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          attachment_file_extension: string
          attachment_file_name: string
          attachment_subtype: string
          attachment_title: string
          attachment_type: string
          attachment_url: string
          blake2b_hash: string
          created_at: string
          openscrapers_id: string
          parent_filling_uuid: string
          updated_at: string
          uuid: string
        }
        Insert: {
          attachment_file_extension?: string
          attachment_file_name?: string
          attachment_subtype?: string
          attachment_title?: string
          attachment_type?: string
          attachment_url?: string
          blake2b_hash?: string
          created_at?: string
          openscrapers_id: string
          parent_filling_uuid: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          attachment_file_extension?: string
          attachment_file_name?: string
          attachment_subtype?: string
          attachment_title?: string
          attachment_type?: string
          attachment_url?: string
          blake2b_hash?: string
          created_at?: string
          openscrapers_id?: string
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
      docket_petitioned_by_org: {
        Row: {
          created_at: string
          docket_uuid: string
          petitioner_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          docket_uuid?: string
          petitioner_uuid?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          docket_uuid?: string
          petitioner_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "docket_petitioned_by_org_docket_uuid_fkey"
            columns: ["docket_uuid"]
            isOneToOne: false
            referencedRelation: "dockets"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "docket_petitioned_by_org_petitioner_uuid_fkey"
            columns: ["petitioner_uuid"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "fk_docket_petitioned_by_org_docket_uuid"
            columns: ["docket_uuid"]
            isOneToOne: false
            referencedRelation: "dockets"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "fk_docket_petitioned_by_org_petitioner_uuid"
            columns: ["petitioner_uuid"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["uuid"]
          },
        ]
      }
      dockets: {
        Row: {
          assigned_judge: string
          closed_date: string | null
          created_at: string
          current_status: string
          docket_description: string
          docket_govid: string
          docket_subtype: string
          docket_title: string
          docket_type: string
          hearing_officer: string
          industry: string
          opened_date: string
          petitioner_strings: string[]
          updated_at: string
          uuid: string
        }
        Insert: {
          assigned_judge?: string
          closed_date?: string | null
          created_at?: string
          current_status?: string
          docket_description?: string
          docket_govid?: string
          docket_subtype?: string
          docket_title?: string
          docket_type?: string
          hearing_officer?: string
          industry?: string
          opened_date: string
          petitioner_strings?: string[]
          updated_at?: string
          uuid?: string
        }
        Update: {
          assigned_judge?: string
          closed_date?: string | null
          created_at?: string
          current_status?: string
          docket_description?: string
          docket_govid?: string
          docket_subtype?: string
          docket_title?: string
          docket_type?: string
          hearing_officer?: string
          industry?: string
          opened_date?: string
          petitioner_strings?: string[]
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          docket_govid: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          docket_govid: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          docket_govid?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      fillings: {
        Row: {
          created_at: string
          docket_govid: string
          docket_uuid: string
          filed_date: string
          filling_description: string
          filling_govid: string
          filling_name: string
          filling_type: string
          individual_author_strings: string[]
          openscrapers_id: string
          organization_author_strings: string[]
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          docket_govid?: string
          docket_uuid: string
          filed_date: string
          filling_description?: string
          filling_govid?: string
          filling_name?: string
          filling_type?: string
          individual_author_strings?: string[]
          openscrapers_id: string
          organization_author_strings?: string[]
          updated_at?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          docket_govid?: string
          docket_uuid?: string
          filed_date?: string
          filling_description?: string
          filling_govid?: string
          filling_name?: string
          filling_type?: string
          individual_author_strings?: string[]
          openscrapers_id?: string
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
      fillings_filed_by_org_relation: {
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
            referencedRelation: "organizations"
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
      fillings_on_behalf_of_org_relation: {
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
            referencedRelation: "organizations"
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
      organizations: {
        Row: {
          aliases: string[]
          artifical_person_type: string
          created_at: string
          description: string
          name: string
          org_suffix: string
          updated_at: string
          uuid: string
        }
        Insert: {
          aliases?: string[]
          artifical_person_type?: string
          created_at?: string
          description?: string
          name?: string
          org_suffix?: string
          updated_at?: string
          uuid?: string
        }
        Update: {
          aliases?: string[]
          artifical_person_type?: string
          created_at?: string
          description?: string
          name?: string
          org_suffix?: string
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_profile: {
        Args: { user_uuid: string }
        Returns: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }[]
      }
      is_profile_owner: {
        Args: { profile_id: string }
        Returns: boolean
      }
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
