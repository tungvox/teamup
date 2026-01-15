import { NotificationSettings } from '../types';
import { Language } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const SETTINGS_KEY = 'teamup_notification_settings';
const LANGUAGE_KEY = 'teamup_language';

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
};

