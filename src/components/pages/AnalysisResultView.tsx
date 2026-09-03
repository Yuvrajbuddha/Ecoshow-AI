import React, { useEffect, useState } from 'react';
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
  Plus,
  Eye,
  X,
  Camera,
  CheckCircle2,
  Square,
  CheckSquare,
  Trash2,
  Layers,
  HelpCircle,
  RefreshCw,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface AnalysisResultViewProps {
  result: WasteAnalysisResult;
  onResetScan: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onLogScanToImpact: (result: WasteAnalysisResult) => void;
  onRefineScan?: (hint: string) => void;
  isReanalyzing?: boolean;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  onResetScan,
  onNavigateTab,
  onLogScanToImpact,
  onRefineScan,
  isReanalyzing = false,
}) => {
  const [logged, setLogged] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [refineHint, setRefineHint] = useState('');
  const [showRefineInput, setShowRefineInput] = useState(false);
  const badgeClasses = getCategoryBadgeClasses(result.category);

  // Derive bin configuration based on category or explicit binColor
  const getBinTheme = () => {
    const rawBin = (result.binColor || '').toLowerCase();
    const cat = result.category;

    if (rawBin.includes('green') || cat === 'organic') {
      return {
        name: result.binColor || 'Green Bin (Organic / Compost)',
        bgLight: 'bg-emerald-50',
        border: 'border-emerald-300',
        textColor: 'text-emerald-950',
        accentBg: 'bg-emerald-600',
        accentText: 'text-emerald-50',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: '🟢',
        shortDesc: 'Wet waste, food scraps, fruit/vegetable peels, organic garden clippings.',
      };
    }
    if (rawBin.includes('blue') || cat === 'recyclable') {
      return {
        name: result.binColor || 'Blue Bin (Dry Recyclables)',
        bgLight: 'bg-blue-50',
        border: 'border-blue-300',
        textColor: 'text-blue-950',
        accentBg: 'bg-blue-600',
        accentText: 'text-blue-50',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '🔵',
        shortDesc: 'Clean paper, cardboard, recyclable plastics (#1, #2, #5), aluminum and steel cans.',
      };
    }
    if (rawBin.includes('yellow') || cat === 'ewaste') {
      return {
        name: result.binColor || 'Yellow Bin (E-Waste & Electronics)',
        bgLight: 'bg-amber-50',
        border: 'border-amber-300',
        textColor: 'text-amber-950',
        accentBg: 'bg-amber-500',
        accentText: 'text-amber-950',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: '🟡',
        shortDesc: 'Electronic gadgets, chargers, cables, and circuit components. Never dispose in regular bins.',
      };
    }
    if (rawBin.includes('red') || cat === 'hazardous') {
      return {
        name: result.binColor || 'Red Bin (Hazardous Collection)',
        bgLight: 'bg-rose-50',
        border: 'border-rose-300',
        textColor: 'text-rose-950',
        accentBg: 'bg-rose-600',
        accentText: 'text-rose-50',
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
        icon: '🔴',
        shortDesc: 'Batteries, chemicals, medical waste, and flammable items. Take to designated drop-off.',
      };
    }
    return {
      name: result.binColor || 'Black/Grey Bin (General Residual Trash)',
      bgLight: 'bg-slate-50',
      border: 'border-slate-300',
      textColor: 'text-slate-900',
      accentBg: 'bg-slate-800',
      accentText: 'text-slate-100',
      badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
      icon: '🔘',
      shortDesc: 'Non-recyclable packaging, multi-layer wrappers, and heavily soiled items heading to landfill.',
    };
  };

  const binTheme = getBinTheme();

  const stepsList = (result.segregationSteps && result.segregationSteps.length > 0)
    ? result.segregationSteps
    : [
        `1. Empty any liquid or organic residue from the item completely.`,
        `2. Separate non-compatible lids, caps, or composite seals.`,
        `3. Deposit into ${binTheme.name}.`,
        `4. Ensure item is kept free of grease or chemical contamination.`
      ];

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

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
      {/* Photo Zoom Modal */}
      <AnimatePresence>
        {showPhotoModal && result.imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setShowPhotoModal(false)}
          >
            <div
              className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPhotoModal(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={result.imageUrl}
                alt={result.detectedItem}
                className="w-full max-h-[75vh] object-contain rounded-2xl"
              />
              <div className="p-4 text-center">
                <p className="text-white font-bold text-base">{result.detectedItem}</p>
                <p className="text-slate-400 text-xs">{result.material}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* MAIN IDENTITY CARD: WHAT IS THE KIND OF WASTE? */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-slate-100">
          {/* Photo Thumbnail */}
          {result.imageUrl ? (
            <div className="relative shrink-0 w-full md:w-48 aspect-4/3 md:aspect-square rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-sm bg-slate-900 group">
              <img
                src={result.imageUrl}
                alt={result.detectedItem}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button
                onClick={() => setShowPhotoModal(true)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-bold backdrop-blur-2xs"
              >
                <Eye className="w-4 h-4" />
                <span>View Full Photo</span>
              </button>
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                <Camera className="w-3 h-3 text-emerald-400" />
                <span>Scanned Photo</span>
              </div>
            </div>
          ) : (
            <div className="shrink-0 w-24 h-24 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-4xl">
              ♻️
            </div>
          )}

          {/* Item Info: WHAT IS THE KIND OF WASTE */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>🔍 Question 1: What kind of waste is this?</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
                {result.detectedItem}
              </h2>
            </div>

            {/* Kind of Waste Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Material Composition</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{result.material}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Waste Category</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-sm">{binTheme.icon}</span>
                  <span>{result.categoryLabel}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800">Recyclability</span>
                <p className="text-xs sm:text-sm font-bold text-emerald-950">
                  {result.recyclability || (result.category === 'recyclable' ? 'Highly Recyclable' : result.category === 'organic' ? '100% Compostable' : 'Special / Residual')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Category Tag */}
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${badgeClasses.bg} ${badgeClasses.border}`}
              >
                <Recycle className="w-3.5 h-3.5" />
                {result.categoryLabel}
              </span>

              {result.recyclingCode && (
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
                  Code: {result.recyclingCode}
                </span>
              )}

              {result.contaminationRisk && (
                <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                  result.contaminationRisk === 'high' 
                    ? 'bg-rose-50 text-rose-800 border-rose-200' 
                    : result.contaminationRisk === 'moderate'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  Contamination: {result.contaminationRisk}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Confidence Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              AI Visual Classification Confidence
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

        {/* REFINE OR CORRECT ITEM IDENTIFICATION */}
        {onRefineScan && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  Not quite the right item or need clarification?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowRefineInput(!showRefineInput)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
              >
                {showRefineInput ? 'Close' : 'Refine identification'}
              </button>
            </div>

            {showRefineInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2.5 pt-1"
              >
                <p className="text-[11px] text-slate-500">
                  Give the AI a hint about the item (e.g. "it's a glass perfume bottle", "pizza box lid", "cardboard tube"). The AI will re-examine the photo with this context.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={refineHint}
                    onChange={(e) => setRefineHint(e.target.value)}
                    placeholder="e.g. glass beverage bottle, greasy takeout box..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-emerald-500 text-slate-800"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && refineHint.trim() && !isReanalyzing) {
                        onRefineScan(refineHint.trim());
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!refineHint.trim() || isReanalyzing}
                    onClick={() => onRefineScan(refineHint.trim())}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    {isReanalyzing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Re-identifying...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Re-identify Item</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* CORE SECTION 2: WHERE SHOULD YOU SEGREGATE IT? */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-3xl p-6 sm:p-8 border-2 shadow-xl relative overflow-hidden space-y-6 ${binTheme.bgLight} ${binTheme.border}`}
      >
        {/* Header with Color-Coded Bin Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white font-bold text-xs shadow-xs border border-slate-200">
              <span>🎯 Question 2: Where should you segregate it?</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-3xl sm:text-4xl">{binTheme.icon}</span>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                  Target Destination Bin
                </span>
                <h3 className={`text-xl sm:text-2xl font-black font-['Space_Grotesk',sans-serif] ${binTheme.textColor}`}>
                  {binTheme.name}
                </h3>
              </div>
            </div>
          </div>

          <div className="sm:text-right">
            <span className={`inline-block px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-xs ${binTheme.badgeBg}`}>
              {result.categoryLabel}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-tight">
              {binTheme.shortDesc}
            </p>
          </div>
        </div>

        {/* Prominent Direct Instruction Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Disposal Instructions</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            “{result.disposalInstructions || result.whereToSegregate || result.recommendedDisposal}”
          </p>
        </div>

        {/* Step-by-Step Segregation Checklist Protocol */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Step-by-Step Segregation Protocol</span>
            </span>
            <span className="text-slate-500 font-normal">
              {completedSteps.length} of {stepsList.length} steps completed
            </span>
          </div>

          <div className="space-y-2">
            {stepsList.map((step, idx) => {
              const isChecked = completedSteps.includes(idx);
              return (
                <button
                  key={idx}
                  id={`btn-segregation-step-${idx}`}
                  type="button"
                  onClick={() => toggleStep(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 text-sm ${
                    isChecked
                      ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <span className={`leading-relaxed font-medium ${isChecked ? 'line-through text-slate-600' : ''}`}>
                    {step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Follow these steps to prevent recycling contamination and maximize material recovery.
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

            {/* Environmental Impact Box */}
            <div className="mt-3 p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-teal-700" />
                <span>Environmental Impact</span>
              </div>
              <p className="text-xs text-teal-950 leading-relaxed font-medium">
                {result.environmentalImpact || `Proper diversion avoids approx. ${result.carbonSavedKg || 0.25} kg CO₂e greenhouse emissions and saves landfill space.`}
              </p>
              {typeof result.carbonSavedKg === 'number' && result.carbonSavedKg > 0 && (
                <div className="text-[11px] font-bold text-teal-800 pt-0.5">
                  🌱 Estimated CO₂e Diverted: ~{result.carbonSavedKg} kg
                </div>
              )}
            </div>
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
