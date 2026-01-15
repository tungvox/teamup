import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NotificationSettings } from '../types';
import { settingsService } from '../services/settingsService';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: NotificationSettings = {
  gameInvites: true,
  scoreUpdates: true,
  rosterChanges: false,
  friendRequests: true,
  directMessages: true,
  teamAnnouncements: true,
  pauseAll: false,
  quietHours: { enabled: false, start: '22:00', end: '07:00' },
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (user?.id) {
        try {
          const saved = await settingsService.getNotificationSettings(user.id);
          if (saved) {
            setNotificationSettings(saved);
          }
        } catch (err) {
          console.error('Error loading notification settings:', err);
          // Fallback to localStorage
          const data = localStorage.getItem('teamup_notification_settings');
          if (data) {
            try {
              setNotificationSettings(JSON.parse(data));
            } catch (e) {
              console.error('Error parsing localStorage settings:', e);
            }
          }
        }
      } else {
        // Fallback to localStorage if no user
        const data = localStorage.getItem('teamup_notification_settings');
        if (data) {
          try {
            setNotificationSettings(JSON.parse(data));
          } catch (e) {
            console.error('Error parsing localStorage settings:', e);
          }
        }
      }
      setIsLoading(false);
    };

    loadSettings();
  }, [user?.id]);

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    const updated = { ...notificationSettings, ...settings };
    setNotificationSettings(updated);
    
    if (user?.id) {
      settingsService.saveNotificationSettings(user.id, updated).catch(err => {
        console.error('Error saving notification settings:', err);
      });
    } else {
      // Fallback to localStorage
      localStorage.setItem('teamup_notification_settings', JSON.stringify(updated));
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        notificationSettings,
        updateNotificationSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

