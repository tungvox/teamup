import React, { createContext, useContext, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { User } from '../types';
import { getUserProfile, createUserProfile } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  clerkUser: ReturnType<typeof useUser>['user'] | null;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUser = async () => {
      if (!clerkLoaded) {
        setIsLoading(true);
        return;
      }

      if (!clerkUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // Try to get user profile from Supabase
        let profile = await getUserProfile(clerkUser.id);
        
        // If profile doesn't exist, create it
        if (!profile && clerkUser.emailAddresses[0]) {
          try {
            logger.log('Creating user profile for:', clerkUser.id);
            profile = await createUserProfile({
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses[0].emailAddress,
              firstName: clerkUser.firstName || 'User',
              lastName: clerkUser.lastName || '',
              avatar: clerkUser.imageUrl || undefined,
            });
            logger.log('Profile created successfully');
            
            // If profile was created but returned null/undefined, refetch it with retries
            if (!profile) {
              logger.log('Profile created but not returned, refetching...');
              // Retry up to 3 times with delays
              for (let i = 0; i < 3; i++) {
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); // 500ms, 1000ms, 1500ms
              profile = await getUserProfile(clerkUser.id);
                if (profile) {
                  logger.log('Refetched profile on attempt', i + 1);
                  break;
                }
              }
              if (!profile) {
                logger.warn('Profile still not found after retries, but continuing...');
              }
            }
          } catch (createError) {
            logger.error('Failed to create user profile:', createError);
            // Don't throw - allow user to continue even if profile creation fails
            // They can complete profile setup later
            logger.warn('Continuing without profile - user can complete setup later');
          }
        }
        
        if (profile) {
          setUser(profile);
        } else {
          logger.warn('No profile found or created for user:', clerkUser.id);
          setUser(null);
        }
      } catch (error) {
        logger.error('Error loading user profile:', error);
        // Don't set user to null if Clerk user exists - this causes auth issues
        // Instead, try to create profile again or show error
        if (clerkUser && clerkUser.emailAddresses[0]) {
          try {
            const newProfile = await createUserProfile({
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses[0].emailAddress,
              firstName: clerkUser.firstName || '',
              lastName: clerkUser.lastName || '',
              avatar: clerkUser.imageUrl || undefined,
            });
            setUser(newProfile);
          } catch (createError) {
            logger.error('Error creating user profile:', createError);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [clerkUser, clerkLoaded]);

  // Set up real-time subscription for user profile changes (friend requests, etc.)
  React.useEffect(() => {
    if (!clerkUser) return;

    logger.log('Setting up real-time subscription for user:', clerkUser.id);

    const channel = supabase
      .channel(`user_profile:${clerkUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
        },
        async (payload) => {
          logger.debug('Real-time update received for user profile');
          
          const newRecord = payload.new as any;
          
          // Filter in callback to avoid binding mismatch
          const isRelevant = 
            newRecord && newRecord.clerk_id === clerkUser.id;
          
          if (!isRelevant) {
            return;
          }
          
          // Reload the user profile to get the latest data
          try {
            const updatedProfile = await getUserProfile(clerkUser.id);
            if (updatedProfile) {
              setUser(updatedProfile);
            }
          } catch (error) {
            logger.error('Error loading updated profile:', error);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          logger.log('Successfully subscribed to real-time updates for user profile');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Real-time subscription error:', err);
          logger.error('Make sure Realtime is enabled for user_profiles table in Supabase Dashboard > Database > Replication');
        } else if (status === 'TIMED_OUT') {
          logger.warn('Real-time subscription timed out for user profile');
        }
      });

    return () => {
      logger.debug('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [clerkUser?.id]); // Only depend on clerkUser.id, not the whole user object

  const signOut = async () => {
    await clerkSignOut();
    setUser(null);
  };

  const loadUserProfile = React.useCallback(async () => {
    if (!clerkUser || !clerkLoaded) return;

    try {
      const profile = await getUserProfile(clerkUser.id);
      if (profile) {
        setUser(profile);
      } else {
        logger.warn('No profile found when refreshing');
      }
    } catch (error) {
      logger.error('Error refreshing user profile:', error);
    }
  }, [clerkUser, clerkLoaded]);

  const refreshUser = React.useCallback(async () => {
    await loadUserProfile();
  }, [loadUserProfile]);

  const updateUser = async (updates: Partial<User>) => {
    if (!clerkUser || !user) return;
    
    try {
      await updateUserProfile(clerkUser.id, updates);
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!clerkUser,
        isLoading: isLoading || !clerkLoaded,
        clerkUser: clerkUser,
        signOut,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function
async function updateUserProfile(clerkId: string, updates: Partial<User>): Promise<void> {
  const { updateUserProfile } = await import('../services/supabaseService');
  return updateUserProfile(clerkId, updates);
}
