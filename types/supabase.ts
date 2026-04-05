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
      admin_coach_applications: {
        Row: {
          applicant_id: string | null
          certificate_url: string | null
          email: string
          experience_years: number
          full_name: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialties: string[]
          status: string
          submitted_at: string
        }
        Insert: {
          applicant_id?: string | null
          certificate_url?: string | null
          email: string
          experience_years?: number
          full_name: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialties?: string[]
          status?: string
          submitted_at?: string
        }
        Update: {
          applicant_id?: string | null
          certificate_url?: string | null
          email?: string
          experience_years?: number
          full_name?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialties?: string[]
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_coach_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_coach_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_moderation_reports: {
        Row: {
          content_type: string
          created_at: string
          id: string
          notes: string | null
          reason: string
          reporter_id: string | null
          reviewed_by: string | null
          status: string
          target_post_id: string | null
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          reporter_id?: string | null
          reviewed_by?: string | null
          status?: string
          target_post_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          reporter_id?: string | null
          reviewed_by?: string | null
          status?: string
          target_post_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_moderation_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_moderation_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_moderation_reports_target_post_id_fkey"
            columns: ["target_post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_moderation_reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource: string
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource?: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          bicep_cm: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          created_at: string
          hips_cm: number | null
          id: string
          measured_at: string
          neck_cm: number | null
          notes: string | null
          thigh_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          bicep_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_at?: string
          neck_cm?: number | null
          notes?: string | null
          thigh_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          bicep_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_at?: string
          neck_cm?: number | null
          notes?: string | null
          thigh_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_broadcast_logs: {
        Row: {
          audience_label: string
          coach_id: string
          created_at: string
          delivered_count: number
          id: string
          message: string
          read_count: number
        }
        Insert: {
          audience_label: string
          coach_id: string
          created_at?: string
          delivered_count?: number
          id?: string
          message: string
          read_count?: number
        }
        Update: {
          audience_label?: string
          coach_id?: string
          created_at?: string
          delivered_count?: number
          id?: string
          message?: string
          read_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_broadcast_logs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_client_links: {
        Row: {
          client_id: string
          coach_id: string
          compliance: number
          created_at: string
          goal_name: string | null
          id: string
          last_active_at: string
          notes: string | null
          status: string
          updated_at: string
          weight_trend: Json
        }
        Insert: {
          client_id: string
          coach_id: string
          compliance?: number
          created_at?: string
          goal_name?: string | null
          id?: string
          last_active_at?: string
          notes?: string | null
          status?: string
          updated_at?: string
          weight_trend?: Json
        }
        Update: {
          client_id?: string
          coach_id?: string
          compliance?: number
          created_at?: string
          goal_name?: string | null
          id?: string
          last_active_at?: string
          notes?: string | null
          status?: string
          updated_at?: string
          weight_trend?: Json
        }
        Relationships: [
          {
            foreignKeyName: "coach_client_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_client_links_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_content_tag_links: {
        Row: {
          created_at: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_content_tag_links_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_content_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "coach_content_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_content_tags: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          label: string
          slug: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          label: string
          slug: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          label?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_content_tags_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_form_assignments: {
        Row: {
          assigned_at: string
          client_id: string
          coach_id: string
          completed_at: string | null
          created_at: string
          deadline: string | null
          form_id: string
          id: string
        }
        Insert: {
          assigned_at?: string
          client_id: string
          coach_id: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          form_id: string
          id?: string
        }
        Update: {
          assigned_at?: string
          client_id?: string
          coach_id?: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          form_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_form_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_form_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_form_assignments_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "coach_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_form_submissions: {
        Row: {
          client_id: string
          coach_id: string
          coach_notes: string | null
          form_id: string
          id: string
          response: Json
          review_status: string
          reviewed_at: string | null
          submitted_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          coach_notes?: string | null
          form_id: string
          id?: string
          response?: Json
          review_status?: string
          reviewed_at?: string | null
          submitted_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          coach_notes?: string | null
          form_id?: string
          id?: string
          response?: Json
          review_status?: string
          reviewed_at?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_form_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_form_submissions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "coach_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_forms: {
        Row: {
          coach_id: string
          created_at: string
          form_schema: Json
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          form_schema?: Json
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          form_schema?: Json
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_forms_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_program_assignments: {
        Row: {
          assigned_at: string
          client_id: string
          coach_id: string
          completed_at: string | null
          id: string
          program_id: string
          progress_pct: number
          started_at: string | null
          status: string
        }
        Insert: {
          assigned_at?: string
          client_id: string
          coach_id: string
          completed_at?: string | null
          id?: string
          program_id: string
          progress_pct?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          assigned_at?: string
          client_id?: string
          coach_id?: string
          completed_at?: string | null
          id?: string
          program_id?: string
          progress_pct?: number
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_program_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_program_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_program_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "coach_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_programs: {
        Row: {
          builder_days: Json
          coach_id: string
          cover_url: string | null
          created_at: string
          difficulty: string
          id: string
          is_archived: boolean
          length_label: string
          name: string
          updated_at: string
        }
        Insert: {
          builder_days?: Json
          coach_id: string
          cover_url?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          is_archived?: boolean
          length_label?: string
          name: string
          updated_at?: string
        }
        Update: {
          builder_days?: Json
          coach_id?: string
          cover_url?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          is_archived?: boolean
          length_label?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_programs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_review_replies: {
        Row: {
          body: string
          coach_id: string
          created_at: string
          id: string
          review_id: string
        }
        Insert: {
          body: string
          coach_id: string
          created_at?: string
          id?: string
          review_id: string
        }
        Update: {
          body?: string
          coach_id?: string
          created_at?: string
          id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_review_replies_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "coach_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_reviews: {
        Row: {
          coach_id: string
          comment: string | null
          created_at: string
          id: string
          is_public: boolean
          rating: number
          reviewer_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          coach_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          rating: number
          reviewer_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          coach_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          rating?: number
          reviewer_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_schedule_events: {
        Row: {
          client_id: string | null
          coach_id: string
          created_at: string
          end_at: string
          event_type: string
          id: string
          notes: string | null
          start_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          coach_id: string
          created_at?: string
          end_at: string
          event_type?: string
          id?: string
          notes?: string | null
          start_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          coach_id?: string
          created_at?: string
          end_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          start_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_schedule_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_schedule_events_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          meal_ref: Json | null
          media_urls: string[]
          parent_id: string | null
          poll: Json | null
          post_type: string
          pr_ref: Json | null
          repost_of_id: string | null
          updated_at: string
          user_id: string
          workout_ref: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          meal_ref?: Json | null
          media_urls?: string[]
          parent_id?: string | null
          poll?: Json | null
          post_type?: string
          pr_ref?: Json | null
          repost_of_id?: string | null
          updated_at?: string
          user_id: string
          workout_ref?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          meal_ref?: Json | null
          media_urls?: string[]
          parent_id?: string | null
          poll?: Json | null
          post_type?: string
          pr_ref?: Json | null
          repost_of_id?: string | null
          updated_at?: string
          user_id?: string
          workout_ref?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_repost_of_id_fkey"
            columns: ["repost_of_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          completed: boolean
          created_at: string
          exercise_id: string | null
          exercise_name: string
          id: string
          logged_at: string
          reps: number | null
          rpe: number | null
          set_number: number
          user_id: string
          weight: number | null
          workout_session_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          exercise_name: string
          id?: string
          logged_at?: string
          reps?: number | null
          rpe?: number | null
          set_number: number
          user_id: string
          weight?: number | null
          workout_session_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          logged_at?: string
          reps?: number | null
          rpe?: number | null
          set_number?: number
          user_id?: string
          weight?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          equipment: Database["public"]["Enums"]["equipment_type"]
          gif_url: string | null
          id: string
          is_custom: boolean
          movement_pattern: Database["public"]["Enums"]["movement_pattern"]
          muscle_groups: string[]
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: Database["public"]["Enums"]["equipment_type"]
          gif_url?: string | null
          id?: string
          is_custom?: boolean
          movement_pattern?: Database["public"]["Enums"]["movement_pattern"]
          muscle_groups?: string[]
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: Database["public"]["Enums"]["equipment_type"]
          gif_url?: string | null
          id?: string
          is_custom?: boolean
          movement_pattern?: Database["public"]["Enums"]["movement_pattern"]
          muscle_groups?: string[]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          barcode: string | null
          brand: string | null
          calories_per_100g: number
          carbs_per_100g: number
          created_at: string
          created_by: string | null
          fat_per_100g: number
          fiber_per_100g: number | null
          id: string
          name: string
          protein_per_100g: number
          sodium_per_100g: number | null
          verified: boolean
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g: number
          carbs_per_100g?: number
          created_at?: string
          created_by?: string | null
          fat_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name: string
          protein_per_100g?: number
          sodium_per_100g?: number | null
          verified?: boolean
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number
          carbs_per_100g?: number
          created_at?: string
          created_by?: string | null
          fat_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name?: string
          protein_per_100g?: number
          sodium_per_100g?: number | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "food_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_log_entries: {
        Row: {
          created_at: string
          food_item_id: string
          id: string
          logged_at: string
          meal_slot: Database["public"]["Enums"]["meal_slot"]
          notes: string | null
          serving_size_g: number
          user_id: string
        }
        Insert: {
          created_at?: string
          food_item_id: string
          id?: string
          logged_at?: string
          meal_slot: Database["public"]["Enums"]["meal_slot"]
          notes?: string | null
          serving_size_g: number
          user_id: string
        }
        Update: {
          created_at?: string
          food_item_id?: string
          id?: string
          logged_at?: string
          meal_slot?: Database["public"]["Enums"]["meal_slot"]
          notes?: string | null
          serving_size_g?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_log_entries_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_log_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          ahead: boolean
          category: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          current_value: number
          deadline: string | null
          id: string
          projected_complete: string | null
          start_value: number
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ahead?: boolean
          category?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          deadline?: string | null
          id?: string
          projected_complete?: string | null
          start_value?: number
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ahead?: boolean
          category?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          deadline?: string | null
          id?: string
          projected_complete?: string | null
          start_value?: number
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hydration_logs: {
        Row: {
          amount_ml: number
          caffeine_mg: number
          created_at: string
          drink_type: string
          hydration_factor: number
          id: string
          label: string | null
          logged_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          caffeine_mg?: number
          created_at?: string
          drink_type?: string
          hydration_factor?: number
          id?: string
          label?: string | null
          logged_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          caffeine_mg?: number
          created_at?: string
          drink_type?: string
          hydration_factor?: number
          id?: string
          label?: string | null
          logged_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hydration_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_thread_participants: {
        Row: {
          joined_at: string
          last_read_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          last_read_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          last_read_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_thread_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          created_by: string | null
          group_avatar: string | null
          group_name: string | null
          id: string
          is_group: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_avatar?: string | null
          group_name?: string | null
          id?: string
          is_group?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_avatar?: string | null
          group_name?: string | null
          id?: string
          is_group?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          created_at: string
          id: string
          reply_to_id: string | null
          sender_id: string
          status: string
          text: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          id?: string
          reply_to_id?: string | null
          sender_id: string
          status?: string
          text?: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          id?: string
          reply_to_id?: string | null
          sender_id?: string
          status?: string
          text?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          actor_id: string | null
          body: string
          created_at: string
          delivered_at: string | null
          id: string
          payload: Json
          read_at: string | null
          recipient_id: string
          seen_at: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          actor_id?: string | null
          body: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          recipient_id: string
          seen_at?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          actor_id?: string | null
          body?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          recipient_id?: string
          seen_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_entries: {
        Row: {
          created_at: string
          food_item: Json
          food_item_id: string
          id: string
          image_source: string | null
          image_url: string | null
          is_ai_generated: boolean
          logged_at: string
          meal_slot: string
          notes: string | null
          quantity: number
          scan_metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          food_item: Json
          food_item_id: string
          id?: string
          image_source?: string | null
          image_url?: string | null
          is_ai_generated?: boolean
          logged_at?: string
          meal_slot?: string
          notes?: string | null
          quantity?: number
          scan_metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          food_item?: Json
          food_item_id?: string
          id?: string
          image_source?: string | null
          image_url?: string | null
          is_ai_generated?: boolean
          logged_at?: string
          meal_slot?: string
          notes?: string | null
          quantity?: number
          scan_metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_scan_logs: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          image_path: string | null
          image_url: string | null
          nutrition_entry_id: string | null
          provider: string | null
          response_payload: Json | null
          source_type: string
          user_id: string
          vision_hints: string[]
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          nutrition_entry_id?: string | null
          provider?: string | null
          response_payload?: Json | null
          source_type?: string
          user_id: string
          vision_hints?: string[]
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          nutrition_entry_id?: string | null
          provider?: string | null
          response_payload?: Json | null
          source_type?: string
          user_id?: string
          vision_hints?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_scan_logs_nutrition_entry_id_fkey"
            columns: ["nutrition_entry_id"]
            isOneToOne: false
            referencedRelation: "nutrition_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_scan_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          coach_id: string | null
          created_at: string
          currency: string
          external_ref: string | null
          id: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          coach_id?: string | null
          created_at?: string
          currency?: string
          external_ref?: string | null
          id?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          coach_id?: string | null
          created_at?: string
          currency?: string
          external_ref?: string | null
          id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_settings: {
        Row: {
          created_at: string
          integrations: Json
          profile_visibility: string
          share_weight_data: boolean
          share_workouts: boolean
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          integrations?: Json
          profile_visibility?: string
          share_weight_data?: boolean
          share_workouts?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
          week_start?: string
        }
        Update: {
          created_at?: string
          integrations?: Json
          profile_visibility?: string
          share_weight_data?: boolean
          share_workouts?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          avatar_url: string | null
          biological_sex: Database["public"]["Enums"]["biological_sex"] | null
          bmr: number | null
          carb_target: number | null
          created_at: string
          current_weight_kg: number | null
          daily_calorie_target: number | null
          date_of_birth: string | null
          dietary_preference:
            | Database["public"]["Enums"]["dietary_preference"]
            | null
          email: string | null
          exercise_preferences: string[] | null
          fat_target: number | null
          fiber_target: number | null
          fitness_goal: Database["public"]["Enums"]["fitness_goal"] | null
          full_name: string | null
          goal: string | null
          goal_weight_kg: number | null
          height_cm: number | null
          id: string
          is_premium: boolean
          measurement_system: Database["public"]["Enums"]["measurement_system"]
          onboarding_complete: boolean
          onboarding_completed: boolean
          protein_target: number | null
          role: string
          session_duration: number | null
          sex: string | null
          tdee: number | null
          timezone: string | null
          updated_at: string
          username: string | null
          water_target_ml: number | null
          weekly_workouts: number | null
          weight_kg: number | null
        }
        Insert: {
          account_status?: string
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          avatar_url?: string | null
          biological_sex?: Database["public"]["Enums"]["biological_sex"] | null
          bmr?: number | null
          carb_target?: number | null
          created_at?: string
          current_weight_kg?: number | null
          daily_calorie_target?: number | null
          date_of_birth?: string | null
          dietary_preference?:
            | Database["public"]["Enums"]["dietary_preference"]
            | null
          email?: string | null
          exercise_preferences?: string[] | null
          fat_target?: number | null
          fiber_target?: number | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          full_name?: string | null
          goal?: string | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          id: string
          is_premium?: boolean
          measurement_system?: Database["public"]["Enums"]["measurement_system"]
          onboarding_complete?: boolean
          onboarding_completed?: boolean
          protein_target?: number | null
          role?: string
          session_duration?: number | null
          sex?: string | null
          tdee?: number | null
          timezone?: string | null
          updated_at?: string
          username?: string | null
          water_target_ml?: number | null
          weekly_workouts?: number | null
          weight_kg?: number | null
        }
        Update: {
          account_status?: string
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          avatar_url?: string | null
          biological_sex?: Database["public"]["Enums"]["biological_sex"] | null
          bmr?: number | null
          carb_target?: number | null
          created_at?: string
          current_weight_kg?: number | null
          daily_calorie_target?: number | null
          date_of_birth?: string | null
          dietary_preference?:
            | Database["public"]["Enums"]["dietary_preference"]
            | null
          email?: string | null
          exercise_preferences?: string[] | null
          fat_target?: number | null
          fiber_target?: number | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          full_name?: string | null
          goal?: string | null
          goal_weight_kg?: number | null
          height_cm?: number | null
          id?: string
          is_premium?: boolean
          measurement_system?: Database["public"]["Enums"]["measurement_system"]
          onboarding_complete?: boolean
          onboarding_completed?: boolean
          protein_target?: number | null
          role?: string
          session_duration?: number | null
          sex?: string | null
          tdee?: number | null
          timezone?: string | null
          updated_at?: string
          username?: string | null
          water_target_ml?: number | null
          weekly_workouts?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_calculator_responses: {
        Row: {
          calculator_type: string
          created_at: string
          id: string
          responses: Json
          result: Json | null
          updated_at: string
          user_id: string
          wizard_step: number
        }
        Insert: {
          calculator_type: string
          created_at?: string
          id?: string
          responses?: Json
          result?: Json | null
          updated_at?: string
          user_id: string
          wizard_step?: number
        }
        Update: {
          calculator_type?: string
          created_at?: string
          id?: string
          responses?: Json
          result?: Json | null
          updated_at?: string
          user_id?: string
          wizard_step?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_calculator_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          calories_kcal: number
          carbs_g: number
          created_at: string
          fat_g: number
          fiber_g: number
          id: string
          protein_g: number
          updated_at: string
          user_id: string
          water_ml: number
        }
        Insert: {
          calories_kcal: number
          carbs_g: number
          created_at?: string
          fat_g: number
          fiber_g?: number
          id?: string
          protein_g: number
          updated_at?: string
          user_id: string
          water_ml?: number
        }
        Update: {
          calories_kcal?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          protein_g?: number
          updated_at?: string
          user_id?: string
          water_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      water_log_entries: {
        Row: {
          amount_ml: number
          caffeine_mg: number | null
          created_at: string
          drink_type: Database["public"]["Enums"]["drink_type"]
          hydration_coefficient: number
          id: string
          logged_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          caffeine_mg?: number | null
          created_at?: string
          drink_type?: Database["public"]["Enums"]["drink_type"]
          hydration_coefficient?: number
          id?: string
          logged_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          caffeine_mg?: number | null
          created_at?: string
          drink_type?: Database["public"]["Enums"]["drink_type"]
          hydration_coefficient?: number
          id?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_log_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          calories: number | null
          created_at: string
          date: string | null
          duration: number | null
          duration_seconds: number | null
          end_time: string | null
          ended_at: string | null
          exercises: Json
          id: string
          is_completed: boolean
          is_template: boolean
          name: string
          notes: string | null
          routine_id: string | null
          start_time: string | null
          started_at: string
          template_id: string | null
          total_volume: number
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          date?: string | null
          duration?: number | null
          duration_seconds?: number | null
          end_time?: string | null
          ended_at?: string | null
          exercises?: Json
          id?: string
          is_completed?: boolean
          is_template?: boolean
          name: string
          notes?: string | null
          routine_id?: string | null
          start_time?: string | null
          started_at?: string
          template_id?: string | null
          total_volume?: number
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          date?: string | null
          duration?: number | null
          duration_seconds?: number | null
          end_time?: string | null
          ended_at?: string | null
          exercises?: Json
          id?: string
          is_completed?: boolean
          is_template?: boolean
          name?: string
          notes?: string | null
          routine_id?: string | null
          start_time?: string | null
          started_at?: string
          template_id?: string | null
          total_volume?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          created_at: string
          distance_m: number | null
          duration_seconds: number | null
          exercise_id: string
          id: string
          notes: string | null
          reps: number | null
          rpe: number | null
          session_id: string
          set_number: number
          set_type: Database["public"]["Enums"]["set_type"]
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          distance_m?: number | null
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_id: string
          set_number: number
          set_type?: Database["public"]["Enums"]["set_type"]
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          distance_m?: number | null
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_id?: string
          set_number?: number
          set_type?: Database["public"]["Enums"]["set_type"]
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          template_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          template_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          template_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active"
        | "light"
        | "moderate"
      biological_sex: "male" | "female" | "prefer_not_to_say"
      dietary_preference:
        | "omnivore"
        | "vegan"
        | "vegetarian"
        | "flexitarian"
        | "pescatarian"
        | "keto"
        | "paleo"
        | "mediterranean"
      drink_type:
        | "water"
        | "coffee"
        | "tea"
        | "juice"
        | "smoothie"
        | "sports_drink"
        | "milk"
        | "sparkling_water"
        | "alcohol"
        | "other"
      equipment_type:
        | "barbell"
        | "dumbbell"
        | "cable"
        | "machine"
        | "bodyweight"
        | "resistance_band"
        | "kettlebell"
        | "suspension"
        | "other"
      fitness_goal:
        | "weight_loss"
        | "muscle_gain"
        | "body_recomposition"
        | "maintenance"
        | "endurance"
        | "general_fitness"
      meal_slot:
        | "breakfast"
        | "morning_snack"
        | "lunch"
        | "afternoon_snack"
        | "dinner"
        | "evening_snack"
      measurement_system: "imperial" | "metric"
      movement_pattern:
        | "push"
        | "pull"
        | "squat"
        | "hinge"
        | "carry"
        | "rotation"
        | "cardio"
        | "other"
      set_type: "warmup" | "working" | "failure" | "dropset"
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
    Enums: {
      activity_level: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "light",
        "moderate",
      ],
      biological_sex: ["male", "female", "prefer_not_to_say"],
      dietary_preference: [
        "omnivore",
        "vegan",
        "vegetarian",
        "flexitarian",
        "pescatarian",
        "keto",
        "paleo",
        "mediterranean",
      ],
      drink_type: [
        "water",
        "coffee",
        "tea",
        "juice",
        "smoothie",
        "sports_drink",
        "milk",
        "sparkling_water",
        "alcohol",
        "other",
      ],
      equipment_type: [
        "barbell",
        "dumbbell",
        "cable",
        "machine",
        "bodyweight",
        "resistance_band",
        "kettlebell",
        "suspension",
        "other",
      ],
      fitness_goal: [
        "weight_loss",
        "muscle_gain",
        "body_recomposition",
        "maintenance",
        "endurance",
        "general_fitness",
      ],
      meal_slot: [
        "breakfast",
        "morning_snack",
        "lunch",
        "afternoon_snack",
        "dinner",
        "evening_snack",
      ],
      measurement_system: ["imperial", "metric"],
      movement_pattern: [
        "push",
        "pull",
        "squat",
        "hinge",
        "carry",
        "rotation",
        "cardio",
        "other",
      ],
      set_type: ["warmup", "working", "failure", "dropset"],
    },
  },
} as const

