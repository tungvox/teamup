import { NotificationSettings } from '../types';
import { Language } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const SETTINGS_KEY = 'teamup_notification_settings';
const LANGUAGE_KEY = 'teamup_language';
const SPORT_FILTER_KEY = 'teamup_sport_filter';
const THEME_KEY = 'teamup_theme';
const FRIENDS_EVENTS_ONLY_KEY = 'teamup_friends_events_only';

export type Theme = 'dark' | 'light';
export type ThemeMode = 'dark' | 'light' | 'auto';

export const settingsService = {
  async getNotificationSettings(clerkId: string): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('notification_settings')
        .eq('clerk_id', clerkId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, return null
          return null;
        }
        logger.error('Error fetching notification settings:', error);
        // Fallback to localStorage
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? JSON.parse(data) : null;
      }

      return data?.notification_settings as NotificationSettings || null;
    } catch (err) {
      logger.error('Error in getNotificationSettings:', err);
      // Fallback to localStorage
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    }
  },

  async saveNotificationSettings(clerkId: string, settings: NotificationSettings): Promise<void> {
    try {
      // Try to update existing settings
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ notification_settings: settings })
        .eq('clerk_id', clerkId);

      if (updateError) {
        // If update fails, try to insert
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            clerk_id: clerkId,
            notification_settings: settings,
          });

        if (insertError) {
          logger.error('Error saving notification settings:', insertError);
        }
      }

      // Also save to localStorage as backup
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      logger.error('Error in saveNotificationSettings:', err);
      // Fallback to localStorage
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  },

  async getLanguage(clerkId: string): Promise<Language> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('language')
        .eq('clerk_id', clerkId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, check localStorage
          const saved = localStorage.getItem(LANGUAGE_KEY);
          if (saved === 'en' || saved === 'vi') {
            return saved;
          }
          return 'vi'; // Default to Vietnamese
        }
        logger.error('Error fetching language:', error);
      }

      if (data?.language && (data.language === 'en' || data.language === 'vi')) {
        return data.language;
      }

      // Fallback to localStorage
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved === 'en' || saved === 'vi') {
        return saved;
      }
      return 'vi'; // Default to Vietnamese
    } catch (err) {
      logger.error('Error in getLanguage:', err);
      // Fallback to localStorage
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved === 'en' || saved === 'vi') {
        return saved;
      }
      return 'vi'; // Default to Vietnamese
    }
  },

  async saveLanguage(clerkId: string, language: Language): Promise<void> {
    try {
      // Try to update existing settings
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ language })
        .eq('clerk_id', clerkId);

      if (updateError) {
        // If update fails, try to insert
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            clerk_id: clerkId,
            language,
          });

        if (insertError) {
          logger.error('Error saving language:', insertError);
        }
      }

      // Also save to localStorage as backup
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch (err) {
      logger.error('Error in saveLanguage:', err);
      // Fallback to localStorage
      localStorage.setItem(LANGUAGE_KEY, language);
    }
  },

  async getSportFilter(clerkId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('sport_filter')
        .eq('clerk_id', clerkId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const saved = localStorage.getItem(SPORT_FILTER_KEY);
          return saved ?? '';
        }
        logger.error('Error fetching sport filter:', error);
      }

      if (data?.sport_filter != null) {
        return data.sport_filter;
      }

      const saved = localStorage.getItem(SPORT_FILTER_KEY);
      return saved ?? '';
    } catch (err) {
      logger.error('Error in getSportFilter:', err);
      const saved = localStorage.getItem(SPORT_FILTER_KEY);
      return saved ?? '';
    }
  },

  async saveSportFilter(clerkId: string, sportFilter: string): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ sport_filter: sportFilter })
        .eq('clerk_id', clerkId);

      if (updateError) {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            clerk_id: clerkId,
            sport_filter: sportFilter,
          });

        if (insertError) {
          logger.error('Error saving sport filter:', insertError);
        }
      }

      localStorage.setItem(SPORT_FILTER_KEY, sportFilter);
    } catch (err) {
      logger.error('Error in saveSportFilter:', err);
      localStorage.setItem(SPORT_FILTER_KEY, sportFilter);
    }
  },

  async getTheme(clerkId: string): Promise<ThemeMode> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('clerk_id', clerkId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const saved = localStorage.getItem(THEME_KEY);
          if (saved === 'dark' || saved === 'light' || saved === 'auto') return saved as ThemeMode;
          return 'dark';
        }
        logger.error('Error fetching theme:', error);
      }

      if (data?.theme === 'dark' || data?.theme === 'light' || data?.theme === 'auto') {
        return data.theme as ThemeMode;
      }

      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'auto') return saved as ThemeMode;
      return 'dark';
    } catch (err) {
      logger.error('Error in getTheme:', err);
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'auto') return saved as ThemeMode;
      return 'dark';
    }
  },

  async saveTheme(clerkId: string, theme: ThemeMode): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ theme })
        .eq('clerk_id', clerkId);

      if (updateError) {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            clerk_id: clerkId,
            theme,
          });

        if (insertError) {
          logger.error('Error saving theme:', insertError);
        }
      }

      localStorage.setItem(THEME_KEY, theme);
    } catch (err) {
      logger.error('Error in saveTheme:', err);
      localStorage.setItem(THEME_KEY, theme);
    }
  },

  async getFriendsEventsOnly(clerkId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('friends_events_only')
        .eq('clerk_id', clerkId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const saved = localStorage.getItem(FRIENDS_EVENTS_ONLY_KEY);
          return saved === 'true';
        }
        logger.error('Error fetching friends_events_only:', error);
      }

      if (typeof data?.friends_events_only === 'boolean') {
        return data.friends_events_only;
      }

      const saved = localStorage.getItem(FRIENDS_EVENTS_ONLY_KEY);
      return saved === 'true';
    } catch (err) {
      logger.error('Error in getFriendsEventsOnly:', err);
      const saved = localStorage.getItem(FRIENDS_EVENTS_ONLY_KEY);
      return saved === 'true';
    }
  },

  async saveFriendsEventsOnly(clerkId: string, value: boolean): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ friends_events_only: value })
        .eq('clerk_id', clerkId);

      if (updateError) {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            clerk_id: clerkId,
            friends_events_only: value,
          });

        if (insertError) {
          logger.error('Error saving friends_events_only:', insertError);
        }
      }

      localStorage.setItem(FRIENDS_EVENTS_ONLY_KEY, String(value));
    } catch (err) {
      logger.error('Error in saveFriendsEventsOnly:', err);
      localStorage.setItem(FRIENDS_EVENTS_ONLY_KEY, String(value));
    }
  },
};

