import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUserInvitations, getEvent, getEventRequests, events } = useEvents();
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
        logger.error('Error loading invitations:', error);
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
        const { supabase } = await import('../lib/supabase');
        const userId = user.id; // Capture user.id in closure
        
        channel = supabase
          .channel(`user_invitations:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'event_requests',
            },
            async (payload) => {
              logger.debug('Real-time invitation change received');
              
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
              const isNewInvitation = newRecord && newRecord.status === 'invited' && newRecord.user_id === userId;
              const wasInvitation = oldRecord && oldRecord.status === 'invited' && oldRecord.user_id === userId;
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
                  logger.error('Error reloading invitations in real-time callback:', error);
                }
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              logger.log('Real-time subscription active for invitations');
            } else if (status === 'CHANNEL_ERROR') {
              logger.warn('Real-time subscription error for invitations:', err);
              logger.warn('Make sure Realtime is enabled for event_requests table in Supabase Dashboard > Database > Replication');
              // Disable real-time subscription on error to prevent constant errors
              if (channel) {
                import('../lib/supabase').then(({ supabase }) => {
                  supabase.removeChannel(channel);
                });
              }
            } else if (status === 'TIMED_OUT') {
              logger.warn('Real-time subscription timed out for invitations');
            }
          });
      } catch (error) {
        logger.error('Error setting up real-time subscription:', error);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        import('../lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel);
        }).catch(err => {
          logger.error('Error removing channel:', err);
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
        const userCreatedEvents = events.filter((e) => e.organizerId === user.id);
        let totalRequests = 0;

        for (const event of userCreatedEvents) {
          try {
            const requests = await getEventRequests(event.id);
            const pendingRequests = requests.filter((r) => r.status === 'pending');
            totalRequests += pendingRequests.length;
          } catch (error) {
            logger.error(`Error loading requests for event ${event.id}:`, error);
          }
        }

        setOtherRequestsCount(totalRequests);
      } catch (error: any) {
        logger.error('Error loading other requests:', error);
        setOtherRequestsCount(0);
      }
    };

    loadOtherRequests();

    // Set up real-time subscription for requests to user's events
    let channel: any = null;
    const setupRealtime = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const userId = user.id;
        
        channel = supabase
          .channel(`user_event_requests:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'event_requests',
            },
            async (payload) => {
              logger.debug('Real-time request change received');
              
              const newRecord = payload.new as any;
              const oldRecord = payload.old as any;
              
              // Check if this request is for an event the user created
              const eventId = newRecord?.event_id || oldRecord?.event_id;
              if (!eventId) return;
              
              const event = getEvent(eventId);
              if (!event || event.organizerId !== userId) return;
              
              // Reload requests count
              try {
                const userCreatedEvents = events.filter((e) => e.organizerId === userId);
                let totalRequests = 0;

                for (const evt of userCreatedEvents) {
                  try {
                    const requests = await getEventRequests(evt.id);
                    const pendingRequests = requests.filter((r) => r.status === 'pending');
                    totalRequests += pendingRequests.length;
                  } catch (error) {
                    logger.error(`Error loading requests for event ${evt.id}:`, error);
                  }
                }

                setOtherRequestsCount(totalRequests);
              } catch (error: any) {
                logger.error('Error reloading requests in real-time callback:', error);
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              logger.log('Real-time subscription active for event requests');
            } else if (status === 'CHANNEL_ERROR') {
              logger.warn('Real-time subscription error for event requests:', err);
            } else if (status === 'TIMED_OUT') {
              logger.warn('Real-time subscription timed out for event requests');
            }
          });
      } catch (error) {
        logger.error('Error setting up real-time subscription for requests:', error);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        import('../lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel);
        }).catch(err => {
          logger.error('Error removing channel:', err);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, events, getEventRequests]);

  const NavItem = ({ path, icon, label, showNotification = false, notificationCount = 0 }: { 
    path: string; 
    icon: string; 
    label: string;
    showNotification?: boolean;
    notificationCount?: number;
  }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center gap-1 p-2 w-16 lg:w-full lg:p-1.5 lg:gap-0.5 group transition-colors relative ${
        isActive(path) ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
      }`}
      title={label}
    >
      <span className="relative">
        <span className={`material-symbols-outlined text-[26px] lg:text-[22px] ${isActive(path) ? 'font-variation-settings-fill' : ''}`}>
          {icon}
        </span>
        {showNotification && notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-surface flex items-center justify-center lg:h-3 lg:w-3 lg:-top-0.5 lg:-right-0.5">
            <span className="text-[8px] font-bold text-white lg:text-[7px]">{notificationCount > 9 ? '9+' : notificationCount}</span>
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium lg:text-[10px]">{label}</span>
    </button>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full bg-surface/95 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-2 lg:border-t-0 lg:border-r lg:border-r-white/5 lg:bg-surface/98 lg:w-16 lg:h-screen lg:left-0 lg:top-0 lg:right-auto lg:flex lg:flex-col lg:justify-start lg:items-center lg:pt-4 lg:pb-3 lg:px-0">
      <div className="flex justify-around items-center h-16 max-w-full lg:flex-col lg:justify-start lg:gap-3 lg:h-auto lg:w-full">
        <NavItem path="/home" icon="home" label={t('nav.home')} />
        <NavItem 
          path="/my-games" 
          icon="sports_score" 
          label={t('nav.myGames')} 
          showNotification={invitationCount > 0 || otherRequestsCount > 0}
          notificationCount={invitationCount + otherRequestsCount}
        />
        <div className="relative -top-5 lg:static lg:my-2">
           <button onClick={() => navigate('/event/create')} className="h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex items-center justify-center transform hover:scale-105 transition-all lg:w-10 lg:h-10">
             <span className="material-symbols-outlined text-[28px] lg:text-[20px]">add</span>
           </button>
        </div>
        <NavItem path="/messages" icon="chat_bubble" label={t('nav.messages')} />
        <NavItem 
          path="/profile" 
          icon="person" 
          label={t('nav.profile')}
          showNotification={friendRequestCount > 0}
          notificationCount={friendRequestCount}
        />
      </div>
    </nav>
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
    <header className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 ${transparent ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md border-b border-white/5'}`}>
      <button 
        onClick={handleBack}
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
      >
        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>
      {title && <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>}
      <div className="flex items-center justify-end w-10">
        {rightAction}
      </div>
    </header>
  );
};

export const Avatar: React.FC<{ src: string; size?: string; alt?: string; className?: string }> = ({
  src,
  size = "h-10 w-10",
  alt = "User",
  className = "",
}) => {
  const [resolvedSrc, setResolvedSrc] = useState(src);

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

      try {
        const { data, error } = await supabase.storage
          .from("photo")
          .createSignedUrl(src, 60 * 60); // 1 hour

        if (error || !data?.signedUrl) {
          logger.error("Error resolving avatar signed URL:", error);
          setResolvedSrc(src);
          return;
        }

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

export const Badge: React.FC<{ children: React.ReactNode; type?: 'gold' | 'neon' | 'primary' | 'slate'; className?: string }> = ({ children, type = 'slate', className = '' }) => {
  const styles = {
    gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black',
    neon: 'bg-gradient-to-r from-[#39FF14] to-[#32CD32] text-black',
    primary: 'bg-primary/20 text-primary border border-primary/20',
    slate: 'bg-surface text-slate-300 border border-white/10'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${styles[type]} ${className}`.trim()}>
      {children}
    </span>
  );
};