import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout';

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
            onClick={() => navigate('/auth')}
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
  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
       <Header transparent />
       <main className="flex-1 px-6 pt-4 pb-8 flex flex-col">
         {/* Title */}
         <div className="mb-8">
           <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Welcome <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Back!</span></h1>
           <p className="text-slate-400 font-medium">Let's get you back on the court.</p>
         </div>

         {/* Form */}
         <div className="space-y-5 mb-8">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 ml-1 tracking-wider">EMAIL</label>
              <div className="relative group">
                <span className="absolute left-4 top-3.5 text-slate-500 material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">mail</span>
                <input type="email" placeholder="name@example.com" className="w-full bg-surface border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 ml-1 tracking-wider">PASSWORD</label>
              <div className="relative group">
                <span className="absolute left-4 top-3.5 text-slate-500 material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                <input type="password" placeholder="Enter your password" className="w-full bg-surface border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                <button className="absolute right-4 top-3.5 text-slate-500 hover:text-white text-[10px] font-bold tracking-wider py-1">SHOW</button>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">Forgot Password?</button>
            </div>
         </div>

         {/* Main Action */}
         <button onClick={() => navigate('/home')} className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all mb-8 flex items-center justify-center gap-2 group">
           Log In
           <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
         </button>

         {/* Divider */}
         <div className="relative flex py-2 items-center mb-8">
           <div className="flex-grow border-t border-white/10"></div>
           <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-wider">Or continue with</span>
           <div className="flex-grow border-t border-white/10"></div>
         </div>

         {/* Social Login */}
         <div className="grid grid-cols-2 gap-4 mb-auto">
           <button className="flex items-center justify-center gap-2 bg-surface border border-white/10 hover:bg-white/5 hover:border-white/20 py-3.5 rounded-xl transition-all group">
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
             <span className="font-bold text-sm">Google</span>
           </button>
           <button className="flex items-center justify-center gap-2 bg-surface border border-white/10 hover:bg-white/5 hover:border-white/20 py-3.5 rounded-xl transition-all group">
             <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">apple</span>
             <span className="font-bold text-sm">Apple</span>
           </button>
         </div>

         {/* Footer */}
         <div className="pt-6 text-center border-t border-white/5">
           <p className="text-slate-400 text-sm">Don't have an account? <span onClick={() => navigate('/create-profile')} className="text-white font-bold cursor-pointer hover:underline">Sign Up</span></p>
         </div>
       </main>
    </div>
  );
};

export const CreateProfile: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSports, setSelectedSports] = useState<string[]>(['Basketball']);

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header />
      <main className="flex-1 px-6 pt-4 pb-32">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-2">
            Let's get you <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">in the game.</span>
          </h1>
          <p className="text-slate-400 font-medium">Create your athlete profile to start connecting.</p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="relative group cursor-pointer">
            <div className="w-32 h-32 rounded-full bg-surface flex items-center justify-center overflow-hidden border-4 border-surface shadow-xl relative">
              <span className="material-symbols-outlined text-5xl text-slate-500">person</span>
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-full shadow-lg border-4 border-background flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">photo_camera</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">First Name</label>
              <input type="text" placeholder="e.g. Alex" className="w-full bg-surface border border-white/5 rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Last Name</label>
              <input type="text" placeholder="e.g. Morgan" className="w-full bg-surface border border-white/5 rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500 text-white" />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300 ml-1">What do you play?</label>
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Select all</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {['Basketball', 'Soccer', 'Tennis', 'Gym', 'Running'].map((sport) => {
                const isSelected = selectedSports.includes(sport);
                return (
                  <button 
                    key={sport}
                    onClick={() => toggleSport(sport)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all active:scale-95 ${
                      isSelected 
                      ? 'bg-gradient-to-br from-[#FFD700] to-[#32CD32] text-black shadow-lg shadow-green-900/20 font-bold' 
                      : 'bg-surface border border-white/5 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <span>{sport}</span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs text-primary font-bold">check</span>
                      </div>
                    )}
                  </button>
                );
              })}
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-slate-600 text-slate-500 font-medium hover:text-primary hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-40 max-w-md mx-auto">
        <button onClick={() => navigate('/set-location')} className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all">
          Continue
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export const SetLocation: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header title="Step 2 of 4" />
      <main className="flex-1 flex flex-col px-5 pb-32">
        <div className="flex flex-col gap-2 pt-4 pb-6">
          <h1 className="text-3xl font-bold leading-tight">Where do you play?</h1>
          <p className="text-slate-400 text-base">Set your home base to find teams, tournaments, and matches near you.</p>
        </div>

        <div className="relative mb-4">
          <div className="flex items-center bg-surface border border-white/5 rounded-xl px-4 h-14 focus-within:ring-2 focus-within:ring-primary transition-all">
            <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
            <input type="text" placeholder="Search city, zip, or venue..." className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500 h-full" />
          </div>
        </div>

        <button className="flex items-center gap-4 bg-surface p-3 rounded-xl mb-6 hover:bg-white/5 transition-colors border border-white/5">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 h-10 w-10">
            <span className="material-symbols-outlined">my_location</span>
          </div>
          <div className="flex flex-col items-start flex-1 text-left">
            <p className="text-white font-medium">Use my current location</p>
          </div>
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </button>

        <div className="flex-1 w-full min-h-[300px] rounded-2xl overflow-hidden relative shadow-lg border border-white/10 group">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1774&q=80" alt="Map" className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
          <div className="absolute inset-0 flex items-center justify-center pb-8">
            <div className="relative flex flex-col items-center">
              <div className="absolute w-12 h-12 bg-primary/30 rounded-full animate-ping"></div>
              <span className="material-symbols-outlined text-primary text-5xl drop-shadow-lg z-20">location_on</span>
              <div className="w-4 h-1.5 bg-black/50 rounded-full blur-[2px] mt-[-6px]"></div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-surface/90 backdrop-blur-md border border-white/10 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sm text-slate-300">navigation</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Selected</p>
              <p className="text-sm text-white font-medium truncate">San Francisco, CA</p>
            </div>
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent z-30 max-w-md mx-auto">
        <button onClick={() => navigate('/success')} className="w-full h-14 rounded-xl bg-primary hover:bg-primary-hover text-white text-lg font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
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