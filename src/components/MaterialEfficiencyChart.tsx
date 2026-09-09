import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { Layers, Zap, Scale, Sparkles, CheckCircle2 } from 'lucide-react';

interface MaterialEfficiencyChartProps {
  totalItemsSorted: number;
}

export const MaterialEfficiencyChart: React.FC<MaterialEfficiencyChartProps> = ({
  totalItemsSorted,
}) => {
  const [metricType, setMetricType] = useState<'mass' | 'energy'>('mass');

  // Multi-material circular performance based on user activity
  const materialData = [
    {
      material: 'PET Plastics (#1 & #2)',
      massKg: 5.4,
      energyKwh: 29.7,
      recoveryRate: 94,
      color: '#059669', // Emerald
      icon: '🧴',
      circularFact: 'Saves 70% energy vs producing virgin plastic resin'
    },
    {
      material: 'Cardboard & Paper',
      massKg: 7.2,
      energyKwh: 28.8,
      recoveryRate: 98,
      color: '#D97706', // Amber
      icon: '📦',
      circularFact: 'Saves 17 trees per ton and uses 60% less water'
    },
    {
      material: 'Aluminum & Steel Cans',
      massKg: 3.1,
      energyKwh: 43.4,
      recoveryRate: 99,
      color: '#3B82F6', // Blue
      icon: '🥫',
      circularFact: 'Infinitely recyclable with 95% energy reduction'
    },
    {
      material: 'Organic Compostables',
      massKg: 8.6,
      energyKwh: 12.9,
      recoveryRate: 95,
      color: '#10B981', // Green
      icon: '🍌',
      circularFact: 'Eliminates potent methane gas formation in landfills'
    },
    {
      material: 'Glass Containers',
      massKg: 4.8,
      energyKwh: 14.4,
      recoveryRate: 92,
      color: '#06B6D4', // Cyan
      icon: '🍾',
      circularFact: '100% recyclable with no loss in purity or clarity'
    },
    {
      material: 'Electronics & E-Waste',
      massKg: 1.6,
      energyKwh: 35.2,
      recoveryRate: 88,
      color: '#8B5CF6', // Purple
      icon: '🔋',
      circularFact: 'Recovers precious gold, copper, and rare lithium elements'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200 mb-1">
            <Layers className="w-3 h-3 text-blue-600" />
            <span>Circular Recovery Breakdown</span>
          </div>
          <h3 className="font-bold text-base text-slate-900 font-['Space_Grotesk',sans-serif]">
            Material Stream Recovery & Energy Conserved
          </h3>
          <p className="text-xs text-slate-500">
            Lifecycle diversion efficiency by specific packaging material
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricType('mass')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricType === 'mass'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>Diverted Mass (kg)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricType('energy')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricType === 'energy'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Energy Saved (kWh)</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={materialData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis 
              type="number" 
              stroke="#94A3B8" 
              fontSize={11} 
              tickLine={false}
              unit={metricType === 'mass' ? ' kg' : ' kWh'}
            />
            <YAxis 
              type="category" 
              dataKey="material" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false}
              width={140}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                border: 'none',
              }}
              formatter={(value: any, name: string | undefined, item: any) => {
                const row = item.payload;
                if (metricType === 'mass') {
                  return [`${value} kg (${row.recoveryRate}% recovered)`, 'Diverted Weight'];
                }
                return [`${value} kWh energy spared`, 'Energy Saved'];
              }}
            />
            <Bar
              dataKey={metricType === 'mass' ? 'massKg' : 'energyKwh'}
              radius={[0, 8, 8, 0]}
              maxBarSize={22}
            >
              {materialData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Material Quick Fact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
        {materialData.slice(0, 3).map((item) => (
          <div
            key={item.material}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5"
          >
            <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>{item.material}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">{item.recoveryRate}% rate</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                {item.circularFact}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
