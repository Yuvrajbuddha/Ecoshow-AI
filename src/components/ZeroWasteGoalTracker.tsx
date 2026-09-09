import React, { useState } from 'react';
import { Target, CheckCircle2, Flame, Award, ChevronRight, Edit3, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ZeroWasteGoalTrackerProps {
  currentCarbonKg: number;
  itemsSorted: number;
}

export const ZeroWasteGoalTracker: React.FC<ZeroWasteGoalTrackerProps> = ({
  currentCarbonKg,
  itemsSorted,
}) => {
  const [monthlyTargetKg, setMonthlyTargetKg] = useState<number>(20);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempTarget, setTempTarget] = useState<string>('20');

  const currentMonthSaved = Math.max(1.5, Number((currentCarbonKg * 0.4).toFixed(1)));
  const progressPercent = Math.min(100, Math.round((currentMonthSaved / monthlyTargetKg) * 100));
  const remainingKg = Math.max(0, Number((monthlyTargetKg - currentMonthSaved).toFixed(1)));

  // Pacing calculation for current day of month (e.g. day 9 of 30)
  const currentDay = 9;
  const daysInMonth = 30;
  const expectedPaceKg = (monthlyTargetKg / daysInMonth) * currentDay;
  const isAheadOfPace = currentMonthSaved >= expectedPaceKg;
  const paceDifference = Math.abs(currentMonthSaved - expectedPaceKg).toFixed(1);

  const handleSaveTarget = () => {
    const val = parseFloat(tempTarget);
    if (!isNaN(val) && val >= 5 && val <= 200) {
      setMonthlyTargetKg(val);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 font-['Space_Grotesk',sans-serif]">
              Monthly Circular Diversion Goal
            </h3>
            <p className="text-xs text-slate-500">
              Personal commitment for September 2026 • Cycle resets in {daysInMonth - currentDay} days
            </p>
          </div>
        </div>

        {/* Edit Target Control */}
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="200"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-20 px-2 py-1 text-xs font-bold border border-emerald-500 rounded-lg focus:outline-none"
              />
              <span className="text-xs text-slate-500 font-bold">kg</span>
              <button
                type="button"
                onClick={handleSaveTarget}
                className="p-1.5 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempTarget(monthlyTargetKg.toString());
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Target: {monthlyTargetKg} kg</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Main Metrics */}
      <div className="space-y-3">
        <div className="flex justify-between items-end text-xs">
          <div>
            <div className="text-slate-400 font-semibold text-[10px] uppercase">Current Month Avoided</div>
            <div className="text-2xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
              {currentMonthSaved} <span className="text-sm font-normal text-slate-500">/ {monthlyTargetKg} kg CO₂e</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-emerald-600 font-['Space_Grotesk',sans-serif]">
              {progressPercent}%
            </span>
            <div className="text-[10px] text-slate-400">Completed</div>
          </div>
        </div>

        {/* Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
          />
        </div>

        {/* Pacing & Status Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isAheadOfPace ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-slate-700">
              {isAheadOfPace ? (
                <span className="text-emerald-700">
                  Ahead of schedule! (+{paceDifference} kg above day {currentDay} pace)
                </span>
              ) : (
                <span className="text-amber-700">
                  {paceDifference} kg to reach expected day {currentDay} pace
                </span>
              )}
            </span>
          </div>

          <span className="text-slate-500">
            {remainingKg > 0 ? `${remainingKg} kg needed to hit goal` : '🎉 Monthly goal surpassed!'}
          </span>
        </div>
      </div>

      {/* 3 Milestone Checkpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className={`p-3 rounded-2xl border ${progressPercent >= 33 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200/70 text-slate-500'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold">Stage 1: Seedling</span>
            {progressPercent >= 33 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <span className="text-[10px] text-slate-400">33%</span>
            )}
          </div>
          <div className="text-[11px] text-slate-600">6.6 kg CO₂e prevented</div>
        </div>

        <div className={`p-3 rounded-2xl border ${progressPercent >= 66 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200/70 text-slate-500'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold">Stage 2: Guardian</span>
            {progressPercent >= 66 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <span className="text-[10px] text-slate-400">66%</span>
            )}
          </div>
          <div className="text-[11px] text-slate-600">13.3 kg CO₂e prevented</div>
        </div>

        <div className={`p-3 rounded-2xl border ${progressPercent >= 100 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200/70 text-slate-500'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold">Stage 3: Champion</span>
            {progressPercent >= 100 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <span className="text-[10px] text-slate-400">100%</span>
            )}
          </div>
          <div className="text-[11px] text-slate-600">{monthlyTargetKg} kg milestone reward</div>
        </div>
      </div>
    </div>
  );
};
