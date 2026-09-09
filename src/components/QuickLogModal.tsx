import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Check, 
  Recycle, 
  Leaf, 
  Smartphone, 
  AlertTriangle, 
  Sparkles 
} from 'lucide-react';
import { motion } from 'motion/react';
import { WasteAnalysisResult } from '../types';
import confetti from 'canvas-confetti';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogItem: (item: WasteAnalysisResult) => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onLogItem,
}) => {
  const [itemName, setItemName] = useState<string>('');
  const [category, setCategory] = useState<'recyclable' | 'organic' | 'ewaste' | 'hazardous' | 'general'>('recyclable');
  const [material, setMaterial] = useState<string>('PET Plastic');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    // Estimate carbon savings based on category
    let carbonKg = 0.12;
    let binColor = 'Blue Bin (Dry Recyclables)';
    let recyclability = 'Recyclable Stream';
    let whereTo = 'Blue Bin (Dry Recyclables)';

    if (category === 'organic') {
      carbonKg = 0.18;
      binColor = 'Green Bin (Compost / Wet)';
      recyclability = '100% Compostable';
      whereTo = 'Green Compost Bin';
    } else if (category === 'ewaste') {
      carbonKg = 0.45;
      binColor = 'Yellow Bin (E-Waste)';
      recyclability = 'Authorized E-Waste Depot';
      whereTo = 'E-Waste Drop-off Depot';
    } else if (category === 'hazardous') {
      carbonKg = 0.05;
      binColor = 'Red Bin (Hazardous)';
      recyclability = 'Special Hazardous Disposal';
      whereTo = 'Special Collection Facility';
    }

    const newItem: WasteAnalysisResult = {
      id: `manual-${Date.now()}`,
      detectedItem: itemName.trim(),
      material: material,
      category: category,
      categoryLabel: category === 'recyclable' ? 'Recyclable / Dry' : category === 'organic' ? 'Organic / Compost' : category === 'ewaste' ? 'E-Waste' : 'General Waste',
      recyclability: recyclability,
      disposalInstructions: `Properly segregated into ${binColor} via Quick Log record.`,
      binColor: binColor,
      whereToSegregate: whereTo,
      confidence: 100,
      confidenceLevel: 'high',
      environmentalImpact: `Proper disposal diverted this item from landfill, preventing ~${carbonKg} kg CO2e.`,
      recommendedDisposal: `Deposit into ${binColor}.`,
      whyThisResult: 'User manual verified segregation log.',
      ecoTip: 'Keep up consistent daily sorting to compound your circular waste reduction.',
      ecoActionScore: 95,
      specialHandlingRequired: category === 'ewaste' || category === 'hazardous',
      carbonSavedKg: carbonKg,
      timestamp: new Date().toISOString(),
      contaminationRisk: 'none'
    };

    onLogItem(newItem);

    try {
      confetti({ particleCount: 50, spread: 50 });
    } catch {}

    setItemName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Quick Log Sorted Item</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Sorted something without taking a photo? Log it manually to keep your eco streak alive and record avoided emissions.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Aluminum Soda Can, Apple Core, Cereal Box"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Waste Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setCategory('recyclable'); setMaterial('PET / Aluminum / Cardboard'); }}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${category === 'recyclable' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                <Recycle className="w-4 h-4 text-emerald-600" />
                <span>Recyclable</span>
              </button>

              <button
                type="button"
                onClick={() => { setCategory('organic'); setMaterial('Food Scraps / Biomass'); }}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${category === 'organic' ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                <Leaf className="w-4 h-4 text-amber-600" />
                <span>Organic</span>
              </button>

              <button
                type="button"
                onClick={() => { setCategory('ewaste'); setMaterial('Electronics / Wiring'); }}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${category === 'ewaste' ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>E-Waste</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Material Specification
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g. Cardboard, Aluminum, Glass, Food"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Log Sorted Item & Add Carbon Savings</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
