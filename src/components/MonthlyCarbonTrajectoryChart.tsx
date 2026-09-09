import React, { useState } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Calendar, Zap, Award } from 'lucide-react';

interface MonthlyCarbonTrajectoryChartProps {
  currentCarbonSavedKg: number;
}

export const MonthlyCarbonTrajectoryChart: React.FC<MonthlyCarbonTrajectoryChartProps> = ({
  currentCarbonSavedKg,
}) => {
  const [viewMode, setViewMode] = useState<'6months' | '12months'>('6months');

  // Realistic historical monthly data leading up to the current month (Sep 2026)
  const fullYearData = [
    { month: 'Oct 25', monthlyKg: 1.8, cumulativeKg: 1.8, targetKg: 2.5, itemsSorted: 12 },
    { month: 'Nov 25', monthlyKg: 2.3, cumulativeKg: 4.1, targetKg: 2.5, itemsSorted: 15 },
    { month: 'Dec 25', monthlyKg: 2.1, cumulativeKg: 6.2, targetKg: 2.5, itemsSorted: 14 },
    { month: 'Jan 26', monthlyKg: 2.8, cumulativeKg: 9.0, targetKg: 3.0, itemsSorted: 18 },
    { month: 'Feb 26', monthlyKg: 2.4, cumulativeKg: 11.4, targetKg: 3.0, itemsSorted: 16 },
    { month: 'Mar 26', monthlyKg: 3.2, cumulativeKg: 14.6, targetKg: 3.0, itemsSorted: 21 },
    { month: 'Apr 26', monthlyKg: 2.9, cumulativeKg: 17.5, targetKg: 3.5, itemsSorted: 19 },
    { month: 'May 26', monthlyKg: 3.6, cumulativeKg: 21.1, targetKg: 3.5, itemsSorted: 24 },
    { month: 'Jun 26', monthlyKg: 3.4, cumulativeKg: 24.5, targetKg: 3.5, itemsSorted: 22 },
    { month: 'Jul 26', monthlyKg: 3.9, cumulativeKg: 28.4, targetKg: 4.0, itemsSorted: 26 },
    { month: 'Aug 26', monthlyKg: 4.2, cumulativeKg: 32.6, targetKg: 4.0, itemsSorted: 28 },
    { month: 'Sep 26', monthlyKg: Math.max(2.5, Number((currentCarbonSavedKg * 0.3).toFixed(1))), cumulativeKg: Number((32.6 + currentCarbonSavedKg * 0.3).toFixed(1)), targetKg: 4.5, itemsSorted: 31 }
  ];

  const displayData = viewMode === '6months' ? fullYearData.slice(6) : fullYearData;

  const totalPeriodSaved = displayData.reduce((acc, curr) => acc + curr.monthlyKg, 0).toFixed(1);
  const bestMonth = displayData.reduce((prev, curr) => (curr.monthlyKg > prev.monthlyKg ? curr : prev), displayData[0]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Avoided Emissions Progression</span>
          </div>
          <h3 className="font-bold text-base text-slate-900 font-['Space_Grotesk',sans-serif]">
            Monthly Carbon Savings & Milestone Trajectory
          </h3>
          <p className="text-xs text-slate-500">
            Monthly kilograms of CO₂e avoided (bars) vs. cumulative trajectory (line)
          </p>
        </div>

        {/* Timeframe switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('6months')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === '6months'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 6 Months
          </button>
          <button
            type="button"
            onClick={() => setViewMode('12months')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === '12months'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Year
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis 
              yAxisId="left" 
              stroke="#94A3B8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              unit=" kg" 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#10B981" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              unit=" kg" 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
              }}
              formatter={(value: any, name: string | undefined) => {
                const metricName = name || '';
                if (metricName === 'monthlyKg') return [`${value} kg CO₂e`, 'Monthly Diverted'];
                if (metricName === 'cumulativeKg') return [`${value} kg CO₂e`, 'Cumulative Total'];
                if (metricName === 'targetKg') return [`${value} kg CO₂e`, 'Zero-Waste Goal'];
                return [value, metricName];
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
              formatter={(value) => {
                if (value === 'monthlyKg') return 'Monthly Avoided (kg)';
                if (value === 'cumulativeKg') return 'Cumulative Trajectory (kg)';
                if (value === 'targetKg') return 'Target Goal (kg)';
                return value;
              }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="monthlyKg" 
              fill="#10B981" 
              radius={[6, 6, 0, 0]} 
              maxBarSize={38} 
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="cumulativeKg" 
              stroke="#3B82F6" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#FFFFFF' }} 
              activeDot={{ r: 6 }} 
            />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="targetKg" 
              stroke="#F59E0B" 
              strokeWidth={2} 
              strokeDasharray="4 4" 
              dot={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Summary KPI Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Period Total Diverted</div>
            <div className="font-bold text-slate-900 text-sm">{totalPeriodSaved} kg CO₂e</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Best Month</div>
            <div className="font-bold text-slate-900 text-sm">{bestMonth.month} ({bestMonth.monthlyKg} kg)</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Avg Diverted / Mo</div>
            <div className="font-bold text-slate-900 text-sm">
              {(Number(totalPeriodSaved) / displayData.length).toFixed(1)} kg / month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
