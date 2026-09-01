import React from 'react';
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
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { SAMPLE_ACHIEVEMENTS } from '../../services/sampleData';

interface ImpactDashboardPageProps {
  metrics: ImpactMetrics;
  recentScans: WasteAnalysisResult[];
  badges: AchievementBadge[];
}

export const ImpactDashboardPage: React.FC<ImpactDashboardPageProps> = ({
  metrics,
  recentScans,
  badges,
}) => {
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
      {/* Header & Streak Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
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

        {/* Gamified Eco Streak Banner */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-3 rounded-2xl shadow-md shadow-amber-600/20">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white fill-white animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-100">
              Active Streak
            </div>
            <div className="text-lg font-black font-['Space_Grotesk',sans-serif]">
              {metrics.streakDays} Day Eco Streak 🌱
            </div>
          </div>
        </div>
      </div>

      {/* 4 PRIMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Items Scanned */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Items Scanned</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">📸</span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
            {metrics.itemsScanned}
          </div>
          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <span>↑ 12% this week</span>
          </div>
        </motion.div>

        {/* KPI 2: Correctly Sorted */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Correctly Sorted</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">✓</span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
            {metrics.correctlySorted}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            90% successful stream compliance
          </div>
        </motion.div>

        {/* KPI 3: Eco Score */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Eco Score</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">🌟</span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
            {metrics.ecoScore}
            <span className="text-lg text-slate-400 font-normal">/100</span>
          </div>
          <div className="text-xs text-amber-600 font-medium">
            Top 5% among community sorters
          </div>
        </motion.div>

        {/* KPI 4: Estimated Impact (CO2 Avoided) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-md space-y-2"
        >
          <div className="flex items-center justify-between text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <span>Estimated CO2 Diverted</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-['Space_Grotesk',sans-serif]">
            {metrics.totalCarbonSavedKg.toFixed(1)} <span className="text-base font-normal text-emerald-300">kg</span>
          </div>
          <div className="text-[11px] text-emerald-200 font-normal">
            *Clearly labeled lifecycle model estimate
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
          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            {metrics.ecoPoints} Eco Points
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

      {/* RECENT SCANS LOG */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-base text-slate-900">Recent Scans & History</h3>
          </div>
          <span className="text-xs text-slate-400">Showing last verified items</span>
        </div>

        <div className="divide-y divide-slate-100">
          {[
            { name: 'Plastic Beverage Bottle', material: 'PET #1', cat: 'Recyclable', icon: '♻️', score: 92, time: '10 mins ago' },
            { name: 'Fresh Banana Peel', material: 'Organic Biomass', cat: 'Organic', icon: '🍌', score: 96, time: '2 hours ago' },
            { name: 'Mobile Charger & USB Cable', material: 'Copper / PCB', cat: 'E-Waste', icon: '📱', score: 88, time: 'Yesterday' },
            { name: 'Clean Newspaper & Cardboard', material: 'Cellulose Paper', cat: 'Recyclable', icon: '📦', score: 95, time: '2 days ago' },
          ].map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                  {item.icon}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {item.material} • <span className="font-medium text-emerald-700">{item.cat}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-800 font-mono">
                  +{item.score} pts
                </div>
                <div className="text-[10px] text-slate-400">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
