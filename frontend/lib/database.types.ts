export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cache_cleanup_logs: {
        Row: {
          cleaned_at: string | null
          id: number
          items_removed: number | null
        }
        Insert: {
          cleaned_at?: string | null
          id?: number
          items_removed?: number | null
        }
        Update: {
          cleaned_at?: string | null
          id?: number
          items_removed?: number | null
        }
        Relationships: []
      }
      dining_gallery: {
        Row: {
          author_name: string | null
          caption: string | null
          created_at: string | null
          dining_hall_name: string
          id: string
          image_url: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          caption?: string | null
          created_at?: string | null
          dining_hall_name: string
          id?: string
          image_url: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          caption?: string | null
          created_at?: string | null
          dining_hall_name?: string
          id?: string
          image_url?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      dining_tables: {
        Row: {
          created_at: string | null
          dining_hall_name: string
          id: string
          is_locked: boolean | null
          owner_id: string | null
          table_size: number
          topic_of_discussion: string
        }
        Insert: {
          created_at?: string | null
          dining_hall_name: string
          id?: string
          is_locked?: boolean | null
          owner_id?: string | null
          table_size: number
          topic_of_discussion: string
        }
        Update: {
          created_at?: string | null
          dining_hall_name?: string
          id?: string
          is_locked?: boolean | null
          owner_id?: string | null
          table_size?: number
          topic_of_discussion?: string
        }
        Relationships: [
          {
            foreignKeyName: "dining_tables_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_cache: {
        Row: {
          contains: string[] | null
          dietaryPreferences: string[] | null
          diningHall: string
          foodName: string
          foodType: string
          hours: string
          id: number
          last_updated: string | null
          mealType: string
          nutritionalInfo: Json | null
        }
        Insert: {
          contains?: string[] | null
          dietaryPreferences?: string[] | null
          diningHall: string
          foodName: string
          foodType: string
          hours: string
          id?: number
          last_updated?: string | null
          mealType: string
          nutritionalInfo?: Json | null
        }
        Update: {
          contains?: string[] | null
          dietaryPreferences?: string[] | null
          diningHall?: string
          foodName?: string
          foodType?: string
          hours?: string
          id?: number
          last_updated?: string | null
          mealType?: string
          nutritionalInfo?: Json | null
        }
        Relationships: []
      }
      nutrition_cache: {
        Row: {
          dining_hall: string
          id: number
          last_updated: string | null
          meal_name: string
          next_refresh: string | null
          nutrition_data: Json
        }
        Insert: {
          dining_hall: string
          id?: number
          last_updated?: string | null
          meal_name: string
          next_refresh?: string | null
          nutrition_data: Json
        }
        Update: {
          dining_hall?: string
          id?: number
          last_updated?: string | null
          meal_name?: string
          next_refresh?: string | null
          nutrition_data?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          diningHistory: Json[] | null
          email: string
          firstName: string | null
          id: string
          preferences: Json[] | null
          uni: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          diningHistory?: Json[] | null
          email: string
          firstName?: string | null
          id: string
          preferences?: Json[] | null
          uni: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          diningHistory?: Json[] | null
          email?: string
          firstName?: string | null
          id?: string
          preferences?: Json[] | null
          uni?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      table_members: {
        Row: {
          id: number
          joined_at: string | null
          table_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          joined_at?: string | null
          table_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          joined_at?: string | null
          table_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_members_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "dining_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      table_messages: {
        Row: {
          content: string
          created_at: string | null
          id: number
          table_id: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          table_id?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          table_id?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_messages_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "dining_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          username: string
        }
        Insert: {
          id?: string
          username: string
        }
        Update: {
          id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_old_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_gallery_images: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_old_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
