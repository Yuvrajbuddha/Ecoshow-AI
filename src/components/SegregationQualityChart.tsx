import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { ShieldCheck, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface SegregationQualityChartProps {
  ecoScore: number;
}

export const SegregationQualityChart: React.FC<SegregationQualityChartProps> = ({
  ecoScore,
}) => {
  // Weekly compliance vs contamination rate data
  const qualityData = [
    { day: 'Mon', compliance: 92, contaminationRisk: 8, notes: 'Rinsed PET soda bottle' },
    { day: 'Tue', compliance: 95, contaminationRisk: 5, notes: 'Paper carton flattened' },
    { day: 'Wed', compliance: 88, contaminationRisk: 12, notes: 'Minor oil residue on takeout box' },
    { day: 'Thu', compliance: 96, contaminationRisk: 4, notes: 'Clean aluminum beverage can' },
    { day: 'Fri', compliance: 94, contaminationRisk: 6, notes: 'Organic kitchen waste composted' },
    { day: 'Sat', compliance: 98, contaminationRisk: 2, notes: 'Dry paper packaging' },
    { day: 'Sun', compliance: 97, contaminationRisk: 3, notes: 'Glass pickle jar washed' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200 mb-1">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            <span>Purity & Contamination Auditing</span>
          </div>
          <h3 className="font-bold text-base text-slate-900 font-['Space_Grotesk',sans-serif]">
            Stream Segregation Purity vs. Contamination Risk
          </h3>
          <p className="text-xs text-slate-500">
            Measures clean sorting adherence to eliminate municipal batch rejections
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            {ecoScore}% Overall Purity
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={qualityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis 
              stroke="#94A3B8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              unit="%" 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                border: 'none',
              }}
              formatter={(value: any, name: string | undefined) => {
                if (name === 'compliance') return [`${value}%`, 'Sorting Compliance'];
                if (name === 'contaminationRisk') return [`${value}%`, 'Contamination Risk'];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                const item = payload && payload[0]?.payload;
                return `${label} • ${item?.notes || ''}`;
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              formatter={(value) => {
                if (value === 'compliance') return 'Sorting Compliance (%)';
                if (value === 'contaminationRisk') return 'Contamination Risk (%)';
                return value;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="compliance" 
              stroke="#10B981" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="contaminationRisk" 
              stroke="#EF4444" 
              strokeWidth={2} 
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#EF4444', strokeWidth: 1.5, stroke: '#FFFFFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2 Pro Tips to Keep Contamination Low */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-900">Always Swill & Empty Containers</span>
            <p className="text-[11px] text-emerald-700 mt-0.5 leading-tight">
              Food residues spoil paper batches. A 5-second rinse preserves 100% recyclability.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900">Separate Composite Materials</span>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-tight">
              Detach plastic films from cardboard boxes and remove metal foil lids from yogurt cups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
