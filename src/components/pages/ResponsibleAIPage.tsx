import React from 'react';
import { 
  ShieldCheck, 
  Leaf, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  Scale, 
  Database,
  Lock,
  Eye,
  Cpu,
  FileCheck
} from 'lucide-react';

export const ResponsibleAIPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI Ethics & Environmental Governance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
          Responsible AI & Transparency Framework
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
          EcoSort AI is designed under strict ethical principles to prevent waste contamination, protect public health, ensure carbon accounting honesty, and safeguard user privacy.
        </p>
      </div>

      {/* THREE GOVERNANCE HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-slate-900">Ephemeral Visual Data</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Uploaded item images are streamed to Gemini in-memory and are never stored, logged, or used for model training.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-slate-900">Calibrated Confidence</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every classification displays an exact confidence rating. Classifications below 65% trigger mandatory caution flags.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-slate-900">Anti-Greenwashing</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            CO2e savings are modeled on peer-reviewed EPA WARM benchmarks, avoiding exaggerated marketing claims.
          </p>
        </div>
      </div>

      {/* 5 CORE RESPONSIBLE AI PILLARS */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
          5 Core Ethical Pillars
        </h2>

        {/* Pillar 1 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Transparent Uncertainty & Confidence Calibration
              </h3>
              <p className="text-xs text-slate-500">Communicating AI limits clearly</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            EcoSort AI explicitly displays confidence percentages on every visual identification. When confidence falls below 65%, the system immediately flags the result with caution notices advising manual verification rather than guessing blindly.
          </p>
          <div className="text-xs text-amber-800 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/60 font-medium">
            Rule: The AI will state "Uncertain polymer - verify label" rather than risking batch contamination at recycling facilities.
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Anti-Greenwashing & Scientific Honesty
              </h3>
              <p className="text-xs text-slate-500">No inflated sustainability claims</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            All carbon emissions avoided (CO2e) and ecological impact figures are transparently labeled as life-cycle assessment models. Eco Scores are clearly defined as behavioral gamification metrics rather than direct ecological offsets.
          </p>
          <div className="text-xs text-emerald-800 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/60 font-medium">
            Data Source: EPA Waste Reduction Model (WARM) v15 & European Environment Agency circular indicators.
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Safety-First Hazardous Containment
              </h3>
              <p className="text-xs text-slate-500">Zero tolerance for toxic mishandling</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Items containing lithium batteries, corrosives, heavy metals, or biohazards trigger prominent full-width red alerts. The application refuses to recommend curbside disposal for hazardous materials and routes users directly to certified disposal facilities.
          </p>
          <div className="text-xs text-rose-800 bg-rose-50/80 p-3 rounded-2xl border border-rose-200/60 font-medium">
            Protocol: Immediate redirect to municipal hazardous collection; warns against fires caused by compacted lithium pouch cells.
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Grounding via Retrieval-Augmented Generation (RAG)
              </h3>
              <p className="text-xs text-slate-500">Eliminating hallucinations with verified facts</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our conversational assistant pulls directly from established municipal guidelines, SPI resin coding standards, and Basel Convention waste frameworks before generating answers, citing sources on every response.
          </p>
          <div className="text-xs text-blue-800 bg-blue-50/80 p-3 rounded-2xl border border-blue-200/60 font-medium">
            Standard: Responses cite verified polymer specs (e.g. SPI ASTM D7611) and clear contamination boundaries.
          </div>
        </div>

        {/* Pillar 5 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              05
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Local Municipal Disclaimers & Inclusivity
              </h3>
              <p className="text-xs text-slate-500">Acknowledging regional infrastructure variations</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Because waste infrastructure varies by country and municipality (e.g. dual-stream vs. single-stream vs. deposit return schemes), EcoSort AI highlights that recommendations serve as general best practices and encourages checking local county ordinances.
          </p>
          <div className="text-xs text-teal-800 bg-teal-50/80 p-3 rounded-2xl border border-teal-200/60 font-medium">
            Action: Direct links to search disposal depots by zipcode or regional authority.
          </div>
        </div>
      </div>
    </div>
  );
};
