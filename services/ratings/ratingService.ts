import { supabase } from '../../lib/supabase';
import { Rating } from '../../types';

export const ratingService = {
  async submitRatings(ratings: Omit<Rating, 'id' | 'createdAt'>[]): Promise<void> {
    const { error } = await supabase
      .from('ratings')
      .insert(ratings.map(r => ({
        event_id: r.eventId,
        rater_id: r.raterId,
        rated_user_id: r.ratedUserId,
        stars: r.stars,
        tags: r.tags,
        comment: r.comment || null,
      })));
    
    if (error) throw error;
  },
};
