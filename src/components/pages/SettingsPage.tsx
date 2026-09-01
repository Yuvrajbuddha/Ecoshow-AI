import React, { useState } from 'react';
import { 
  Settings, 
  Sparkles, 
  MapPin, 
  Trash2, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Layers,
  Sliders
} from 'lucide-react';

interface SettingsPageProps {
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  onResetUserData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDemoMode,
  setIsDemoMode,
  onResetUserData,
}) => {
  const [region, setRegion] = useState('global');
  const [streamType, setStreamType] = useState('single');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = () => {
    setSavedMessage('Settings saved successfully!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
          <Settings className="w-3.5 h-3.5 text-emerald-600" />
          <span>Application Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
          EcoSort AI Settings
        </h1>
        <p className="text-slate-500 text-sm">
          Configure AI intelligence modes, municipal segregation rules, and local preferences.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* 1. AI ENGINE MODE CONFIGURATION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>AI Intelligence Engine Mode</span>
            </h3>
            <p className="text-xs text-slate-500">
              Switch between real live server-side Gemini AI and offline simulated demo mode.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!isDemoMode}
              onChange={(e) => setIsDemoMode(!e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>
            Current Status:{' '}
            <strong className={!isDemoMode ? 'text-emerald-700' : 'text-amber-700'}>
              {!isDemoMode ? 'Real AI (Gemini Server-Side Active)' : 'Demo Simulation Mode'}
            </strong>
          </span>
          <span className="text-[11px] text-slate-400">
            {!isDemoMode ? 'Uses Gemini 3.7 Flash' : 'High-speed instant mock responses'}
          </span>
        </div>
      </div>

      {/* 2. REGIONAL DISPOSAL GUIDELINES */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="space-y-0.5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Regional Municipal Ruleset</span>
          </h3>
          <p className="text-xs text-slate-500">
            Tailor AI categorization rules to match your local regional waste jurisdiction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'global', name: 'Global Standard', desc: 'ISO/UNEP baseline circular rules' },
            { id: 'na', name: 'North America', desc: 'Single-stream curbside & drop-offs' },
            { id: 'eu', name: 'European Union', desc: 'Dual-stream, Green Dot & WEEE directives' },
          ].map((reg) => (
            <button
              key={reg.id}
              onClick={() => setRegion(reg.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                region === reg.id
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm font-bold">{reg.name}</div>
              <div className="text-xs text-slate-500 mt-1">{reg.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. RESIDENTIAL STREAM SETUP */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="space-y-0.5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>Curbside Collection System</span>
          </h3>
          <p className="text-xs text-slate-500">
            Define what bins you have available at home for tailored recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'single', name: 'Single-Stream (Mixed Blue Bin)', desc: 'Paper, plastics #1-2, metals, and glass in one bin' },
            { id: 'dual', name: 'Dual/Multi-Stream Segregation', desc: 'Separate bins for paper/fiber and containers' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStreamType(st.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                streamType === st.id
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm font-bold">{st.name}</div>
              <div className="text-xs text-slate-500 mt-1">{st.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. USER DATA & RESET */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="space-y-0.5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Reset Local Activity Data</span>
          </h3>
          <p className="text-xs text-slate-500">
            Clear all tracked scans, streak counters, and gamification points from this browser.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset your impact statistics and streak?')) {
              onResetUserData();
              setSavedMessage('Activity metrics reset to initial state.');
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Impact Stats</span>
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
        >
          Save All Preferences
        </button>
      </div>
    </div>
  );
};
