import React, { useEffect } from 'react';
import { WasteAnalysisResult, ActiveTab } from '../../types';
import { getCategoryBadgeClasses } from '../../lib/utils';
import { 
  Recycle, 
  Leaf, 
  AlertTriangle, 
  Sparkles, 
  ArrowLeft, 
  MapPin, 
  MessageSquare, 
  CheckCircle, 
  Info, 
  ShieldCheck, 
  Share2,
  Award,
  Flame,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface AnalysisResultViewProps {
  result: WasteAnalysisResult;
  onResetScan: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onLogScanToImpact: (result: WasteAnalysisResult) => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  onResetScan,
  onNavigateTab,
  onLogScanToImpact,
}) => {
  const [logged, setLogged] = React.useState(false);
  const badgeClasses = getCategoryBadgeClasses(result.category);

  // Trigger celebration confetti on high eco-score items
  useEffect(() => {
    if (result.ecoActionScore >= 85) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10B981', '#059669', '#34D399', '#FBBF24'],
        });
      } catch (e) {
        // Safe fallback if confetti isn't supported
      }
    }
  }, [result]);

  const handleLog = () => {
    if (!logged) {
      setLogged(true);
      onLogScanToImpact(result);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  };

  // Confidence color & status determination
  const isHighConfidence = result.confidence >= 85;
  const isMediumConfidence = result.confidence >= 65 && result.confidence < 85;
  const isLowConfidence = result.confidence < 65;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar: Back Action & Status */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-scan"
          onClick={onResetScan}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Scan Another Item</span>
        </button>

        <div className="flex items-center gap-2">
          {result.isMock && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Demo Simulation
            </span>
          )}
          <div className="text-xs text-slate-400">
            {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* CONFIDENCE WARNING CALLOUTS */}
      {isLowConfidence && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <div className="font-bold">⚠️ Unable to confidently identify this item ({result.confidence}%)</div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Try uploading a clearer image or provide more information. Disposal rules may vary significantly for unverified items.
            </p>
          </div>
        </motion.div>
      )}

      {isMediumConfidence && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3 shadow-xs"
        >
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <div className="font-bold">⚠️ AI is moderately confident ({result.confidence}%)</div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Please inspect the material and physical labels before final disposal.
            </p>
          </div>
        </motion.div>
      )}

      {/* SPECIAL HANDLING ALERT (Batteries / Hazard / Biohazard) */}
      {result.specialHandlingRequired && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3 shadow-xs"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <div className="font-bold text-rose-900">⚠️ Special Handling Required</div>
            <p className="text-xs text-rose-800 leading-relaxed">
              {result.specialHandlingNotes ||
                'This item contains hazardous, electronic, or reactive components. Never place in standard curbside bins.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* MAIN IDENTITY & CONFIDENCE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Detected Waste Item
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
              {result.detectedItem}
            </h2>
            <div className="text-sm text-slate-600 font-medium mt-0.5">
              Material: <span className="text-slate-900 font-semibold">{result.material}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Tag */}
            <span
              className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-1.5 shadow-xs ${badgeClasses.bg} ${badgeClasses.border}`}
            >
              <Recycle className="w-4 h-4" />
              {result.categoryLabel}
            </span>

            {result.recyclingCode && (
              <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
                {result.recyclingCode}
              </span>
            )}
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              AI Classification Confidence
            </span>
            <span className="font-bold text-slate-900 font-mono text-base">
              {result.confidence}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isHighConfidence
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : isMediumConfidence
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                  : 'bg-gradient-to-r from-rose-400 to-rose-500'
              }`}
            />
          </div>
        </div>
      </motion.div>

      {/* RECOMMENDED DISPOSAL CARD (Highlighted Main Card) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-4"
      >
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-2xl shadow-inner">
            ♻️
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">
              Recommended Disposal Method
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk',sans-serif]">
              {result.categoryLabel}
            </h3>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-sm sm:text-base leading-relaxed font-normal text-emerald-50">
          “{result.recommendedDisposal}”
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-300/80 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Guidelines adhere to standard circular principles. Check local municipal drop-off variations.
          </span>
        </div>
      </motion.div>

      {/* TWO COLUMNS: "WHY THIS RESULT?" & "SUSTAINABILITY SCORE / ECO TIP" */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Why this result? */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Info className="w-5 h-5 text-emerald-700" />
              <span>Why this result?</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {result.whyThisResult}
            </p>
          </div>

          {result.alternativeUses && result.alternativeUses.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                💡 Creative Upcycling Ideas
              </div>
              <ul className="text-xs text-slate-700 space-y-1">
                {result.alternativeUses.map((alt, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Right Column: Eco Action Score Gauge & Eco Tip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-5 space-y-4"
        >
          {/* Sustainability Score Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sustainability Engagement
            </span>

            {/* Circular / Radial Progress Ring */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-600"
                  strokeDasharray={`${result.ecoActionScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
                  {result.ecoActionScore}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">/100</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-sm text-slate-900">
                Eco Action Score: {result.ecoActionScore}/100
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Gamification & engagement rating for proper sorting action.
              </p>
            </div>
          </div>

          {/* Eco Tip Card */}
          <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-sm">
              <Leaf className="w-4 h-4 text-emerald-700" />
              <span>🌱 Eco Tip</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              {result.ecoTip}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ACTION TOOLBAR (Log to Impact, Find Drop-offs, Ask Chatbot) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Log to Impact Button */}
          <button
            id="btn-log-scan"
            onClick={handleLog}
            disabled={logged}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              logged
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 active:scale-95'
            }`}
          >
            {logged ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>Logged to Impact (+10 pts)</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Log to My Impact (+10 pts)</span>
              </>
            )}
          </button>

          {/* Find Nearby Drop-off */}
          <button
            id="btn-find-centers"
            onClick={() => onNavigateTab('centers')}
            className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Find Disposal Center</span>
          </button>
        </div>

        {/* Ask AI Follow-up */}
        <button
          id="btn-ask-ai-item"
          onClick={() => onNavigateTab('chat')}
          className="w-full sm:w-auto px-4 py-3 rounded-2xl text-emerald-800 hover:bg-emerald-50 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Ask AI more questions</span>
        </button>
      </div>
    </div>
  );
};
