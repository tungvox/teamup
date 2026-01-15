import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Header } from "../components/Layout";
import { useMessages } from "../context/MessageContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useLanguage } from "../context/LanguageContext";
import { settingsService } from "../services/settingsService";
import { userService } from "../services/userService";
import { User, Message } from "../types";

export const ChatDetail: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 py-3">
        <Header onBack={() => navigate(-1)} transparent />
      </div>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary">
              chat_bubble
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Coming soon...</h2>
          <p className="text-slate-400">Chat feature is under development</p>
        </div>
      </main>
    </div>
  );
};

export const NotificationSettings: React.FC = () => {
  const { notificationSettings, updateNotificationSettings } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();

  const ToggleItem = ({
    label,
    icon,
    color,
    settingKey,
  }: {
    label: string;
    icon: string;
    color: string;
    settingKey: keyof typeof notificationSettings;
  }) => {
    const active = notificationSettings[settingKey] as boolean;
    const colorClasses: Record<string, string> = {
      primary: "bg-primary-500/10 text-primary-500",
      green: "bg-green-500/10 text-green-500",
      purple: "bg-purple-500/10 text-purple-500",
      pink: "bg-pink-500/10 text-pink-500",
      blue: "bg-blue-500/10 text-blue-500",
      yellow: "bg-yellow-500/10 text-yellow-500",
    };

    return (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors lg:p-3">
      <div className="flex items-center gap-4 lg:gap-3">
          <div
            className={`w-10 h-10 rounded-lg lg:w-8 lg:h-8 lg:rounded ${
              colorClasses[color] || colorClasses.primary
            } flex items-center justify-center`}
          >
            <span className="material-symbols-outlined text-[20px] lg:text-base">
              {icon}
            </span>
        </div>
        <span className="font-medium lg:text-sm">{label}</span>
      </div>
        <button
          onClick={() => updateNotificationSettings({ [settingKey]: !active })}
          className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors lg:w-[43px] lg:h-[26px] ${
            active ? "bg-primary" : "bg-slate-700"
          } flex`}
        >
          <div
            className={`w-[27px] h-full bg-white rounded-full shadow-sm transition-transform lg:w-[22px] ${
              active ? "translate-x-5 lg:translate-x-[18px]" : ""
            }`}
          ></div>
        </button>
    </div>
  );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header title={t('settings.title')} />
      <main className="flex-1 p-4 space-y-6 w-full max-w-4xl mx-auto lg:p-6 lg:space-y-4">
        {/* Language Settings */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 lg:text-[11px] lg:mb-1.5">
            {t('settings.language')}
          </h3>
          <div className="bg-surface rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5 lg:rounded-lg">
            <button
              onClick={() => setLanguage('en')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors lg:p-3"
            >
              <div className="flex items-center gap-4 lg:gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center lg:w-8 lg:h-8 lg:rounded">
                  <span className="material-symbols-outlined text-[20px] lg:text-base">
                    language
                  </span>
                </div>
                <span className="font-medium lg:text-sm">{t('settings.language.english')}</span>
              </div>
              {language === 'en' && (
                <span className="material-symbols-outlined text-primary">
                  check_circle
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setLanguage('vi');
                if (user?.id) {
                  settingsService.saveLanguage(user.id, 'vi').catch(err => {
                    console.error('Error saving language:', err);
                  });
                }
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    language
                  </span>
                </div>
                <span className="font-medium">{t('settings.language.vietnamese')}</span>
              </div>
              {language === 'vi' && (
                <span className="material-symbols-outlined text-primary">
                  check_circle
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <span className="material-symbols-outlined">
                  notifications_paused
                </span>
              </div>
              <div>
                <p className="font-bold">{t('settings.pauseAll')}</p>
                <p className="text-xs text-slate-400">
                  {t('settings.pauseAll.desc')}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                updateNotificationSettings({
                  pauseAll: !notificationSettings.pauseAll,
                })
              }
              className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors ${
                notificationSettings.pauseAll ? "bg-primary" : "bg-slate-700"
              } flex`}
            >
              <div
                className={`w-[27px] h-full bg-white rounded-full shadow-sm transition-transform ${
                  notificationSettings.pauseAll ? "translate-x-5" : ""
                }`}
              ></div>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">
            {t('settings.matchActivity')}
          </h3>
          <div className="bg-surface rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            <ToggleItem
              label={t('settings.gameInvites')}
              icon="confirmation_number"
              color="primary"
              settingKey="gameInvites"
            />
            <ToggleItem
              label={t('settings.scoreUpdates')}
              icon="scoreboard"
              color="green"
              settingKey="scoreUpdates"
            />
            <ToggleItem
              label={t('settings.rosterChanges')}
              icon="groups"
              color="purple"
              settingKey="rosterChanges"
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">
            {t('settings.social')}
          </h3>
          <div className="bg-surface rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            <ToggleItem
              label={t('settings.friendRequests')}
              icon="person_add"
              color="pink"
              settingKey="friendRequests"
            />
            <ToggleItem
              label={t('settings.directMessages')}
              icon="chat_bubble"
              color="blue"
              settingKey="directMessages"
            />
            <ToggleItem
              label={t('settings.teamAnnouncements')}
              icon="campaign"
              color="yellow"
              settingKey="teamAnnouncements"
            />
          </div>
        </div>

        <div className="bg-surface rounded-xl p-4 flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <span className="material-symbols-outlined">bedtime</span>
            </div>
            <div>
              <p className="font-medium">{t('settings.quietHours')}</p>
              <p className="text-xs text-slate-400">10:00 PM - 07:00 AM</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400">
            chevron_right
          </span>
        </div>
      </main>
    </div>
  );
};

export const RatePlayers: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <div className="sticky top-0 z-30 flex items-center justify-between bg-background/80 backdrop-blur-md p-4 border-b border-white/5 lg:px-6 lg:py-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center lg:w-8 lg:h-8"
        >
          <span className="material-symbols-outlined lg:text-lg">arrow_back</span>
        </button>
        <h2 className="font-bold text-lg lg:text-base">Rate Players</h2>
        <button className="text-sm font-bold text-slate-400 hover:text-white lg:text-xs">
          Skip
        </button>
      </div>

      <main className="flex-1 p-4 pb-32 space-y-6 lg:p-6 lg:pb-6 lg:space-y-4">
        <div className="lg:max-w-3xl lg:mx-auto lg:w-full">
        <div className="relative h-48 rounded-xl overflow-hidden shadow-lg group">
          <img
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            alt="match"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-5 flex flex-col justify-end">
            <div className="flex justify-between items-end">
              <div>
                <span className="bg-white/20 backdrop-blur px-2 py-1 rounded-full text-xs font-medium border border-white/10 mb-2 inline-block">
                  Final Score
                </span>
                <h3 className="text-2xl font-bold">86 - 82</h3>
                <p className="text-sm text-slate-300">
                  Varsity Basketball Match
                </p>
              </div>
              <div className="text-right text-xs text-slate-300 space-y-1">
                <div className="flex items-center justify-end gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    calendar_today
                  </span>{" "}
                  Aug 24
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    location_on
                  </span>{" "}
                  Central Court
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-1 lg:text-xl lg:mb-0.5">Who was the MVP?</h2>
          <p className="text-sm text-slate-400 lg:text-xs">
            Rate your teammates to boost their reputation.
          </p>
        </div>

        <div className="space-y-4 lg:space-y-3">
          <div className="bg-surface rounded-xl p-4 border border-white/5 space-y-4 lg:rounded-lg lg:p-3 lg:space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="relative">
                  <Avatar
                    src="https://i.pravatar.cc/150?u=marcus"
                    size="w-14 h-14"
                    className="ring-2 ring-primary/20"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                    <span className="material-symbols-outlined text-primary text-sm bg-blue-900/30 rounded-full">
                      verified
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-base lg:text-sm">Marcus Johnson</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide lg:text-[11px]">
                    Point Guard
                  </p>
                </div>
              </div>
              <div className="flex gap-1 text-yellow-400">
                <span className="material-symbols-outlined text-[20px] fill-current lg:text-base">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] fill-current lg:text-base">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] fill-current lg:text-base">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] fill-current lg:text-base">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] fill-current lg:text-base">
                  star
                </span>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                <span className="material-symbols-outlined text-[16px]">
                  trophy
                </span>{" "}
                MVP
              </button>
              <button className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                Playmaker
              </button>
              <button className="bg-slate-700 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300">
                Hustle
              </button>
            </div>
            <div className="bg-background rounded-full px-3 py-2 flex items-center gap-2 text-sm text-slate-400 border border-white/5">
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>{" "}
              Great game, nice passes!
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-white/5 space-y-4 lg:rounded-lg lg:p-3 lg:space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex gap-3 lg:gap-2">
                <Avatar
                  src="https://i.pravatar.cc/150?u=sarah"
                  size="w-14 h-14 lg:w-12 lg:h-12"
                />
                <div>
                  <p className="font-bold text-base lg:text-sm">Sarah Williams</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide lg:text-[11px]">
                    Center
                  </p>
                </div>
              </div>
              <div className="flex gap-1 text-slate-600">
                <span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current lg:text-base">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current lg:text-base">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current lg:text-base">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current lg:text-base">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] lg:text-base">
                  star
                </span>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button className="flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                <span className="material-symbols-outlined text-[16px]">
                  handshake
                </span>{" "}
                Good Sport
              </button>
              <button className="bg-slate-700 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300">
                Defense
              </button>
              <button className="bg-slate-700 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300">
                Rebounds
              </button>
            </div>
          </div>
        </div>
        </div>
      </main>

      <div className="fixed bottom-0 w-full p-4 bg-gradient-to-t from-background via-background/90 to-transparent pb-8 lg:relative lg:pb-4 lg:pt-4">
        <div className="lg:max-w-3xl lg:mx-auto lg:w-full">
        <button className="w-full h-14 bg-primary rounded-full font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all lg:h-12 lg:text-base lg:rounded-xl">
          Submit Ratings{" "}
          <span className="material-symbols-outlined lg:text-lg">check_circle</span>
        </button>
        </div>
      </div>
    </div>
  );
};
