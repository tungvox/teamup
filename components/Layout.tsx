import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEvents } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { logger } from "../utils/logger";
import { supabase } from "../lib/supabase";

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUserInvitations, getEvent, getEventRequests, events } =
    useEvents();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [invitationCount, setInvitationCount] = useState(0);
  const [otherRequestsCount, setOtherRequestsCount] = useState(0);
  const friendRequestCount = user?.friendRequests?.length || 0;

  const isActive = (path: string) => location.pathname === path;

  // Load invitation count
  useEffect(() => {
    if (!user) {
      setInvitationCount(0);
      return;
    }

    const loadInvitations = async () => {
      try {
        const invitations = await getUserInvitations();
        // Only count invitations where the user has NOT already joined the event
        const count =
          invitations?.filter((inv) => {
            if (!user) return false;
            const event = getEvent(inv.eventId);
            return !event || !event.players.includes(user.id);
          }).length || 0;
        setInvitationCount(count);
      } catch (error: any) {
        logger.error("Error loading invitations:", error);
        // Don't show error to user, just set count to 0
        setInvitationCount(0);
      }
    };

    loadInvitations();

    // Set up real-time subscription for invitations
    // Note: We subscribe to all changes and filter in the callback to avoid binding mismatch errors
    let channel: any = null;
    const setupRealtime = async () => {
      try {
        const { supabase } = await import("../lib/supabase");
        const userId = user.id; // Capture user.id in closure

        channel = supabase
          .channel(`user_invitations:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "event_requests",
            },
            async (payload) => {
              logger.debug("Real-time invitation change received");

              const newRecord = payload.new as any;
              const oldRecord = payload.old as any;

              // Filter in callback to avoid binding mismatch
              const isRelevant =
                (newRecord && newRecord.user_id === userId) ||
                (oldRecord && oldRecord.user_id === userId);

              if (!isRelevant) {
                return;
              }

              // Check if this is an invitation-related change
              // For INSERT: new record with status 'invited'
              // For UPDATE: status changed to/from 'invited'
              // For DELETE: old record had status 'invited'
              const isNewInvitation =
                newRecord &&
                newRecord.status === "invited" &&
                newRecord.user_id === userId;
              const wasInvitation =
                oldRecord &&
                oldRecord.status === "invited" &&
                oldRecord.user_id === userId;
              const isInvitationChange = isNewInvitation || wasInvitation;

              if (isInvitationChange) {
                // Reload invitations to get updated count
                try {
                  const invitations = await getUserInvitations();
                  const count =
                    invitations?.filter((inv) => {
                      if (!user) return false;
                      const event = getEvent(inv.eventId);
                      return !event || !event.players.includes(user.id);
                    }).length || 0;
                  setInvitationCount(count);
                } catch (error: any) {
                  logger.error(
                    "Error reloading invitations in real-time callback:",
                    error,
                  );
                }
              }
            },
          )
          .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              logger.log("Real-time subscription active for invitations");
            } else if (status === "CHANNEL_ERROR") {
              logger.warn("Real-time subscription error for invitations:", err);
              logger.warn(
                "Make sure Realtime is enabled for event_requests table in Supabase Dashboard > Database > Replication",
              );
              // Disable real-time subscription on error to prevent constant errors
              if (channel) {
                import("../lib/supabase").then(({ supabase }) => {
                  supabase.removeChannel(channel);
                });
              }
            } else if (status === "TIMED_OUT") {
              logger.warn("Real-time subscription timed out for invitations");
            }
          });
      } catch (error) {
        logger.error("Error setting up real-time subscription:", error);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        import("../lib/supabase")
          .then(({ supabase }) => {
            supabase.removeChannel(channel);
          })
          .catch((err) => {
            logger.error("Error removing channel:", err);
          });
      }
    };
    // Include getUserInvitations in dependencies to ensure we have the latest function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, getUserInvitations]);

  // Load requests from other people (requests to join events the user created)
  useEffect(() => {
    if (!user) {
      setOtherRequestsCount(0);
      return;
    }

    const loadOtherRequests = async () => {
      try {
        const userCreatedEvents = events.filter(
          (e) => e.organizerId === user.id,
        );
        let totalRequests = 0;

        for (const event of userCreatedEvents) {
          try {
            const requests = await getEventRequests(event.id);
            const pendingRequests = requests.filter(
              (r) => r.status === "pending",
            );
            totalRequests += pendingRequests.length;
          } catch (error) {
            logger.error(
              `Error loading requests for event ${event.id}:`,
              error,
            );
          }
        }

        setOtherRequestsCount(totalRequests);
      } catch (error: any) {
        logger.error("Error loading other requests:", error);
        setOtherRequestsCount(0);
      }
    };

    loadOtherRequests();

    // Set up real-time subscription for requests to user's events
    let channel: any = null;
    const setupRealtime = async () => {
      try {
        const { supabase } = await import("../lib/supabase");
        const userId = user.id;

        channel = supabase
          .channel(`user_event_requests:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "event_requests",
            },
            async (payload) => {
              logger.debug("Real-time request change received");

              const newRecord = payload.new as any;
              const oldRecord = payload.old as any;

              // Check if this request is for an event the user created
              const eventId = newRecord?.event_id || oldRecord?.event_id;
              if (!eventId) return;

              const event = getEvent(eventId);
              if (!event || event.organizerId !== userId) return;

              // Reload requests count
              try {
                const userCreatedEvents = events.filter(
                  (e) => e.organizerId === userId,
                );
                let totalRequests = 0;

                for (const evt of userCreatedEvents) {
                  try {
                    const requests = await getEventRequests(evt.id);
                    const pendingRequests = requests.filter(
                      (r) => r.status === "pending",
                    );
                    totalRequests += pendingRequests.length;
                  } catch (error) {
                    logger.error(
                      `Error loading requests for event ${evt.id}:`,
                      error,
                    );
                  }
                }

                setOtherRequestsCount(totalRequests);
              } catch (error: any) {
                logger.error(
                  "Error reloading requests in real-time callback:",
                  error,
                );
              }
            },
          )
          .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
              logger.log("Real-time subscription active for event requests");
            } else if (status === "CHANNEL_ERROR") {
              logger.warn(
                "Real-time subscription error for event requests:",
                err,
              );
            } else if (status === "TIMED_OUT") {
              logger.warn(
                "Real-time subscription timed out for event requests",
              );
            }
          });
      } catch (error) {
        logger.error(
          "Error setting up real-time subscription for requests:",
          error,
        );
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        import("../lib/supabase")
          .then(({ supabase }) => {
            supabase.removeChannel(channel);
          })
          .catch((err) => {
            logger.error("Error removing channel:", err);
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, events, getEventRequests]);

  const NavItem = ({
    path,
    icon,
    label,
    showNotification = false,
    notificationCount = 0,
    showLabel = true,
  }: {
    path: string;
    icon: string;
    label: string;
    showNotification?: boolean;
    notificationCount?: number;
    showLabel?: boolean;
  }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-1 rounded-xl lg:w-full lg:min-w-0 lg:py-2 lg:px-3 lg:rounded-lg group transition-all duration-200 relative ${
        isActive(path)
          ? "text-primary"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      }`}
      title={label}
    >
      <span className="relative flex items-center justify-center">
        <span
          className={`material-symbols-outlined text-[24px] lg:text-[22px] transition-transform group-active:scale-95 ${
            isActive(path) ? "font-variation-settings-fill" : ""
          }`}
        >
          {icon}
        </span>
        {showNotification && notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-danger rounded-full border-2 border-surface flex items-center justify-center lg:min-w-[14px] lg:h-[14px] lg:-top-0.5 lg:-right-0.5">
            <span className="text-[10px] font-bold text-white leading-none lg:text-[8px]">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          </span>
        )}
      </span>
      {showLabel && (
        <span className="text-[11px] font-medium truncate max-w-full lg:text-xs lg:whitespace-normal lg:text-center lg:leading-tight">
          {label}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile: full-width bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 w-full">
        <div className="w-full rounded-t-2xl bg-surface/98 backdrop-blur-xl border-t border-x-0 border-b-0 border-white/10 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.3)] pt-3 px-2 pb-safe">
          <div className="flex justify-around items-stretch gap-1">
            <NavItem path="/home" icon="home" label={t("nav.home")} showLabel={false} />
            <NavItem
              path="/my-games"
              icon="sports_score"
              label={t("nav.myGames")}
              showNotification={invitationCount > 0 || otherRequestsCount > 0}
              notificationCount={invitationCount + otherRequestsCount}
              showLabel={false}
            />
            <button
              onClick={() => navigate("/event/create")}
              className="flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-1 rounded-xl transition-all duration-200 active:scale-95 relative -top-1"
              aria-label={t("events.create")}
              title={t("events.create")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/40 ring-2 ring-primary/30">
                <span className="material-symbols-outlined text-[26px] font-variation-settings-fill">
                  add
                </span>
              </span>
            </button>
            <NavItem
              path="/messages"
              icon="chat_bubble"
              label={t("nav.messages")}
              showLabel={false}
            />
            <NavItem
              path="/profile"
              icon="person"
              label={t("nav.profile")}
              showNotification={friendRequestCount > 0}
              notificationCount={friendRequestCount}
              showLabel={false}
            />
          </div>
        </div>
      </nav>
      {/* Desktop: fixed left sidebar, full height */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 w-20 flex-col items-center py-4 gap-2 bg-surface/95 backdrop-blur-xl border-r border-white/10">
        <NavItem path="/home" icon="home" label={t("nav.home")} />
        <NavItem
          path="/my-games"
          icon="sports_score"
          label={t("nav.myGames")}
          showNotification={invitationCount > 0 || otherRequestsCount > 0}
          notificationCount={invitationCount + otherRequestsCount}
        />
        <button
          onClick={() => navigate("/event/create")}
          className="flex flex-col items-center justify-center gap-1 w-full py-2 px-2 rounded-lg transition-all duration-200 hover:bg-white/5 active:scale-95 group"
          aria-label={t("events.create")}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md group-hover:bg-primary-hover">
            <span className="material-symbols-outlined text-[22px] font-variation-settings-fill">
              add
            </span>
          </span>
          <span className="text-xs font-medium text-slate-400 text-center leading-tight whitespace-normal">
            {t("events.create")}
          </span>
        </button>
        <NavItem
          path="/messages"
          icon="chat_bubble"
          label={t("nav.messages")}
        />
        <NavItem
          path="/profile"
          icon="person"
          label={t("nav.profile")}
          showNotification={friendRequestCount > 0}
          notificationCount={friendRequestCount}
        />
      </nav>
    </>
  );
};

export const Header: React.FC<{
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}> = ({ title, onBack, rightAction, transparent = false }) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <header
      className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 ${transparent ? "bg-transparent" : "bg-background/80 backdrop-blur-md border-b border-white/5"}`}
    >
      <button
        onClick={handleBack}
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
      >
        <span className="material-symbols-outlined text-[24px]">
          arrow_back
        </span>
      </button>
      {title && (
        <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>
      )}
      <div className="flex items-center justify-end w-10">{rightAction}</div>
    </header>
  );
};

// Cache signed avatar URLs by storage path so the same image doesn't reload when
// switching tabs (Avatar remounts with the same path get the same URL from cache).
const AVATAR_SIGNED_URL_CACHE = new Map<
  string,
  { url: string; expiresAt: number }
>();
const CACHE_VALIDITY_MS = 55 * 60 * 1000; // 55 min (refresh before 1h expiry)

function getCachedSignedUrl(path: string): string | null {
  const entry = AVATAR_SIGNED_URL_CACHE.get(path);
  if (!entry || Date.now() >= entry.expiresAt) return null;
  return entry.url;
}

function setCachedSignedUrl(
  path: string,
  url: string,
  expiresInSeconds: number,
): void {
  AVATAR_SIGNED_URL_CACHE.set(path, {
    url,
    expiresAt:
      Date.now() + Math.min(expiresInSeconds * 1000, CACHE_VALIDITY_MS),
  });
}

/** Resolve storage path to signed URL (cached). Use for img src when not using Avatar. */
export async function resolveSignedAvatarUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const cached = getCachedSignedUrl(path);
  if (cached) return cached;
  try {
    const expiresIn = 60 * 60; // 1 hour
    const { data, error } = await supabase.storage
      .from("photo")
      .createSignedUrl(path, expiresIn);
    if (error || !data?.signedUrl) {
      logger.error("Error resolving signed avatar URL:", error);
      return null;
    }
    setCachedSignedUrl(path, data.signedUrl, expiresIn);
    return data.signedUrl;
  } catch (err) {
    logger.error("Unexpected error resolving signed avatar URL:", err);
    return null;
  }
}

export const Avatar: React.FC<{
  src: string;
  size?: string;
  alt?: string;
  className?: string;
}> = ({ src, size = "h-10 w-10", alt = "User", className = "" }) => {
  const [resolvedSrc, setResolvedSrc] = useState(() => {
    if (!src) return src;
    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("data:")
    ) {
      return src;
    }
    return getCachedSignedUrl(src) ?? src;
  });

  useEffect(() => {
    const resolve = async () => {
      if (!src) {
        setResolvedSrc(src);
        return;
      }

      // If src is already an absolute URL or data URL, just use it
      if (
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("data:")
      ) {
        setResolvedSrc(src);
        return;
      }

      const cached = getCachedSignedUrl(src);
      if (cached) {
        setResolvedSrc(cached);
        return;
      }

      try {
        const expiresIn = 60 * 60; // 1 hour
        const { data, error } = await supabase.storage
          .from("photo")
          .createSignedUrl(src, expiresIn);

        if (error || !data?.signedUrl) {
          logger.error("Error resolving avatar signed URL:", error);
          setResolvedSrc(src);
          return;
        }

        setCachedSignedUrl(src, data.signedUrl, expiresIn);
        setResolvedSrc(data.signedUrl);
      } catch (err) {
        logger.error("Unexpected error resolving avatar signed URL:", err);
        setResolvedSrc(src);
      }
    };

    resolve();
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={`${size} rounded-full object-cover border-2 border-surface ${className}`}
    />
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  type?: "gold" | "neon" | "primary" | "slate";
  className?: string;
}> = ({ children, type = "slate", className = "" }) => {
  const styles = {
    gold: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black",
    neon: "bg-gradient-to-r from-[#39FF14] to-[#32CD32] text-black",
    primary: "bg-primary/20 text-primary border border-primary/20",
    slate: "bg-surface text-slate-300 border border-white/10",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${styles[type]} ${className}`.trim()}
    >
      {children}
    </span>
  );
};
