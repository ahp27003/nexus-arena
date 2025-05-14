export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface SupabaseRPCFunctions {
  create_chat_with_creator: {
    Args: {
      p_name: string;
      p_created_by: string;
      p_is_private: boolean;
      p_chat_type?: string;
      p_team_id?: string | null;
    };
    Returns: any;
  };
  add_chat_participant: {
    Args: {
      p_chat_id: string;
      p_user_id: string;
    };
    Returns: boolean;
  };
}

export type Database = {
  public: {
    Tables: {
      chat_participants: {
        Row: {
          chat_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_private: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          details: string | null
          game: string
          id: string
          mvp_user_id: string | null
          status: string
          team1_id: string | null
          team1_score: number | null
          team2_id: string | null
          team2_score: number | null
          type: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          details?: string | null
          game: string
          id?: string
          mvp_user_id?: string | null
          status?: string
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          type: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          details?: string | null
          game?: string
          id?: string
          mvp_user_id?: string | null
          status?: string
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          type?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      player_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          games: string[] | null
          id: string
          play_style: string | null
          skill_level: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          games?: string[] | null
          id: string
          play_style?: string | null
          skill_level?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          games?: string[] | null
          id?: string
          play_style?: string | null
          skill_level?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          game: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          game: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          game?: string
          id?: string
          logo_url?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
