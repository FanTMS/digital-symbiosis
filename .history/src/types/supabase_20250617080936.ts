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
      users: {
        Row: {
          id: number
          name: string
          username: string
          skills: string[] | null
          portfolio: string[] | null
          description: string | null
          level: string | null
          rating: number | null
          credits: number | null
          completed_tasks: number | null
          avatar_url: string | null
          joined_at: string
          updated_at: string
          role: string | null
          referral_code: string | null
          used_referral_code: string | null
        }
        Insert: {
          id: number
          name: string
          username: string
          skills?: string[] | null
          portfolio?: string[] | null
          description?: string | null
          level?: string | null
          rating?: number | null
          credits?: number | null
          completed_tasks?: number | null
          avatar_url?: string | null
          joined_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          username?: string
          skills?: string[] | null
          portfolio?: string[] | null
          description?: string | null
          level?: string | null
          rating?: number | null
          credits?: number | null
          completed_tasks?: number | null
          avatar_url?: string | null
          joined_at?: string
          updated_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          user_id: number
          badge_id: string
          received_at: string
        }
        Insert: {
          user_id: number
          badge_id: string
          received_at?: string
        }
        Update: {
          user_id?: number
          badge_id?: string
          received_at?: string
        }
      }
      services: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          price: number
          user_id: number
          skills: string[] | null
          rating: number | null
          reviews_count: number | null
          created_at: string
          updated_at: string
          is_active: boolean
          image_url: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          price: number
          user_id: number
          skills?: string[] | null
          rating?: number | null
          reviews_count?: number | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          image_url?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          price?: number
          user_id?: number
          skills?: string[] | null
          rating?: number | null
          reviews_count?: number | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          image_url?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          service_id: string
          client_id: number
          provider_id: number
          status: string
          price: number
          created_at: string
          completed_at: string | null
          updated_at: string
          quiz_answers?: Json | null
        }
        Insert: {
          id?: string
          service_id: string
          client_id: number
          provider_id: number
          status: string
          price: number
          created_at?: string
          completed_at?: string | null
          updated_at?: string
          quiz_answers?: Json | null
        }
        Update: {
          id?: string
          service_id?: string
          client_id?: number
          provider_id?: number
          status?: string
          price?: number
          created_at?: string
          completed_at?: string | null
          updated_at?: string
          quiz_answers?: Json | null
        }
      }
      reviews: {
        Row: {
          id: string
          order_id: string
          user_id: number
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          user_id: number
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          user_id?: number
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: number
          type: string
          message: string
          read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: number
          type: string
          message: string
          read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: number
          type?: string
          message?: string
          read?: boolean
          data?: Json | null
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: number
          referred_id: number
          status: string
          bonus_received: boolean
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: number
          referred_id: number
          status: string
          bonus_received?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: number
          referred_id?: number
          status?: string
          bonus_received?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_telegram: {
        Args: {
          init_data: string
          user_id: number
        }
        Returns: {
          success: boolean
          message?: string
          session_id?: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 