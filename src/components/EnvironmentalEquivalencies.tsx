import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TreePine, 
  Car, 
  Lightbulb, 
  Droplets, 
  Smartphone, 
  Sparkles, 
  Calculator, 
  TrendingUp, 
  ArrowRight,
  Info
} from 'lucide-react';

interface EnvironmentalEquivalenciesProps {
  totalCarbonSavedKg: number;
}

export const EnvironmentalEquivalencies: React.FC<EnvironmentalEquivalenciesProps> = ({
  totalCarbonSavedKg,
}) => {
  // Interactive projection: additional items sorted per week
  const [weeklyExtraItems, setWeeklyExtraItems] = useState<number>(5);

  // Environmental equivalency factors (standard EPA and GHG protocol estimates):
  // 1 kg CO2 avoided ≈ 2.48 miles driven by avg passenger vehicle
  // 1 kg CO2 avoided ≈ 0.045 urban tree seedlings grown for 10 years
  // 1 kg CO2 avoided ≈ 38.5 hours of 10W LED bulb lighting
  // 1 kg CO2 avoided ≈ 14.2 liters of freshwater conserved in circular manufacturing
  // 1 kg CO2 avoided ≈ 122 smartphone recharges

  const treesEquiv = (totalCarbonSavedKg * 0.045).toFixed(1);
  const milesEquiv = Math.round(totalCarbonSavedKg * 2.48);
  const ledHours = Math.round(totalCarbonSavedKg * 38.5);
  const waterLiters = Math.round(totalCarbonSavedKg * 14.2);
  const phoneCharges = Math.round(totalCarbonSavedKg * 122);

  // Projection math: avg 0.15 kg CO2e per properly segregated household item
  const projectedExtraAnnualCarbon = (weeklyExtraItems * 52 * 0.15);
  const totalProjectedAnnualCarbon = (totalCarbonSavedKg + projectedExtraAnnualCarbon);
  const projectedAnnualTrees = (totalProjectedAnnualCarbon * 0.045).toFixed(1);
  const projectedAnnualMiles = Math.round(totalProjectedAnnualCarbon * 2.48);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Tangible Real-World Equivalence</span>
          </div>
          <h3 className="font-bold text-lg text-slate-900 font-['Space_Grotesk',sans-serif]">
            What Your {totalCarbonSavedKg.toFixed(1)} kg CO₂e Saved Means
          </h3>
          <p className="text-xs text-slate-500">
            Based on standard EPA greenhouse gas equivalencies and circular lifecycle data.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 flex items-center gap-1.5 self-start sm:self-auto">
          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live Conversions</span>
        </div>
      </div>

      {/* 5 Real-World Equivalencies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Trees Seedlings */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100/80 flex flex-col justify-between space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-950 font-['Space_Grotesk',sans-serif]">
              {treesEquiv}
            </div>
            <div className="text-xs font-bold text-emerald-800">Tree Seedlings</div>
            <div className="text-[11px] text-emerald-700/80 leading-tight mt-0.5">
              Grown for 10 yrs carbon absorption
            </div>
          </div>
        </div>

        {/* Metric 2: Miles of Car Travel */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100/80 flex flex-col justify-between space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-950 font-['Space_Grotesk',sans-serif]">
              {milesEquiv}
            </div>
            <div className="text-xs font-bold text-blue-800">Miles Avoided</div>
            <div className="text-[11px] text-blue-700/80 leading-tight mt-0.5">
              Gasoline car driving emissions spared
            </div>
          </div>
        </div>

        {/* Metric 3: LED Bulb Energy */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100/80 flex flex-col justify-between space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950 font-['Space_Grotesk',sans-serif]">
              {ledHours}
            </div>
            <div className="text-xs font-bold text-amber-800">LED Lighting Hrs</div>
            <div className="text-[11px] text-amber-700/80 leading-tight mt-0.5">
              Clean home illumination saved
            </div>
          </div>
        </div>

        {/* Metric 4: Water Conserved */}
        <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-100/80 flex flex-col justify-between space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-700 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-cyan-950 font-['Space_Grotesk',sans-serif]">
              {waterLiters} L
            </div>
            <div className="text-xs font-bold text-cyan-800">Water Conserved</div>
            <div className="text-[11px] text-cyan-700/80 leading-tight mt-0.5">
              Freshwater saved via circular recycling
            </div>
          </div>
        </div>

        {/* Metric 5: Phone Charges */}
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100/80 flex flex-col justify-between space-y-2 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-950 font-['Space_Grotesk',sans-serif]">
              {phoneCharges.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-purple-800">Phone Recharges</div>
            <div className="text-[11px] text-purple-700/80 leading-tight mt-0.5">
              Full smartphone battery cycles
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Annual Projection Simulator */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-sm text-white font-['Space_Grotesk',sans-serif]">
              Interactive Future Impact Forecast
            </h4>
          </div>
          <span className="text-xs text-emerald-300 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-700/50">
            +{weeklyExtraItems} extra items/week = +{projectedExtraAnnualCarbon.toFixed(1)} kg CO₂e/yr
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Simulate how increasing your weekly recycling consistency compounds your environmental footprint over 12 months:
        </p>

        {/* Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Extra items sorted per week:</span>
            <span className="text-emerald-400 font-mono text-sm font-black">
              {weeklyExtraItems} items/wk
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={weeklyExtraItems}
            onChange={(e) => setWeeklyExtraItems(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>+1 item (Light habit)</span>
            <span>+15 items (Dedicated)</span>
            <span>+30 items (Zero-waste hero)</span>
          </div>
        </div>

        {/* Projected 1-Year Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase font-bold">1-Year Total Diverted</div>
            <div className="text-lg font-black text-emerald-400 font-['Space_Grotesk',sans-serif] mt-0.5">
              {totalProjectedAnnualCarbon.toFixed(1)} kg CO₂e
            </div>
            <div className="text-[10px] text-slate-400">Cumulative footprint avoided</div>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Equivalent Trees Planted</div>
            <div className="text-lg font-black text-amber-300 font-['Space_Grotesk',sans-serif] mt-0.5">
              {projectedAnnualTrees} Trees
            </div>
            <div className="text-[10px] text-slate-400">Annual forest absorption</div>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Road Emissions Cancelled</div>
            <div className="text-lg font-black text-cyan-300 font-['Space_Grotesk',sans-serif] mt-0.5">
              {projectedAnnualMiles} Miles
            </div>
            <div className="text-[10px] text-slate-400">Combustion vehicle travel equivalent</div>
          </div>
        </div>
      </div>
    </div>
  );
};
