import React from 'react';
import { ActiveTab, WasteAnalysisResult } from '../../types';
import { HeroIllustration } from '../HeroIllustration';
import { 
  Camera, 
  MessageSquare, 
  Sparkles, 
  Compass, 
  BarChart3, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Leaf, 
  Globe2, 
  Recycle
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
    <div className="w-full space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Copy & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-6 space-y-6 text-center lg:text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Next-Gen Waste Intelligence Engine</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] font-['Space_Grotesk',sans-serif]">
                Sort Smarter. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600">
                  Live Greener.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                AI-powered waste identification and responsible disposal guidance for a cleaner, healthier planet.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  id="hero-cta-scan"
                  onClick={() => setActiveTab('scan')}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-lg shadow-emerald-800/25 hover:shadow-xl hover:shadow-emerald-800/35 transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
                >
                  <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Scan Your Waste</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  id="hero-cta-ask-ai"
                  onClick={() => setActiveTab('chat')}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-200 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <span>Ask EcoSort AI</span>
                </button>
              </div>

              {/* Social Proof / Metric Badges */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-700">Multimodal Vision</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-semibold text-slate-700">RAG Knowledge Base</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="font-semibold text-slate-700">Zero Guesswork</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Hero Visual Illustration */}
            <div className="lg:col-span-6 flex justify-center">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK DEMO PREVIEW (Try Sample Scans) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                  Instant Interactive Demo
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk',sans-serif]">
                  Try one-click AI sorting on common waste items
                </h3>
              </div>
              <span className="text-xs text-slate-300">
                Click any preset to simulate the full AI analysis:
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
              {[
                { id: 'plastic_bottle', name: 'Plastic Bottle', icon: '🧴', cat: 'Recyclable' },
                { id: 'banana_peel', name: 'Banana Peel', icon: '🍌', cat: 'Organic' },
                { id: 'mobile_charger', name: 'Mobile Charger', icon: '🔌', cat: 'E-Waste' },
                { id: 'aluminum_can', name: 'Soda Can', icon: '🥫', cat: 'Recyclable' },
                { id: 'used_battery', name: 'AA Battery', icon: '🔋', cat: 'Hazardous/E-Waste' },
                { id: 'pizza_box', name: 'Pizza Box', icon: '🍕', cat: 'Contaminated' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectSampleScan(SAMPLE_WASTE_ITEMS[item.id])}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-emerald-400/50 text-left transition-all group flex flex-col justify-between"
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

      {/* 3. FEATURE CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
            Engineered for Modern Circular Living
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Intelligent tools designed to eliminate contamination and make responsible waste sorting effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: AI Powered */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">AI Powered</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Smart waste recognition that detects resin types, organic matter, and complex electronics.
            </p>
          </div>

          {/* Card 2: Instant Guidance */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Instant Guidance</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get responsible disposal recommendations, preparation steps, and nearest verified drop-offs.
            </p>
          </div>

          {/* Card 3: Learn & Improve */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Learn & Improve</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Understand better waste habits, contamination risks, and resin codes with interactive guides.
            </p>
          </div>

          {/* Card 4: Track Impact */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Track Impact</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Monitor your sustainability journey, streak badges, and estimated CO2 emission reductions.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW ECOSORT AI WORKS (3-Step Section) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-700">
            The Sustainable Journey
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
            How EcoSort AI Works
          </h2>
          <p className="text-sm text-slate-600">
            From scan to sustainable sorting in under 3 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900">SCAN</h3>
              <p className="text-sm text-slate-600">
                Upload or take a photo of your waste item from any device.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
              2
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900">ANALYZE</h3>
              <p className="text-sm text-slate-600">
                AI identifies the item composition, material, and contamination risks.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
              3
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900">SORT</h3>
              <p className="text-sm text-slate-600">
                Get disposal guidance, upcycling ideas, and ecological tips instantly.
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
                EcoSort AI directly supports the United Nations 2030 Agenda for Sustainable Development by providing transparent, transparent AI-driven circular economy education.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SDG 12 */}
              <div className="p-4 rounded-2xl bg-[#CF8D2A]/20 border border-[#CF8D2A]/40 space-y-2">
                <div className="text-xs font-bold text-[#FBBF24]">GOAL 12</div>
                <div className="font-extrabold text-sm text-white">
                  Responsible Consumption & Production
                </div>
                <p className="text-xs text-slate-300">
                  Substantially reduce waste generation through prevention, reduction, recycling, and reuse.
                </p>
              </div>

              {/* SDG 11 */}
              <div className="p-4 rounded-2xl bg-[#FD9D24]/20 border border-[#FD9D24]/40 space-y-2">
                <div className="text-xs font-bold text-[#F59E0B]">GOAL 11</div>
                <div className="font-extrabold text-sm text-white">
                  Sustainable Cities & Communities
                </div>
                <p className="text-xs text-slate-300">
                  Reduce the adverse per capita environmental impact of cities by paying special attention to municipal waste management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
