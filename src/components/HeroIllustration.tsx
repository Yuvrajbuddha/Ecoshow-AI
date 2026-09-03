import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, Scan, Layers, Leaf } from 'lucide-react';

export const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Background Ambient Glow */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-200/50 via-teal-100/40 to-emerald-100/30 rounded-3xl blur-3xl -z-10 pointer-events-none" />

      {/* Main Glassmorphism Card Showcase */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-200/80 shadow-xl shadow-emerald-950/5 p-5 sm:p-6 space-y-5">
        {/* Card Header: AI Vision Live Process */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live AI Sorting Pipeline
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-bold">
            Gemini Multimodal
          </span>
        </div>

        {/* The 3-Step Visual Flow: Waste Image → AI Analysis → Correct Bin */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center relative">
          {/* Step 1: Waste Image */}
          <div className="flex flex-col items-center text-center space-y-2 p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-xs relative overflow-hidden group">
              <span className="group-hover:scale-110 transition-transform">🧴</span>
              <div className="absolute inset-0 border border-emerald-500/20 rounded-2xl pointer-events-none" />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-900">Waste Image</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">PET Bottle</div>
            </div>
          </div>

          {/* Connector Arrow 1 */}
          <div className="absolute left-[31%] top-1/3 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

          {/* Step 2: AI Analysis */}
          <div className="flex flex-col items-center text-center space-y-2 p-2.5 sm:p-3 rounded-2xl bg-emerald-50/80 border border-emerald-300 shadow-2xs relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 relative overflow-hidden">
              <Scan className="w-6 h-6 text-emerald-100 animate-pulse" />
              {/* Animated scanning laser */}
              <motion.div
                className="absolute inset-x-0 h-0.5 bg-emerald-200 shadow-[0_0_8px_#ffffff]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-bold text-emerald-950">AI Analysis</div>
              <div className="text-[9px] sm:text-[10px] text-emerald-700 font-bold">94% Match</div>
            </div>
          </div>

          {/* Connector Arrow 2 */}
          <div className="absolute right-[31%] top-1/3 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

          {/* Step 3: Correct Bin */}
          <div className="flex flex-col items-center text-center space-y-2 p-2.5 sm:p-3 rounded-2xl bg-blue-50/80 border border-blue-200 shadow-2xs">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-700/20">
              <span>🔵</span>
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-bold text-blue-950">Correct Bin</div>
              <div className="text-[9px] sm:text-[10px] text-blue-700 font-bold">Blue Recyclable</div>
            </div>
          </div>
        </div>

        {/* Live Classification Result Snapshot Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Identified: Plastic Beverage Bottle</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono font-bold text-emerald-300">
              PET #1
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Destination:</span>
              <span className="font-bold text-blue-300">Blue Dry Recyclables Bin</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Eco Impact:</span>
              <span className="font-bold text-emerald-300">~0.12 kg CO₂e Diverted</span>
            </div>
          </div>
        </div>

        {/* Mini Trust Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Circular Economy Compliant</span>
          </span>
          <span className="text-slate-400 text-[11px]">Instant 3-Second Guidance</span>
        </div>
      </div>
    </div>
  );
};
