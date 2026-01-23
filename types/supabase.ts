// Supabase database types
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
// Or use the Supabase dashboard to generate types

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
      events: {
        Row: {
          id: string
          code: string
          title: string
          sport: string
          description: string | null
          date: string
          time: string
          end_time: string | null
          location: string
          location_details: string | null
          organizer_id: string
          organizer_name: string
          max_players: number
          current_players: number
          players: string[]
          price: number | null
          skill_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All'
          competitive: boolean
          image: string | null
          status: 'open' | 'full' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at' | 'current_players'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          sender_name: string
          sender_avatar: string | null
          content: string
          timestamp: string
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      chats: {
        Row: {
          id: string
          participants: string[]
          last_message_id: string | null
          unread_count: number
          updated_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chats']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['chats']['Insert']>
      }
      ratings: {
        Row: {
          id: string
          event_id: string
          rater_id: string
          rated_user_id: string
          stars: number
          tags: string[]
          comment: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ratings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>
      }
      user_profiles: {
        Row: {
          id: string
          clerk_id: string
          email: string
          first_name: string
          last_name: string
          avatar: string | null
          location: string | null
          sports: string[]
          stats: Json
          level: number
          user_id: string | null
          friends: string[]
          friend_requests: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          first_name: string
          last_name: string
          avatar?: string | null
          location?: string | null
          sports: string[]
          stats: Json
          level?: number
          user_id?: string | null
          friends?: string[]
          friend_requests?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      event_requests: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'pending' | 'approved' | 'denied' | 'invited'
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['event_requests']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_event: {
        Args: {
          p_code: string
          p_title: string
          p_sport: string
          p_description: string | null
          p_date: string
          p_time: string
          p_end_time: string | null
          p_location: string
          p_location_details: string | null
          p_organizer_id: string
          p_organizer_name: string
          p_max_players: number
          p_price: number | null
          p_skill_level: string
          p_competitive: boolean
          p_image: string | null
        }
        Returns: any
      }
      approve_player_request: {
        Args: {
          p_event_id: string
          p_user_id: string
        }
        Returns: any
      }
      get_user_pending_request: {
        Args: {
          p_event_id: string
          p_user_id: string
        }
        Returns: any
      }
      invite_friend_to_event: {
        Args: {
          p_event_id: string
          p_friend_id: string
          p_organizer_id: string
        }
        Returns: any
      }
      get_user_invitations: {
        Args: { p_user_id: string }
        Returns: any
      }
      deny_invitation: {
        Args: {
          p_event_id: string
          p_user_id: string
        }
        Returns: any
      }
      create_user_profile: {
        Args: {
          p_clerk_id: string
          p_email: string
          p_user_id: string
          p_first_name: string
          p_last_name: string
          p_avatar: string | null
          p_location: string | null
          p_sports: string[]
        }
        Returns: any
      }
      update_user_profile: {
        Args: {
          p_clerk_id: string
          p_updates: any
        }
        Returns: any
      }
      send_friend_request: {
        Args: {
          p_from_user_id: string
          p_to_user_id: string
        }
        Returns: any
      }
      accept_friend_request: {
        Args: {
          p_user_id: string
          p_friend_id: string
        }
        Returns: any
      }
      remove_friend: {
        Args: {
          p_user_id: string
          p_friend_id: string
        }
        Returns: any
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

