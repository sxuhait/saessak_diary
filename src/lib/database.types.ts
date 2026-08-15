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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
          reason: string | null
          session_date: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
          reason?: string | null
          session_date: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          reason?: string | null
          session_date?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      center_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["center_event_type"]
          id: string
          location: string | null
          photo_urls: string[]
          schedule: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          event_type?: Database["public"]["Enums"]["center_event_type"]
          id?: string
          location?: string | null
          photo_urls?: string[]
          schedule?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          event_type?: Database["public"]["Enums"]["center_event_type"]
          id?: string
          location?: string | null
          photo_urls?: string[]
          schedule?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      class_cancellations: {
        Row: {
          cancelled_date: string
          class_id: string
          created_at: string
          id: string
        }
        Insert: {
          cancelled_date: string
          class_id: string
          created_at?: string
          id?: string
        }
        Update: {
          cancelled_date?: string
          class_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_cancellations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_days: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          id?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_days_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          created_at: string
          id: string
          mentee_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          mentee_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          mentee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          color: Database["public"]["Enums"]["class_color"]
          created_at: string
          description: string | null
          id: string
          name: string
          teacher_name: string | null
          updated_at: string
        }
        Insert: {
          color?: Database["public"]["Enums"]["class_color"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          teacher_name?: string | null
          updated_at?: string
        }
        Update: {
          color?: Database["public"]["Enums"]["class_color"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          teacher_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          mentor_id: string
          pain_point: string | null
          rating: number
          useful_feature:
            | Database["public"]["Enums"]["feedback_useful_feature"]
            | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          mentor_id: string
          pain_point?: string | null
          rating: number
          useful_feature?:
            | Database["public"]["Enums"]["feedback_useful_feature"]
            | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          mentor_id?: string
          pain_point?: string | null
          rating?: number
          useful_feature?:
            | Database["public"]["Enums"]["feedback_useful_feature"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentees: {
        Row: {
          birth_date: string | null
          created_at: string
          grade: string | null
          guardian_contact: string | null
          id: string
          name: string
          notes: string | null
          school: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          grade?: string | null
          guardian_contact?: string | null
          id?: string
          name: string
          notes?: string | null
          school?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          grade?: string | null
          guardian_contact?: string | null
          id?: string
          name?: string
          notes?: string | null
          school?: string | null
        }
        Relationships: []
      }
      mentor_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          mentor_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          mentor_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          mentor_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_schedules_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          reactivated_at: string | null
          role: Database["public"]["Enums"]["mentor_role"]
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          phone?: string | null
          reactivated_at?: string | null
          role?: Database["public"]["Enums"]["mentor_role"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          reactivated_at?: string | null
          role?: Database["public"]["Enums"]["mentor_role"]
        }
        Relationships: []
      }
      schedule_items: {
        Row: {
          color: Database["public"]["Enums"]["class_color"]
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          color?: Database["public"]["Enums"]["class_color"]
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          color?: Database["public"]["Enums"]["class_color"]
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_logs: {
        Row: {
          attendance_id: string | null
          content: string
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
          progress: string | null
          session_date: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          attendance_id?: string | null
          content: string
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
          progress?: string | null
          session_date: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          attendance_id?: string | null
          content?: string
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          progress?: string | null
          session_date?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          volunteer_id: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: string
          volunteer_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_attendance_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_mentor_blocked: { Args: never; Returns: boolean }
      current_mentor_role: {
        Args: never
        Returns: Database["public"]["Enums"]["mentor_role"]
      }
      is_volunteer_expired: { Args: { p_mentor_id: string }; Returns: boolean }
      mentor_last_activity: { Args: { p_mentor_id: string }; Returns: string }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "excused"
      center_event_type: "field_trip" | "camp" | "other"
      class_color:
        | "rose"
        | "orange"
        | "violet"
        | "sky"
        | "fuchsia"
        | "indigo"
        | "teal"
        | "cyan"
      feedback_useful_feature:
        | "session_log"
        | "diagnostics"
        | "attendance"
        | "schedule"
        | "other"
      mentor_role: "mentor" | "volunteer" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late", "excused"],
      center_event_type: ["field_trip", "camp", "other"],
      class_color: [
        "rose",
        "orange",
        "violet",
        "sky",
        "fuchsia",
        "indigo",
        "teal",
        "cyan",
      ],
      feedback_useful_feature: [
        "session_log",
        "diagnostics",
        "attendance",
        "schedule",
        "other",
      ],
      mentor_role: ["mentor", "volunteer", "admin"],
    },
  },
} as const
