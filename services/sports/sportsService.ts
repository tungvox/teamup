import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

export type Sport = {
  id: string;
  name: string;
  name_vi?: string | null;
  icon: string;
};

export const sportsService = {
  async getAllSports(): Promise<Sport[]> {
    const { data, error } = await supabase
      .from('sports')
      .select('id, name, name_vi, icon')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Error fetching sports:', error);
      return [
        { id: '1', name: 'Tennis', icon: 'sports_tennis' },
        { id: '2', name: 'Pickleball', icon: 'sports_tennis' },
        { id: '3', name: 'Badminton', icon: 'sports_tennis' },
      ];
    }

    return data || [];
  },
};
