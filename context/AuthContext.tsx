import React, { createContext, useContext, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { User } from '../types';
import { getUserProfile, createUserProfile } from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  clerkUser: ReturnType<typeof useUser>['user'] | null;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
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
            console.log('Creating user profile for:', clerkUser.id);
            profile = await createUserProfile({
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses[0].emailAddress,
              firstName: clerkUser.firstName || 'User',
              lastName: clerkUser.lastName || '',
              avatar: clerkUser.imageUrl || undefined,
            });
            console.log('Profile created successfully:', profile);
            
            // If profile was created but returned null/undefined, refetch it with retries
            if (!profile) {
              console.log('Profile created but not returned, refetching...');
              // Retry up to 3 times with delays
              for (let i = 0; i < 3; i++) {
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); // 500ms, 1000ms, 1500ms
                profile = await getUserProfile(clerkUser.id);
                if (profile) {
                  console.log('Refetched profile on attempt', i + 1, ':', profile);
                  break;
                }
              }
              if (!profile) {
                console.warn('Profile still not found after retries, but continuing...');
              }
            }
          } catch (createError) {
            console.error('Failed to create user profile:', createError);
            // Don't throw - allow user to continue even if profile creation fails
            // They can complete profile setup later
            console.warn('Continuing without profile - user can complete setup later');
          }
        }
        
        if (profile) {
          console.log('Setting user profile in state:', profile.id, profile.email);
          setUser(profile);
        } else {
          console.warn('No profile found or created for user:', clerkUser.id);
          setUser(null);
        }
        console.log('AuthContext: User profile loaded:', profile ? 'Profile found' : 'No profile');
      } catch (error) {
        console.error('Error loading user profile:', error);
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
            console.error('Error creating user profile:', createError);
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

  const signOut = async () => {
    await clerkSignOut();
    setUser(null);
  };

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
