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
  Lock
} from 'lucide-react';

export const ResponsibleAIPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ethics & Environmental Governance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
          Responsible AI & Transparency Principles
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          How EcoSort AI handles uncertainty, protects safety, and prevents misinformation in circular waste sorting.
        </p>
      </div>

      {/* 5 CORE RESPONSIBLE AI PILLARS */}
      <div className="space-y-4">
        {/* Pillar 1 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              1
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
        </div>

        {/* Pillar 2 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              2
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
        </div>

        {/* Pillar 3 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              3
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
        </div>

        {/* Pillar 4 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              4
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
        </div>

        {/* Pillar 5 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              5
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Local Municipal Disclaimers
              </h3>
              <p className="text-xs text-slate-500">Acknowledging regional variations</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Because waste infrastructure varies by country and municipality (e.g. dual-stream vs. single-stream vs. deposit return schemes), EcoSort AI highlights that recommendations serve as general best practices and encourages checking local county ordinances.
          </p>
        </div>
      </div>
    </div>
  );
};
