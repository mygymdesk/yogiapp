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
      food_log_items: {
        Row: {
          carbs: number
          created_at: string
          fat: number
          fiber: number
          food_id: string | null
          food_name: string
          id: string
          kcal: number
          meal_log_id: string
          protein: number
          serving_g: number
          user_id: string
        }
        Insert: {
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          food_id?: string | null
          food_name: string
          id?: string
          kcal?: number
          meal_log_id: string
          protein?: number
          serving_g?: number
          user_id: string
        }
        Update: {
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          food_id?: string | null
          food_name?: string
          id?: string
          kcal?: number
          meal_log_id?: string
          protein?: number
          serving_g?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_log_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_log_items_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          carbs_per_100g: number
          created_at: string
          default_serving_g: number
          fat_per_100g: number
          fiber_per_100g: number
          food_group: string | null
          id: string
          is_system: boolean
          kcal_per_100g: number
          name: string
          protein_per_100g: number
          source: string | null
          source_code: string | null
          tags: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          carbs_per_100g?: number
          created_at?: string
          default_serving_g?: number
          fat_per_100g?: number
          fiber_per_100g?: number
          food_group?: string | null
          id?: string
          is_system?: boolean
          kcal_per_100g?: number
          name: string
          protein_per_100g?: number
          source?: string | null
          source_code?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          carbs_per_100g?: number
          created_at?: string
          default_serving_g?: number
          fat_per_100g?: number
          fiber_per_100g?: number
          food_group?: string | null
          id?: string
          is_system?: boolean
          kcal_per_100g?: number
          name?: string
          protein_per_100g?: number
          source?: string | null
          source_code?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          logged_at: string
          note: string | null
          slot: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          logged_at?: string
          note?: string | null
          slot?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          logged_at?: string
          note?: string | null
          slot?: string
          user_id?: string
        }
        Relationships: []
      }
      medicine_logs: {
        Row: {
          date: string
          id: string
          medicine_id: string
          notes: string | null
          scheduled_time: string
          status: string
          taken_at: string
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          medicine_id: string
          notes?: string | null
          scheduled_time: string
          status?: string
          taken_at?: string
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          medicine_id?: string
          notes?: string | null
          scheduled_time?: string
          status?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_logs_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          dosage: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          schedule_days: number[]
          schedule_times: string[]
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          schedule_days?: number[]
          schedule_times?: string[]
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          schedule_days?: number[]
          schedule_times?: string[]
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          date: string
          id: string
          logged_at: string
          mood: number
          note: string | null
          tags: string[]
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          logged_at?: string
          mood: number
          note?: string | null
          tags?: string[]
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          logged_at?: string
          mood?: number
          note?: string | null
          tags?: string[]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          daily_carbs_g_target: number
          daily_fat_g_target: number
          daily_kcal_target: number
          daily_protein_g_target: number
          daily_water_target_ml: number
          display_name: string | null
          dob: string | null
          goal_weight_kg: number | null
          height_cm: number | null
          meal_slots: Json
          quiet_hours_end: string
          quiet_hours_start: string
          timezone: string
          updated_at: string
          user_id: string
          walking_target_min: number
          weight_unit: string
        }
        Insert: {
          created_at?: string
          daily_carbs_g_target?: number
          daily_fat_g_target?: number
          daily_kcal_target?: number
          daily_protein_g_target?: number
          daily_water_target_ml?: number
          display_name?: string | null
          dob?: string | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          meal_slots?: Json
          quiet_hours_end?: string
          quiet_hours_start?: string
          timezone?: string
          updated_at?: string
          user_id: string
          walking_target_min?: number
          weight_unit?: string
        }
        Update: {
          created_at?: string
          daily_carbs_g_target?: number
          daily_fat_g_target?: number
          daily_kcal_target?: number
          daily_protein_g_target?: number
          daily_water_target_ml?: number
          display_name?: string | null
          dob?: string | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          meal_slots?: Json
          quiet_hours_end?: string
          quiet_hours_start?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          walking_target_min?: number
          weight_unit?: string
        }
        Relationships: []
      }
      walk_logs: {
        Row: {
          date: string
          distance_km: number | null
          duration_min: number
          id: string
          logged_at: string
          notes: string | null
          user_id: string
        }
        Insert: {
          date?: string
          distance_km?: number | null
          duration_min: number
          id?: string
          logged_at?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          date?: string
          distance_km?: number | null
          duration_min?: number
          id?: string
          logged_at?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          id: string
          logged_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          id?: string
          logged_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          id?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          body_fat_pct: number | null
          chest_cm: number | null
          date: string
          id: string
          logged_at: string
          user_id: string
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          body_fat_pct?: number | null
          chest_cm?: number | null
          date?: string
          id?: string
          logged_at?: string
          user_id: string
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          body_fat_pct?: number | null
          chest_cm?: number | null
          date?: string
          id?: string
          logged_at?: string
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number
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
