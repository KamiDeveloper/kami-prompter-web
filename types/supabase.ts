export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          user_id: string
          default_model: 'flash' | 'pro' | null
          default_thinking_level: 'LOW' | 'MEDIUM' | 'HIGH' | null
          use_paid_key_for_all: boolean | null
          show_nsfw: boolean | null
          theme: 'dark' | 'light' | 'system' | null
          default_export_format: string | null
          prd_default_detail: 'basic' | 'standard' | 'exhaustive' | null
          prd_default_language: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          default_model?: 'flash' | 'pro' | null
          default_thinking_level?: 'LOW' | 'MEDIUM' | 'HIGH' | null
          use_paid_key_for_all?: boolean | null
          show_nsfw?: boolean | null
          theme?: 'dark' | 'light' | 'system' | null
          default_export_format?: string | null
          prd_default_detail?: 'basic' | 'standard' | 'exhaustive' | null
          prd_default_language?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          default_model?: 'flash' | 'pro' | null
          default_thinking_level?: 'LOW' | 'MEDIUM' | 'HIGH' | null
          use_paid_key_for_all?: boolean | null
          show_nsfw?: boolean | null
          theme?: 'dark' | 'light' | 'system' | null
          default_export_format?: string | null
          prd_default_detail?: 'basic' | 'standard' | 'exhaustive' | null
          prd_default_language?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          id: string
          user_id: string
          key_type: 'flash_free' | 'pro_paid'
          vault_secret_id: string
          is_valid: boolean | null
          last_verified_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          key_type: 'flash_free' | 'pro_paid'
          vault_secret_id: string
          is_valid?: boolean | null
          last_verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          key_type?: 'flash_free' | 'pro_paid'
          vault_secret_id?: string
          is_valid?: boolean | null
          last_verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_history: {
        Row: {
          id: string
          user_id: string
          module: 'improver' | 'builder' | 'prd'
          input_prompt: string
          output_prompt: string | null
          model_used: string
          thinking_level: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          module: 'improver' | 'builder' | 'prd'
          input_prompt: string
          output_prompt?: string | null
          model_used: string
          thinking_level: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          module?: 'improver' | 'builder' | 'prd'
          input_prompt?: string
          output_prompt?: string | null
          model_used?: string
          thinking_level?: string
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          emoji: string | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          emoji?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          emoji?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          name: string
          description: string | null
          is_nsfw: boolean | null
          is_deleted: boolean | null
          deleted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          name: string
          description?: string | null
          is_nsfw?: boolean | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          is_nsfw?: boolean | null
          is_deleted?: boolean | null
          deleted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      template_tags: {
        Row: {
          id: string
          template_id: string
          tag: string
          created_by: 'user' | 'ai' | null
        }
        Insert: {
          id?: string
          template_id: string
          tag: string
          created_by?: 'user' | 'ai' | null
        }
        Update: {
          id?: string
          template_id?: string
          tag?: string
          created_by?: 'user' | 'ai' | null
        }
        Relationships: []
      }
      template_branches: {
        Row: {
          id: string
          template_id: string
          name: string
          content: string
          is_main: boolean | null
          parent_branch_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          template_id: string
          name?: string
          content: string
          is_main?: boolean | null
          parent_branch_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          template_id?: string
          name?: string
          content?: string
          is_main?: boolean | null
          parent_branch_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      branch_history: {
        Row: {
          id: string
          branch_id: string
          content: string
          change_description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          content: string
          change_description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          content?: string
          change_description?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      'vault.create_secret': {
        Args: {
          secret: string
          name?: string
          description?: string
        }
        Returns: string
      }
      'vault.get_secret': {
        Args: {
          secret_id: string
        }
        Returns: string
      }
      'vault.delete_secret': {
        Args: {
          secret_id: string
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type Insert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type Update<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
