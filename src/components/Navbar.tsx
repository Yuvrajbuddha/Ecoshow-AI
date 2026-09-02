import React from 'react';
import { ActiveTab } from '../types';
import { 
  Camera, 
  Sparkles, 
  MessageSquare, 
  BarChart3, 
  MapPin, 
  BookOpen, 
  ShieldCheck,
  Flame,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  streakDays: number;
  isDemoMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streakDays,
  isDemoMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'home', label: 'Home', icon: null },
    { tab: 'scan', label: 'Scan Waste', icon: <Camera className="w-4 h-4 text-emerald-600" /> },
    { tab: 'chat', label: 'Ask AI', icon: <MessageSquare className="w-4 h-4" /> },
    { tab: 'impact', label: 'My Impact', icon: <BarChart3 className="w-4 h-4" /> },
    { tab: 'centers', label: 'Disposal Centers', icon: <MapPin className="w-4 h-4" /> },
    { tab: 'guide', label: 'Waste Guide', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          id="nav-logo-btn"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center text-white shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform">
            <span className="text-lg">🌿</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 font-['Space_Grotesk',sans-serif]">
                EcoSort<span className="text-emerald-600">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              AI Waste Segregation Assistant
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                id={`nav-link-${item.tab}`}
                onClick={() => setActiveTab(item.tab)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions (Streak, Responsible AI, Quick Scan CTA) */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Streak Indicator */}
          <div
            title="7-Day Sustainable Sorting Streak"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-bold"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{streakDays}d Streak</span>
          </div>

          {/* Responsible AI Link */}
          <button
            id="nav-responsible-ai-btn"
            onClick={() => setActiveTab('responsible-ai')}
            className={`p-2 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
              activeTab === 'responsible-ai'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Responsible AI & Transparency Principles"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden xl:inline">Responsible AI</span>
          </button>

          {/* Primary Quick CTA: Scan Waste */}
          <button
            id="nav-cta-scan"
            onClick={() => setActiveTab('scan')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-semibold shadow-md shadow-emerald-700/20 hover:shadow-lg hover:shadow-emerald-700/30 transition-all flex items-center gap-2 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Waste</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{streakDays}d</span>
          </div>
          <button
            id="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu (when open) */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => {
                setActiveTab(item.tab);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 ${
                activeTab === item.tab
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-start">
            <button
              onClick={() => {
                setActiveTab('responsible-ai');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Responsible AI
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
