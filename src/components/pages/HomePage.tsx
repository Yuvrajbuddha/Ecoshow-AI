import React from 'react';
import { ActiveTab, WasteAnalysisResult } from '../../types';
import { HeroIllustration } from '../HeroIllustration';
import { 
  Camera, 
  MessageSquare, 
  Sparkles, 
  BarChart3, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Leaf, 
  Globe2, 
  Recycle,
  Eye,
  Compass,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';
import { SAMPLE_WASTE_ITEMS } from '../../services/sampleData';

interface HomePageProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSampleScan: (item: WasteAnalysisResult) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setActiveTab,
  onSelectSampleScan,
}) => {
  return (
    <div className="w-full space-y-20 sm:space-y-28 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 sm:pt-14 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[44rem] h-[28rem] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column: Copy & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-6 space-y-7 text-center lg:text-left"
            >
              {/* Trust/Technology Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-emerald-800 text-xs font-bold border border-emerald-200/80 shadow-sm">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AI Vision</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-teal-800 text-xs font-bold border border-teal-200/80 shadow-sm">
                  <Recycle className="w-3.5 h-3.5 text-teal-600" />
                  <span>Smart Segregation</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-blue-800 text-xs font-bold border border-blue-200/80 shadow-sm">
                  <Leaf className="w-3.5 h-3.5 text-blue-600" />
                  <span>Eco Impact</span>
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-[4.65rem] font-extrabold tracking-[-0.055em] text-[#17211D] leading-[0.98]">
                Turn waste into <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#65A30D]">
                  a better future.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                EcoSort AI identifies what you’re holding, explains what to do next, and turns everyday waste decisions into measurable environmental progress.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  id="hero-cta-scan"
                  onClick={() => setActiveTab('scan')}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#047857] hover:bg-[#064E3B] text-white font-bold text-sm shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-95 group border border-emerald-500/30"
                >
                  <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Start scanning</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  id="hero-cta-waste-guide"
                  onClick={() => setActiveTab('guide')}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Explore EcoSort</span>
                </button>
              </div>

              {/* Small trust indicator line */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Instant Bin Matching
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Hazardous Waste Screening
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  CO₂e Diverted Metrics
                </span>
              </div>
            </motion.div>

            {/* Right Column: Hero Visual Pipeline Illustration */}
            <div className="lg:col-span-6 flex justify-center">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATISTIC / CAPABILITY CARDS (AI Waste Analysis, Smart Disposal Guidance, Environmental Impact) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Waste Analysis */}
          <div className="premium-card p-7 space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 font-['Space_Grotesk',sans-serif]">
              AI Waste Analysis
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Multimodal computer vision detects material chemistry, resin numbers (#1–#7), composite packaging, and soil contamination in seconds.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
              <span>Multimodal Vision</span>
              <span>•</span>
              <span>High Precision</span>
            </div>
          </div>

          {/* Card 2: Smart Disposal Guidance */}
          <div className="premium-card p-7 space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 font-['Space_Grotesk',sans-serif]">
              Smart Disposal Guidance
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Color-coded bin destinations (Blue, Green, Yellow, Red, Gray), rinse instructions, upcycling ideas, and authorized municipal drop-offs.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-blue-700">
              <span>Color-Coded Bins</span>
              <span>•</span>
              <span>Zero Guesswork</span>
            </div>
          </div>

          {/* Card 3: Environmental Impact */}
          <div className="premium-card p-7 space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 font-['Space_Grotesk',sans-serif]">
              Environmental Impact
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track carbon emissions avoided (kg CO₂e), maintain eco-sorting streaks, unlock milestones, and observe your personal circular footprint.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-teal-700">
              <span>CO₂e Avoided</span>
              <span>•</span>
              <span>Gamified Streaks</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. QUICK DEMO PREVIEW (Try Sample Scans) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/30">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                  Instant Interactive Demo
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk',sans-serif]">
                  Try one-click AI sorting on common household waste
                </h3>
              </div>
              <span className="text-xs text-slate-300">
                Click any preset to simulate the complete AI analysis:
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
              {[
                { id: 'plastic_bottle', name: 'Plastic Bottle', icon: '🧴', cat: 'Recyclable' },
                { id: 'banana_peel', name: 'Banana Peel', icon: '🍌', cat: 'Organic' },
                { id: 'mobile_charger', name: 'Mobile Charger', icon: '🔌', cat: 'E-Waste' },
                { id: 'aluminum_can', name: 'Soda Can', icon: '🥫', cat: 'Recyclable' },
                { id: 'used_battery', name: 'AA Battery', icon: '🔋', cat: 'Hazardous' },
                { id: 'pizza_box', name: 'Pizza Box', icon: '🍕', cat: 'Contaminated' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectSampleScan(SAMPLE_WASTE_ITEMS[item.id])}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-emerald-400/50 text-left transition-all group flex flex-col justify-between"
                >
                  <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-300">{item.cat}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW ECOSORT WORKS (AI-powered waste recognition, Smart disposal guidance, Environmental impact tracking, Educational waste guide) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
            Intelligent Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
            How EcoSort Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            A comprehensive 4-pillar system guiding you from initial visual capture to long-term circular impact.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Pillar 1 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
              1
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-slate-900">
                AI-Powered Waste Recognition
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Snap or upload any photo. Gemini multimodal vision instantly classifies material integrity, resin codes, and contamination levels.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-lg">
              2
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-slate-900">
                Smart Disposal Guidance
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Receive exact color-coded bin recommendations, preparation steps (rinsing, lid separation), and safety alerts for hazardous materials.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-lg">
              3
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-slate-900">
                Environmental Impact Tracking
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Log sorted items to monitor cumulative CO₂e emissions diverted, build daily sorting streaks, and unlock sustainability badges.
              </p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-lg">
              4
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-slate-900">
                Educational Waste Guide
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Explore an extensive library covering plastic resin codes (#1–#7), myth busters, and ask our RAG-grounded AI assistant any question.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. UNITED NATIONS SUSTAINABLE DEVELOPMENT GOALS (SDG) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Globe2 className="w-3.5 h-3.5" />
                <span>UN Global Goals Alignment</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-['Space_Grotesk',sans-serif]">
                Powering Global Sustainable Waste Reduction
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                EcoSort AI directly supports the United Nations 2030 Agenda for Sustainable Development by providing transparent, AI-driven circular economy education and contamination prevention.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SDG 12 */}
              <div className="p-5 rounded-2xl bg-[#CF8D2A]/20 border border-[#CF8D2A]/40 space-y-2">
                <div className="text-xs font-bold text-[#FBBF24]">SDG GOAL 12</div>
                <div className="font-extrabold text-sm text-white">
                  Responsible Consumption & Production
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Substantially reduce municipal waste generation through prevention, reduction, recycling, and reuse.
                </p>
              </div>

              {/* SDG 11 */}
              <div className="p-5 rounded-2xl bg-[#FD9D24]/20 border border-[#FD9D24]/40 space-y-2">
                <div className="text-xs font-bold text-[#F59E0B]">SDG GOAL 11</div>
                <div className="font-extrabold text-sm text-white">
                  Sustainable Cities & Communities
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Reduce the adverse per capita environmental impact of urban centers with accurate segregation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
