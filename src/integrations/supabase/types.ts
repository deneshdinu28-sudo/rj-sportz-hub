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
      attendance: {
        Row: {
          date: string
          id: string
          marked_at: string | null
          marked_by: string | null
          status: string
          student_id: string
          time_slot_id: string | null
        }
        Insert: {
          date: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          status?: string
          student_id: string
          time_slot_id?: string | null
        }
        Update: {
          date?: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          status?: string
          student_id?: string
          time_slot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_promotions: {
        Row: {
          from_batch: string
          id: string
          new_fee: number
          old_fee: number
          promoted_at: string | null
          promoted_by: string | null
          reason: string | null
          student_code: string
          student_id: string
          to_batch: string
          whatsapp_sent: boolean | null
        }
        Insert: {
          from_batch: string
          id?: string
          new_fee: number
          old_fee: number
          promoted_at?: string | null
          promoted_by?: string | null
          reason?: string | null
          student_code: string
          student_id: string
          to_batch: string
          whatsapp_sent?: boolean | null
        }
        Update: {
          from_batch?: string
          id?: string
          new_fee?: number
          old_fee?: number
          promoted_at?: string | null
          promoted_by?: string | null
          reason?: string | null
          student_code?: string
          student_id?: string
          to_batch?: string
          whatsapp_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_promotions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          coach_id: string
          community_id: string
          id: string
          sport_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          coach_id: string
          community_id: string
          id?: string
          sport_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          coach_id?: string
          community_id?: string
          id?: string
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_assignments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_assignments_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          assigned_communities: string[] | null
          assigned_sports: string[] | null
          coach_id: string
          coach_number: number
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          signup_completed: boolean | null
          signup_email: string | null
          sport_name: string
          sport_shortcode: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_communities?: string[] | null
          assigned_sports?: string[] | null
          coach_id: string
          coach_number?: number
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          signup_completed?: boolean | null
          signup_email?: string | null
          sport_name: string
          sport_shortcode?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_communities?: string[] | null
          assigned_sports?: string[] | null
          coach_id?: string
          coach_number?: number
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          signup_completed?: boolean | null
          signup_email?: string | null
          sport_name?: string
          sport_shortcode?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      communities: {
        Row: {
          address: string
          contact_person: string
          contact_phone: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          pricing: Json
          short_code: string
          status: string
          total_revenue: number | null
          total_sports: number | null
          total_students: number | null
          updated_at: string
        }
        Insert: {
          address?: string
          contact_person?: string
          contact_phone?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          pricing?: Json
          short_code: string
          status?: string
          total_revenue?: number | null
          total_sports?: number | null
          total_students?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          contact_person?: string
          contact_phone?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          pricing?: Json
          short_code?: string
          status?: string
          total_revenue?: number | null
          total_sports?: number | null
          total_students?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cron_logs: {
        Row: {
          duration_ms: number | null
          error_message: string | null
          id: string
          job_name: string
          messages_sent: number | null
          ran_at: string
          status: string | null
          students_affected: number | null
        }
        Insert: {
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name: string
          messages_sent?: number | null
          ran_at?: string
          status?: string | null
          students_affected?: number | null
        }
        Update: {
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name?: string
          messages_sent?: number | null
          ran_at?: string
          status?: string | null
          students_affected?: number | null
        }
        Relationships: []
      }
      global_sports: {
        Row: {
          created_at: string | null
          created_by: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          created_at: string | null
          id: string
          qr_code_url: string | null
          updated_at: string | null
          upi_id: string | null
          upi_number: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          qr_code_url?: string | null
          updated_at?: string | null
          upi_id?: string | null
          upi_number?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          qr_code_url?: string | null
          updated_at?: string | null
          upi_id?: string | null
          upi_number?: string | null
        }
        Relationships: []
      }
      payment_students: {
        Row: {
          allocated_amount: number
          created_at: string | null
          id: string
          payment_id: string
          plan_chosen: string
          student_id: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string | null
          id?: string
          payment_id: string
          plan_chosen: string
          student_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string | null
          id?: string
          payment_id?: string
          plan_chosen?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_students_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
          receipt_number: string | null
          screenshot_url: string | null
          student_code: string | null
          student_codes: string | null
          student_id: string
          student_names: string | null
          transaction_id: string | null
          verification_method: string
          verified_at: string | null
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
          receipt_number?: string | null
          screenshot_url?: string | null
          student_code?: string | null
          student_codes?: string | null
          student_id: string
          student_names?: string | null
          transaction_id?: string | null
          verification_method?: string
          verified_at?: string | null
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
          receipt_number?: string | null
          screenshot_url?: string | null
          student_code?: string | null
          student_codes?: string | null
          student_id?: string
          student_names?: string | null
          transaction_id?: string | null
          verification_method?: string
          verified_at?: string | null
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
      plan_change_logs: {
        Row: {
          changed_at: string
          changed_by: string | null
          effective_from: string | null
          id: string
          new_plan: string | null
          note: string | null
          previous_plan: string | null
          student_code: string | null
          student_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          effective_from?: string | null
          id?: string
          new_plan?: string | null
          note?: string | null
          previous_plan?: string | null
          student_code?: string | null
          student_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          effective_from?: string | null
          id?: string
          new_plan?: string | null
          note?: string | null
          previous_plan?: string | null
          student_code?: string | null
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          coach_id: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          sport_name: string | null
          updated_at: string | null
          user_type: string
          whatsapp: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          sport_name?: string | null
          updated_at?: string | null
          user_type?: string
          whatsapp?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          sport_name?: string | null
          updated_at?: string | null
          user_type?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      session_pack_pricing: {
        Row: {
          community_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          pack_name: string
          premium_price: number | null
          session_count: number
          sport_id: string | null
          standard_price: number
          updated_at: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pack_name: string
          premium_price?: number | null
          session_count: number
          sport_id?: string | null
          standard_price: number
          updated_at?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pack_name?: string
          premium_price?: number | null
          session_count?: number
          sport_id?: string | null
          standard_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_pack_pricing_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_pack_pricing_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_pricing: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          premium_1month: number
          premium_3months: number
          premium_6months: number
          sport_id: string
          standard_1month: number
          standard_3months: number
          standard_6months: number
          updated_at: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          premium_1month?: number
          premium_3months?: number
          premium_6months?: number
          sport_id: string
          standard_1month?: number
          standard_3months?: number
          standard_6months?: number
          updated_at?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          premium_1month?: number
          premium_3months?: number
          premium_6months?: number
          sport_id?: string
          standard_1month?: number
          standard_3months?: number
          standard_6months?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sport_pricing_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sport_pricing_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_shortcodes: {
        Row: {
          created_at: string | null
          id: string
          shortcode: string
          sport_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          shortcode: string
          sport_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          shortcode?: string
          sport_name?: string
        }
        Relationships: []
      }
      sports: {
        Row: {
          active_days: string[]
          coach_name: string
          coach_phone: string
          community_id: string
          created_at: string
          custom_monthly_price: number | null
          custom_monthly_sessions: number | null
          icon: string
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          name: string
          premium_fee: number
          pricing_type: string | null
          renewal_trigger: string | null
          revenue_collected: number | null
          sessions_per_month: number | null
          standard_fee: number
          time_slots: string[]
          total_students: number | null
          updated_at: string
        }
        Insert: {
          active_days?: string[]
          coach_name?: string
          coach_phone?: string
          community_id: string
          created_at?: string
          custom_monthly_price?: number | null
          custom_monthly_sessions?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name: string
          premium_fee?: number
          pricing_type?: string | null
          renewal_trigger?: string | null
          revenue_collected?: number | null
          sessions_per_month?: number | null
          standard_fee?: number
          time_slots?: string[]
          total_students?: number | null
          updated_at?: string
        }
        Update: {
          active_days?: string[]
          coach_name?: string
          coach_phone?: string
          community_id?: string
          created_at?: string
          custom_monthly_price?: number | null
          custom_monthly_sessions?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name?: string
          premium_fee?: number
          pricing_type?: string | null
          renewal_trigger?: string | null
          revenue_collected?: number | null
          sessions_per_month?: number | null
          standard_fee?: number
          time_slots?: string[]
          total_students?: number | null
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
          created_by: string | null
          current_pack_name: string | null
          days_overdue: number | null
          fee_amount: number
          fee_status: string
          hold_reason: string | null
          id: string
          is_active: boolean
          is_on_hold: boolean | null
          joining_date: string
          name: string
          next_due_date: string | null
          parent_name: string
          parent_phone: string
          parent_whatsapp: string
          payment_end_date: string | null
          payment_plan: string
          payment_start_date: string | null
          plan_change_effective_from: string | null
          plan_change_requested_at: string | null
          pricing_type: string | null
          renewal_trigger: string | null
          sessions_completed: number | null
          sessions_remaining: number | null
          sport_id: string
          student_id: string
          student_phone: string | null
          student_type: string | null
          student_whatsapp: string | null
          time_slot_id: string | null
          total_sessions_paid: number | null
          updated_at: string
        }
        Insert: {
          age?: number
          age_group?: string
          batch_time?: string
          batch_type?: string
          community_id: string
          created_at?: string
          created_by?: string | null
          current_pack_name?: string | null
          days_overdue?: number | null
          fee_amount?: number
          fee_status?: string
          hold_reason?: string | null
          id?: string
          is_active?: boolean
          is_on_hold?: boolean | null
          joining_date?: string
          name: string
          next_due_date?: string | null
          parent_name?: string
          parent_phone?: string
          parent_whatsapp?: string
          payment_end_date?: string | null
          payment_plan?: string
          payment_start_date?: string | null
          plan_change_effective_from?: string | null
          plan_change_requested_at?: string | null
          pricing_type?: string | null
          renewal_trigger?: string | null
          sessions_completed?: number | null
          sessions_remaining?: number | null
          sport_id: string
          student_id: string
          student_phone?: string | null
          student_type?: string | null
          student_whatsapp?: string | null
          time_slot_id?: string | null
          total_sessions_paid?: number | null
          updated_at?: string
        }
        Update: {
          age?: number
          age_group?: string
          batch_time?: string
          batch_type?: string
          community_id?: string
          created_at?: string
          created_by?: string | null
          current_pack_name?: string | null
          days_overdue?: number | null
          fee_amount?: number
          fee_status?: string
          hold_reason?: string | null
          id?: string
          is_active?: boolean
          is_on_hold?: boolean | null
          joining_date?: string
          name?: string
          next_due_date?: string | null
          parent_name?: string
          parent_phone?: string
          parent_whatsapp?: string
          payment_end_date?: string | null
          payment_plan?: string
          payment_start_date?: string | null
          plan_change_effective_from?: string | null
          plan_change_requested_at?: string | null
          pricing_type?: string | null
          renewal_trigger?: string | null
          sessions_completed?: number | null
          sessions_remaining?: number | null
          sport_id?: string
          student_id?: string
          student_phone?: string | null
          student_type?: string | null
          student_whatsapp?: string | null
          time_slot_id?: string | null
          total_sessions_paid?: number | null
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
          {
            foreignKeyName: "students_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          google_vision_key: string | null
          id: string
          updated_at: string
          wati_server_url: string | null
          wati_token: string | null
          wati_webhook_url: string | null
        }
        Insert: {
          created_at?: string
          google_vision_key?: string | null
          id?: string
          updated_at?: string
          wati_server_url?: string | null
          wati_token?: string | null
          wati_webhook_url?: string | null
        }
        Update: {
          created_at?: string
          google_vision_key?: string | null
          id?: string
          updated_at?: string
          wati_server_url?: string | null
          wati_token?: string | null
          wati_webhook_url?: string | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          active_days: string[] | null
          age_group: string
          batch_type: string
          community_id: string
          created_at: string | null
          current_students: number | null
          end_time: string
          id: string
          is_active: boolean | null
          max_students: number | null
          sport_id: string
          start_time: string
        }
        Insert: {
          active_days?: string[] | null
          age_group?: string
          batch_type?: string
          community_id: string
          created_at?: string | null
          current_students?: number | null
          end_time: string
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          sport_id: string
          start_time: string
        }
        Update: {
          active_days?: string[] | null
          age_group?: string
          batch_type?: string
          community_id?: string
          created_at?: string | null
          current_students?: number | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          sport_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slots_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template: string
          template_id: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template: string
          template_id: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template?: string
          template_id?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      update_fee_statuses: { Args: never; Returns: undefined }
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
