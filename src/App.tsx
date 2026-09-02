import React, { useState, useEffect } from 'react';
import { ActiveTab, WasteAnalysisResult, ImpactMetrics, AchievementBadge } from './types';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomePage } from './components/pages/HomePage';
import { ScanWastePage } from './components/pages/ScanWastePage';
import { AnalysisResultView } from './components/pages/AnalysisResultView';
import { AskAIPage } from './components/pages/AskAIPage';
import { ImpactDashboardPage } from './components/pages/ImpactDashboardPage';
import { DisposalCentersPage } from './components/pages/DisposalCentersPage';
import { WasteGuidePage } from './components/pages/WasteGuidePage';
import { ResponsibleAIPage } from './components/pages/ResponsibleAIPage';
import { SAMPLE_METRICS, SAMPLE_ACHIEVEMENTS } from './services/sampleData';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentAnalysis, setCurrentAnalysis] = useState<WasteAnalysisResult | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // User impact statistics with localStorage persistence
  const [metrics, setMetrics] = useState<ImpactMetrics>(() => {
    try {
      const saved = localStorage.getItem('ecosort_metrics');
      return saved ? JSON.parse(saved) : SAMPLE_METRICS;
    } catch {
      return SAMPLE_METRICS;
    }
  });

  const [badges, setBadges] = useState<AchievementBadge[]>(() => {
    try {
      const saved = localStorage.getItem('ecosort_badges');
      return saved ? JSON.parse(saved) : SAMPLE_ACHIEVEMENTS;
    } catch {
      return SAMPLE_ACHIEVEMENTS;
    }
  });

  const [recentScans, setRecentScans] = useState<WasteAnalysisResult[]>(() => {
    try {
      const saved = localStorage.getItem('ecosort_recent_scans');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save metrics on change
  useEffect(() => {
    try {
      localStorage.setItem('ecosort_metrics', JSON.stringify(metrics));
    } catch (e) {}
  }, [metrics]);

  useEffect(() => {
    try {
      localStorage.setItem('ecosort_badges', JSON.stringify(badges));
    } catch (e) {}
  }, [badges]);

  useEffect(() => {
    try {
      localStorage.setItem('ecosort_recent_scans', JSON.stringify(recentScans));
    } catch (e) {}
  }, [recentScans]);

  // Handle successful scan or sample selection
  const handleAnalysisComplete = (result: WasteAnalysisResult) => {
    setCurrentAnalysis(result);
    // Switch to scan tab if not already on it
    setActiveTab('scan');
  };

  const handleResetScan = () => {
    setCurrentAnalysis(null);
  };

  // Log scan into impact dashboard
  const handleLogScanToImpact = (result: WasteAnalysisResult) => {
    setMetrics((prev) => {
      const cat = result.category;
      const breakdownKey =
        cat === 'recyclable'
          ? 'recyclable'
          : cat === 'organic'
          ? 'organic'
          : cat === 'ewaste'
          ? 'ewaste'
          : cat === 'hazardous'
          ? 'hazardous'
          : 'general';

      const addedCarbon =
        cat === 'recyclable'
          ? 0.4
          : cat === 'organic'
          ? 0.3
          : cat === 'ewaste'
          ? 1.2
          : 0.1;

      return {
        ...prev,
        itemsScanned: prev.itemsScanned + 1,
        correctlySorted: prev.correctlySorted + 1,
        totalCarbonSavedKg: prev.totalCarbonSavedKg + addedCarbon,
        ecoPoints: prev.ecoPoints + 10,
        categoryBreakdown: {
          ...prev.categoryBreakdown,
          [breakdownKey]: prev.categoryBreakdown[breakdownKey] + 1,
        },
      };
    });

    setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
  };

  const handleResetUserData = () => {
    setMetrics(SAMPLE_METRICS);
    setBadges(SAMPLE_ACHIEVEMENTS);
    setRecentScans([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAF8] via-white to-[#F0FDF4] text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-emerald-200 selection:text-emerald-900 pb-20 lg:pb-0">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // If navigating away from scan, we can keep or reset analysis
        }}
        streakDays={metrics.streakDays}
        isDemoMode={isDemoMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <HomePage
                setActiveTab={setActiveTab}
                onSelectSampleScan={handleAnalysisComplete}
              />
            </motion.div>
          )}

          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {currentAnalysis ? (
                <AnalysisResultView
                  result={currentAnalysis}
                  onResetScan={handleResetScan}
                  onNavigateTab={setActiveTab}
                  onLogScanToImpact={handleLogScanToImpact}
                />
              ) : (
                <ScanWastePage
                  onAnalysisComplete={handleAnalysisComplete}
                  isDemoMode={isDemoMode}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <AskAIPage isDemoMode={isDemoMode} />
            </motion.div>
          )}

          {activeTab === 'impact' && (
            <motion.div
              key="impact"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <ImpactDashboardPage
                metrics={metrics}
                recentScans={recentScans}
                badges={badges}
              />
            </motion.div>
          )}

          {activeTab === 'centers' && (
            <motion.div
              key="centers"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <DisposalCentersPage />
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <WasteGuidePage />
            </motion.div>
          )}

          {activeTab === 'responsible-ai' && (
            <motion.div
              key="responsible-ai"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <ResponsibleAIPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-12 mt-16 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🌿</span>
              <span className="font-extrabold text-base tracking-tight text-slate-900 font-['Space_Grotesk',sans-serif]">
                EcoSort<span className="text-emerald-600">AI</span>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">AI-Powered Circular Waste Intelligence</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveTab('responsible-ai')}
                className="hover:text-emerald-700 flex items-center gap-1 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Responsible AI & Ethics
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className="hover:text-emerald-700 transition-colors"
              >
                Waste Guide
              </button>
              <button
                onClick={() => setActiveTab('centers')}
                className="hover:text-emerald-700 transition-colors"
              >
                Drop-off Locator
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 text-slate-400 text-[11px] text-center sm:text-left">
            <p>
              Aligned with UN Sustainable Development Goals (SDG 11 & SDG 12). Guidelines serve as general circular principles; verify local municipal drop-off rules.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
