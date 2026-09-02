import {
  WasteAnalysisResult,
  DisposalCenter,
  ImpactMetrics,
  AchievementBadge,
  GuideItem
} from '../types';

export const SAMPLE_WASTE_ITEMS: Record<string, WasteAnalysisResult> = {
  plastic_bottle: {
    id: 'sample-1',
    detectedItem: 'Plastic Beverage Bottle',
    material: 'PET Plastic (Resin Code 1)',
    category: 'recyclable',
    categoryLabel: 'Recyclable / Dry Waste',
    binColor: 'Blue Bin (Dry Recyclables)',
    whereToSegregate: 'Blue Bin (Dry Recyclables) after emptying and rinsing',
    segregationSteps: [
      '1. Empty any remaining liquid completely down the drain',
      '2. Give the inside a quick rinse with cold water',
      '3. Remove cap (re-attach or place in plastics if local facility accepts caps)',
      '4. Crush the bottle flat to conserve collection space',
      '5. Place into the Blue Bin (Dry Recyclables)'
    ],
    confidence: 94,
    confidenceLevel: 'high',
    recommendedDisposal: 'Empty and rinse the bottle before placing it in the Blue Recyclable bin according to local guidelines.',
    whyThisResult: 'This item appears to be primarily made of polyethylene terephthalate (PET) plastic, which is universally recyclable where collection facilities exist.',
    ecoTip: 'Consider switching to a double-walled insulated stainless steel bottle to avoid single-use plastic waste.',
    ecoActionScore: 92,
    specialHandlingRequired: false,
    recyclingCode: 'PET 1',
    contaminationRisk: 'low',
    alternativeUses: [
      'Seed starter pot for indoor herbs',
      'DIY drip irrigation funnel for house plants'
    ],
    carbonSavedKg: 0.12,
    timestamp: new Date().toISOString(),
    isMock: true
  },
  banana_peel: {
    id: 'sample-2',
    detectedItem: 'Fresh Banana Peel',
    material: 'Organic Biomass (Biodegradable)',
    category: 'organic',
    categoryLabel: 'Organic / Wet Waste',
    binColor: 'Green Bin (Organic / Compost)',
    whereToSegregate: 'Green Bin (Organic / Compost) or backyard food composter',
    segregationSteps: [
      '1. Remove any plastic stickers or fruit labels from the peel',
      '2. Do not enclose in standard plastic bags (use certified compostable liner or bare bin)',
      '3. Drop into the Green Bin (Organic / Wet Compost) or home compost pile'
    ],
    confidence: 96,
    confidenceLevel: 'high',
    recommendedDisposal: 'Place into green organic compost bin, food waste processor, or backyard compost pile.',
    whyThisResult: 'The item is plant-based organic matter rich in potassium, nitrogen, and carbon that biodegrades naturally without chemical treatment.',
    ecoTip: 'Banana peels make great natural fertilizer when soaked in watering water for houseplants.',
    ecoActionScore: 96,
    specialHandlingRequired: false,
    contaminationRisk: 'none',
    alternativeUses: [
      'Homemade potassium-rich liquid plant feed',
      'Compost activator for dry brown leaves'
    ],
    carbonSavedKg: 0.18,
    timestamp: new Date().toISOString(),
    isMock: true
  },
  mobile_charger: {
    id: 'sample-3',
    detectedItem: 'Mobile Charger & USB Cable',
    material: 'E-Waste (Copper Wiring, PCB, Flame-Retardant PVC)',
    category: 'ewaste',
    categoryLabel: 'E-Waste / Electronics',
    binColor: 'Yellow Bin (E-Waste & Electronics)',
    whereToSegregate: 'Yellow Bin / Certified E-Waste Kiosk or Municipal Collection Center (Never in Curbside Bins)',
    segregationSteps: [
      '1. Unplug from power outlet and inspect for battery swelling if applicable',
      '2. Bundle cords neatly using rubber bands or twist ties',
      '3. Deposit at an authorized e-waste collection bin, electronics retailer drop-box, or recycling center',
      '4. NEVER throw into household green, blue, or black trash bins'
    ],
    confidence: 91,
    confidenceLevel: 'high',
    recommendedDisposal: 'Deposit at an authorized e-waste collection bin or certified electronic drop-off kiosk. Never dispose in household bins.',
    whyThisResult: 'Contains copper wiring, electronic transformers, and circuit components that cannot be safely processed in regular municipal recycling plants and can tangle conveyor belts.',
    ecoTip: 'Keep cables organized and unplug chargers when not in use to eliminate vampire draw electricity waste.',
    ecoActionScore: 88,
    specialHandlingRequired: true,
    specialHandlingNotes: 'Drop-off at certified e-waste centers only to recover precious metals.',
    contaminationRisk: 'none',
    carbonSavedKg: 0.45,
    timestamp: new Date().toISOString(),
    isMock: true
  },
  aluminum_can: {
    id: 'sample-4',
    detectedItem: 'Aluminum Soda Can',
    material: 'Anodized Aluminum Alloy',
    category: 'recyclable',
    categoryLabel: 'Recyclable Metal',
    binColor: 'Blue Bin (Dry Recyclables)',
    whereToSegregate: 'Blue Bin (Dry Recyclables / Metals)',
    segregationSteps: [
      '1. Pour out any remaining soda or beverage residue',
      '2. Rinse interior briefly with water to avoid insect attraction',
      '3. Leave the pull tab attached to the can (do not rip it off)',
      '4. Crush flat if permitted locally to save bin space',
      '5. Place into the Blue Bin (Dry Recyclables)'
    ],
    confidence: 95,
    confidenceLevel: 'high',
    recommendedDisposal: 'Rinse out sticky beverage residue and place in your standard dry recycling container.',
    whyThisResult: 'Aluminum is 100% recyclable infinitely without losing quality. Recycling aluminum saves up to 95% of the energy needed to make new cans from raw bauxite ore.',
    ecoTip: 'Crushing cans saves up to 70% bin volume, reducing transport emissions for collection fleets.',
    ecoActionScore: 95,
    specialHandlingRequired: false,
    contaminationRisk: 'low',
    carbonSavedKg: 0.22,
    timestamp: new Date().toISOString(),
    isMock: true
  },
  used_battery: {
    id: 'sample-5',
    detectedItem: 'Used AA Alkaline Battery',
    material: 'Zinc-Manganese Dioxide / Heavy Metals',
    category: 'hazardous',
    categoryLabel: 'Hazardous Waste / Battery Recycling',
    binColor: 'Red Bin (Hazardous Drop-Off)',
    whereToSegregate: 'Red Bin / Dedicated Battery Recycling Collection Box (Never in standard curbside trash)',
    segregationSteps: [
      '1. Inspect battery casing for leakage or corrosion',
      '2. Cover both positive (+) and negative (-) terminals with clear tape to prevent short circuits',
      '3. Store in a cool, dry container away from metal objects until disposal',
      '4. Take to a supermarket, hardware store, or civic amenity battery drop-off box'
    ],
    confidence: 93,
    confidenceLevel: 'high',
    recommendedDisposal: 'Tape terminals with clear tape and deliver to an authorized hazardous/battery drop-off station.',
    whyThisResult: 'Batteries contain heavy metals and volatile chemistry that can cause catastrophic fires inside recycling trucks and trash compactors if disposed improperly.',
    ecoTip: 'Invest in low-self-discharge NiMH rechargeable batteries — one rechargeable cell can replace over 500 single-use batteries.',
    ecoActionScore: 90,
    specialHandlingRequired: true,
    specialHandlingNotes: '⚠️ Extreme Fire Hazard: Never place in general trash or curbside recycling.',
    contaminationRisk: 'high',
    carbonSavedKg: 0.35,
    timestamp: new Date().toISOString(),
    isMock: true
  },
  pizza_box: {
    id: 'sample-6',
    detectedItem: 'Food-Contaminated Pizza Box',
    material: 'Grease-Soiled Corrugated Cardboard',
    category: 'context_dependent',
    categoryLabel: 'Context-Dependent / Mixed',
    binColor: 'Separate into Blue Bin & Green/Black Bin',
    whereToSegregate: 'Tear in half: Clean top in Blue Bin (Paper); Greasy bottom in Green Bin (Organics) or Black Bin',
    segregationSteps: [
      '1. Remove any crusts, garlic sauce cups, plastic tables, or wax paper liners',
      '2. Tear the box in half along the crease',
      '3. Place the clean, oil-free top half into the Blue Bin (Dry Recyclables)',
      '4. Place the grease-soaked bottom half into the Green Bin (Organics/Compost) if accepted, or Black Bin (General Trash)'
    ],
    confidence: 78,
    confidenceLevel: 'medium',
    recommendedDisposal: 'Tear off the clean cardboard top lid for recycling. Place the grease-saturated bottom section into the organic/compost stream or general trash according to local rules.',
    whyThisResult: 'While corrugated cardboard is recyclable, grease and cheese oils cannot be separated from paper fibers during pulping, creating oil spots that ruin batches.',
    ecoTip: 'Always separate clean portions from contaminated portions to maximize recycling recovery without spoiling clean paper bales.',
    ecoActionScore: 75,
    specialHandlingRequired: false,
    contaminationRisk: 'high',
    carbonSavedKg: 0.08,
    timestamp: new Date().toISOString(),
    isMock: true
  }
};

export const INITIAL_IMPACT_METRICS: ImpactMetrics = {
  itemsScanned: 48,
  correctlySorted: 43,
  ecoScore: 91,
  streakDays: 7,
  ecoPoints: 480,
  totalCarbonSavedKg: 14.6,
  categoryBreakdown: {
    recyclable: 26,
    organic: 12,
    ewaste: 5,
    hazardous: 2,
    general: 3,
    context_dependent: 0
  },
  weeklyActivity: [
    { day: 'Mon', scans: 6, sorted: 6 },
    { day: 'Tue', scans: 8, sorted: 7 },
    { day: 'Wed', scans: 5, sorted: 5 },
    { day: 'Thu', scans: 9, sorted: 8 },
    { day: 'Fri', scans: 7, sorted: 6 },
    { day: 'Sat', scans: 11, sorted: 10 },
    { day: 'Sun', scans: 2, sorted: 1 }
  ]
};

export const SAMPLE_METRICS = INITIAL_IMPACT_METRICS;

export const SAMPLE_ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: 'badge-rookie',
    title: 'Recycling Rookie',
    description: 'Scanned and sorted your first 10 waste items correctly.',
    icon: 'Sparkles',
    unlocked: true,
    unlockedDate: '3 days ago',
    progress: 10,
    maxProgress: 10
  },
  {
    id: 'badge-warrior',
    title: 'Waste Warrior',
    description: 'Maintained an active 7-day sustainable sorting streak.',
    icon: 'Flame',
    unlocked: true,
    unlockedDate: 'Today',
    progress: 7,
    maxProgress: 7
  },
  {
    id: 'badge-champion',
    title: 'Green Champion',
    description: 'Diverted over 10 kg of CO2 equivalent emissions through proper segregation.',
    icon: 'Award',
    unlocked: true,
    unlockedDate: 'Yesterday',
    progress: 14.6,
    maxProgress: 10
  },
  {
    id: 'badge-explorer',
    title: 'Eco Explorer',
    description: 'Identified items across all 5 waste streams (Plastic, Organic, Metal, E-Waste, Hazard).',
    icon: 'Compass',
    unlocked: false,
    progress: 4,
    maxProgress: 5
  }
];

export const SAMPLE_DISPOSAL_CENTERS: DisposalCenter[] = [
  {
    id: 'center-1',
    name: 'GreenCircle E-Waste Hub & Electronics Depot',
    category: 'ewaste',
    categoryLabel: 'E-Waste & Batteries',
    address: '420 GreenTech Boulevard, Suite 100',
    distanceKm: 2.1,
    status: 'Open',
    openingHours: 'Mon-Sat: 8:00 AM – 6:00 PM',
    phone: '+1 (555) 382-9278',
    acceptedMaterials: ['Smartphones', 'Lithium Batteries', 'Cables & Chargers', 'Laptops', 'Small Appliances'],
    latitude: 37.7749,
    longitude: -122.4194,
    rating: 4.9,
    verified: true
  },
  {
    id: 'center-2',
    name: 'Metro EcoRecycle Material Recovery Facility',
    category: 'recyclable',
    categoryLabel: 'Paper, Plastic & Metals',
    address: '890 Circular Economy Way',
    distanceKm: 3.4,
    status: 'Open',
    openingHours: 'Mon-Sun: 7:00 AM – 7:00 PM',
    phone: '+1 (555) 732-9253',
    acceptedMaterials: ['PET Bottles', 'HDPE Jugs', 'Aluminum Cans', 'Cardboard Bales', 'Glass Jars'],
    latitude: 37.7833,
    longitude: -122.4167,
    rating: 4.8,
    verified: true
  },
  {
    id: 'center-3',
    name: 'Community BioCompost & Soil Farm',
    category: 'organic',
    categoryLabel: 'Organic & Food Waste',
    address: '15 EarthCare Avenue, Park District',
    distanceKm: 4.2,
    status: 'Open',
    openingHours: 'Tue-Sun: 9:00 AM – 5:00 PM',
    phone: '+1 (555) 246-8367',
    acceptedMaterials: ['Vegetable Scraps', 'Coffee Grounds', 'Yard Trimmings', 'Untreated Wood Shavings'],
    latitude: 37.7650,
    longitude: -122.4300,
    rating: 4.9,
    verified: true
  },
  {
    id: 'center-4',
    name: 'County Hazardous Materials Safe Drop Station',
    category: 'hazardous',
    categoryLabel: 'Household Hazardous Waste (HHW)',
    address: '500 Safety Harbor Way, Industrial Zone',
    distanceKm: 5.8,
    status: 'Closing Soon',
    openingHours: 'Wed-Sat: 10:00 AM – 4:00 PM',
    phone: '+1 (555) 911-4299',
    acceptedMaterials: ['Aerosols', 'Solvents & Paints', 'Fluorescent Bulbs', 'Pesticides', 'Expired Medicines'],
    latitude: 37.7550,
    longitude: -122.3900,
    rating: 4.7,
    verified: true
  }
];

export const WASTE_GUIDE_DATA: GuideItem[] = [
  {
    id: 'guide-plastic',
    title: 'Plastics & Polymers',
    category: 'recyclable',
    categoryLabel: 'Recyclable / Plastic',
    iconName: 'Package',
    badgeColor: 'emerald',
    recyclingCode: 'Resin #1, #2, #5',
    description: 'Rigid plastic containers and bottles. Not all plastics are recyclable—look for resin identification codes #1 (PET), #2 (HDPE), and #5 (PP).',
    examples: ['Water bottles', 'Milk jugs', 'Shampoo containers', 'Yogurt cups', 'Detergent bottles'],
    preparationSteps: [
      'Empty all liquids and scrape food remains.',
      'Quick rinse with cold water—no need to make it dishwasher-clean.',
      'Re-attach caps securely to prevent small cap loss during optical sorting.'
    ],
    dos: [
      'Check the numbered resin triangle on the container base.',
      'Flatten large plastic milk jugs to conserve collection space.'
    ],
    donts: [
      'Do NOT recycle flimsy plastic bags or plastic wrap in standard curbside bins.',
      'Do NOT recycle polystyrene styrofoam cups or black plastic takeout trays in most municipal bins.'
    ],
    specialWarning: 'Soft plastic films (grocery bags, chip bags) jam conveyor gears and require specialized supermarket drop-off collection.'
  },
  {
    id: 'guide-paper',
    title: 'Paper & Cardboard',
    category: 'recyclable',
    categoryLabel: 'Recyclable / Paper',
    iconName: 'FileText',
    badgeColor: 'blue',
    description: 'Clean paper, office documents, newspapers, cereal boxes, and corrugated shipping cartons.',
    examples: ['Amazon shipping boxes', 'Newspapers & magazines', 'Cereal packaging', 'Office printing paper'],
    preparationSteps: [
      'Flatten all cardboard boxes completely.',
      'Remove bulky plastic bubble wrap or styrofoam packaging inserts.'
    ],
    dos: [
      'Keep paper dry—wet paper breaks down into useless slush that molders.',
      'Small staples and envelope address windows are acceptable in modern paper mills.'
    ],
    donts: [
      'Do NOT recycle greasy pizza box bottoms or coffee paper cups lined with polyethylene plastic film.',
      'Do NOT recycle thermal receipt paper, which contains BPA/BPS coatings.'
    ]
  },
  {
    id: 'guide-glass',
    title: 'Glass Bottles & Jars',
    category: 'recyclable',
    categoryLabel: 'Recyclable / Glass',
    iconName: 'Wine',
    badgeColor: 'teal',
    description: 'Container glass such as beverage bottles, olive oil bottles, and sauce jars. Glass is 100% infinitely recyclable.',
    examples: ['Jam jars', 'Wine & beer bottles', 'Sauce containers', 'Perfume bottles (rinsed)'],
    preparationSteps: [
      'Rinse out food residues.',
      'Metal lids can be removed and recycled in metal bin.'
    ],
    dos: [
      'Recycle both clear and colored glass (amber, green, flint).',
      'Keep bottles intact when placing in bins.'
    ],
    donts: [
      'Do NOT mix with Pyrex, cookware, window panes, lightbulbs, or ceramic mugs (different melting temperatures).'
    ],
    specialWarning: 'Drinking glasses and tempered glassware contain chemical additives that ruin glass batches.'
  },
  {
    id: 'guide-organic',
    title: 'Organic & Food Waste',
    category: 'organic',
    categoryLabel: 'Organic / Compost',
    iconName: 'Leaf',
    badgeColor: 'amber',
    description: 'Biodegradable kitchen food scraps, vegetable peelings, coffee grounds, and yard waste.',
    examples: ['Banana peels & fruit cores', 'Coffee grounds & paper filters', 'Eggshells', 'Garden trimmings & fallen leaves'],
    preparationSteps: [
      'Remove all fruit labels, plastic stickers, and rubber produce bands.',
      'Keep food scraps in a ventilated kitchen caddy with a certified compostable liner.'
    ],
    dos: [
      'Combine green (nitrogen-rich food scraps) with brown (dry leaves, shredded egg cartons).',
      'Use for home composting or deposit in municipal organic collection.'
    ],
    donts: [
      'Avoid placing large animal bones, pet feces, or synthetic teabags in home compost piles.'
    ]
  },
  {
    id: 'guide-ewaste',
    title: 'Electronic Waste (E-Waste)',
    category: 'ewaste',
    categoryLabel: 'Specialty / E-Waste',
    iconName: 'Smartphone',
    badgeColor: 'indigo',
    description: 'Any discarded item with a plug, battery, or circuit board. Contains critical raw materials that must not enter landfills.',
    examples: ['Smartphones & tablets', 'Chargers & USB cables', 'Power tools', 'Dead batteries', 'Computer keyboards'],
    preparationSteps: [
      'Back up and perform a factory reset to wipe personal data.',
      'Tape terminal ends of all loose batteries with electrical or scotch tape.'
    ],
    dos: [
      'Drop off at designated retail collection kiosks or electronics recycler events.',
      'Consider donation or refurbishing if the device is still functional.'
    ],
    donts: [
      'NEVER put e-waste or lithium batteries in curbside recycling or trash bins.'
    ],
    specialWarning: '⚠️ Damaged or punctured lithium-ion batteries are prone to thermal runaway and severe fires.'
  },
  {
    id: 'guide-hazardous',
    title: 'Hazardous Household Waste (HHW)',
    category: 'hazardous',
    categoryLabel: 'Hazardous Waste',
    iconName: 'AlertTriangle',
    badgeColor: 'red',
    description: 'Chemicals, flammable liquids, pressurized aerosols, toxic pesticides, fluorescent lamps, and medical waste.',
    examples: ['Spray paint cans', 'Bleach & harsh cleaners', 'Motor oil & coolant', 'Fluorescent mercury tubes', 'Prescription medicines'],
    preparationSteps: [
      'Keep chemicals in their original labeled containers whenever possible.',
      'Ensure caps are sealed tightly to prevent toxic fumes or spills during transport.'
    ],
    dos: [
      'Transport safely in the trunk of your car to an authorized Hazardous Waste Collection facility.',
      'Use expired medicine take-back dropboxes at local pharmacies.'
    ],
    donts: [
      'NEVER pour chemicals down storm drains, sinks, or toilet bowls.',
      'Do NOT incinerate or puncture aerosol spray cans.'
    ],
    specialWarning: 'Improper disposal contaminates municipal drinking water reservoirs and poisons local ecosystems.'
  }
];
