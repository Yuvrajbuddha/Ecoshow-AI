import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Camera,
  Command,
  Leaf,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface CommandPaletteProps {
  open: boolean;
  activeTab: ActiveTab;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

const commands: Array<{ tab: ActiveTab; label: string; description: string; icon: React.ReactNode; keywords: string }> = [
  { tab: 'scan', label: 'Scan waste', description: 'Identify an item with AI', icon: <Camera className="w-4 h-4" />, keywords: 'camera image classify upload' },
  { tab: 'impact', label: 'Open impact dashboard', description: 'Review your sustainability metrics', icon: <BarChart3 className="w-4 h-4" />, keywords: 'analytics carbon points stats' },
  { tab: 'chat', label: 'Ask EcoSort AI', description: 'Get grounded disposal guidance', icon: <MessageSquare className="w-4 h-4" />, keywords: 'assistant question help' },
  { tab: 'centers', label: 'Find disposal centers', description: 'Explore nearby drop-off options', icon: <MapPin className="w-4 h-4" />, keywords: 'map recycling location' },
  { tab: 'guide', label: 'Browse waste guide', description: 'Learn material-specific rules', icon: <BookOpen className="w-4 h-4" />, keywords: 'education materials recycle' },
  { tab: 'responsible-ai', label: 'Responsible AI', description: 'Review safety and transparency', icon: <ShieldCheck className="w-4 h-4" />, keywords: 'privacy safety ethics' },
  { tab: 'home', label: 'Go to home', description: 'Return to the EcoSort overview', icon: <Leaf className="w-4 h-4" />, keywords: 'landing overview' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  activeTab,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.description} ${command.keywords}`.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((index) => Math.min(index + 1, Math.max(filteredCommands.length - 1, 0)));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === 'Enter' && filteredCommands[selectedIndex]) {
        event.preventDefault();
        onNavigate(filteredCommands[selectedIndex].tab);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, onClose, onNavigate, open, selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/45 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="EcoSort command palette"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="w-5 h-5 text-emerald-600" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, actions, and guidance..."
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-400 sm:inline-flex">ESC</kbd>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close command palette">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {filteredCommands.length ? filteredCommands.map((command, index) => (
            <button
              type="button"
              key={command.tab}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => {
                onNavigate(command.tab);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                selectedIndex === index ? 'bg-emerald-50 text-emerald-950' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${selectedIndex === index ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {command.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{command.label}</span>
                <span className="block truncate text-xs text-slate-500">{command.description}</span>
              </span>
              {activeTab === command.tab && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Open</span>}
            </button>
          )) : (
            <div className="px-4 py-10 text-center">
              <Command className="mx-auto mb-2 h-5 w-5 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No matching actions</p>
              <p className="mt-1 text-xs text-slate-500">Try “scan”, “impact”, or “recycling”.</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-3 text-[10px] font-semibold text-slate-400">
          <span><kbd className="mr-1 rounded border border-slate-200 px-1">↑↓</kbd> Navigate</span>
          <span><kbd className="mr-1 rounded border border-slate-200 px-1">↵</kbd> Open</span>
          <span className="ml-auto">EcoSort command center</span>
        </div>
      </div>
    </div>
  );
};
