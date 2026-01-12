import { NotificationSettings } from '../types';

const SETTINGS_KEY = 'teamup_notification_settings';

export const settingsService = {
  getNotificationSettings(): NotificationSettings | null {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveNotificationSettings(settings: NotificationSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
};

