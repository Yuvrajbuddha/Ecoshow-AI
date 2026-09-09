import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  TreePine, 
  Flame, 
  Sparkles,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { ImpactMetrics } from '../types';

interface PrintCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: ImpactMetrics;
}

export const PrintCertificateModal: React.FC<PrintCertificateModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  const [recipientName, setRecipientName] = useState<string>('EcoSort Champion');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">
              Sustainability Milestone Certificate
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Recipient name customizer */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 no-print text-xs">
            <span className="font-bold text-slate-700 whitespace-nowrap">Name on Certificate:</span>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Your Name"
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 font-semibold text-slate-800"
            />
          </div>

          {/* Certificate Canvas Area */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white border-4 border-emerald-400/40 relative shadow-inner overflow-hidden text-center space-y-6">
            {/* Background watermarks */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Circular Sustainability Certificate</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black font-['Space_Grotesk',sans-serif] tracking-tight text-white">
                Certificate of Environmental Impact
              </h2>
              <p className="text-xs text-emerald-200">
                Issued in recognition of verified waste diversion and carbon mitigation
              </p>
            </div>

            <div className="py-2 border-y border-white/10">
              <div className="text-xs text-slate-400 font-medium">Proudly presented to</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-serif my-1">
                {recipientName || 'EcoSort Champion'}
              </div>
              <div className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                For outstanding dedication to circular waste segregation, achieving verified diversion metrics and fostering community ecological resilience.
              </div>
            </div>

            {/* Core KPI Banner inside certificate */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-emerald-300 uppercase font-bold">Carbon Avoided</div>
                <div className="text-xl font-black text-white mt-0.5">
                  {metrics.totalCarbonSavedKg.toFixed(1)} kg
                </div>
                <div className="text-[9px] text-slate-300">CO₂e Emissions</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-amber-300 uppercase font-bold">Items Sorted</div>
                <div className="text-xl font-black text-white mt-0.5">
                  {metrics.correctlySorted || metrics.itemsScanned}
                </div>
                <div className="text-[9px] text-slate-300">100% Verified</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-blue-300 uppercase font-bold">Eco Streak</div>
                <div className="text-xl font-black text-white mt-0.5">
                  {metrics.streakDays} Days
                </div>
                <div className="text-[9px] text-slate-300">Active Habit</div>
              </div>
            </div>

            {/* Date & Verified Stamp */}
            <div className="pt-4 flex items-center justify-between text-xs text-slate-300 border-t border-white/10">
              <div className="text-left">
                <div className="text-[10px] text-slate-400">Date Issued</div>
                <div className="font-bold text-white">{currentDate}</div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-[11px]">EcoSort AI Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save as PDF</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
