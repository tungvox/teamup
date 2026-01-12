import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NotificationSettings } from '../types';
import { settingsService } from '../services/settingsService';

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
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    const saved = settingsService.getNotificationSettings();
    if (saved) {
      setNotificationSettings(saved);
    }
  }, []);

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    const updated = { ...notificationSettings, ...settings };
    setNotificationSettings(updated);
    settingsService.saveNotificationSettings(updated);
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

