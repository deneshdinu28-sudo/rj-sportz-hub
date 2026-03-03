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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      communities: {
        Row: {
          address: string
          contact_person: string
          contact_phone: string
          created_at: string
          id: string
          name: string
          pricing: Json
          short_code: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string
          contact_person?: string
          contact_phone?: string
          created_at?: string
          id?: string
          name: string
          pricing?: Json
          short_code: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          contact_person?: string
          contact_phone?: string
          created_at?: string
          id?: string
          name?: string
          pricing?: Json
          short_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_date: string
          payment_mode: string
          period_end: string | null
          period_start: string | null
          plan_period: string
          student_id: string
          transaction_id: string | null
          verification_method: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_date?: string
          payment_mode?: string
          period_end?: string | null
          period_start?: string | null
          plan_period?: string
          student_id: string
          transaction_id?: string | null
          verification_method?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_date?: string
          payment_mode?: string
          period_end?: string | null
          period_start?: string | null
          plan_period?: string
          student_id?: string
          transaction_id?: string | null
          verification_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          active_days: string[]
          coach_name: string
          coach_phone: string
          community_id: string
          created_at: string
          icon: string
          id: string
          name: string
          premium_fee: number
          standard_fee: number
          time_slots: string[]
          updated_at: string
        }
        Insert: {
          active_days?: string[]
          coach_name?: string
          coach_phone?: string
          community_id: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          premium_fee?: number
          standard_fee?: number
          time_slots?: string[]
          updated_at?: string
        }
        Update: {
          active_days?: string[]
          coach_name?: string
          coach_phone?: string
          community_id?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          premium_fee?: number
          standard_fee?: number
          time_slots?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age: number
          age_group: string
          batch_time: string
          batch_type: string
          community_id: string
          created_at: string
          fee_amount: number
          fee_status: string
          id: string
          is_active: boolean
          joining_date: string
          name: string
          next_due_date: string | null
          parent_name: string
          parent_phone: string
          parent_whatsapp: string
          payment_end_date: string | null
          payment_plan: string
          payment_start_date: string | null
          sport_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          age?: number
          age_group?: string
          batch_time?: string
          batch_type?: string
          community_id: string
          created_at?: string
          fee_amount?: number
          fee_status?: string
          id?: string
          is_active?: boolean
          joining_date?: string
          name: string
          next_due_date?: string | null
          parent_name?: string
          parent_phone?: string
          parent_whatsapp?: string
          payment_end_date?: string | null
          payment_plan?: string
          payment_start_date?: string | null
          sport_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          age?: number
          age_group?: string
          batch_time?: string
          batch_type?: string
          community_id?: string
          created_at?: string
          fee_amount?: number
          fee_status?: string
          id?: string
          is_active?: boolean
          joining_date?: string
          name?: string
          next_due_date?: string | null
          parent_name?: string
          parent_phone?: string
          parent_whatsapp?: string
          payment_end_date?: string | null
          payment_plan?: string
          payment_start_date?: string | null
          sport_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
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
