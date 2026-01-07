import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge } from '../components/Layout';

const games = [
  { id: 1, title: '3v3 Basketball Run', loc: 'Venice Courts', time: '18:00 Today', spots: 'Last Spot!', type: 'Basketball', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc' },
  { id: 2, title: '5v5 Futsal Pickup', loc: 'Downtown Gym', time: '19:30 Today', spots: '4/10 Spots', type: 'Soccer', img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974' },
  { id: 3, title: 'Sunrise Yoga', loc: 'City Park', time: '07:00 Tomorrow', spots: '8/20 Spots', type: 'Yoga', img: 'https://images.unsplash.com/photo-1544367563-12123d8975bd' },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 px-5 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
          <div>
            <p className="text-xs font-medium text-text-secondary">Welcome back,</p>
            <h2 className="text-lg font-bold leading-tight">Alex Johnson</h2>
          </div>
          <div className="ml-auto relative">
            <button 
              onClick={() => navigate('/settings/notifications')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-white hover:bg-surface-light/10 transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-danger border border-surface"></span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 py-6">
        <h1 className="text-2xl font-extrabold mb-4">Find your game</h1>
        <div className="relative group mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input className="block w-full rounded-2xl border-none bg-surface py-3.5 pl-12 pr-4 text-base font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 text-white" placeholder="Search events, courts..." type="text"/>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {['Nearby', 'Basketball', 'Soccer', 'This Week'].map((f, i) => (
            <button key={f} className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${i === 0 ? 'bg-white text-black' : 'bg-surface text-slate-300 border border-white/5'}`}>
              {i === 1 && <span className="material-symbols-outlined text-[18px] text-primary">sports_basketball</span>}
              {i === 2 && <span className="material-symbols-outlined text-[18px] text-green-500">sports_soccer</span>}
              {f}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Upcoming Games</h3>
          <button className="text-sm font-medium text-primary hover:text-primary-hover">See all</button>
        </div>

        <div className="flex flex-col gap-4">
          {games.map(game => (
            <div key={game.id} onClick={() => navigate(`/event/${game.id}`)} className="group relative flex flex-col gap-3 rounded-2xl bg-surface p-4 border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-light/5 text-primary border border-white/5">
                    <span className="material-symbols-outlined text-3xl">{game.type === 'Basketball' ? 'sports_basketball' : game.type === 'Soccer' ? 'sports_soccer' : 'self_improvement'}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{game.title}</h4>
                    <div className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-400">
                      <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span>{game.loc}</div>
                      <div className="h-1 w-1 rounded-full bg-slate-600"></div>
                      <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{game.time}</div>
                    </div>
                  </div>
                </div>
                <Badge type={game.spots.includes('Last') ? 'neon' : 'slate'}>{game.spots}</Badge>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex items-center -space-x-2">
                  <Avatar src="https://i.pravatar.cc/150?u=1" size="h-7 w-7" className="border-surface" />
                  <Avatar src="https://i.pravatar.cc/150?u=2" size="h-7 w-7" className="border-surface" />
                  <Avatar src="https://i.pravatar.cc/150?u=3" size="h-7 w-7" className="border-surface" />
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-slate-700 text-[10px] font-bold">+2</div>
                </div>
                <button className="rounded-lg bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors">Join Game</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MyGames: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/5 px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">My Games</h1>
          <button className="p-2 rounded-full hover:bg-white/5"><span className="material-symbols-outlined text-3xl">calendar_month</span></button>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
          {[11, 12, 13, 14, 15, 16].map((day, i) => (
            <button key={day} className={`snap-start flex-shrink-0 flex flex-col items-center justify-center w-[3.75rem] h-[4.75rem] rounded-2xl border transition-all ${i === 1 ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25 scale-105' : 'bg-surface border-white/5 text-slate-400 hover:border-primary/50'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{['Mon','Tue','Wed','Thu','Fri','Sat'][i]}</span>
              <span className="text-lg font-bold mt-0.5">{day}</span>
              {i === 2 && <span className="w-1 h-1 rounded-full bg-primary mt-1.5"></span>}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">Upcoming <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">3</span></h2>
          <button className="text-xs font-bold text-primary">See all</button>
        </div>

        <div onClick={() => navigate('/event/manage/1')} className="bg-surface rounded-2xl p-4 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-3">
              <Badge type="gold">Hosting</Badge>
              <Badge>Basketball</Badge>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">3v3 Pickup Session</h3>
              <div className="space-y-1 text-sm text-slate-400">
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">event</span> Tomorrow, 6:00 PM</div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">location_on</span> Central Park Courts</div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-primary h-9 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">Message Players</button>
                <button className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center"><span className="material-symbols-outlined text-sm">more_horiz</span></button>
              </div>
            </div>
            <div className="w-24 h-32 rounded-xl bg-cover bg-center relative overflow-hidden" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1519861531473-920026393112)'}}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-2 right-2 text-right">
                <div className="text-white font-bold text-xs">5/6</div>
                <div className="text-[9px] text-slate-300">Players</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-white/5 flex gap-4 items-center">
          <div className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1622279457486-62dcc4a431d6)'}}></div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-bold">Tennis Doubles</h3>
              <Badge type="neon">Joined</Badge>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span> City Club • Sat, 10 AM</div>
            <div className="mt-2 flex justify-between items-center">
              <div className="flex -space-x-2">
                <Avatar src="https://i.pravatar.cc/150?u=4" size="h-5 w-5" className="border-surface" />
                <Avatar src="https://i.pravatar.cc/150?u=5" size="h-5 w-5" className="border-surface" />
                <div className="h-5 w-5 rounded-full bg-white/10 border-2 border-surface flex items-center justify-center text-[8px]">+1</div>
              </div>
              <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">View Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Messages: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 pt-8 px-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold">Messages</h1>
          <button className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined">edit_square</span></button>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><span className="material-symbols-outlined text-[20px]">search</span></span>
          <input type="text" placeholder="Search teammates..." className="w-full bg-surface rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 border border-white/5 focus:border-primary/50 outline-none" />
        </div>
      </header>

      <div className="flex gap-4 px-5 py-4 overflow-x-auto no-scrollbar border-b border-white/5">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center bg-surface text-slate-400"><span className="material-symbols-outlined">add</span></div>
          <span className="text-xs text-slate-400">My Status</span>
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <div className={`w-[60px] h-[60px] rounded-full p-[2px] ${i===1 ? 'bg-gradient-to-tr from-primary to-[#39FF14]' : 'bg-surface border border-white/10'}`}>
              <img src={`https://i.pravatar.cc/150?u=${i+10}`} className="w-full h-full rounded-full object-cover border-2 border-background" alt="" />
            </div>
            <span className="text-xs text-white">Name</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        <div onClick={() => navigate('/chat/1')} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 cursor-pointer transition-colors relative">
          <div className="relative">
            <Avatar src="https://i.pravatar.cc/150?u=coach" size="h-14 w-14" />
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 border-2 border-background rounded-full w-5 h-5 flex items-center justify-center"><span className="material-symbols-outlined text-[12px] text-black font-bold">star</span></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <h3 className="font-bold text-white truncate">Coach Mike</h3>
              <span className="text-xs text-primary font-medium">2m ago</span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-white font-medium truncate pr-4">Practice is moved to 5 PM today. Don't be late!</p>
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 cursor-pointer transition-colors opacity-70">
          <Avatar src="https://i.pravatar.cc/150?u=sarah" size="h-14 w-14" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <h3 className="font-bold text-white truncate">Sarah Jenkins</h3>
              <span className="text-xs text-slate-500">Yesterday</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[16px]">done_all</span>
              <p className="text-sm text-slate-400 truncate">Great game last night! You were on fire 🔥</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col bg-background min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-4 py-3 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="font-bold">Profile</h1>
        <button className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined">settings</span></button>
      </header>

      <div className="flex flex-col items-center pt-6 px-4">
        <div className="relative mb-4">
          <div className="absolute -inset-1 bg-gradient-to-tr from-yellow-400 via-green-400 to-primary opacity-70 blur rounded-full"></div>
          <div className="relative">
            <Avatar src="https://i.pravatar.cc/150?u=alex" size="w-28 h-28" className="border-4 border-background" />
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-yellow-600 border border-white/20 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
            <span className="material-symbols-outlined text-[14px] text-white">military_tech</span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Pro Level 5</span>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold mt-4 text-center">Alex 'The Cannon' Doe</h2>
        <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
          <span className="material-symbols-outlined text-[16px] text-primary">location_on</span> San Francisco, CA
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 mt-8">
        <div className="bg-surface p-3 rounded-xl flex flex-col items-center border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Matches</span>
          <span className="text-2xl font-bold mt-1">42</span>
          <span className="text-[10px] text-green-400 bg-green-400/10 px-1.5 rounded mt-1">+12%</span>
        </div>
        <div className="bg-surface p-3 rounded-xl flex flex-col items-center border border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-yellow-400"></div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Reliability</span>
          <span className="text-2xl font-bold mt-1">98%</span>
          <span className="text-[10px] text-green-400 flex items-center gap-0.5 mt-1"><span className="material-symbols-outlined text-[10px]">trending_up</span> Top 5%</span>
        </div>
        <div className="bg-surface p-3 rounded-xl flex flex-col items-center border border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">MVPs</span>
          <span className="text-2xl font-bold mt-1">5</span>
          <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 rounded mt-1">+1</span>
        </div>
      </div>

      <div className="mt-8 px-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Trophy Case</h3>
          <button className="text-primary text-sm font-bold">View Collection</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {['target', 'shield', 'sports_soccer'].map((icon, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFF8D6] to-[#D4AF37] flex items-center justify-center shadow-lg border-2 border-white/10">
                <span className="material-symbols-outlined text-3xl text-[#8B6914]">{icon}</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400 text-center">Gold Tier</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 px-4">
        <h3 className="font-bold text-lg mb-4">Teammates (24)</h3>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar src={`https://i.pravatar.cc/150?u=tm${i}`} />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface"></div>
                </div>
                <div>
                  <p className="font-bold text-sm">Teammate Name</p>
                  <p className="text-xs text-slate-400">Pro Level {i+2}</p>
                </div>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[18px]">chat</span></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};