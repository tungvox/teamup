import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Header } from '../components/Layout';

export const ChatDetail: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 py-3">
        <Header onBack={() => {}} transparent />
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar src="https://i.pravatar.cc/150?u=marcus" size="w-10 h-10" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <h2 className="font-bold text-sm">Marcus Johnson</h2>
            <span className="material-symbols-outlined text-yellow-500 text-[14px] filled">verified</span>
          </div>
          <p className="text-[10px] text-primary font-bold uppercase tracking-wide">Point Guard • Active Now</p>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"><span className="material-symbols-outlined">info</span></button>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-center"><span className="text-xs text-slate-500 bg-surface px-3 py-1 rounded-full">Today, 9:41 AM</span></div>
        
        <div className="flex gap-2 items-end">
          <Avatar src="https://i.pravatar.cc/150?u=marcus" size="w-8 h-8" />
          <div className="flex flex-col gap-1 max-w-[75%]">
            <div className="bg-surface rounded-2xl rounded-bl-none px-4 py-3 text-sm">Hey! Are you still down for the 5v5 on Saturday?</div>
            <span className="text-[10px] text-slate-500 ml-1">9:42 AM</span>
          </div>
        </div>

        <div className="flex gap-2 items-end flex-row-reverse">
          <div className="flex flex-col gap-1 items-end max-w-[75%]">
            <div className="bg-primary text-white rounded-2xl rounded-br-none px-4 py-3 text-sm shadow-lg shadow-primary/20">Absolutely. What time is tip-off?</div>
            <div className="flex items-center gap-1"><span className="text-[10px] text-slate-500">9:43 AM</span><span className="material-symbols-outlined text-[14px] text-primary">done_all</span></div>
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <Avatar src="https://i.pravatar.cc/150?u=marcus" size="w-8 h-8" />
          <div className="flex flex-col gap-1 max-w-[75%]">
            <div className="bg-surface rounded-2xl rounded-bl-none px-4 py-3 text-sm">6 PM at the downtown court. Bring your A-game. 🏀</div>
            <span className="text-[10px] text-slate-500 ml-1">9:45 AM</span>
          </div>
        </div>

        <div className="flex gap-2 items-end flex-row-reverse">
          <div className="flex flex-col gap-1 items-end max-w-[75%]">
            <div className="bg-primary text-white rounded-2xl rounded-br-none px-4 py-3 text-sm shadow-lg shadow-primary/20">You know I will. See you there.</div>
            <div className="flex items-center gap-1"><span className="text-[10px] text-slate-500">Read 9:46 AM</span><span className="material-symbols-outlined text-[14px] text-primary">done_all</span></div>
          </div>
        </div>
      </main>

      <div className="p-4 bg-background/95 backdrop-blur border-t border-white/5 flex gap-3 items-end">
        <button className="h-10 w-10 rounded-full text-slate-400 hover:bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined">add_circle</span></button>
        <div className="flex-1 relative">
          <input type="text" placeholder="Type a message..." className="w-full bg-surface rounded-full h-10 pl-4 pr-10 outline-none focus:ring-1 focus:ring-primary/50 text-sm" />
          <span className="absolute right-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">sentiment_satisfied</span>
        </div>
        <button className="h-10 w-10 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center transform active:scale-95 transition-transform"><span className="material-symbols-outlined text-[20px] ml-0.5">send</span></button>
      </div>
    </div>
  );
};

export const NotificationSettings: React.FC = () => {
  const ToggleItem = ({ label, icon, color, active = false }: { label: string, icon: string, color: string, active?: boolean }) => (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 text-${color}-500 flex items-center justify-center`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <div className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors ${active ? 'bg-primary justify-end' : 'bg-slate-700 justify-start'} flex`}>
        <div className="w-[27px] h-full bg-white rounded-full shadow-sm"></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-white">
      <Header title="Notification Settings" />
      <main className="flex-1 p-4 space-y-6 max-w-md mx-auto w-full">
        <div className="bg-surface rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center"><span className="material-symbols-outlined">notifications_paused</span></div>
              <div><p className="font-bold">Pause All</p><p className="text-xs text-slate-400">Mute all notifications for 24h</p></div>
            </div>
            <div className="w-[51px] h-[31px] bg-slate-700 rounded-full p-0.5"><div className="w-[27px] h-full bg-white rounded-full shadow-sm"></div></div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Match & Event Activity</h3>
          <div className="bg-surface rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            <ToggleItem label="New Game Invites" icon="confirmation_number" color="primary" active />
            <ToggleItem label="Score Updates" icon="scoreboard" color="green" active />
            <ToggleItem label="Roster Changes" icon="groups" color="purple" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Social</h3>
          <div className="bg-surface rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
            <ToggleItem label="Friend Requests" icon="person_add" color="pink" active />
            <ToggleItem label="Direct Messages" icon="chat_bubble" color="blue" active />
            <ToggleItem label="Team Announcements" icon="campaign" color="yellow" active />
          </div>
        </div>

        <div className="bg-surface rounded-xl p-4 flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><span className="material-symbols-outlined">bedtime</span></div>
            <div><p className="font-medium">Quiet Hours</p><p className="text-xs text-slate-400">10:00 PM - 07:00 AM</p></div>
          </div>
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
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
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-lg">Rate Players</h2>
        <button className="text-sm font-bold text-slate-400 hover:text-white">Skip</button>
      </div>

      <main className="flex-1 p-4 pb-32 space-y-6">
        <div className="relative h-48 rounded-xl overflow-hidden shadow-lg group">
          <img src="https://images.unsplash.com/photo-1546519638-68e109498ffc" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="match" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-5 flex flex-col justify-end">
            <div className="flex justify-between items-end">
              <div>
                <span className="bg-white/20 backdrop-blur px-2 py-1 rounded-full text-xs font-medium border border-white/10 mb-2 inline-block">Final Score</span>
                <h3 className="text-2xl font-bold">86 - 82</h3>
                <p className="text-sm text-slate-300">Varsity Basketball Match</p>
              </div>
              <div className="text-right text-xs text-slate-300 space-y-1">
                <div className="flex items-center justify-end gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> Aug 24</div>
                <div className="flex items-center justify-end gap-1"><span className="material-symbols-outlined text-[16px]">location_on</span> Central Court</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-1">Who was the MVP?</h2>
          <p className="text-sm text-slate-400">Rate your teammates to boost their reputation.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-surface rounded-xl p-4 border border-white/5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="relative">
                  <Avatar src="https://i.pravatar.cc/150?u=marcus" size="w-14 h-14" className="ring-2 ring-primary/20" />
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5"><span className="material-symbols-outlined text-primary text-sm bg-blue-900/30 rounded-full">verified</span></div>
                </div>
                <div>
                  <p className="font-bold text-base">Marcus Johnson</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Point Guard</p>
                </div>
              </div>
              <div className="flex gap-1 text-yellow-400"><span className="material-symbols-outlined text-[20px] fill-current">star</span><span className="material-symbols-outlined text-[20px] fill-current">star</span><span className="material-symbols-outlined text-[20px] fill-current">star</span><span className="material-symbols-outlined text-[20px] fill-current">star</span><span className="material-symbols-outlined text-[20px] fill-current">star</span></div>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                <span className="material-symbols-outlined text-[16px]">trophy</span> MVP
              </button>
              <button className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-medium">Playmaker</button>
              <button className="bg-slate-700 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300">Hustle</button>
            </div>
            <div className="bg-background rounded-full px-3 py-2 flex items-center gap-2 text-sm text-slate-400 border border-white/5">
              <span className="material-symbols-outlined text-[18px]">edit</span> Great game, nice passes!
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-white/5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <Avatar src="https://i.pravatar.cc/150?u=sarah" size="w-14 h-14" />
                <div>
                  <p className="font-bold text-base">Sarah Williams</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Center</p>
                </div>
              </div>
              <div className="flex gap-1 text-slate-600"><span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current">star</span><span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current">star</span><span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current">star</span><span className="material-symbols-outlined text-[20px] text-yellow-400 fill-current">star</span><span className="material-symbols-outlined text-[20px]">star</span></div>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button className="flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                <span className="material-symbols-outlined text-[16px]">handshake</span> Good Sport
              </button>
              <button className="bg-slate-700 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300">Defense</button>
              <button className="bg-slate-700 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300">Rebounds</button>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 w-full p-4 bg-gradient-to-t from-background via-background/90 to-transparent pb-8">
        <button className="w-full h-14 bg-primary rounded-full font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          Submit Ratings <span className="material-symbols-outlined">check_circle</span>
        </button>
      </div>
    </div>
  );
};