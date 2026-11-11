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
  X,
  Leaf,
  Layers
  ,Search, Sun, Moon, Bell
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  streakDays: number;
  isDemoMode: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streakDays,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'home', label: 'Home', icon: null },
    { tab: 'scan', label: 'Scan Waste', icon: <Camera className="w-4 h-4 text-emerald-600" /> },
    { tab: 'history', label: 'History Gallery', icon: <Layers className="w-4 h-4 text-emerald-600" /> },
    { tab: 'chat', label: 'Ask AI', icon: <MessageSquare className="w-4 h-4 text-emerald-600" /> },
    { tab: 'impact', label: 'My Impact', icon: <BarChart3 className="w-4 h-4 text-emerald-600" /> },
    { tab: 'guide', label: 'Waste Guide', icon: <BookOpen className="w-4 h-4 text-emerald-600" /> },
    { tab: 'centers', label: 'Disposal Centers', icon: <MapPin className="w-4 h-4 text-emerald-600" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/75 backdrop-blur-xl border-b border-slate-200/70 transition-all shadow-[0_1px_14px_rgba(15,23,42,0.04)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-[72px] flex items-center justify-between">
        {/* Brand Logo */}
        <button
          id="nav-logo-btn"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-[14px] bg-[#064E3B] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-all duration-200 border border-emerald-400/25">
            <Leaf className="w-5 h-5 text-emerald-100 fill-emerald-200/30" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[19px] tracking-[-0.03em] text-slate-950">
                EcoSort<span className="text-emerald-600">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                Multimodal • IBM AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide hidden sm:block">
            AI sustainability intelligence
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                id={`nav-link-${item.tab}`}
                onClick={() => setActiveTab(item.tab)}
                className={`px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions (Streak, Responsible AI, Quick Scan CTA) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden xl:flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-700"
            aria-label="Open command palette"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="ml-2 rounded border border-slate-200 px-1.5 py-0.5 text-[9px] text-slate-400">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="xl:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
            aria-label="Open command palette"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            type="button"
            className="relative hidden xl:flex rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-lime-500" />
          </button>
          {/* Streak Indicator */}
          <div
            title="Sustainable Sorting Streak"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{streakDays}d Streak</span>
          </div>

          {/* Responsible AI Link */}
          <button
            id="nav-responsible-ai-btn"
            onClick={() => setActiveTab('responsible-ai')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              activeTab === 'responsible-ai'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'text-slate-600 border-slate-200/80 hover:bg-slate-100/80 hover:text-slate-900'
            }`}
            title="Responsible AI & Transparency Principles"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="hidden xl:inline">Responsible AI</span>
          </button>

          {/* Primary Quick CTA: Scan Waste */}
          <button
            id="nav-cta-scan"
            onClick={() => setActiveTab('scan')}
            className="px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#064E3B] text-white text-sm font-bold shadow-md shadow-emerald-900/20 hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 border border-emerald-500/20"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Waste</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{streakDays}d</span>
          </div>
          <button
            id="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu (when open) */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1.5 shadow-xl animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => {
                setActiveTab(item.tab);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                activeTab === item.tab
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                setActiveTab('responsible-ai');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Responsible AI Principles</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('scan');
                setMobileMenuOpen(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
