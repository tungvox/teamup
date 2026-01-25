import { supabase } from '../../lib/supabase';
import { Rating } from '../../types';

// Helper functions to convert between skill levels and numbers
const skillLevelToNumber = (skill: number | string | undefined): number | null => {
  if (!skill) return null;
  if (typeof skill === 'number') return skill;
  switch (skill) {
    case 'newbie': return 1;
    case 'intermediate': return 3;
    case 'advanced': return 5;
    default: return null;
  }
};

const numberToSkillLevel = (skill: number | string | null | undefined): number | string | null => {
  if (skill === null || skill === undefined) return null;
  if (typeof skill === 'string') return skill; // Already a skill level string
  if (typeof skill === 'number') {
    // Convert number back to skill level for consistency
    if (skill <= 2) return 'newbie';
    if (skill >= 4) return 'advanced';
    return 'intermediate';
  }
  return null;
};

// Helper functions to convert between satisfaction levels and numbers
const satisfactionLevelToNumber = (satisfaction: number | string | undefined): number | null => {
  if (!satisfaction) return null;
  if (typeof satisfaction === 'number') return satisfaction;
  switch (satisfaction) {
    case 'bad': return 1;
    case 'ok': return 3;
    case 'great': return 5;
    default: return null;
  }
};

const numberToSatisfactionLevel = (satisfaction: number | string | null | undefined): number | string | null => {
  if (satisfaction === null || satisfaction === undefined) return null;
  if (typeof satisfaction === 'string') return satisfaction; // Already a satisfaction level string
  if (typeof satisfaction === 'number') {
    // Convert number back to satisfaction level for consistency
    if (satisfaction <= 2) return 'bad';
    if (satisfaction >= 4) return 'great';
    return 'ok';
  }
  return null;
};

export const ratingService = {
  async submitRatings(ratings: Omit<Rating, 'id' | 'createdAt'>[]): Promise<void> {
    // Try using RPC function first (bypasses RLS)
    const ratingsData = ratings.map(r => ({
      event_id: r.eventId,
      rater_id: r.raterId,
      rated_user_id: r.ratedUserId,
      stars: r.stars,
      skill: skillLevelToNumber(r.skill),
      satisfaction: satisfactionLevelToNumber(r.satisfaction),
      tags: r.tags || [],
      comment: r.comment || null,
    }));

    const { error: rpcError } = await supabase.rpc('submit_ratings', {
      p_ratings: ratingsData,
    } as any);

    if (!rpcError) {
      return; // Success via RPC
    }

    // Fallback to direct insert if RPC function doesn't exist
    console.warn('RPC function not available, using direct insert. Error:', rpcError);
    const { error } = await supabase
      .from('ratings')
      .insert(ratingsData);
    
    if (error) {
      console.error('Error submitting ratings:', error);
      throw error;
    }
  },

  async getEventRatings(eventId: string): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('event_id', eventId);
    
    if (error) throw error;
    
    return (data || []).map((r: any) => ({
      id: r.id,
      eventId: r.event_id,
      raterId: r.rater_id,
      ratedUserId: r.rated_user_id,
      stars: r.stars,
      skill: numberToSkillLevel(r.skill),
      satisfaction: numberToSatisfactionLevel(r.satisfaction),
      tags: r.tags || [],
      comment: r.comment,
      createdAt: r.created_at,
    }));
  },

  async getUserRatingsForEvent(eventId: string, userId: string): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('event_id', eventId)
      .eq('rater_id', userId);
    
    if (error) throw error;
    
    return (data || []).map((r: any) => ({
      id: r.id,
      eventId: r.event_id,
      raterId: r.rater_id,
      ratedUserId: r.rated_user_id,
      stars: r.stars,
      skill: numberToSkillLevel(r.skill),
      satisfaction: numberToSatisfactionLevel(r.satisfaction),
      tags: r.tags || [],
      comment: r.comment,
      createdAt: r.created_at,
    }));
  },

  async getUserRatings(userId: string): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('rated_user_id', userId);
    
    if (error) throw error;
    
    return (data || []).map((r: any) => ({
      id: r.id,
      eventId: r.event_id,
      raterId: r.rater_id,
      ratedUserId: r.rated_user_id,
      stars: r.stars,
      skill: numberToSkillLevel(r.skill),
      satisfaction: numberToSatisfactionLevel(r.satisfaction),
      tags: r.tags || [],
      comment: r.comment,
      createdAt: r.created_at,
    }));
  },
};
