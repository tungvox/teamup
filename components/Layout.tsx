import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon, label }: { path: string; icon: string; label: string }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center gap-1 p-2 w-16 group transition-colors ${
        isActive(path) ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <span className={`material-symbols-outlined text-[26px] ${isActive(path) ? 'font-variation-settings-fill' : ''}`}>
        {icon}
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <nav className="sticky bottom-0 z-50 w-full bg-surface/95 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-2">
      <div className="flex justify-around items-center h-16">
        <NavItem path="/home" icon="home" label="Home" />
        <NavItem path="/my-games" icon="sports_score" label="My Games" />
        <div className="relative -top-5">
           <button onClick={() => navigate('/event/create')} className="h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex items-center justify-center transform hover:scale-105 transition-all">
             <span className="material-symbols-outlined text-[28px]">add</span>
           </button>
        </div>
        <NavItem path="/messages" icon="chat_bubble" label="Chat" />
        <NavItem path="/profile" icon="person" label="Profile" />
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
  className = "" 
}) => (
  <img 
    src={src} 
    alt={alt} 
    className={`${size} rounded-full object-cover border-2 border-surface ${className}`}
  />
);

export const Badge: React.FC<{ children: React.ReactNode; type?: 'gold' | 'neon' | 'primary' | 'slate' }> = ({ children, type = 'slate' }) => {
  const styles = {
    gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black',
    neon: 'bg-gradient-to-r from-[#39FF14] to-[#32CD32] text-black',
    primary: 'bg-primary/20 text-primary border border-primary/20',
    slate: 'bg-surface text-slate-300 border border-white/10'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${styles[type]}`}>
      {children}
    </span>
  );
};