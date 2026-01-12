import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Header } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { validators } from '../utils/validation';

export const OnboardingLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col h-full min-h-screen">
      <div className="absolute inset-0 z-0 h-[65%] w-full">
        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1780&q=80')" }}></div>
        <div className="absolute inset-0 bg-hero-gradient"></div>
      </div>

      <header className="relative z-20 flex items-center justify-between px-6 py-6 pt-12">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <span className="material-symbols-outlined text-[#39FF14] text-[20px]">sports_basketball</span>
          <span className="text-white font-bold text-sm tracking-wide">TeamUp</span>
        </div>
      </header>

      <main className="relative z-10 flex flex-col flex-1 justify-end pb-8 px-6">
        <div className="mb-6 w-full animate-fade-in-up">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl flex items-center justify-between border-l-4 border-l-[#39FF14]">
            <div className="flex flex-col">
              <span className="text-xs text-slate-300 uppercase tracking-wider font-medium">Active Players</span>
              <span className="text-2xl font-bold text-white">12,405<span className="text-[#39FF14] text-sm align-top">+</span></span>
            </div>
            <div className="flex -space-x-3">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-10 h-10 rounded-full border-2 border-background object-cover" />
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User" className="w-10 h-10 rounded-full border-2 border-background object-cover" />
              <div className="w-10 h-10 rounded-full border-2 border-background bg-primary flex items-center justify-center text-xs font-bold text-white">+2k</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-8">
          <div className="inline-flex self-start px-3 py-1 rounded-full bg-gradient-to-r from-[#FFD700]/20 to-[#39FF14]/20 border border-[#39FF14]/30 backdrop-blur-sm mb-2">
            <span className="text-xs font-bold text-[#39FF14] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">bolt</span> 
              Pro-Athlete Edition
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-[1.1] tracking-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#39FF14]">Squad.</span><br/>
            Dominate the Game.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mt-2">
            Connect with local athletes, join pickup games instantly, and track your performance stats.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate('/create-profile')}
            className="w-full py-4 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-xl shadow-lg shadow-primary/20 text-white font-bold text-lg flex items-center justify-center gap-2 group"
          >
            Get Started
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
          <div className="text-center text-sm text-slate-400">
            Already have an account? <span className="text-white font-medium cursor-pointer hover:underline" onClick={() => navigate('/login')}>Log In</span>
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

      <div className="relative z-10 flex flex-col flex-1 px-6 pb-8 pt-20">
         <div className="flex-1 flex flex-col justify-center items-start">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/30 mb-6 border border-white/10">
               <span className="material-symbols-outlined text-3xl text-white">sports_score</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
              Team<span className="text-primary">Up</span>
            </h1>
            <p className="text-xl text-slate-300 font-medium max-w-[80%]">
              Join the community. <br/>Find your game.
            </p>
         </div>

         <div className="flex flex-col gap-4 animate-fade-in-up">
            <button 
              onClick={() => navigate('/create-profile')}
              className="w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-lg font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Sign Up Free
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-4 rounded-xl bg-surface border border-white/10 hover:bg-white/5 text-white text-lg font-bold transition-all active:scale-[0.98]"
            >
              Log In
            </button>
            
            <div className="mt-4 flex items-center gap-4 justify-center">
                 <div className="h-px bg-white/10 w-full"></div>
                 <span className="text-xs text-slate-500 font-bold uppercase whitespace-nowrap">Or continue with</span>
                 <div className="h-px bg-white/10 w-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button className="h-12 rounded-xl bg-surface border border-white/5 hover:bg-white/5 flex items-center justify-center transition-colors">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                </button>
                <button className="h-12 rounded-xl bg-surface border border-white/5 hover:bg-white/5 flex items-center justify-center transition-colors text-white">
                    <span className="material-symbols-outlined text-[24px]">apple</span>
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
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
              Welcome <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Back!</span>
            </h1>
           <p className="text-slate-400 font-medium">Let's get you back on the court.</p>
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
  const { isAuthenticated, isLoading, user, clerkUser } = useAuth();
  const hasRedirectedRef = React.useRef(false);

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

    // If Clerk user exists and loading is done, redirect (don't wait for profile)
    if (clerkUser && !isLoading) {
      console.log('CreateProfile: Clerk user exists and loading done, redirecting...');
      hasRedirectedRef.current = true;
      
      // Redirect immediately without delay
      if (user && user.location) {
        // User has location, go to home
        console.log('CreateProfile: Redirecting to /home (has location)');
        navigate('/home', { replace: true });
      } else {
        // New user without location, go to set-location
        console.log('CreateProfile: Redirecting to /set-location (no location or no profile yet)');
        navigate('/set-location', { replace: true });
      }
    }
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
          <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-2">
            Let's get you <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">in the game.</span>
          </h1>
            <p className="text-slate-400 font-medium">Create your account to start connecting.</p>
        </div>
          <div className="w-full" style={{ minHeight: '400px' }}>
            <SignUp 
              routing="hash"
              signInUrl="/#/login"
              afterSignUpUrl="/#/set-location"
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
  const { user, updateUser } = useAuth();
  const [selectedCity, setSelectedCity] = useState('Bà Rịa - Vũng Tàu');

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

  const handleConfirm = () => {
    if (user) {
      updateUser({ location: selectedCity });
      navigate('/success');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header title="Step 2 of 4" />
      <main className="flex-1 flex flex-col px-5 pb-32">
        <div className="flex flex-col gap-2 pt-4 pb-6">
          <h1 className="text-3xl font-bold leading-tight">Where do you play?</h1>
          <p className="text-slate-400 text-base">Set your home base to find teams, tournaments, and matches near you.</p>
        </div>

        {/* City Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-400 mb-2 block">Chọn thành phố</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 h-14 outline-none border border-white/10 focus:border-primary transition-colors text-white"
          >
            {vietnamCities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent z-30 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <button onClick={handleConfirm} className="w-full h-14 rounded-xl bg-primary hover:bg-primary-hover text-white text-lg font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export const RegistrationSuccess: React.FC = () => {
  const navigate = useNavigate();
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
        <h1 className="text-4xl font-extrabold mb-3">You're In!</h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          Your account has been created successfully. Get ready to find your squad.
        </p>
      </div>

      <div className="w-full glass-panel p-1 rounded-2xl relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] mb-8 border border-white/5 bg-white/5">
        <div className="relative w-full h-40 bg-cover bg-center rounded-xl overflow-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex items-end justify-between">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffd700] text-black uppercase tracking-wider mb-1 inline-block">New</span>
              <p className="text-white font-bold text-lg">Pro League Access</p>
              <p className="text-slate-300 text-xs">Unlocked for your profile</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 z-10">
        <button onClick={() => navigate('/home')} className="w-full h-14 rounded-xl bg-primary hover:bg-primary-hover text-white text-lg font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          Find a Game
        </button>
        <button onClick={() => navigate('/profile')} className="w-full h-14 rounded-xl bg-transparent border border-white/20 text-white text-lg font-bold hover:bg-white/5 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          Edit Profile
        </button>
      </div>
    </div>
  );
};