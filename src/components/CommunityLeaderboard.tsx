import React, { useState } from 'react';
import { 
  CommunityLeaderboardEntry, 
  CommunityBenchmark, 
  ImpactMetrics 
} from '../types';
import { 
  COMMUNITY_BENCHMARKS, 
  COMMUNITY_LEADERBOARD_ENTRIES, 
  SIMULATED_LOCATIONS 
} from '../services/sampleData';
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  Flame, 
  Sparkles, 
  Heart, 
  Award, 
  Leaf, 
  CheckCircle2, 
  ArrowUpRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommunityLeaderboardProps {
  metrics: ImpactMetrics;
}

export const CommunityLeaderboard: React.FC<CommunityLeaderboardProps> = ({ metrics }) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('metro-core');
  const [kudosGiven, setKudosGiven] = useState<Record<string, number>>({});
  const [kudosToast, setKudosToast] = useState<string | null>(null);

  const benchmark: CommunityBenchmark = 
    COMMUNITY_BENCHMARKS[selectedDistrict] || COMMUNITY_BENCHMARKS['metro-core'];
  
  const rawEntries = 
    COMMUNITY_LEADERBOARD_ENTRIES[selectedDistrict] || COMMUNITY_LEADERBOARD_ENTRIES['metro-core'];

  // Dynamically inject user's real totalCarbonSavedKg, itemsSorted, and streak into the user's leaderboard entry
  const userCarbon = metrics.totalCarbonSavedKg;
  const userSorted = metrics.correctlySorted || metrics.itemsScanned;
  const userStreak = metrics.streakDays;

  const entries: CommunityLeaderboardEntry[] = rawEntries.map((entry) => {
    if (entry.isCurrentUser) {
      return {
        ...entry,
        carbonSavedKg: userCarbon,
        itemsSorted: userSorted,
        streakDays: userStreak,
        kudosCount: (entry.kudosCount || 19) + (kudosGiven[entry.id] || 0)
      };
    }
    return {
      ...entry,
      kudosCount: (entry.kudosCount || 0) + (kudosGiven[entry.id] || 0)
    };
  }).sort((a, b) => b.carbonSavedKg - a.carbonSavedKg)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  const currentUserEntry = entries.find((e) => e.isCurrentUser) || entries[0];

  // Benchmark difference calculation
  const diffFromAvg = userCarbon - benchmark.averageCarbonSavedKg;
  const percentFromAvg = Math.round((Math.abs(diffFromAvg) / benchmark.averageCarbonSavedKg) * 100);
  const isAboveAvg = diffFromAvg >= 0;

  const handleGiveKudos = (entry: CommunityLeaderboardEntry) => {
    setKudosGiven((prev) => ({
      ...prev,
      [entry.id]: (prev[entry.id] || 0) + 1
    }));
    setKudosToast(`High-five sent to ${entry.name}! 👏`);
    setTimeout(() => {
      setKudosToast(null);
    }, 2400);
  };

  const districtOptions = [
    { id: 'metro-core', label: 'Downtown Metro' },
    { id: 'greenfield', label: 'Greenfield Eco-District' },
    { id: 'northside', label: 'Northside & Riverview' }
  ];

  // Scale calculations for visual benchmark comparison bar
  const maxScaleKg = Math.max(benchmark.topTenPercentAverageKg * 1.15, userCarbon * 1.2, 35);
  const userPercentBar = Math.min(100, Math.max(6, (userCarbon / maxScaleKg) * 100));
  const avgPercentBar = Math.min(100, (benchmark.averageCarbonSavedKg / maxScaleKg) * 100);
  const topTenPercentBar = Math.min(100, (benchmark.topTenPercentAverageKg / maxScaleKg) * 100);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6 relative overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {kudosToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 right-6 z-30 bg-slate-900 text-white px-3.5 py-2 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-2 border border-slate-700"
          >
            <span>👏</span>
            <span>{kudosToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & District Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Community Circles</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif] flex items-center gap-2">
            <span>Local Sustainability Leaderboard</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Compare your carbon reduction progress with verified local averages and celebrate friendly community wins.
          </p>
        </div>

        {/* District Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-slate-100 p-1 rounded-2xl">
          {districtOptions.map((dist) => (
            <button
              key={dist.id}
              type="button"
              onClick={() => setSelectedDistrict(dist.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDistrict === dist.id
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {dist.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. COMMUNITY AVERAGE COMPARISON CARD                                      */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/50 border border-emerald-200/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              Neighborhood Benchmark Analysis
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
              {isAboveAvg ? (
                <span className="text-emerald-800">
                  +{percentFromAvg}% Ahead of {benchmark.districtName} Average! 🌱
                </span>
              ) : (
                <span className="text-slate-800">
                  Just {Math.abs(diffFromAvg).toFixed(1)} kg from {benchmark.districtName} Average!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {isAboveAvg
                ? `You've diverted ${diffFromAvg.toFixed(1)} kg more CO₂e than the average active neighbor this month.`
                : `You are making steady progress! Keep segregating organic and recyclable streams to reach your district target.`}
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center min-w-[100px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Your Impact</div>
              <div className="text-lg font-black text-emerald-700 font-mono">
                {userCarbon.toFixed(1)} <span className="text-xs font-normal">kg</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center min-w-[100px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Local Average</div>
              <div className="text-lg font-black text-slate-700 font-mono">
                {benchmark.averageCarbonSavedKg.toFixed(1)} <span className="text-xs font-normal">kg</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center min-w-[100px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Top 10% Avg</div>
              <div className="text-lg font-black text-amber-600 font-mono">
                {benchmark.topTenPercentAverageKg.toFixed(1)} <span className="text-xs font-normal">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Comparative Scale Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>0 kg CO₂e</span>
            <span className="text-slate-400">Progress Comparison Scale</span>
            <span>{maxScaleKg.toFixed(0)} kg CO₂e</span>
          </div>

          <div className="relative h-6 w-full bg-slate-200 rounded-full overflow-hidden p-1 flex items-center">
            {/* User bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${userPercentBar}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full shadow-xs relative"
            />

            {/* Local Average Marker Line */}
            <div
              style={{ left: `${avgPercentBar}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-10"
              title={`Local Average: ${benchmark.averageCarbonSavedKg} kg`}
            />

            {/* Top 10% Marker Line */}
            <div
              style={{ left: `${topTenPercentBar}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
              title={`Top 10% Average: ${benchmark.topTenPercentAverageKg} kg`}
            />
          </div>

          {/* Scale Legend Markers */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 pt-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>You: {userCarbon.toFixed(1)} kg ({currentUserEntry.rank ? `Rank #${currentUserEntry.rank}` : 'Top Tier'})</span>
            </div>

            <div className="flex items-center gap-1.5 font-medium text-blue-700">
              <span className="w-2 h-2 rounded-xs bg-blue-600 inline-block" />
              <span>District Avg: {benchmark.averageCarbonSavedKg.toFixed(1)} kg</span>
            </div>

            <div className="flex items-center gap-1.5 font-medium text-amber-700">
              <span className="w-2 h-2 rounded-xs bg-amber-500 inline-block" />
              <span>Top 10% Goal: {benchmark.topTenPercentAverageKg.toFixed(1)} kg</span>
            </div>
          </div>
        </div>

        {/* Collective District Impact Banner */}
        <div className="p-3 rounded-2xl bg-white/80 border border-emerald-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Collective District Impact:</strong> {benchmark.activeRecyclersCount} neighbors have collectively avoided{' '}
              <strong className="text-emerald-800">{benchmark.collectiveTotalKg} kg CO₂e</strong> this month!
            </span>
          </div>
          <div className="text-[11px] font-bold text-emerald-700 whitespace-nowrap">
            {Math.round((benchmark.collectiveTotalKg / benchmark.monthlyGoalKg) * 100)}% of monthly district target
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FRIENDLY LEADERBOARD ROSTER                                            */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Community Circular Champions</span>
          </h3>
          <span className="text-xs text-slate-400">
            Updated today • Encouraging zero-waste habits
          </span>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-3xl overflow-hidden bg-white shadow-2xs">
          {entries.map((entry) => {
            const isUser = entry.isCurrentUser;
            const rankIcon = 
              entry.rank === 1 ? '🥇' : 
              entry.rank === 2 ? '🥈' : 
              entry.rank === 3 ? '🥉' : `#${entry.rank}`;

            return (
              <div
                key={entry.id}
                className={`p-4 transition-all flex items-center justify-between gap-3 ${
                  isUser
                    ? 'bg-emerald-50/80 hover:bg-emerald-50 border-l-4 border-l-emerald-600 font-medium'
                    : 'hover:bg-slate-50/70'
                }`}
              >
                {/* Left: Rank & Avatar & Info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Rank Badge */}
                  <div className="w-8 text-center shrink-0 font-bold text-sm text-slate-600 font-mono">
                    {rankIcon}
                  </div>

                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs ${entry.avatarBg}`}
                  >
                    {entry.avatarText}
                  </div>

                  {/* User Meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm truncate ${isUser ? 'text-emerald-950 font-black' : 'text-slate-900'}`}>
                        {entry.name}
                      </span>
                      {isUser && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                      <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {entry.badgeTitle}
                      </span>
                      <span className="hidden sm:inline-block">•</span>
                      <span className="hidden sm:inline-flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        {entry.streakDays}d streak
                      </span>
                      <span className="hidden md:inline-block">•</span>
                      <span className="hidden md:inline-block text-slate-400">
                        {entry.itemsSorted} items sorted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Carbon Saved & Kudos Button */}
                <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-right">
                  <div>
                    <div className="font-mono text-base font-black text-slate-900">
                      {entry.carbonSavedKg.toFixed(1)}{' '}
                      <span className="text-xs font-normal text-slate-500">kg CO₂e</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      avoided emissions
                    </div>
                  </div>

                  {/* Kudos / High-Five Button */}
                  <button
                    type="button"
                    onClick={() => handleGiveKudos(entry)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all active:scale-90"
                    title={`Send a high-five to ${entry.name}`}
                  >
                    <span>👏</span>
                    <span className="font-mono">{entry.kudosCount}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Privacy & Ethics Note */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Community statistics are aggregated anonymously with active opt-in. Rankings are designed for peer encouragement and collective ecological diversion, not commercial scoring.
        </span>
      </div>
    </div>
  );
};
