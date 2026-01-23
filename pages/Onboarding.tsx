import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Header } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const OnboardingLanding: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="relative flex flex-col w-full h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 h-[60%] w-full">
        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1780&q=80')" }}></div>
        <div className="absolute inset-0 bg-hero-gradient"></div>
      </div>

      <header className="relative z-20 flex items-center justify-between px-4 py-2 pt-4 lg:px-5 lg:py-2 lg:pt-3">
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
          <span className="material-symbols-outlined text-[#39FF14] text-base">sports_basketball</span>
          <span className="text-white font-bold text-[10px] tracking-wide">TeamUp</span>
        </div>
      </header>

      <main className="relative z-10 flex flex-col flex-1 justify-center pb-4 px-4 lg:pb-6 lg:px-5">
        <div className="lg:max-w-2xl lg:mx-auto lg:w-full">
          {/* Stats Card */}
          <div className="mb-3 w-full animate-fade-in-up lg:mb-4">
            <div className="bg-white/10 backdrop-blur-xl p-2 rounded-lg flex items-center justify-between border border-white/20 shadow-md lg:p-2.5 lg:rounded-xl">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-300 uppercase tracking-wider font-semibold mb-0.5 lg:text-[10px]">{t('onboarding.activePlayers')}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-extrabold text-white lg:text-2xl">12,405</span>
                  <span className="text-[#39FF14] text-sm font-bold lg:text-base">+</span>
                </div>
              </div>
              <div className="flex -space-x-2">
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-8 h-8 rounded-full border-2 border-background object-cover shadow-sm lg:w-10 lg:h-10" />
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User" className="w-8 h-8 rounded-full border-2 border-background object-cover shadow-sm lg:w-10 lg:h-10" />
                <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm lg:w-10 lg:h-10 lg:text-[10px]">+2k</div>
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="flex flex-col gap-2 mb-4 lg:mb-5 lg:gap-2.5">
            <div className="inline-flex self-start px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FFD700]/30 via-[#39FF14]/30 to-[#FFD700]/30 border border-[#39FF14]/40 backdrop-blur-md shadow-sm mb-1.5 lg:px-3 lg:py-1 lg:mb-2">
              <span className="text-[9px] font-bold text-[#39FF14] flex items-center gap-1 lg:text-[10px]">
              <span className="material-symbols-outlined text-xs lg:text-sm">bolt</span> 
              {t('onboarding.proAthleteEdition')}
            </span>
          </div>
          
          <h1 className="text-2xl font-extrabold text-white leading-[1.1] tracking-tight lg:text-4xl lg:leading-[1.1]">
            {t('onboarding.findYourSquad')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#39FF14] to-[#FFD700]">{t('onboarding.squad')}</span><br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-[#0d7cf2]">{t('onboarding.dominate')}</span> {t('onboarding.theGame')}
          </h1>
          
          <p className="text-xs text-slate-300 leading-snug max-w-lg lg:text-sm lg:leading-relaxed lg:max-w-xl">
            {t('onboarding.description')}
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-1 mt-2 lg:gap-1.5 lg:mt-2.5">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 lg:px-2.5 lg:py-1">
              <span className="material-symbols-outlined text-[#39FF14] text-xs lg:text-sm">location_on</span>
              <span className="text-[9px] text-slate-300 font-medium lg:text-[10px]">{t('onboarding.localGames')}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 lg:px-2.5 lg:py-1">
              <span className="material-symbols-outlined text-[#39FF14] text-xs lg:text-sm">groups</span>
              <span className="text-[9px] text-slate-300 font-medium lg:text-[10px]">{t('onboarding.findPlayers')}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 lg:px-2.5 lg:py-1">
              <span className="material-symbols-outlined text-[#39FF14] text-xs lg:text-sm">analytics</span>
              <span className="text-[9px] text-slate-300 font-medium lg:text-[10px]">{t('onboarding.trackStats')}</span>
            </div>
          </div>
        </div>
        </div>

        {/* CTA Section */}
        <div className="lg:max-w-2xl lg:mx-auto lg:w-full">
          <div className="flex flex-col gap-2 lg:gap-2.5">
            <button 
              onClick={() => navigate('/create-profile', { state: { skipIntro: true } })}
              className="w-full py-2.5 bg-gradient-to-r from-primary via-blue-600 to-primary hover:from-primary-hover hover:via-blue-700 hover:to-primary-hover active:scale-[0.98] transition-all rounded-lg shadow-lg shadow-primary/30 text-white font-bold text-sm flex items-center justify-center gap-1.5 group lg:py-3 lg:text-base lg:rounded-xl"
            >
              <span>{t('onboarding.getStartedFree')}</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-base lg:text-lg">arrow_forward</span>
            </button>
            <div className="text-center text-[10px] text-slate-400 lg:text-xs">
              {t('onboarding.alreadyHaveAccount')} <span className="text-white font-semibold cursor-pointer hover:text-[#39FF14] transition-colors underline underline-offset-1" onClick={() => navigate('/login')}>{t('onboarding.logIn')}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const AuthSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[60%] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-6 pb-8 pt-20 lg:px-8 lg:pb-6 lg:pt-12">
        <div className="lg:max-w-md lg:mx-auto lg:w-full">
         <div className="flex-1 flex flex-col justify-center items-start lg:items-center lg:text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/30 mb-6 border border-white/10 lg:w-14 lg:h-14 lg:rounded-xl lg:mb-4">
               <span className="material-symbols-outlined text-3xl text-white lg:text-2xl">sports_score</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-[1.1] lg:text-4xl lg:mb-3">
              Team<span className="text-primary">Up</span>
            </h1>
            <p className="text-xl text-slate-300 font-medium max-w-[80%] lg:text-lg lg:max-w-full">
              Join the community. <br/>Find your game.
            </p>
         </div>

         <div className="flex flex-col gap-4 animate-fade-in-up lg:gap-3">
            <button 
              onClick={() => navigate('/create-profile')}
              className="w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-lg font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 lg:py-3 lg:text-base lg:rounded-lg"
            >
              Sign Up Free
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-4 rounded-xl bg-surface border border-white/10 hover:bg-white/5 text-white text-lg font-bold transition-all active:scale-[0.98] lg:py-3 lg:text-base lg:rounded-lg"
            >
              Log In
            </button>
            
            <div className="mt-4 flex items-center gap-4 justify-center lg:mt-3 lg:gap-3">
                 <div className="h-px bg-white/10 w-full"></div>
                 <span className="text-xs text-slate-500 font-bold uppercase whitespace-nowrap lg:text-[11px]">Or continue with</span>
                 <div className="h-px bg-white/10 w-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:gap-3">
                <button className="h-12 rounded-xl bg-surface border border-white/5 hover:bg-white/5 flex items-center justify-center transition-colors lg:h-10 lg:rounded-lg">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 lg:w-4 lg:h-4" alt="Google" />
                </button>
                <button className="h-12 rounded-xl bg-surface border border-white/5 hover:bg-white/5 flex items-center justify-center transition-colors text-white lg:h-10 lg:rounded-lg">
                    <span className="material-symbols-outlined text-[24px] lg:text-xl">apple</span>
                </button>
            </div>
         </div>
        </div>
      </div>
    </div>
  );
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated, isLoading, clerkUser } = useAuth();

  useEffect(() => {
    // Only redirect if fully authenticated
    // Wait for loading to complete and ensure both Clerk and profile exist
    if (!isLoading && isAuthenticated && clerkUser) {
      // Small delay to ensure state is stable
      const timer = setTimeout(() => {
        navigate('/home', { replace: true });
      }, 50);
      return () => clearTimeout(timer);
    }
    return;
  }, [isAuthenticated, isLoading, clerkUser, navigate]);

  // Show loading state if Clerk user exists but profile is still loading
  if (clerkUser && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-white">Loading your profile...</div>
      </div>
    );
  }

  // Don't show login form if already authenticated
  if (!isLoading && isAuthenticated && clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
       <Header transparent />
      <main className="flex-1 px-6 pt-4 pb-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
              {t('onboarding.welcomeBack')} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">{t('onboarding.back')}</span>
            </h1>
           <p className="text-slate-400 font-medium">{t('onboarding.getBackOnCourt')}</p>
         </div>
          <SignIn 
            routing="hash"
            signUpUrl="/#/create-profile"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-surface border border-white/10",
                headerTitle: "text-white",
                headerSubtitle: "text-slate-400",
                socialButtonsBlockButton: "bg-surface border border-white/10 text-white hover:bg-white/5",
                formButtonPrimary: "bg-primary hover:bg-primary-hover",
                formFieldInput: "bg-background border-white/10 text-white",
                formFieldLabel: "text-slate-400",
                footerActionLink: "text-primary",
              }
            }}
          />
         </div>
       </main>
    </div>
  );
};

export const CreateProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, user, clerkUser, refreshUser } = useAuth();
  const { t } = useLanguage();
  const hasRedirectedRef = React.useRef(false);
  const skipIntro = location.state?.skipIntro || false;
  const hasRefreshedRef = React.useRef(false);

  useEffect(() => {
    // Debug logging
    console.log('CreateProfile redirect check:', {
      hasRedirected: hasRedirectedRef.current,
      isLoading,
      isAuthenticated,
      hasClerkUser: !!clerkUser,
      hasUser: !!user,
      userLocation: user?.location,
    });

    // If we've already redirected, don't do anything
    if (hasRedirectedRef.current) return;

    // Wait for loading to complete and Clerk user to exist
    if (clerkUser && !isLoading) {
      // If user profile is null but Clerk user exists, try refreshing once (for existing users)
      if (!user && !hasRefreshedRef.current) {
        console.log('CreateProfile: User profile not found, refreshing...');
        hasRefreshedRef.current = true;
        refreshUser();
        return; // Wait for refresh to complete - useEffect will run again when user updates
      }
      
      // Give a delay to ensure profile is loaded (especially for existing users after refresh)
      // If we just refreshed, wait longer for the profile to load
      const delay = hasRefreshedRef.current ? 1000 : 500;
      const redirectTimer = setTimeout(() => {
        if (hasRedirectedRef.current) return;
        
        console.log('CreateProfile: Clerk user exists and loading done, redirecting...', {
          hasUser: !!user,
          hasLocation: !!(user?.location),
          hasRefreshed: hasRefreshedRef.current
        });
        hasRedirectedRef.current = true;
        
        // Check if user has a location
        if (user && user.location) {
          // Existing user with location, go to home
          console.log('CreateProfile: Redirecting to /home (has location)');
          navigate('/home', { replace: true });
        } else {
          // New user without location, go to set-location
          console.log('CreateProfile: Redirecting to /set-location (no location or no profile yet)');
          navigate('/set-location', { replace: true });
        }
      }, delay);
      
      return () => clearTimeout(redirectTimer);
    }
    return;
  }, [isLoading, user, clerkUser, navigate]);

  // Show loading state while profile is being created
  if (clerkUser && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-white">Creating your profile...</div>
      </div>
    );
  }

  // Show redirecting if Clerk user exists and we're about to redirect
  // OR if user is already authenticated - don't show signup form
  if (clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header />
      <main className="flex-1 px-6 pt-4 pb-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          {!skipIntro && (
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-2">
                {t('onboarding.letsGetYouInGame')} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">{t('onboarding.inTheGame')}</span>
              </h1>
              <p className="text-slate-400 font-medium">{t('onboarding.createAccountToStart')}</p>
            </div>
          )}
          <div className="w-full" style={{ minHeight: '400px' }}>
            <SignUp 
              routing="hash"
              signInUrl="/#/login"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-surface border border-white/10 shadow-lg w-full",
                  headerTitle: "text-white !text-2xl",
                  headerSubtitle: "text-slate-400",
                  socialButtonsBlockButton: "bg-surface border border-white/10 text-white hover:bg-white/5",
                  formButtonPrimary: "bg-primary hover:bg-primary-hover text-white",
                  formFieldInput: "bg-background border-white/10 text-white",
                  formFieldLabel: "text-slate-400",
                  footerActionLink: "text-primary hover:text-primary-hover",
                  formFieldInputShowPasswordButton: "text-slate-400 hover:text-white",
                  identityPreviewText: "text-white",
                  identityPreviewEditButton: "text-primary",
                },
                variables: {
                  colorPrimary: "#0d7cf2",
                  colorBackground: "#1C232B",
                  colorInputBackground: "#101922",
                  colorText: "#ffffff",
                  colorTextSecondary: "#93a2b7",
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export const SetLocation: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, isLoading, clerkUser } = useAuth();
  const { t } = useLanguage();
  const [selectedCity, setSelectedCity] = useState('Bà Rịa - Vũng Tàu');
  const [isSaving, setIsSaving] = useState(false);
  const hasRedirectedRef = React.useRef(false);

  // Redirect existing users who already have a location
  useEffect(() => {
    if (hasRedirectedRef.current) return;
    
    // Wait for loading to complete
    if (!isLoading && user && user.location) {
      console.log('SetLocation: User already has location, redirecting to /home');
      hasRedirectedRef.current = true;
      navigate('/home', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Vietnamese cities list
  const vietnamCities = [
    { name: "Thành phố Hồ Chí Minh", english: "Ho Chi Minh City" },
    { name: "Hà Nội", english: "Hanoi" },
    { name: "Đà Nẵng", english: "Da Nang" },
    { name: "Hải Phòng", english: "Hai Phong" },
    { name: "Cần Thơ", english: "Can Tho" },
    { name: "Vũng Tàu", english: "Vung Tau" },
    { name: "Nha Trang", english: "Nha Trang" },
    { name: "Huế", english: "Hue" },
    { name: "Đà Lạt", english: "Da Lat" },
    { name: "Quy Nhơn", english: "Quy Nhon" },
    { name: "Phan Thiết", english: "Phan Thiet" },
    { name: "Vinh", english: "Vinh" },
    { name: "Thái Nguyên", english: "Thai Nguyen" },
    { name: "Biên Hòa", english: "Bien Hoa" },
    { name: "Long Xuyên", english: "Long Xuyen" },
    { name: "Rạch Giá", english: "Rach Gia" },
    { name: "Mỹ Tho", english: "My Tho" },
    { name: "Cà Mau", english: "Ca Mau" },
    { name: "Bạc Liêu", english: "Bac Lieu" },
    { name: "Sóc Trăng", english: "Soc Trang" },
    { name: "Trà Vinh", english: "Tra Vinh" },
    { name: "Bến Tre", english: "Ben Tre" },
    { name: "Tây Ninh", english: "Tay Ninh" },
    { name: "Bình Dương", english: "Binh Duong" },
    { name: "Đồng Nai", english: "Dong Nai" },
    { name: "Bà Rịa - Vũng Tàu", english: "Ba Ria - Vung Tau" },
    { name: "Khánh Hòa", english: "Khanh Hoa" },
    { name: "Lâm Đồng", english: "Lam Dong" },
    { name: "Bình Thuận", english: "Binh Thuan" },
    { name: "Bình Phước", english: "Binh Phuoc" },
    { name: "Đồng Tháp", english: "Dong Thap" },
    { name: "An Giang", english: "An Giang" },
    { name: "Kiên Giang", english: "Kien Giang" }
  ];

  const handleConfirm = async () => {
    if (!user || !clerkUser) {
      console.error('User or Clerk user not available');
      alert('User not found. Please try logging in again.');
      return;
    }
    
    if (isSaving) return; // Prevent double submission
    
    setIsSaving(true);
    try {
      console.log('Updating location:', { selectedCity, userId: user.id, clerkId: clerkUser.id });
      await updateUser({ location: selectedCity });
      console.log('Location updated successfully:', selectedCity);
      navigate('/success');
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to save location. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header title={t('onboarding.step2Of4')} />
      <main className="flex-1 flex flex-col px-5 pb-32 lg:px-6 lg:pb-6">
        <div className="lg:max-w-2xl lg:mx-auto lg:w-full">
        <div className="flex flex-col gap-2 pt-4 pb-6 lg:pt-3 lg:pb-4 lg:gap-1.5">
          <h1 className="text-3xl font-bold leading-tight lg:text-2xl">{t('onboarding.whereDoYouPlay')}</h1>
          <p className="text-slate-400 text-base lg:text-sm">{t('onboarding.setHomeBase')}</p>
        </div>

        {/* City Selector */}
        <div className="mb-6 lg:mb-4">
          <label className="text-sm font-medium text-slate-400 mb-2 block lg:text-xs lg:mb-1.5">{t('onboarding.selectCity')}</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 h-14 outline-none border border-white/10 focus:border-primary transition-colors text-white lg:h-10 lg:px-3 lg:text-sm lg:rounded-lg"
          >
            {vietnamCities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent z-30 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto lg:relative lg:p-4 lg:pt-4">
        <div className="lg:max-w-2xl lg:mx-auto lg:w-full">
        <button 
          onClick={handleConfirm} 
          disabled={isSaving || !user}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all lg:h-10 lg:text-base lg:rounded-lg"
        >
          {isSaving ? 'Saving...' : t('onboarding.confirmLocation')}
        </button>
        </div>
      </div>
    </div>
  );
};

export const RegistrationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative mb-8 group z-10">
        <div className="absolute inset-0 -m-4 rounded-full border border-primary/20 scale-110 animate-pulse"></div>
        <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-surface shadow-2xl border border-white/10">
          <span className="material-symbols-outlined text-6xl text-primary">emoji_events</span>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-success text-black p-2 rounded-full shadow-lg border-4 border-background flex items-center justify-center">
          <span className="material-symbols-outlined text-xl font-bold">check</span>
        </div>
      </div>

      <div className="text-center mb-10 z-10">
        <h1 className="text-4xl font-extrabold mb-3">{t('onboarding.youreIn')}</h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          {t('onboarding.accountCreatedSuccess')}
        </p>
      </div>

      <div className="w-full glass-panel p-1 rounded-2xl relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] mb-8 border border-white/5 bg-white/5">
        <div className="relative w-full h-40 bg-cover bg-center rounded-xl overflow-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex items-end justify-between">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffd700] text-black uppercase tracking-wider mb-1 inline-block">{t('onboarding.new')}</span>
              <p className="text-white font-bold text-lg">{t('onboarding.proLeagueAccess')}</p>
              <p className="text-slate-300 text-xs">{t('onboarding.unlockedForProfile')}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 z-10">
        <button onClick={() => navigate('/home')} className="w-full h-14 rounded-xl bg-primary hover:bg-primary-hover text-white text-lg font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {t('onboarding.findAGame')}
        </button>
        <button onClick={() => navigate('/profile')} className="w-full h-14 rounded-xl bg-transparent border border-white/20 text-white text-lg font-bold hover:bg-white/5 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          {t('onboarding.editProfile')}
        </button>
      </div>
    </div>
  );
};