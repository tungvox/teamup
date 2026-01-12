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
          stats: {
            matches: number
            reliability: number
            mvps: number
          }
          level: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
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
  }
}

