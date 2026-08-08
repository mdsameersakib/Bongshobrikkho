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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          author_uid: string
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_uid: string
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_uid?: string
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          event_type: string
          id: string
          location: string | null
          marriage_id: string | null
          person_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type: string
          id?: string
          location?: string | null
          marriage_id?: string | null
          person_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          location?: string | null
          marriage_id?: string | null
          person_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_marriage_id_fkey"
            columns: ["marriage_id"]
            isOneToOne: false
            referencedRelation: "marriages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      marriages: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          person1_id: string
          person2_id: string
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          person1_id: string
          person2_id: string
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          person1_id?: string
          person2_id?: string
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marriages_person1_id_fkey"
            columns: ["person1_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marriages_person2_id_fkey"
            columns: ["person2_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      merge_conflicts: {
        Row: {
          created_at: string | null
          id: string
          node_a_id: string | null
          node_b_id: string | null
          resolution_status: string | null
          resolved_data: Json | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          node_a_id?: string | null
          node_b_id?: string | null
          resolution_status?: string | null
          resolved_data?: Json | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          node_a_id?: string | null
          node_b_id?: string | null
          resolution_status?: string | null
          resolved_data?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merge_conflicts_node_a_id_fkey"
            columns: ["node_a_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_conflicts_node_b_id_fkey"
            columns: ["node_b_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_conflicts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tree_merge_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      network_connections: {
        Row: {
          created_at: string | null
          id: string
          recipient_uid: string
          requester_uid: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipient_uid: string
          requester_uid: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recipient_uid?: string
          requester_uid?: string
          status?: string | null
        }
        Relationships: []
      }
      parent_child: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          parent_id: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          parent_id: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      persons: {
        Row: {
          address: string | null
          birth_date: string | null
          country_of_residence: string | null
          created_at: string | null
          death_date: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          invite_code: string | null
          is_deceased: boolean | null
          is_private: boolean | null
          last_name: string | null
          middle_name: string | null
          owner_uid: string
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          country_of_residence?: string | null
          created_at?: string | null
          death_date?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          invite_code?: string | null
          is_deceased?: boolean | null
          is_private?: boolean | null
          last_name?: string | null
          middle_name?: string | null
          owner_uid: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          country_of_residence?: string | null
          created_at?: string | null
          death_date?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          invite_code?: string | null
          is_deceased?: boolean | null
          is_private?: boolean | null
          last_name?: string | null
          middle_name?: string | null
          owner_uid?: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_uid: string
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          updated_at: string | null
        }
        Insert: {
          author_uid: string
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          author_uid?: string
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          created_at: string | null
          id: string
          share_children: boolean | null
          share_contact_info: boolean | null
          share_parents: boolean | null
          share_siblings: boolean | null
          updated_at: string | null
          user_uid: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          share_children?: boolean | null
          share_contact_info?: boolean | null
          share_parents?: boolean | null
          share_siblings?: boolean | null
          updated_at?: string | null
          user_uid: string
        }
        Update: {
          created_at?: string | null
          id?: string
          share_children?: boolean | null
          share_contact_info?: boolean | null
          share_parents?: boolean | null
          share_siblings?: boolean | null
          updated_at?: string | null
          user_uid?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          person_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          person_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          person_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string | null
          user_uid: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type?: string | null
          user_uid: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string | null
          user_uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_merge_sessions: {
        Row: {
          created_at: string | null
          id: string
          initiator_uid: string
          status: string | null
          target_uid: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          initiator_uid: string
          status?: string | null
          target_uid: string
        }
        Update: {
          created_at?: string | null
          id?: string
          initiator_uid?: string
          status?: string | null
          target_uid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_tree_merge: { Args: { p_session_id: string }; Returns: undefined }
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

// Helper Types for easy importing
export type Person = Tables<'persons'>
export type Profile = Tables<'profiles'>
export type Marriage = Tables<'marriages'>
export type Couple = Marriage // Alias for backward compatibility during migration
export type ParentChild = Tables<'parent_child'>
export type Lineage = ParentChild // Alias for backward compatibility
export type Post = Tables<'posts'>
export type Comment = Tables<'comments'>
export type Reaction = Tables<'reactions'>
export type FamilyEvent = Tables<'events'>
