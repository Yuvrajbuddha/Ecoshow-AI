import React, { useState } from 'react';
import { 
  BookOpen, 
  Recycle, 
  Leaf, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Search, 
  Sparkles,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

export const WasteGuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'dos-donts' | 'resin' | 'myths'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>('all');

  // Universal Dos and Donts
  const dosAndDonts = [
    {
      doTitle: 'Empty and lightly scrape food containers',
      doDesc: 'Remove excess liquid and food particles so grease does not ruin whole batches of paper pulp.',
      dontTitle: 'Do not put soiled paper or pizza bottoms in recycling',
      dontDesc: 'Heavy grease clings to paper fibers and cannot be filtered out at paper recycling mills.',
    },
    {
      doTitle: 'Keep caps screwed onto plastic bottles',
      doDesc: 'Modern reclamation plants grind bottles and caps together; density separation handles them easily.',
      dontTitle: 'Do not bag recyclables in plastic garbage sacks',
      dontDesc: 'Plastic bags jam sorting conveyor gears and cause MRF workers to throw the whole bag in trash.',
    },
    {
      doTitle: 'Recycle clean aluminum foil rolled in a ball',
      doDesc: 'Bunch foil into a ball at least 2 inches wide so magnetic eddy current separators can catch it.',
      dontTitle: 'Do not put rechargeable batteries in regular curbside bins',
      dontDesc: 'Lithium batteries crush under compactor pressure, causing dangerous fires inside collection trucks.',
    },
    {
      doTitle: 'Check resin numbers #1 and #2 for curbside',
      doDesc: 'PET and HDPE have standard circular recycling markets across virtually every municipal grid.',
      dontTitle: 'Do not "wishcycle" items hoping they are recyclable',
      dontDesc: 'Items like garden hoses, broken toys, and electronics shut down sorting equipment and elevate costs.',
    },
  ];

  // Resin codes
  const resinCodes = [
    { code: '#1', name: 'PET / PETE', full: 'Polyethylene Terephthalate', recyclable: 'High (Curbside)', uses: 'Water & soda bottles, salad dressing jars', tip: 'Rinse cleanly; replace cap before recycling.' },
    { code: '#2', name: 'HDPE', full: 'High-Density Polyethylene', recyclable: 'High (Curbside)', uses: 'Milk jugs, detergent bottles, shampoo containers', tip: 'Sturdy & easily reprocessed into outdoor lumber.' },
    { code: '#3', name: 'PVC', full: 'Polyvinyl Chloride', recyclable: 'Low / Specialized', uses: 'Pipes, wire jacketing, medical tubing', tip: 'Contains chlorine; do NOT place in standard curbside bins.' },
    { code: '#4', name: 'LDPE', full: 'Low-Density Polyethylene', recyclable: 'Moderate (Store Drop-off)', uses: 'Grocery plastic bags, bread bags, shrink wrap', tip: 'Take to supermarket drop-off collection bins.' },
    { code: '#5', name: 'PP', full: 'Polypropylene', recyclable: 'Moderate to High', uses: 'Yogurt cups, bottle caps, medicine bottles, straw tubs', tip: 'Check local guidelines; increasingly accepted.' },
    { code: '#6', name: 'PS', full: 'Polystyrene', recyclable: 'Very Low', uses: 'Styrofoam cups, egg cartons, packing peanuts', tip: 'Avoid single-use foam; prone to fragmentation.' },
    { code: '#7', name: 'OTHER', full: 'Multi-layer, Polycarbonate, Bioplastics (PLA)', recyclable: 'Varies', uses: 'Baby bottles, sunglasses, compostable bioplastics', tip: 'Bioplastics require industrial compost, not home bins.' },
  ];

  // Common myths
  const myths = [
    {
      myth: '“Greasy pizza boxes belong in cardboard recycling.”',
      truth: 'False',
      explanation: 'Food oils and grease contaminate paper pulp during repulping. Only clean tops can be recycled; tear off greasy bottoms for organic composting or general waste.',
    },
    {
      myth: '“Any plastic with a recycling triangle can go in curbside bins.”',
      truth: 'False',
      explanation: 'The triangle indicates resin chemistry (#1 to #7), NOT municipal acceptance. Only #1 and #2 are universally accepted curbside in most cities.',
    },
    {
      myth: '“Recyclables must be scrubbed with hot soap and water.”',
      truth: 'False',
      explanation: 'A quick scrape and light rinse to remove solid food residue is sufficient. Excessive washing wastes freshwater.',
    },
    {
      myth: '“Crushing aluminum cans is always best.”',
      truth: 'Context-Dependent',
      explanation: 'In single-stream facilities with optical sorters, flattened cans can mistakenly register as paper. Leaving slightly 3D helps optical sorters catch them.',
    },
  ];

  const filteredResins = resinCodes.filter((r) => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.full.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.uses.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyths = myths.filter((m) =>
    m.myth.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.explanation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Master Knowledge Base</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
            Waste Segregation Guide
          </h1>
          <p className="text-slate-500 text-sm">
            Everything you need to know about material streams, resin numbers, and contamination prevention.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Waste Streams
          </button>
          <button
            onClick={() => setActiveTab('dos-donts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dos-donts'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Do's & Don'ts
          </button>
          <button
            onClick={() => setActiveTab('resin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'resin'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resin Codes (#1-#7)
          </button>
          <button
            onClick={() => setActiveTab('myths')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'myths'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recycling Myths
          </button>
        </div>
      </div>

      {/* SEARCH BAR & CATEGORY STREAM CHIPS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="guide-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, polymers, resin numbers, or disposal rules..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {activeTab === 'categories' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Streams' },
              { id: 'recyclable', label: 'Recyclables' },
              { id: 'organic', label: 'Organic' },
              { id: 'ewaste', label: 'E-Waste' },
              { id: 'hazardous', label: 'Hazardous' },
            ].map((stream) => (
              <button
                key={stream.id}
                onClick={() => setSelectedStreamFilter(stream.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  selectedStreamFilter === stream.id
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {stream.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: 4 WASTE STREAMS */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stream 1: Recyclables */}
          {(selectedStreamFilter === 'all' || selectedStreamFilter === 'recyclable') && (
            <div className="p-6 rounded-3xl bg-white border border-emerald-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl">
                  ♻️
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Dry Recyclables</h3>
                  <p className="text-xs text-emerald-700 font-semibold">Blue Bin / Dry Collection</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean rigid materials that can be remelted, re-pulped, or re-extruded into secondary circular commodities.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="font-bold text-slate-800">Accepted Items:</div>
                <ul className="grid grid-cols-2 gap-1.5 text-slate-600">
                  <li className="flex items-center gap-1.5">✓ PET #1 & HDPE #2 Bottles</li>
                  <li className="flex items-center gap-1.5">✓ Aluminum soda cans</li>
                  <li className="flex items-center gap-1.5">✓ Clean cardboard boxes</li>
                  <li className="flex items-center gap-1.5">✓ Glass food jars & bottles</li>
                  <li className="flex items-center gap-1.5">✓ Steel & tin food cans</li>
                  <li className="flex items-center gap-1.5">✓ Clean office paper</li>
                </ul>
              </div>
            </div>
          )}

          {/* Stream 2: Organic */}
          {(selectedStreamFilter === 'all' || selectedStreamFilter === 'organic') && (
            <div className="p-6 rounded-3xl bg-white border border-amber-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl">
                  🍌
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Organic / Compostable</h3>
                  <p className="text-xs text-amber-700 font-semibold">Green Bin / Wet Compost</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Biodegradable biomass that decomposes anaerobically into rich humus and nutrient-dense fertilizer.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="font-bold text-slate-800">Accepted Items:</div>
                <ul className="grid grid-cols-2 gap-1.5 text-slate-600">
                  <li className="flex items-center gap-1.5">✓ Fruit peels & vegetable scraps</li>
                  <li className="flex items-center gap-1.5">✓ Coffee grounds & tea leaves</li>
                  <li className="flex items-center gap-1.5">✓ Eggshells & nut hulls</li>
                  <li className="flex items-center gap-1.5">✓ Shredded unprinted paper</li>
                  <li className="flex items-center gap-1.5">✓ Garden clippings & dry leaves</li>
                  <li className="flex items-center gap-1.5">✓ Greasy pizza box bottoms</li>
                </ul>
              </div>
            </div>
          )}

          {/* Stream 3: E-Waste */}
          {(selectedStreamFilter === 'all' || selectedStreamFilter === 'ewaste') && (
            <div className="p-6 rounded-3xl bg-white border border-blue-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-2xl">
                  🔋
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Electronic Waste (E-Waste)</h3>
                  <p className="text-xs text-blue-700 font-semibold">Dedicated Certified Drop-off</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Discarded electrical appliances containing precious metals (gold, copper, lithium) and toxic heavy metals.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="font-bold text-slate-800">Accepted Items:</div>
                <ul className="grid grid-cols-2 gap-1.5 text-slate-600">
                  <li className="flex items-center gap-1.5">✓ Old smartphones & tablets</li>
                  <li className="flex items-center gap-1.5">✓ Charging cables & adapters</li>
                  <li className="flex items-center gap-1.5">✓ Laptops & motherboards</li>
                  <li className="flex items-center gap-1.5">✓ Keyboards, mice & headsets</li>
                  <li className="flex items-center gap-1.5">✓ Alkaline & lithium batteries</li>
                  <li className="flex items-center gap-1.5">✓ Microwaves & small appliances</li>
                </ul>
              </div>
            </div>
          )}

          {/* Stream 4: Hazardous */}
          {(selectedStreamFilter === 'all' || selectedStreamFilter === 'hazardous') && (
            <div className="p-6 rounded-3xl bg-white border border-rose-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Hazardous & Chemical</h3>
                  <p className="text-xs text-rose-700 font-semibold">Municipal Hazardous Facility Only</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Substances that are corrosive, toxic, flammable, or infectious. Never dump down storm drains or trash.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="font-bold text-slate-800">Accepted Items:</div>
                <ul className="grid grid-cols-2 gap-1.5 text-slate-600">
                  <li className="flex items-center gap-1.5">✓ Oil & latex paint cans</li>
                  <li className="flex items-center gap-1.5">✓ Motor oil & automotive fluids</li>
                  <li className="flex items-center gap-1.5">✓ Pesticides & herbicides</li>
                  <li className="flex items-center gap-1.5">✓ Fluorescent CFL light tubes</li>
                  <li className="flex items-center gap-1.5">✓ Aerosol spray cans</li>
                  <li className="flex items-center gap-1.5">✓ Medical sharps in puncture bins</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLEAR DO'S AND DON'TS */}
      {activeTab === 'dos-donts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dosAndDonts.map((item, idx) => (
            <div key={idx} className="space-y-3">
              {/* Do Card */}
              <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/90 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>DO: {item.doTitle}</span>
                </div>
                <p className="text-xs text-emerald-800/90 leading-relaxed pl-6">
                  {item.doDesc}
                </p>
              </div>

              {/* Don't Card */}
              <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200/90 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>DON'T: {item.dontTitle}</span>
                </div>
                <p className="text-xs text-rose-800/90 leading-relaxed pl-6">
                  {item.dontDesc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: RESIN IDENTIFICATION CODES */}
      {activeTab === 'resin' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
            <Info className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>
              The SPI Resin Identification Coding System classifies plastic polymers to standardize commercial sorting.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResins.length === 0 ? (
              <div className="col-span-full py-8 text-center text-sm text-slate-400">
                No plastic resin types matched your search.
              </div>
            ) : (
              filteredResins.map((r) => (
                <div
                  key={r.code}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-black flex items-center justify-center text-base">
                      {r.code}
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {r.recyclable}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{r.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">{r.full}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div>
                      <strong>Common uses:</strong> {r.uses}
                    </div>
                    <div className="text-emerald-800 font-medium bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                      💡 {r.tip}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RECYCLING MYTHS DEBUNKED */}
      {activeTab === 'myths' && (
        <div className="space-y-4">
          {filteredMyths.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No recycling myths matched your search query.
            </div>
          ) : (
            filteredMyths.map((m, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <span className="text-xl">🤔</span>
                  <span>{m.myth}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {m.truth}
                  </span>
                  <span className="text-xs font-bold text-slate-500">Expert Explanation:</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {m.explanation}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
