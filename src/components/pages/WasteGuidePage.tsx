import React, { useState, useEffect, useMemo } from 'react';
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
  Info,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Headphones,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WasteCategoryItem {
  id: string;
  title: string;
  streamName: string;
  binColor: string;
  emoji: string;
  accent: 'emerald' | 'amber' | 'blue' | 'rose';
  description: string;
  acceptedItems: string[];
  preparationInstructions: string[];
  dos: string[];
  donts: string[];
  safetyWarning?: string;
}

const CATEGORY_ITEMS: WasteCategoryItem[] = [
  {
    id: 'recyclable',
    title: 'Dry Recyclables',
    streamName: 'Blue Bin / Dry Collection',
    binColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    emoji: '♻️',
    accent: 'emerald',
    description: 'Clean rigid materials that can be remelted, re-pulped, or re-extruded into secondary circular commodities.',
    acceptedItems: [
      'PET #1 & HDPE #2 plastic bottles',
      'Aluminum beverage cans',
      'Clean corrugated cardboard boxes',
      'Glass food jars and beverage bottles',
      'Steel and tin food cans',
      'Clean dry office paper and newsprint'
    ],
    preparationInstructions: [
      'Empty all liquids and scrape excess food particles completely.',
      'Give containers a quick cold water rinse; no need for dishwasher washing.',
      'Screw plastic caps back onto bottles so optical sorters do not lose them.',
      'Flatten all shipping cartons and cardboard boxes to maximize collection volume.'
    ],
    dos: [
      'Check the triangular resin number on the bottom of plastic containers.',
      'Bunch clean aluminum foil into a 2-inch ball before placing in bin.'
    ],
    donts: [
      'Do not bag your recyclables inside plastic garbage sacks.',
      'Do not include greasy pizza box bottoms or plastic-lined coffee cups.'
    ],
    safetyWarning: 'Never place rechargeable lithium batteries in curbside recycling bins, as truck compaction causes dangerous friction fires.'
  },
  {
    id: 'organic',
    title: 'Organic & Compostable Waste',
    streamName: 'Green Bin / Wet Compost',
    binColor: 'bg-amber-100 text-amber-800 border-amber-200',
    emoji: '🍌',
    accent: 'amber',
    description: 'Biodegradable biomass that decomposes into nutrient-rich organic humus and soil-restoring fertilizer.',
    acceptedItems: [
      'Fruit peels and vegetable scraps',
      'Coffee grounds and unbleached paper filters',
      'Crushed eggshells and nut hulls',
      'Dry yard trimmings and garden clippings',
      'Shredded unprinted paper and cardboard',
      'Greasy pizza box bottoms'
    ],
    preparationInstructions: [
      'Peel off and discard all produce stickers, plastic labels, and rubber bands.',
      'Store wet kitchen scraps in a ventilated counter caddy with certified BPI compostable liners.',
      'Chop bulky garden branches down into pieces shorter than three feet.'
    ],
    dos: [
      'Balance wet green nitrogen scraps with dry brown carbon material like dried leaves or plain cardboard.',
      'Deposit in curbside organic carts or home compost tumblers.'
    ],
    donts: [
      'Do not include pet waste, large animal bones, or non-biodegradable synthetic teabags.',
      'Do not place plastic bags or glossy printed cartons in the organic bin.'
    ]
  },
  {
    id: 'ewaste',
    title: 'Electronic Waste (E-Waste)',
    streamName: 'Dedicated Certified Drop-off',
    binColor: 'bg-blue-100 text-blue-800 border-blue-200',
    emoji: '🔋',
    accent: 'blue',
    description: 'Discarded electrical and electronic appliances containing precious raw materials and hazardous heavy metals.',
    acceptedItems: [
      'Smartphones, tablets, and ereaders',
      'Charging cables, power bricks, and cords',
      'Laptops, motherboards, and PC towers',
      'Keyboards, mice, and computer peripherals',
      'Household alkaline and lithium batteries',
      'Microwaves, blenders, and small home appliances'
    ],
    preparationInstructions: [
      'Perform a full factory reset to permanently wipe sensitive personal data.',
      'Remove detachable battery packs whenever possible before dropping off.',
      'Cover positive and negative terminals of loose lithium batteries with electrical tape.'
    ],
    dos: [
      'Drop off at municipal e-waste recycling depots or certified electronics retailer kiosks.',
      'Consider donation or refurbishment if devices are in working condition.'
    ],
    donts: [
      'Never place electronic items or loose batteries into curbside trash or recycling carts.'
    ],
    safetyWarning: 'Damaged, punctured, or swollen lithium-ion batteries present severe thermal runaway and spontaneous combustion risks.'
  },
  {
    id: 'hazardous',
    title: 'Hazardous Household Waste',
    streamName: 'Municipal Hazardous Facility Only',
    binColor: 'bg-rose-100 text-rose-800 border-rose-200',
    emoji: '⚠️',
    accent: 'rose',
    description: 'Substances that are corrosive, toxic, flammable, or chemically reactive. Must never enter drains or ordinary landfills.',
    acceptedItems: [
      'Oil-based and latex paint cans',
      'Motor oil and automotive coolant',
      'Garden pesticides, weed killers, and herbicides',
      'Fluorescent light bulbs and CFL tubes',
      'Aerosol spray cans and propane canisters',
      'Prescription medicines and medical sharps'
    ],
    preparationInstructions: [
      'Keep all chemicals sealed in their original, clearly labeled containers.',
      'Ensure caps and lids are tightly closed to prevent noxious vapors or accidental leaks.',
      'Pack containers upright in a sturdy cardboard box inside your car trunk.'
    ],
    dos: [
      'Transport safely to your city’s designated Household Hazardous Waste Facility.',
      'Drop expired medications at secure pharmacy drop boxes.'
    ],
    donts: [
      'Never pour chemicals into storm drains, sinks, or household toilets.',
      'Do not puncture, crush, or incinerate pressurized aerosol cans.'
    ],
    safetyWarning: 'Improper disposal contaminates municipal drinking water reservoirs and poisons local aquatic wildlife.'
  }
];

export const WasteGuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'dos-donts' | 'resin' | 'myths'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>('all');

  // Web Speech API state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeReadingId, setActiveReadingId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);

  // Preload voices and stop speech when navigating away or unmounting
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;

      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Compute selected category for primary "Listen to Guide" button
  const effectiveSelectedCategory = useMemo(() => {
    if (selectedStreamFilter !== 'all') {
      const found = CATEGORY_ITEMS.find((c) => c.id === selectedStreamFilter);
      if (found) return found;
    }
    return CATEGORY_ITEMS[0]; // defaults to Dry Recyclables when all streams are shown
  }, [selectedStreamFilter]);

  const playGuideAudio = (category: WasteCategoryItem) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setSpeechFeedback('Speech synthesis is not supported on this browser or device.');
      setTimeout(() => setSpeechFeedback(null), 4000);
      return;
    }

    // Toggle pause/resume if clicking currently playing category
    if (isPlaying && activeReadingId === category.id) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    // Cancel any active audio first
    window.speechSynthesis.cancel();

    // Prepare complete, crystal-clear spoken guidance
    const spokenSentences: string[] = [
      `Disposal guide for ${category.title}.`,
      `Collection stream: ${category.streamName}.`,
      category.description,
      `Preparation steps: ${category.preparationInstructions.join('. ')}.`,
      `Accepted items include: ${category.acceptedItems.join(', ')}.`,
      `Important rules to follow. Do: ${category.dos.join('. ')}.`,
      `Do not: ${category.donts.join('. ')}.`
    ];

    if (category.safetyWarning) {
      spokenSentences.push(`Important safety alert: ${category.safetyWarning}`);
    }

    const textToRead = spokenSentences.join(' ');
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setActiveReadingId(category.id);
      setSpeechFeedback(`Reading guide for ${category.title}...`);
      setTimeout(() => setSpeechFeedback(null), 3000);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveReadingId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis state event:', e);
      setIsPlaying(false);
      setIsPaused(false);
      setActiveReadingId(null);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopGuideAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveReadingId(null);
  };

  const togglePauseResume = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const changeSpeed = (newRate: number) => {
    setSpeechRate(newRate);
    if (isPlaying && activeReadingId) {
      const currentCat = CATEGORY_ITEMS.find((c) => c.id === activeReadingId);
      if (currentCat) {
        // Restart speech with new rate smoothly
        window.speechSynthesis.cancel();
        setTimeout(() => {
          playGuideAudio(currentCat);
        }, 50);
      }
    }
  };

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

  const filteredCategories = CATEGORY_ITEMS.filter((c) => {
    const matchesFilter = selectedStreamFilter === 'all' || c.id === selectedStreamFilter;
    const matchesSearch = 
      searchQuery.trim() === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.streamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.acceptedItems.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

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

  const activeCategoryForDock = CATEGORY_ITEMS.find((c) => c.id === activeReadingId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative">
      {/* Toast Feedback */}
      <AnimatePresence>
        {speechFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-slate-700"
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>{speechFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* SEARCH BAR & CATEGORY STREAM CHIPS + LISTEN TO GUIDE BUTTON */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
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
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Stream Filter Pills */}
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
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                    selectedStreamFilter === stream.id
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {stream.label}
                </button>
              ))}
            </div>

            {/* Prominent Primary "Listen to Guide" Button */}
            <button
              id="listen-to-guide-primary-btn"
              type="button"
              onClick={() => playGuideAudio(effectiveSelectedCategory)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                isPlaying && activeReadingId === effectiveSelectedCategory.id
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
              }`}
              title={`Read aloud disposal instructions for ${effectiveSelectedCategory.title}`}
            >
              {isPlaying && activeReadingId === effectiveSelectedCategory.id ? (
                <>
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-2 bg-white rounded-full animate-bounce"></span>
                  </span>
                  <span>{isPaused ? 'Resume Guide' : 'Pause Guide'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-700" />
                  <span>Listen to Guide</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ACTIVE SPEECH SYNTHESIS CONTROLLER DOCK */}
      <AnimatePresence>
        {isPlaying && activeCategoryForDock && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl shrink-0">
                {activeCategoryForDock.emoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm truncate">
                    Listening to Guide: {activeCategoryForDock.title}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                    {isPaused ? 'Paused' : 'Playing'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  Stream: {activeCategoryForDock.streamName} • Preparation steps and contamination warnings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Playback speed buttons */}
              <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-[11px] font-mono font-bold">
                {[0.8, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changeSpeed(rate)}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      speechRate === rate
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Pause / Resume Button */}
              <button
                type="button"
                onClick={togglePauseResume}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all"
                title={isPaused ? 'Resume reading' : 'Pause reading'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              {/* Stop Button */}
              <button
                type="button"
                onClick={stopGuideAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800 transition-all"
                title="Stop audio playback"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: 4 WASTE STREAMS */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-400">
              No waste streams matched your search query.
            </div>
          ) : (
            filteredCategories.map((category) => {
              const isCurrentlyReading = isPlaying && activeReadingId === category.id;

              const borderClass = 
                category.accent === 'emerald' ? 'border-emerald-200/80' :
                category.accent === 'amber' ? 'border-amber-200/80' :
                category.accent === 'blue' ? 'border-blue-200/80' : 'border-rose-200/80';

              const headerBg = 
                category.accent === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                category.accent === 'amber' ? 'bg-amber-100 text-amber-800' :
                category.accent === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800';

              const streamLabelColor = 
                category.accent === 'emerald' ? 'text-emerald-700' :
                category.accent === 'amber' ? 'text-amber-700' :
                category.accent === 'blue' ? 'text-blue-700' : 'text-rose-700';

              return (
                <div
                  key={category.id}
                  className={`p-6 rounded-3xl bg-white border ${borderClass} shadow-xs space-y-4 transition-all ${
                    isCurrentlyReading ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${headerBg} flex items-center justify-center text-2xl shrink-0`}>
                        {category.emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{category.title}</h3>
                        <p className={`text-xs ${streamLabelColor} font-semibold`}>{category.streamName}</p>
                      </div>
                    </div>

                    {/* Dedicated 'Listen to Guide' button on each stream card */}
                    <button
                      type="button"
                      onClick={() => playGuideAudio(category)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        isCurrentlyReading
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200'
                      }`}
                      title={`Listen to disposal instructions for ${category.title}`}
                    >
                      {isCurrentlyReading ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                          <span>{isPaused ? 'Resume' : 'Pause'}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Listen to Guide</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {category.description}
                  </p>

                  {/* Preparation Guidelines */}
                  <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Preparation Instructions:</span>
                    </div>
                    <ul className="space-y-1 text-slate-600 pl-5 list-disc">
                      {category.preparationInstructions.map((prep, pIdx) => (
                        <li key={pIdx}>{prep}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Accepted Items Checklist */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                    <div className="font-bold text-slate-800">Accepted Items:</div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
                      {category.acceptedItems.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-center gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Safety Warning */}
                  {category.safetyWarning && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{category.safetyWarning}</span>
                    </div>
                  )}
                </div>
              );
            })
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

      {/* TAB 3: RESIN IDENTIFICATION CODES */}
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
