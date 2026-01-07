import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Avatar, Badge } from '../components/Layout';

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between px-4 py-3 bg-background/90 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="text-primary font-medium">Cancel</button>
        <h1 className="font-bold">Create Event</h1>
        <button className="text-primary/50 font-medium cursor-not-allowed">Save</button>
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h2 className="text-lg font-bold mb-3">Sport Type</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <button className="flex items-center gap-2 bg-primary px-4 py-2 rounded-full shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-[20px]">sports_basketball</span>
              <span className="font-medium">Basketball</span>
            </button>
            {['Soccer', 'Tennis', 'Volleyball'].map(s => (
              <button key={s} className="flex items-center gap-2 bg-surface border border-white/10 px-4 py-2 rounded-full text-slate-400 shrink-0">
                <span className="font-medium">{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-400 ml-1 mb-1 block">Event Name</label>
            <input type="text" defaultValue="Downtown Hoop Session" className="w-full bg-surface rounded-xl px-4 h-12 outline-none border border-white/10 focus:border-primary transition-colors text-white" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-3">When & Where</h3>
            <div className="bg-surface rounded-xl overflow-hidden border border-white/10 divide-y divide-white/5">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-[20px]">calendar_today</span></div>
                  <span className="font-medium">Date</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium">Tomorrow, Oct 24 <span className="material-symbols-outlined text-[16px]">arrow_forward_ios</span></div>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><span className="material-symbols-outlined text-[20px]">schedule</span></div>
                  <span className="font-medium">Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/5 px-2 py-1 rounded text-sm">10:00 AM</span>
                  <span className="text-slate-500 text-sm">to</span>
                  <span className="bg-white/5 px-2 py-1 rounded text-sm">12:00 PM</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><span className="material-symbols-outlined text-[20px]">location_on</span></div>
                    <span className="font-medium">Location</span>
                  </div>
                  <span className="text-primary text-sm font-medium">Edit</span>
                </div>
                <div className="h-32 rounded-lg bg-slate-800 relative overflow-hidden group">
                  <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b" className="w-full h-full object-cover opacity-60" alt="map" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-3 flex flex-col justify-end">
                    <p className="font-medium text-sm">Lincoln Park Courts</p>
                    <p className="text-xs text-slate-400">Chicago, IL • 2.4 mi away</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">Details</h3>
            <div className="bg-surface rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-end mb-4">
                <label className="font-medium">Total Spots</label>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">10</span>
                  <span className="text-sm text-slate-500">players</span>
                </div>
              </div>
              <div className="relative w-full h-2 bg-white/10 rounded-full mb-6">
                <div className="absolute left-0 top-0 h-full w-1/3 bg-primary rounded-full"></div>
                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow border-2 border-primary"></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <p className="font-medium">Competitive Mode</p>
                  <p className="text-xs text-slate-500">Only matching skill levels can join</p>
                </div>
                <div className="w-12 h-7 bg-white/10 rounded-full relative">
                  <div className="absolute left-1 top-1 w-5 h-5 bg-slate-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <div className="p-4 bg-background border-t border-white/10">
        <button onClick={() => navigate('/event/created')} className="w-full h-14 bg-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add_circle</span> Create Event
        </button>
      </div>
    </div>
  );
};

export const EventCreated: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-screen bg-background justify-between pb-10 pt-10 px-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 mb-6 relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h1 className="text-4xl font-extrabold mb-2">Game On!</h1>
        <p className="text-slate-400">Your squad is ready to be assembled. Event created successfully!</p>
      </div>

      <div className="w-full bg-surface border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="h-40 relative">
          <img src="https://images.unsplash.com/photo-1575361204480-aadea25e6e68" className="w-full h-full object-cover" alt="Event" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
            <span className="material-symbols-outlined text-green-400 text-xs">group</span>
            <span className="text-[10px] font-bold uppercase">3 Spots Open</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold leading-tight">Sunday Morning Football</h2>
              <p className="text-primary text-sm">Touchdown Titans</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-green-400 p-[1px] rounded-lg">
              <div className="bg-black/80 px-2 py-1 rounded-[7px]">
                <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400">GOLD LEAGUE</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">calendar_month</span></div>
              <div><p className="text-xs text-slate-400">Date & Time</p><p className="font-medium text-sm">Oct 24, 10:00 AM</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">location_on</span></div>
              <div><p className="text-xs text-slate-400">Location</p><p className="font-medium text-sm">Central Park Field 3</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar src="https://i.pravatar.cc/150?u=p1" size="w-8 h-8" className="ring-2 ring-background" />
            <Avatar src="https://i.pravatar.cc/150?u=p2" size="w-8 h-8" className="ring-2 ring-background" />
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs ring-2 ring-background">+</div>
          </div>
          <span className="text-sm font-medium">Invite your crew</span>
        </div>
        <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span className="material-symbols-outlined text-sm">arrow_forward</span></button>
      </div>

      <div className="space-y-3 w-full">
        <button onClick={() => navigate('/event/manage/123')} className="w-full py-4 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">visibility</span> View Event Details
        </button>
        <button onClick={() => navigate('/home')} className="w-full py-4 bg-transparent border border-white/20 rounded-xl font-medium hover:bg-white/5">Return to Dashboard</button>
      </div>
    </div>
  );
};

export const OrganizerDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">share</span></button>
            <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">edit</span></button>
          </div>
        </div>
        <div className="px-5 pb-4">
          <h1 className="text-2xl font-extrabold leading-tight">Saturday 5v5 Scrimmage</h1>
          <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
            <span className="material-symbols-outlined text-[16px]">location_on</span> Central Park, Field 4 • 10:00 AM
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="bg-surface border border-white/5 p-5 rounded-2xl">
          <div className="flex justify-between items-end mb-3">
            <span className="font-bold">Roster Status</span>
            <span className="text-sm text-slate-400">8/10 Confirmed</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
            <div className="h-full w-[80%] bg-gradient-to-r from-yellow-400 to-green-400"></div>
          </div>
          <p className="text-xs text-slate-500">2 spots remaining. Promote your event to fill up fast!</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold flex items-center gap-2">Pending Requests <span className="text-primary text-base">(2)</span></h3>
            <button className="text-sm text-primary font-bold">View All</button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Marcus Johnson', role: 'Midfielder', tag: 'MVP', lvl: '5' },
              { name: 'Sarah Lee', role: 'Goalkeeper', tag: 'NEW', lvl: null }
            ].map((p, i) => (
              <div key={i} className="bg-surface p-4 rounded-2xl border border-white/5 flex gap-4 items-center">
                <div className="relative">
                  <Avatar src={`https://i.pravatar.cc/150?u=req${i}`} size="w-14 h-14" />
                  {p.lvl && <div className="absolute -bottom-1 -right-1 bg-black text-[10px] font-bold px-1 rounded border border-white/20">LVL {p.lvl}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold truncate">{p.name}</h4>
                    <span className={`text-[10px] font-bold px-1.5 rounded ${p.tag === 'MVP' ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>{p.tag}</span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{p.role}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20"><span className="material-symbols-outlined text-[20px]">close</span></button>
                  <button className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20"><span className="material-symbols-outlined text-[20px]">check</span></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold flex items-center gap-2">Confirmed Players <span className="text-slate-400 text-base font-normal">(8)</span></h3>
            <button className="text-sm text-primary font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">chat</span> Message All</button>
          </div>
          <div className="bg-surface rounded-3xl border border-white/5 divide-y divide-white/5">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={`https://i.pravatar.cc/150?u=conf${i}`} />
                  <div>
                    <p className="font-semibold text-sm">Player Name</p>
                    <p className="text-xs text-slate-400">Position</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${i === 3 ? 'bg-white/5 text-slate-400' : 'bg-green-500/10 text-green-500'}`}>
                  {i !== 3 && <span className="material-symbols-outlined text-[14px]">paid</span>}
                  {i === 3 ? 'Pending' : 'Paid'}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-3 text-primary font-bold text-sm mt-2">View All 8 Players</button>
        </div>
      </div>
    </div>
  );
};

export const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-background min-h-screen flex flex-col relative pb-24">
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 bg-white/10 backdrop-blur-md border-b border-white/5">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-lg">Event Details</h2>
        <button className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur"><span className="material-symbols-outlined text-[20px]">ios_share</span></button>
      </div>

      <div className="relative w-full h-[300px] shrink-0">
        <img src="https://images.unsplash.com/photo-1551972873-b7e8754e8e26" className="w-full h-full object-cover" alt="Court" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
        <button className="absolute bottom-6 right-4 bg-white text-black px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg">
          <span className="material-symbols-outlined text-primary text-[20px]">directions</span> Get Directions
        </button>
      </div>

      <div className="-mt-6 bg-background rounded-t-[24px] relative px-5 pt-8 pb-4 border-t border-white/5">
        <div className="flex gap-2 mb-2">
          <span className="bg-green-500/20 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-xs font-bold">Open</span>
          <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded text-xs font-bold">5v5</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight mb-4">Saturday Morning Hoops</h1>
        
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0"><span className="material-symbols-outlined">calendar_month</span></div>
            <div>
              <p className="font-bold">Saturday, Oct 24</p>
              <p className="text-sm text-slate-400">10:00 AM - 12:00 PM</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0"><span className="material-symbols-outlined">location_on</span></div>
            <div>
              <p className="font-bold">Central Park Courts</p>
              <p className="text-sm text-slate-400">North Entrance, Court #3</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <div className="bg-surface border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">payments</span>
            <span className="text-sm font-semibold text-slate-300">$5 Entry</span>
          </div>
          <div className="bg-surface border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">leaderboard</span>
            <span className="text-sm font-semibold text-slate-300">Intermediate</span>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-green-400 text-black rounded-lg px-3 py-2 flex items-center gap-2 font-bold shadow-lg shadow-green-500/20">
            <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
            <span className="text-sm">High Intensity</span>
          </div>
        </div>

        <div className="h-px bg-white/5 w-full my-6"></div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Current Roster</h3>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">8/10 Players</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[60px]">
                <div className="relative">
                  <Avatar src={`https://i.pravatar.cc/150?u=r${i}`} size="w-16 h-16" className={i===1 ? 'border-yellow-400' : ''} />
                  {i===1 && <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 rounded border border-white">CPT</div>}
                </div>
                <span className="text-xs font-medium text-slate-300">Name</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2 min-w-[60px]">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 bg-white/5 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <span className="text-xs font-medium text-slate-500">Open</span>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button className="flex-1 bg-surface border border-white/10 h-12 rounded-lg font-bold text-primary flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined text-[20px]">ios_share</span> Invite Friends
            </button>
            <button className="flex-1 bg-primary/10 border border-primary/20 h-12 rounded-lg font-bold text-primary flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">chat</span> Team Chat
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-ping"></span>
            </button>
          </div>
        </div>

        <div className="mt-8 mb-4">
          <h3 className="text-lg font-bold mb-2">About the Game</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Casual but competitive run. We play to 15, win by 2. Bring both a white and black shirt if possible so we can split teams easily. See you on the court!</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-surface/90 backdrop-blur-md border-t border-white/10 z-30 max-w-md mx-auto">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
            <span className="text-xl font-bold">$5.00</span>
          </div>
          <button className="flex-1 h-14 bg-primary hover:bg-primary-hover rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">Request to Join</button>
        </div>
        <p className="text-center text-[10px] text-slate-500">Your spot is held for 10 mins after request</p>
      </div>
    </div>
  );
};

export const EditEvent: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header title="Edit Event" rightAction={<button className="text-primary font-bold">Save</button>} />
      
      <main className="flex-1 p-4 space-y-6">
        <div className="relative h-40 rounded-xl overflow-hidden group">
          <img src="https://images.unsplash.com/photo-1546519638-68e109498ffc" className="w-full h-full object-cover" alt="banner" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-4 left-4">
            <span className="bg-gradient-to-r from-yellow-400 to-green-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Basketball</span>
            <h2 className="text-2xl font-bold mt-1">Sunday Morning Hoops</h2>
            <p className="text-sm opacity-90">Oct 24 • 10:00 AM</p>
          </div>
          <button className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur rounded-full"><span className="material-symbols-outlined text-sm">edit</span></button>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">The Basics</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">EVENT NAME</label>
              <div className="relative">
                <input type="text" defaultValue="Sunday Morning Hoops" className="w-full bg-surface border border-white/10 rounded-lg h-12 px-4 focus:border-primary outline-none" />
                <span className="absolute right-4 top-3 text-slate-400 material-symbols-outlined text-[20px]">edit</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">SPORT TYPE</label>
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                <div className="w-20 h-20 bg-surface rounded-xl border-2 border-primary flex flex-col items-center justify-center text-primary relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/10"></div>
                  <span className="material-symbols-outlined text-3xl mb-1">sports_basketball</span>
                  <span className="text-xs font-bold">Hoops</span>
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(57,255,20,0.6)]"></div>
                </div>
                {['Soccer', 'Tennis', 'Volleyball', 'Run'].map((s, i) => (
                  <div key={i} className="w-20 h-20 bg-surface rounded-xl border border-white/10 flex flex-col items-center justify-center text-slate-400 hover:border-white/30 transition-colors">
                    <span className="material-symbols-outlined text-3xl mb-1">{i===0?'sports_soccer':i===1?'sports_tennis':i===2?'sports_volleyball':'directions_run'}</span>
                    <span className="text-xs font-medium">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Logistics</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">DATE</label>
              <div className="bg-surface border border-white/10 rounded-lg h-12 flex items-center px-4 justify-between">
                <span>Oct 24, 2023</span>
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">TIME</label>
              <div className="bg-surface border border-white/10 rounded-lg h-12 flex items-center px-4 justify-between">
                <span>10:00 AM</span>
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
              </div>
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-white/10">
            <div className="flex items-center gap-3 p-3 bg-surface border-b border-white/5">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <span className="flex-1">Central Park Courts</span>
              <span className="material-symbols-outlined text-slate-400">search</span>
            </div>
            <div className="h-32 relative">
              <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83" className="w-full h-full object-cover opacity-60" alt="map" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse ring-4 ring-primary/30 text-white"><span className="material-symbols-outlined text-sm">location_on</span></div>
              </div>
              <div className="absolute bottom-2 right-2 bg-surface/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded">Change Location</div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Roster Limit</h3>
            <span className="text-primary font-bold">10 Spots</span>
          </div>
          <div className="bg-surface border border-white/10 rounded-xl p-5">
            <div className="flex justify-between text-xs text-slate-400 font-bold mb-4"><span>Min: 2</span><span>Max: 50</span></div>
            <div className="relative h-2 bg-white/10 rounded-full mb-3">
              <div className="absolute left-0 top-0 h-full w-[20%] bg-gradient-to-r from-yellow-400 to-green-400 rounded-full"></div>
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-primary rounded-full shadow cursor-grab flex items-center justify-center"><div className="w-2 h-2 bg-primary rounded-full"></div></div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-sm">info</span> Current signups: 4 players</p>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <button className="w-full h-12 bg-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"><span className="material-symbols-outlined">save</span> Save Changes</button>
          <button className="w-full h-12 bg-transparent border border-white/10 rounded-xl font-bold text-slate-300">Cancel</button>
          <button className="w-full h-12 flex items-center justify-center gap-2 text-danger font-bold text-sm hover:bg-danger/5 rounded-xl"><span className="material-symbols-outlined">delete</span> Delete Event</button>
        </div>
      </main>
    </div>
  );
};