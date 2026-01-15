import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

export const sportsService = {
  async getAllSports(): Promise<Array<{ id: string; name: string; icon: string }>> {
    const { data, error } = await supabase
      .from('sports')
      .select('id, name, icon')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      logger.error('Error fetching sports:', error);
      // Return default sports if database query fails
      return [
        { id: '1', name: 'Tennis', icon: 'sports_tennis' },
        { id: '2', name: 'Pickleball', icon: 'sports_tennis' },
        { id: '3', name: 'Badminton', icon: 'sports_tennis' },
      ];
    }
    
    return data || [];
  },
};
