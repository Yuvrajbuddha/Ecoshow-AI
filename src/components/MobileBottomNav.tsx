import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  Home, 
  Camera, 
  MessageSquare, 
  BarChart3, 
  MoreHorizontal,
  MapPin,
  BookOpen,
  ShieldCheck,
  X,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  return (
    <>
      {/* More Drawer Overlay & Sheet */}
      <AnimatePresence>
        {moreDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl p-6 border-t border-slate-200 shadow-2xl lg:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌿</span>
                  <h3 className="font-bold text-slate-900 text-base">EcoSort AI Tools</h3>
                </div>
                <button
                  id="mobile-drawer-close"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 py-4">
                <button
                  id="mobile-drawer-history"
                  onClick={() => {
                    setActiveTab('history');
                    setMoreDrawerOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                    activeTab === 'history'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">History Gallery</div>
                    <div className="text-xs text-slate-500">Visual scan archive</div>
                  </div>
                </button>

                <button
                  id="mobile-drawer-centers"
                  onClick={() => {
                    setActiveTab('centers');
                    setMoreDrawerOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                    activeTab === 'centers'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Disposal Centers</div>
                    <div className="text-xs text-slate-500">Find nearby drop-offs</div>
                  </div>
                </button>

                <button
                  id="mobile-drawer-guide"
                  onClick={() => {
                    setActiveTab('guide');
                    setMoreDrawerOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                    activeTab === 'guide'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Waste Guide</div>
                    <div className="text-xs text-slate-500">Recycling rules & codes</div>
                  </div>
                </button>

                <button
                  id="mobile-drawer-responsible-ai"
                  onClick={() => {
                    setActiveTab('responsible-ai');
                    setMoreDrawerOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                    activeTab === 'responsible-ai'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Responsible AI</div>
                    <div className="text-xs text-slate-500">Ethics & safety principles</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-3 lg:hidden shadow-lg shadow-slate-900/10">
        <div className="flex items-center justify-around relative">
          {/* Home */}
          <button
            id="mobile-nav-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'home' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px]">Home</span>
          </button>

          {/* Ask AI */}
          <button
            id="mobile-nav-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'chat' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[11px]">Ask AI</span>
          </button>

          {/* Center Prominent Scan Button */}
          <div className="-mt-6">
            <button
              id="mobile-nav-scan-cta"
              onClick={() => setActiveTab('scan')}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0F392B] via-[#059669] to-[#10B981] text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 active:scale-95 transition-transform border-4 border-white"
              aria-label="Scan Waste"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          {/* Impact */}
          <button
            id="mobile-nav-impact"
            onClick={() => setActiveTab('impact')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'impact' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px]">Impact</span>
          </button>

          {/* More Drawer Trigger */}
          <button
            id="mobile-nav-more"
            onClick={() => setMoreDrawerOpen(true)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
              moreDrawerOpen || ['centers', 'guide', 'responsible-ai'].includes(activeTab)
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[11px]">More</span>
          </button>
        </div>
      </div>
    </>
  );
};
