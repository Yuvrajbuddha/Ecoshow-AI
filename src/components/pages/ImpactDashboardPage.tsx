import React, { useState, useRef, useEffect } from 'react';
import { ImpactMetrics, AchievementBadge, WasteAnalysisResult } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Flame, 
  Award, 
  CheckCircle2, 
  Recycle, 
  Leaf, 
  Smartphone, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Clock,
  HelpCircle,
  Layers,
  ArrowRight,
  Download,
  FileSpreadsheet,
  FileJson,
  Check,
  ChevronDown,
  FileText,
  ShieldCheck,
  Share2,
  PlusCircle,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SAMPLE_ACHIEVEMENTS } from '../../services/sampleData';
import { CommunityLeaderboard } from '../CommunityLeaderboard';
import { ShareAchievementModal } from '../ShareAchievementModal';
import { EnvironmentalEquivalencies } from '../EnvironmentalEquivalencies';
import { MonthlyCarbonTrajectoryChart } from '../MonthlyCarbonTrajectoryChart';
import { MaterialEfficiencyChart } from '../MaterialEfficiencyChart';
import { SegregationQualityChart } from '../SegregationQualityChart';
import { ZeroWasteGoalTracker } from '../ZeroWasteGoalTracker';
import { PrintCertificateModal } from '../PrintCertificateModal';
import { QuickLogModal } from '../QuickLogModal';

interface ImpactDashboardPageProps {
  metrics: ImpactMetrics;
  recentScans: WasteAnalysisResult[];
  badges: AchievementBadge[];
  onNavigateTab?: (tab: any) => void;
  onSelectScan?: (item: WasteAnalysisResult) => void;
  onLogItem?: (item: WasteAnalysisResult) => void;
}

export const ImpactDashboardPage: React.FC<ImpactDashboardPageProps> = ({
  metrics,
  recentScans,
  badges,
  onNavigateTab,
  onSelectScan,
  onLogItem,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isQuickLogModalOpen, setIsQuickLogModalOpen] = useState(false);
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear download notification after 4 seconds
  useEffect(() => {
    if (downloadNotification) {
      const timer = setTimeout(() => {
        setDownloadNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [downloadNotification]);

  // Helper to trigger file download in browser
  const triggerBrowserDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate CSV format
  const handleDownloadCsv = () => {
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const lines: string[] = [];

    // Header & Summary Block
    lines.push('ECOSORT AI - PERSONAL SUSTAINABILITY IMPACT REPORT');
    lines.push(`Exported Date,${escapeCsv(new Date().toLocaleString())}`);
    lines.push(`Total Carbon Saved (kg CO2e),${metrics.totalCarbonSavedKg.toFixed(2)}`);
    lines.push(`Total Items Sorted,${metrics.correctlySorted || metrics.itemsScanned}`);
    lines.push(`Active Eco Streak (Days),${metrics.streakDays}`);
    lines.push(`Eco Score Accuracy,${metrics.ecoScore}%`);
    lines.push(`Recyclable Items Count,${metrics.categoryBreakdown.recyclable}`);
    lines.push(`Organic Items Count,${metrics.categoryBreakdown.organic}`);
    lines.push(`E-Waste Items Count,${metrics.categoryBreakdown.ewaste}`);
    lines.push(`Hazardous Items Count,${metrics.categoryBreakdown.hazardous}`);
    lines.push(`General / Landfill Count,${metrics.categoryBreakdown.general + metrics.categoryBreakdown.context_dependent}`);
    lines.push(''); // Blank separator row

    // Detailed Recycling History Column Headers
    const headers = [
      'Record ID',
      'Date & Time',
      'Item Name',
      'Material Composition',
      'Category',
      'Target Bin Color',
      'Resin / Recycling Code',
      'Carbon Saved (kg CO2e)',
      'AI Confidence (%)',
      'Contamination Risk',
      'Recommended Disposal',
      'Segregation Instructions'
    ];
    lines.push(headers.map(escapeCsv).join(','));

    // Scan records rows
    recentScans.forEach((scan, idx) => {
      const row = [
        scan.id || `scan-${idx + 1}`,
        scan.timestamp ? new Date(scan.timestamp).toLocaleString() : new Date().toLocaleString(),
        scan.detectedItem || 'General Waste Item',
        scan.material || 'Mixed Material',
        scan.categoryLabel || scan.category || 'General',
        scan.binColor || 'Standard Bin',
        scan.recyclingCode || 'N/A',
        (scan.carbonSavedKg || 0).toFixed(2),
        scan.confidence || 0,
        scan.contaminationRisk || 'None',
        scan.recommendedDisposal || scan.disposalInstructions || 'Dispose in appropriate municipal stream',
        scan.segregationSteps ? scan.segregationSteps.join('; ') : scan.whereToSegregate || ''
      ];
      lines.push(row.map(escapeCsv).join(','));
    });

    const csvContent = lines.join('\r\n');
    triggerBrowserDownload(
      csvContent,
      `ecosort-impact-report-${dateStr}.csv`,
      'text/csv;charset=utf-8;'
    );

    setIsExportMenuOpen(false);
    setDownloadNotification(`CSV Impact Report downloaded (${recentScans.length} records, ${metrics.totalCarbonSavedKg.toFixed(2)} kg CO₂e saved)`);
  };

  // Generate JSON format
  const handleDownloadJson = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const reportData = {
      reportTitle: 'EcoSort AI - Personal Sustainability Impact & Recycling History',
      exportDate: new Date().toISOString(),
      reportVersion: '1.0',
      userSummary: {
        totalCarbonSavedKg: Number(metrics.totalCarbonSavedKg.toFixed(2)),
        totalItemsSorted: metrics.correctlySorted || metrics.itemsScanned,
        itemsScanned: metrics.itemsScanned,
        activeStreakDays: metrics.streakDays,
        ecoScorePercentage: metrics.ecoScore,
        ecoPoints: metrics.ecoPoints,
        categoryBreakdown: metrics.categoryBreakdown,
        weeklyActivity: metrics.weeklyActivity,
      },
      recyclingHistoryRecordCount: recentScans.length,
      recyclingHistory: recentScans.map((scan, idx) => ({
        id: scan.id || `scan-${idx + 1}`,
        date: scan.timestamp || new Date().toISOString(),
        detectedItem: scan.detectedItem,
        material: scan.material,
        category: scan.category,
        categoryLabel: scan.categoryLabel,
        recyclability: scan.recyclability,
        binColor: scan.binColor,
        whereToSegregate: scan.whereToSegregate,
        recyclingCode: scan.recyclingCode || null,
        carbonSavedKg: scan.carbonSavedKg || 0,
        confidence: scan.confidence,
        contaminationRisk: scan.contaminationRisk || 'none',
        specialHandlingRequired: Boolean(scan.specialHandlingRequired),
        specialHandlingNotes: scan.specialHandlingNotes || null,
        recommendedDisposal: scan.recommendedDisposal || scan.disposalInstructions,
        segregationSteps: scan.segregationSteps || [],
        ecoTip: scan.ecoTip || null
      }))
    };

    const jsonContent = JSON.stringify(reportData, null, 2);
    triggerBrowserDownload(
      jsonContent,
      `ecosort-impact-report-${dateStr}.json`,
      'application/json;charset=utf-8;'
    );

    setIsExportMenuOpen(false);
    setDownloadNotification(`JSON Impact Report downloaded (${recentScans.length} records, ${metrics.totalCarbonSavedKg.toFixed(2)} kg CO₂e saved)`);
  };

  // Pie chart data
  const pieData = [
    { name: 'Recyclable', value: metrics.categoryBreakdown.recyclable, color: '#10B981', icon: '♻️' },
    { name: 'Organic', value: metrics.categoryBreakdown.organic, color: '#F59E0B', icon: '🍌' },
    { name: 'E-Waste', value: metrics.categoryBreakdown.ewaste, color: '#3B82F6', icon: '🔋' },
    { name: 'Hazardous', value: metrics.categoryBreakdown.hazardous, color: '#EF4444', icon: '⚠️' },
    { name: 'Other / General', value: metrics.categoryBreakdown.general + metrics.categoryBreakdown.context_dependent, color: '#64748B', icon: '🗑️' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Toast Notification for Report Download */}
      <AnimatePresence>
        {downloadNotification && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="fixed top-20 right-4 z-50 max-w-md bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-start gap-3 text-sm"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-emerald-100">Report Downloaded Successfully</div>
              <div className="text-xs text-emerald-200/90 mt-0.5">{downloadNotification}</div>
            </div>
            <button
              onClick={() => setDownloadNotification(null)}
              className="text-emerald-300 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Streak Badge & Download Impact Report Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Environmental Impact Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
            Your Sustainability Journey
          </h1>
          <p className="text-slate-500 text-sm">
            Real-time tracking of waste diverted, circular segregation compliance, and ecological streak.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Log Manual Item Button */}
          <button
            type="button"
            id="btn-quick-log-waste"
            onClick={() => setIsQuickLogModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-3 rounded-2xl font-bold text-sm border border-emerald-300 transition-all active:scale-95 shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Quick Log Item</span>
          </button>

          {/* Share Achievement Button in Header */}
          <button
            type="button"
            id="btn-share-achievement-header"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white px-4 py-3 rounded-2xl font-bold text-sm shadow-md shadow-amber-600/20 transition-all border border-amber-400/40"
          >
            <Award className="w-4 h-4" />
            <span>Share Achievement</span>
          </button>

          {/* Print Certificate Button */}
          <button
            type="button"
            id="btn-print-certificate-header"
            onClick={() => setIsCertificateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-2xl font-bold text-sm shadow-md shadow-slate-900/10 transition-all active:scale-95 border border-slate-700"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Certificate</span>
          </button>

          {/* Download Impact Report Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              id="btn-download-impact-report"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-3 rounded-2xl font-bold text-sm shadow-md shadow-emerald-700/20 transition-all border border-emerald-500"
              aria-expanded={isExportMenuOpen}
              aria-haspopup="true"
            >
              <Download className="w-4 h-4" />
              <span>Download Impact Report</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isExportMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 z-30 space-y-1.5"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-800">Export Personal Sustainability Records</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Includes total {metrics.totalCarbonSavedKg.toFixed(2)} kg CO₂e saved & {recentScans.length} item records
                    </div>
                  </div>

                  {/* CSV Option */}
                  <button
                    type="button"
                    id="btn-export-csv"
                    onClick={handleDownloadCsv}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-colors flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>CSV Spreadsheet (.csv)</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-medium">Recommended</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Open in Excel, Google Sheets, or Numbers. Includes summary metrics and tabular history.
                      </div>
                    </div>
                  </button>

                  {/* JSON Option */}
                  <button
                    type="button"
                    id="btn-export-json"
                    onClick={handleDownloadJson}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-colors flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        JSON Data File (.json)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Structured machine-readable data with full analytics and raw scan attributes.
                      </div>
                    </div>
                  </button>

                  {/* Certificate Option */}
                  <button
                    type="button"
                    id="btn-export-certificate"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      setIsCertificateModalOpen(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-colors flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        Official Certificate (Print / PDF)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Customized milestone certificate with official verified stamp.
                      </div>
                    </div>
                  </button>

                  <div className="px-3 pt-1 text-[10px] text-slate-400 border-t border-slate-100 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Private & client-side generated. No personal data shared.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gamified Eco Streak Banner */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-md shadow-amber-600/20 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-100">
                Active Streak
              </div>
              <div className="text-base sm:text-lg font-black font-['Space_Grotesk',sans-serif]">
                {metrics.streakDays} Day Eco Streak 🌱
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 PRIMARY PERSONAL STAT CARDS: Items Sorted, CO₂ Saved (kg), Accuracy Rate, Current Streak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Items Sorted */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Items Sorted</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">♻️</span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
            {metrics.correctlySorted || metrics.itemsScanned}
          </div>
          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <span>↑ Verified sustainable disposal</span>
          </div>
        </motion.div>

        {/* Card 2: CO2 Saved (kg) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between text-teal-800 text-xs font-bold uppercase tracking-wider">
            <span>CO₂ Saved (kg)</span>
            <Leaf className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
            {metrics.totalCarbonSavedKg.toFixed(1)}{' '}
            <span className="text-base font-normal text-slate-400">kg CO₂e</span>
          </div>
          <div className="text-xs text-teal-600 font-medium">
            Avoided landfill emissions
          </div>
        </motion.div>

        {/* Card 3: Accuracy Rate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Accuracy Rate</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">🎯</span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
            {metrics.itemsScanned > 0
              ? `${Math.min(98, Math.round((metrics.correctlySorted / Math.max(1, metrics.itemsScanned)) * 100))}%`
              : '96%'}
          </div>
          <div className="text-xs text-blue-600 font-medium">
            Stream segregation precision
          </div>
        </motion.div>

        {/* Card 4: Current Streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-md space-y-2"
        >
          <div className="flex items-center justify-between text-amber-300 text-xs font-bold uppercase tracking-wider">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-3xl font-black text-white font-['Space_Grotesk',sans-serif]">
            {metrics.streakDays} <span className="text-base font-normal text-emerald-300">Days</span>
          </div>
          <div className="text-[11px] text-emerald-200 font-normal">
            Active daily sorting habit
          </div>
        </motion.div>
      </div>

      {/* CHARTS SECTION (Weekly Activity & Waste Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Activity Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Weekly Waste Activity</h3>
              <p className="text-xs text-slate-500">Scans vs Verified Sorted Items</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.weeklyActivity}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScans)"
                  name="Scans"
                />
                <Area
                  type="monotone"
                  dataKey="sorted"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                  name="Sorted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Waste Breakdown (Pie Chart + Legend) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Waste Stream Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution by classified material</p>
            </div>
          </div>

          <div className="flex items-center justify-center h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom scannable stats list matching prompt specifications */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {pieData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </span>
                <span className="font-bold font-mono text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NEW GRAPH 1: MONTHLY CARBON TRAJECTORY & GOAL FORECAST */}
      <MonthlyCarbonTrajectoryChart currentCarbonSavedKg={metrics.totalCarbonSavedKg} />

      {/* NEW FEATURE: TANGIBLE ENVIRONMENTAL EQUIVALENCIES & INTERACTIVE SIMULATOR */}
      <EnvironmentalEquivalencies totalCarbonSavedKg={metrics.totalCarbonSavedKg} />

      {/* NEW GRAPHS 2 & 3: MATERIAL EFFICIENCY & SEGREGATION QUALITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaterialEfficiencyChart totalItemsSorted={metrics.correctlySorted || metrics.itemsScanned} />
        <SegregationQualityChart ecoScore={metrics.ecoScore} />
      </div>

      {/* NEW FEATURE: ZERO-WASTE MONTHLY GOAL TRACKER & PACING */}
      <ZeroWasteGoalTracker 
        currentCarbonKg={metrics.totalCarbonSavedKg} 
        itemsSorted={metrics.correctlySorted || metrics.itemsScanned} 
      />

      {/* COMMUNITY LEADERBOARD & LOCAL AVERAGE BENCHMARK */}
      <CommunityLeaderboard metrics={metrics} />

      {/* GAMIFICATION & BADGES SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>Eco Achievements & Badges</span>
            </h3>
            <p className="text-xs text-slate-500">
              Earn rewards and level up your circular sustainability rank.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-share-achievement-badges"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Achievement Card</span>
            </button>
            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              {metrics.ecoPoints} Eco Points
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {SAMPLE_ACHIEVEMENTS.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all ${
                badge.unlocked
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-900 shadow-xs'
                  : 'bg-slate-50/80 border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    badge.unlocked ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                {badge.unlocked ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Locked</span>
                )}
              </div>

              <h4 className="font-bold text-sm text-slate-900 mb-1">{badge.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{badge.description}</p>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (badge.progress / badge.maxProgress) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT SCANS LOG & GALLERY SHORTCUT */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-base text-slate-900">Recent Scans & History</h3>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              id="btn-goto-history-gallery"
              onClick={() => onNavigateTab('history')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200/80 transition-all active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Open Visual History Gallery ({recentScans.length} items)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {(recentScans.length > 0 ? recentScans.slice(0, 5) : []).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectScan && onSelectScan(item)}
              className="py-3 flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/80 shrink-0 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.detectedItem}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <span className="text-lg">
                      {item.category === 'recyclable' ? '♻️' : item.category === 'organic' ? '🍌' : item.category === 'ewaste' ? '🔋' : '📦'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                    {item.detectedItem}
                  </div>
                  <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                    <span>{item.material}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700">{item.categoryLabel || item.category}</span>
                    {item.recyclingCode && (
                      <span className="px-1 py-0.2 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                        {item.recyclingCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-emerald-700 font-mono">
                  +{item.carbonSavedKg || 0.1} kg CO₂
                </div>
                <div className="text-[10px] text-slate-400">
                  {item.confidence}% Match
                </div>
              </div>
            </div>
          ))}

          {recentScans.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              No scans recorded yet. Use the camera or upload packaging to build your history!
            </div>
          )}
        </div>

        {/* Quick Export bar inside Recent Scans card */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export complete personal records:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-quick-export-csv"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              id="btn-quick-export-json"
              onClick={handleDownloadJson}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-600" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Achievement Modal with Snapshot & Local Gallery Download */}
      <ShareAchievementModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        metrics={metrics}
        badges={badges}
        recentScans={recentScans}
      />

      {/* Official Milestone Certificate Modal */}
      <PrintCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        metrics={metrics}
      />

      {/* Quick Log Manual Item Modal */}
      <QuickLogModal
        isOpen={isQuickLogModalOpen}
        onClose={() => setIsQuickLogModalOpen(false)}
        onLogItem={(item) => {
          if (onLogItem) {
            onLogItem(item);
          }
        }}
      />
    </div>
  );
};
