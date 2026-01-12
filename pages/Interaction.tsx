import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Header } from "../components/Layout";
import { useMessages } from "../context/MessageContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { userService } from "../services/userService";
import { User, Message } from "../types";

export const ChatDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getChat, getMessages, sendMessage, markAsRead } = useMessages();
  const [messageContent, setMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = id ? getChat(id) : undefined;
  const [messages, setMessages] = useState<Message[]>([]);
  const otherParticipantId = chat?.participants.find((p) => p !== user?.id);

  useEffect(() => {
    if (id) {
      getMessages(id).then(setMessages);
    }
  }, [id, getMessages]);

  const [otherUser, setOtherUser] = useState<User | null>(null);

  useEffect(() => {
    if (otherParticipantId) {
      userService.getUser(otherParticipantId).then(setOtherUser);
    }
  }, [otherParticipantId]);

  useEffect(() => {
    if (id && user) {
      markAsRead(id);
    }
  }, [id, user, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!id || !messageContent.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(id, messageContent.trim());
      setMessageContent("");
    } catch (err) {
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 py-3">
        <Header onBack={() => navigate(-1)} transparent />
        {otherUser && (
        <div className="flex flex-col items-center">
          <div className="relative">
              <Avatar
                src={
                  otherUser.avatar ||
                  `https://i.pravatar.cc/150?u=${otherUser.id}`
                }
                size="w-10 h-10"
              />
          </div>
          <div className="flex items-center gap-1 mt-1">
              <h2 className="font-bold text-sm">
                {otherUser.firstName} {otherUser.lastName}
              </h2>
          </div>
        </div>
        )}
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
          <span className="material-symbols-outlined">info</span>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === user?.id;
            const [sender, setSender] = useState<User | null>(null);

            useEffect(() => {
              userService.getUser(msg.senderId).then(setSender);
            }, [msg.senderId]);

            return (
              <div
                key={msg.id}
                className={`flex gap-2 items-end ${
                  isOwn ? "flex-row-reverse" : ""
                }`}
              >
                {!isOwn && (
                  <Avatar
                    src={
                      sender?.avatar ||
                      `https://i.pravatar.cc/150?u=${msg.senderId}`
                    }
                    size="w-8 h-8"
                  />
                )}
                <div
                  className={`flex flex-col gap-1 ${
                    isOwn ? "items-end" : ""
                  } max-w-[75%]`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      isOwn
                        ? "bg-primary text-white rounded-br-none shadow-lg shadow-primary/20"
                        : "bg-surface rounded-bl-none"
                    }`}
                  >
                    {msg.content}
          </div>
                  <div
                    className={`flex items-center gap-1 ${
                      isOwn ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span className="text-[10px] text-slate-500">
                      {formatTime(msg.timestamp)}
                    </span>
                    {isOwn && msg.read && (
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        done_all
                      </span>
                    )}
          </div>
        </div>
          </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="p-4 bg-background/95 backdrop-blur border-t border-white/5 flex gap-3 items-end">
        <button className="h-10 w-10 rounded-full text-slate-400 hover:bg-white/5 flex items-center justify-center">
          <span className="material-symbols-outlined">add_circle</span>
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Type a message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="w-full bg-surface rounded-full h-10 pl-4 pr-10 outline-none focus:ring-1 focus:ring-primary/50 text-sm text-white"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!messageContent.trim() || isSending}
          className="h-10 w-10 rounded-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-primary/30 flex items-center justify-center transform active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px] ml-0.5">
            send
          </span>
        </button>
      </div>
    </div>
  );
};

export const NotificationSettings: React.FC = () => {
  const { notificationSettings, updateNotificationSettings } = useSettings();

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
    <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-lg ${
              colorClasses[color] || colorClasses.primary
            } flex items-center justify-center`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {icon}
            </span>
        </div>
        <span className="font-medium">{label}</span>
      </div>
        <button
          onClick={() => updateNotificationSettings({ [settingKey]: !active })}
          className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors ${
            active ? "bg-primary" : "bg-slate-700"
          } flex`}
        >
          <div
            className={`w-[27px] h-full bg-white rounded-full shadow-sm transition-transform ${
              active ? "translate-x-5" : ""
            }`}
          ></div>
        </button>
    </div>
  );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header title="Notification Settings" />
      <main className="flex-1 p-4 space-y-6 w-full max-w-4xl mx-auto">
        <div className="bg-surface rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <span className="material-symbols-outlined">
                  notifications_paused
                </span>
              </div>
              <div>
                <p className="font-bold">Pause All</p>
                <p className="text-xs text-slate-400">
                  Mute all notifications for 24h
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
            Match & Event Activity
          </h3>
          <div className="bg-surface rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            <ToggleItem
              label="New Game Invites"
              icon="confirmation_number"
              color="primary"
              settingKey="gameInvites"
            />
            <ToggleItem
              label="Score Updates"
              icon="scoreboard"
              color="green"
              settingKey="scoreUpdates"
            />
            <ToggleItem
              label="Roster Changes"
              icon="groups"
              color="purple"
              settingKey="rosterChanges"
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">
            Social
          </h3>
          <div className="bg-surface rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            <ToggleItem
              label="Friend Requests"
              icon="person_add"
              color="pink"
              settingKey="friendRequests"
            />
            <ToggleItem
              label="Direct Messages"
              icon="chat_bubble"
              color="blue"
              settingKey="directMessages"
            />
            <ToggleItem
              label="Team Announcements"
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
              <p className="font-medium">Quiet Hours</p>
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
      <div className="sticky top-0 z-30 flex items-center justify-between bg-background/80 backdrop-blur-md p-4 border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-bold text-lg">Rate Players</h2>
        <button className="text-sm font-bold text-slate-400 hover:text-white">
          Skip
        </button>
      </div>

      <main className="flex-1 p-4 pb-32 space-y-6">
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
          <h2 className="text-2xl font-bold mb-1">Who was the MVP?</h2>
          <p className="text-sm text-slate-400">
            Rate your teammates to boost their reputation.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-surface rounded-xl p-4 border border-white/5 space-y-4">
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
                  <p className="font-bold text-base">Marcus Johnson</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Point Guard
                  </p>
                </div>
              </div>
              <div className="flex gap-1 text-yellow-400">
                <span className="material-symbols-outlined text-[20px] fill-current">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] fill-current">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] fill-current">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] fill-current">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] fill-current">
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

          <div className="bg-surface rounded-xl p-4 border border-white/5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <Avatar
                  src="https://i.pravatar.cc/150?u=sarah"
                  size="w-14 h-14"
                />
                <div>
                  <p className="font-bold text-base">Sarah Williams</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Center
                  </p>
                </div>
              </div>
              <div className="flex gap-1 text-slate-600">
                <span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current">
                  star
                </span>
                <span className="material-symbols-outlined text-[20px]">
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
      </main>

      <div className="fixed bottom-0 w-full p-4 bg-gradient-to-t from-background via-background/90 to-transparent pb-8">
        <button className="w-full h-14 bg-primary rounded-full font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          Submit Ratings{" "}
          <span className="material-symbols-outlined">check_circle</span>
        </button>
      </div>
    </div>
  );
};
