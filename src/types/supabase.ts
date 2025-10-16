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
          credits: number
          locked_credits: number
          completed_tasks: number | null
          avatar_url: string | null
          joined_at: string
          updated_at: string
          role: string | null
          referral_code: string | null
          used_referral_code: string | null
          auth_uid: string | null
          onboarding_done: boolean
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
          credits?: number
          locked_credits?: number
          completed_tasks?: number | null
          avatar_url?: string | null
          joined_at?: string
          updated_at?: string
          auth_uid?: string | null
          onboarding_done?: boolean
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
          credits?: number
          locked_credits?: number
          completed_tasks?: number | null
          avatar_url?: string | null
          joined_at?: string
          updated_at?: string
          auth_uid?: string | null
          onboarding_done?: boolean
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
          min_price: number | null
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
          min_price?: number | null
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
          min_price?: number | null
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
          max_price: number | null
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
          max_price?: number | null
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
          max_price?: number | null
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
      },
      promo_banners: {
        Row: {
          id: string;
          title: string;
          text: string;
          image_url: string | null;
          link: string | null;
          color: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          text: string;
          image_url?: string | null;
          link?: string | null;
          color?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          text?: string;
          image_url?: string | null;
          link?: string | null;
          color?: string | null;
          updated_at?: string;
        };
      },
      price_proposals: {
        Row: {
          id: string
          order_id: string
          from_user_id: number
          to_user_id: number
          proposed_price: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          from_user_id: number
          to_user_id: number
          proposed_price: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          from_user_id?: number
          to_user_id?: number
          proposed_price?: number
          status?: string
          created_at?: string
        }
      },
      challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          background_url: string | null
          avatar_url: string | null
          brand_logo: string | null
          brand: string | null
          prize: string
          prize_type: 'money' | 'certificate' | 'item' | 'points'
          status: 'active' | 'finished' | 'draft'
          ends_at: string
          created_at: string
          participants_limit: number | null
          current_participants: number
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          background_url?: string | null
          avatar_url?: string | null
          brand_logo?: string | null
          brand?: string | null
          prize: string
          prize_type: 'money' | 'certificate' | 'item' | 'points'
          status?: 'active' | 'finished' | 'draft'
          ends_at: string
          created_at?: string
          participants_limit?: number | null
          current_participants?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          background_url?: string | null
          avatar_url?: string | null
          brand_logo?: string | null
          brand?: string | null
          prize?: string
          prize_type?: 'money' | 'certificate' | 'item' | 'points'
          status?: 'active' | 'finished' | 'draft'
          ends_at?: string
          created_at?: string
          participants_limit?: number | null
          current_participants?: number
        }
      },
      challenge_submissions: {
        Row: {
          id: string
          challenge_id: string
          user_id: number
          title: string
          description: string | null
          file_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: number
          title: string
          description?: string | null
          file_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: number
          title?: string
          description?: string | null
          file_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
      },
      challenge_comments: {
        Row: {
          id: string
          submission_id: string
          user_id: number
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          user_id: number
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          user_id?: number
          text?: string
          created_at?: string
        }
      },
      challenge_votes: {
        Row: {
          id: string
          submission_id: string
          voter_id: number
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          voter_id: number
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          voter_id?: number
          created_at?: string
        }
      },
      challenge_reports: {
        Row: {
          id: string
          submission_id: string
          user_id: number
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          user_id: number
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          user_id?: number
          reason?: string
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