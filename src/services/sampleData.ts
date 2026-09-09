import {
  WasteAnalysisResult,
  DisposalCenter,
  ImpactMetrics,
  AchievementBadge,
  GuideItem,
  RecyclingEvent,
  SimulatedLocation,
  CommunityLeaderboardEntry,
  CommunityBenchmark
} from '../types';

export const SAMPLE_WASTE_ITEMS: Record<string, WasteAnalysisResult> = {
  plastic_bottle: {
    id: 'sample-1',
    detectedItem: 'Plastic Beverage Bottle',
    material: 'PET Plastic (Resin Code 1)',
    category: 'recyclable',
    categoryLabel: 'Recyclable / Dry Waste',
    recyclability: 'Highly Recyclable (Curbside Collection)',
    disposalInstructions: 'Empty all liquids, give a quick rinse, crush the bottle to save volume, and place in the Blue Dry Recyclables bin with the cap attached.',
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
    environmentalImpact: 'Recycling PET plastics reduces crude oil extraction, cuts landfill volume, and avoids approximately 0.12 kg of CO2e emissions per bottle.',
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
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date().toISOString(),
    isMock: true
  },
  banana_peel: {
    id: 'sample-2',
    detectedItem: 'Fresh Banana Peel',
    material: 'Organic Biomass (Biodegradable)',
    category: 'organic',
    categoryLabel: 'Organic / Wet Waste',
    recyclability: '100% Biodegradable & Compostable',
    disposalInstructions: 'Remove any non-compostable stickers or fruit labels, then place into the green organic compost bin, vermicomposter, or backyard compost pile.',
    binColor: 'Green Bin (Organic / Compost)',
    whereToSegregate: 'Green Bin (Organic / Compost) or backyard food composter',
    segregationSteps: [
      '1. Remove any plastic stickers or fruit labels from the peel',
      '2. Do not enclose in standard plastic bags (use certified compostable liner or bare bin)',
      '3. Drop into the Green Bin (Organic / Wet Compost) or home compost pile'
    ],
    confidence: 96,
    confidenceLevel: 'high',
    environmentalImpact: 'Composting organic scraps prevents methane formation in anaerobic landfills and produces nutrient-dense humus, avoiding 0.18 kg CO2e.',
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
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date().toISOString(),
    isMock: true
  },
  mobile_charger: {
    id: 'sample-3',
    detectedItem: 'Mobile Charger & USB Cable',
    material: 'E-Waste (Copper Wiring, PCB, Flame-Retardant PVC)',
    category: 'ewaste',
    categoryLabel: 'E-Waste / Electronics',
    recyclability: 'Specialized E-Waste Recycling (Do NOT put in Curbside Bins)',
    disposalInstructions: 'Unplug and bundle cords neatly. Drop off at a designated electronics recycler, municipal e-waste depot, or retailer take-back kiosk.',
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
    environmentalImpact: 'Recovers critical copper, gold, and rare earth elements while preventing heavy metals from leaching into water tables, saving 0.45 kg CO2e.',
    recommendedDisposal: 'Deposit at an authorized e-waste collection bin or certified electronic drop-off kiosk. Never dispose in household bins.',
    whyThisResult: 'Contains copper wiring, electronic transformers, and circuit components that cannot be safely processed in regular municipal recycling plants and can tangle conveyor belts.',
    ecoTip: 'Keep cables organized and unplug chargers when not in use to eliminate vampire draw electricity waste.',
    ecoActionScore: 88,
    specialHandlingRequired: true,
    specialHandlingNotes: 'Drop-off at certified e-waste centers only to recover precious metals.',
    contaminationRisk: 'none',
    carbonSavedKg: 0.45,
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date().toISOString(),
    isMock: true
  },
  aluminum_can: {
    id: 'sample-4',
    detectedItem: 'Aluminum Soda Can',
    material: 'Anodized Aluminum Alloy',
    category: 'recyclable',
    categoryLabel: 'Recyclable Metal',
    recyclability: 'Infinitely Recyclable (100% Closed-Loop Recyclability)',
    disposalInstructions: 'Empty any remaining beverage, lightly rinse to prevent odors and insects, leave the pull tab attached, and place directly into the Blue Bin.',
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
    environmentalImpact: 'Recycled aluminum saves 95% of the energy needed for primary smelting, cutting greenhouse gas emissions and saving 0.22 kg CO2e.',
    recommendedDisposal: 'Rinse out sticky beverage residue and place in your standard dry recycling container.',
    whyThisResult: 'Aluminum is 100% recyclable infinitely without losing quality. Recycling aluminum saves up to 95% of the energy needed to make new cans from raw bauxite ore.',
    ecoTip: 'Crushing cans saves up to 70% bin volume, reducing transport emissions for collection fleets.',
    ecoActionScore: 95,
    specialHandlingRequired: false,
    contaminationRisk: 'low',
    carbonSavedKg: 0.22,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date().toISOString(),
    isMock: true
  },
  used_battery: {
    id: 'sample-5',
    detectedItem: 'Used AA Alkaline Battery',
    material: 'Zinc-Manganese Dioxide / Heavy Metals',
    category: 'hazardous',
    categoryLabel: 'Hazardous Waste / Battery Recycling',
    recyclability: 'Hazardous Chemical Processing (Strict Drop-Off Mandate)',
    disposalInstructions: 'Cover positive and negative terminals with clear tape to prevent short-circuit sparks. Deliver to a certified hazardous waste or battery collection drop-box.',
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
    environmentalImpact: 'Prevents corrosive electrolyte and toxic heavy metal groundwater pollution while mitigating recycling facility fire risks, saving 0.35 kg CO2e.',
    recommendedDisposal: 'Tape terminals with clear tape and deliver to an authorized hazardous/battery drop-off station.',
    whyThisResult: 'Batteries contain heavy metals and volatile chemistry that can cause catastrophic fires inside recycling trucks and trash compactors if disposed improperly.',
    ecoTip: 'Invest in low-self-discharge NiMH rechargeable batteries — one rechargeable cell can replace over 500 single-use batteries.',
    ecoActionScore: 90,
    specialHandlingRequired: true,
    specialHandlingNotes: '⚠️ Extreme Fire Hazard: Never place in general trash or curbside recycling.',
    contaminationRisk: 'high',
    carbonSavedKg: 0.35,
    imageUrl: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date().toISOString(),
    isMock: true
  },
  pizza_box: {
    id: 'sample-6',
    detectedItem: 'Food-Contaminated Pizza Box',
    material: 'Grease-Soiled Corrugated Cardboard',
    category: 'context_dependent',
    categoryLabel: 'Context-Dependent / Mixed',
    recyclability: 'Partial Recyclability (Clean sections only; grease ruins paper pulp)',
    disposalInstructions: 'Separate clean cardboard from greasy cardboard. Place the clean top lid in paper recycling (Blue Bin) and the grease-stained bottom in compost (Green Bin) or trash.',
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
    environmentalImpact: 'Separating clean paper prevents whole-batch recycling rejection at pulping facilities, saving 0.08 kg CO2e and preserving cellulose fibers.',
    recommendedDisposal: 'Tear off the clean cardboard top lid for recycling. Place the grease-saturated bottom section into the organic/compost stream or general trash according to local rules.',
    whyThisResult: 'While corrugated cardboard is recyclable, grease and cheese oils cannot be separated from paper fibers during pulping, creating oil spots that ruin batches.',
    ecoTip: 'Always separate clean portions from contaminated portions to maximize recycling recovery without spoiling clean paper bales.',
    ecoActionScore: 75,
    specialHandlingRequired: false,
    contaminationRisk: 'high',
    carbonSavedKg: 0.08,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date().toISOString(),
    isMock: true
  }
};

/**
 * Curated initial recycling gallery scans displaying verified images alongside rich classification tags
 */
export const INITIAL_RECYCLING_HISTORY: WasteAnalysisResult[] = [
  {
    id: 'history-1',
    detectedItem: 'Plastic Beverage Bottle',
    material: 'PET Plastic (Resin Code 1)',
    category: 'recyclable',
    categoryLabel: 'Recyclable / Dry Waste',
    recyclability: 'Highly Recyclable (Curbside Collection)',
    disposalInstructions: 'Empty all liquids, give a quick rinse, crush to reduce volume, and deposit into the Blue Dry Recyclables bin.',
    binColor: 'Blue Bin (Dry Recyclables)',
    whereToSegregate: 'Blue Bin (Dry Recyclables) after emptying and rinsing',
    segregationSteps: [
      '1. Pour remaining water/juice down drain',
      '2. Quick cold water rinse',
      '3. Flatten bottle to save bin space',
      '4. Secure cap back onto neck',
      '5. Place into Blue Bin'
    ],
    confidence: 96,
    confidenceLevel: 'high',
    environmentalImpact: 'Diverting PET cuts petroleum use and avoids 0.12 kg CO2e emissions.',
    recommendedDisposal: 'Empty, rinse, crush, and place in Blue Bin.',
    whyThisResult: 'Optical clear-wall PET container with universal recycling resin code #1.',
    ecoTip: 'Switch to a reusable stainless steel water bottle to stop single-use plastic waste.',
    ecoActionScore: 94,
    specialHandlingRequired: false,
    recyclingCode: 'PET 1',
    contaminationRisk: 'low',
    carbonSavedKg: 0.12,
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'history-2',
    detectedItem: 'Fresh Banana Peel',
    material: 'Organic Biomass (Biodegradable)',
    category: 'organic',
    categoryLabel: 'Organic / Wet Waste',
    recyclability: '100% Biodegradable & Compostable',
    disposalInstructions: 'Peel off any PLU barcode stickers and drop directly into the Green organic compost bin or home vermicomposter.',
    binColor: 'Green Bin (Organic / Compost)',
    whereToSegregate: 'Green Bin (Organic / Compost) or backyard composter',
    segregationSteps: [
      '1. Remove small plastic fruit sticker',
      '2. Place in compost bucket or Green Bin',
      '3. Do not place inside non-biodegradable plastic bags'
    ],
    confidence: 98,
    confidenceLevel: 'high',
    environmentalImpact: 'Prevents anaerobic landfill methane production and creates nutrient-rich organic compost, avoiding 0.18 kg CO2e.',
    recommendedDisposal: 'Place in Green compost bin or food processor.',
    whyThisResult: 'Pure cellulose and pectin plant tissue rich in potassium and nitrogen.',
    ecoTip: 'Steep peel in plant watering water for 24h as a potassium-rich houseplant fertilizer.',
    ecoActionScore: 98,
    specialHandlingRequired: false,
    contaminationRisk: 'none',
    carbonSavedKg: 0.18,
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(), // 1.4 hours ago
  },
  {
    id: 'history-3',
    detectedItem: 'Aluminum Soda Can',
    material: 'Anodized Aluminum Alloy (100% Closed Loop)',
    category: 'recyclable',
    categoryLabel: 'Recyclable Metal',
    recyclability: 'Infinitely Recyclable (Closed-Loop Metal)',
    disposalInstructions: 'Rinse out sticky beverage syrup residue, leave pull-tab attached, and place in Blue Dry Recyclables bin.',
    binColor: 'Blue Bin (Dry Recyclables / Metals)',
    whereToSegregate: 'Blue Bin (Metals & Dry Recyclables)',
    segregationSteps: [
      '1. Empty liquid completely',
      '2. Quick rinse with water',
      '3. Keep tab attached',
      '4. Place in Blue Bin'
    ],
    confidence: 95,
    confidenceLevel: 'high',
    environmentalImpact: 'Recycled aluminum saves 95% of the massive electricity needed for virgin bauxite smelting, saving 0.22 kg CO2e.',
    recommendedDisposal: 'Rinse out residue and place into standard metal recycling container.',
    whyThisResult: 'Pure aluminum container with closed-loop metallurgical recyclability.',
    ecoTip: 'Can return schemes (deposit return) refund cash while ensuring 100% circularity.',
    ecoActionScore: 96,
    specialHandlingRequired: false,
    recyclingCode: 'ALU 41',
    contaminationRisk: 'low',
    carbonSavedKg: 0.22,
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'history-4',
    detectedItem: 'Mobile USB-C Cable & Charger',
    material: 'Copper Wiring, PCB, Flame-Retardant PVC',
    category: 'ewaste',
    categoryLabel: 'E-Waste / Electronics',
    recyclability: 'Specialized E-Waste Drop-Off (Strictly No Curbside Bins)',
    disposalInstructions: 'Never place into household trash. Bundle cord and drop off at municipal e-waste depot or certified retail drop-box.',
    binColor: 'Yellow Bin (E-Waste & Electronics)',
    whereToSegregate: 'Yellow Bin / Certified E-Waste Kiosk or Retail Drop-Box',
    segregationSteps: [
      '1. Check cable for severe fraying or damage',
      '2. Coil cord and tie neatly with twist-tie',
      '3. Take to certified electronics recycling kiosk'
    ],
    confidence: 92,
    confidenceLevel: 'high',
    environmentalImpact: 'Recovers valuable copper and precious circuit metals while stopping toxic lead and brominated compounds from entering landfills, saving 0.45 kg CO2e.',
    recommendedDisposal: 'Deposit at certified e-waste bin or electronics store kiosk.',
    whyThisResult: 'Transformer electronics and copper stranded wiring requires specialized shredding.',
    ecoTip: 'Donating working chargers to community centers extends product life span.',
    ecoActionScore: 90,
    specialHandlingRequired: true,
    specialHandlingNotes: 'Specialized electronic recycling required.',
    contaminationRisk: 'none',
    carbonSavedKg: 0.45,
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), // Yesterday
  },
  {
    id: 'history-5',
    detectedItem: 'Used AA Alkaline Batteries',
    material: 'Zinc-Manganese Dioxide & Heavy Metals',
    category: 'hazardous',
    categoryLabel: 'Hazardous Waste / Battery Recycling',
    recyclability: 'Hazardous Material Processing (Strict Drop-Off)',
    disposalInstructions: 'Tape both positive and negative terminals with clear tape to prevent friction sparks and deliver to a designated battery recycling station.',
    binColor: 'Red Bin (Hazardous Drop-Off)',
    whereToSegregate: 'Red Bin / Dedicated Battery Recycling Box (Never in standard trash)',
    segregationSteps: [
      '1. Tape terminals (+) and (-) with clear scotch or masking tape',
      '2. Store in dry non-conductive box',
      '3. Drop off at supermarket or library battery bin'
    ],
    confidence: 94,
    confidenceLevel: 'high',
    environmentalImpact: 'Stops caustic chemicals and heavy metal groundwater contamination and avoids trash compactor fires, saving 0.35 kg CO2e.',
    recommendedDisposal: 'Tape terminals and deposit in authorized battery recycling bin.',
    whyThisResult: 'Chemical storage cells with reactive compounds posing severe fire hazards in standard compactors.',
    ecoTip: 'Invest in USB-rechargeable Li-ion or NiMH batteries to replace 500+ disposable cells.',
    ecoActionScore: 92,
    specialHandlingRequired: true,
    specialHandlingNotes: '⚠️ Fire Hazard: Tape terminals before drop-off.',
    contaminationRisk: 'high',
    carbonSavedKg: 0.35,
    imageUrl: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
  },
  {
    id: 'history-6',
    detectedItem: 'Clean Corrugated Shipping Box',
    material: 'Unbleached Kraft Corrugated Fiberboard',
    category: 'recyclable',
    categoryLabel: 'Recyclable / Paper & Cardboard',
    recyclability: '100% Recyclable (Multiple Pulp Cycles)',
    disposalInstructions: 'Remove excess plastic packaging tape, flatten the box completely flat, and deposit into the Blue Bin.',
    binColor: 'Blue Bin (Dry Recyclables / Cardboard)',
    whereToSegregate: 'Blue Bin (Dry Paper & Cardboard Stream)',
    segregationSteps: [
      '1. Slice tape and remove any plastic bubble wrap or styrofoam inside',
      '2. Flatten the box completely flat',
      '3. Keep dry and deposit in Blue Bin'
    ],
    confidence: 97,
    confidenceLevel: 'high',
    environmentalImpact: 'Recycling cardboard conserves timber forests, reduces water consumption in paper mills, and saves 0.30 kg CO2e.',
    recommendedDisposal: 'Flatten flat and place into paper/cardboard recycling.',
    whyThisResult: 'Clean unbleached corrugated fiberboard ideal for secondary cellulose paper production.',
    ecoTip: 'Cardboard boxes make exceptional weed barrier mulch in organic garden beds.',
    ecoActionScore: 95,
    specialHandlingRequired: false,
    recyclingCode: 'PAP 20',
    contaminationRisk: 'low',
    carbonSavedKg: 0.30,
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'history-7',
    detectedItem: 'Food-Contaminated Pizza Box',
    material: 'Grease-Soiled Corrugated Cardboard',
    category: 'context_dependent',
    categoryLabel: 'Context-Dependent / Mixed',
    recyclability: 'Partial Recyclability (Separate clean lid from greasy bottom)',
    disposalInstructions: 'Tear in half: deposit clean top lid into Blue Bin for paper recycling. Deposit greasy cheese-stained base into Green organic bin or trash.',
    binColor: 'Separate into Blue Bin & Green/Black Bin',
    whereToSegregate: 'Tear in half: Clean top in Blue Bin; Greasy base in Green Bin (Organic) or Black Bin',
    segregationSteps: [
      '1. Discard crusts and sauce cups',
      '2. Tear box along middle hinge',
      '3. Clean top lid -> Blue Bin (Paper)',
      '4. Greasy base -> Green Bin (Compost) or Black Bin (Trash)'
    ],
    confidence: 84,
    confidenceLevel: 'medium',
    environmentalImpact: 'Separating clean portions avoids contaminating entire paper pulp batches, preserving 0.08 kg CO2e.',
    recommendedDisposal: 'Tear in half and segregate clean from contaminated sections.',
    whyThisResult: 'Grease and oil cannot be washed from paper pulp, causing grease spots that weaken new paper batches.',
    ecoTip: 'Always segregate grease-soiled paper from dry paper to prevent batch rejection at the recycling plant.',
    ecoActionScore: 78,
    specialHandlingRequired: false,
    contaminationRisk: 'high',
    carbonSavedKg: 0.08,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
  },
  {
    id: 'history-8',
    detectedItem: 'Glass Olive Oil & Beverage Bottle',
    material: '100% Recyclable Silica Flint Glass',
    category: 'recyclable',
    categoryLabel: 'Recyclable / Glass Container',
    recyclability: 'Infinitely Recyclable Without Quality Degradation',
    disposalInstructions: 'Rinse with warm water to clear lingering oil, leave metal cap detached, and deposit in Blue Bin or neighborhood bottle bank.',
    binColor: 'Blue Bin (Glass Stream / Bottle Bank)',
    whereToSegregate: 'Blue Bin (Glass Collection) or local Bottle Bank',
    segregationSteps: [
      '1. Pour out remaining oil residue',
      '2. Rinse inside with warm soapy water',
      '3. Remove metal pourer or cap (place cap in metal bin)',
      '4. Place glass bottle in Blue Bin'
    ],
    confidence: 95,
    confidenceLevel: 'high',
    environmentalImpact: 'Glass recycling cullet melts at lower temperatures than raw silica sand, reducing furnace emissions and saving 0.25 kg CO2e.',
    recommendedDisposal: 'Rinse thoroughly and deposit into curbside glass recycling or bottle bank.',
    whyThisResult: 'Container glass (cullet) can be melted and remolded indefinitely with zero loss in chemical purity.',
    ecoTip: 'Clean glass bottles make gorgeous reusable containers for homemade dressings and cold brew coffee.',
    ecoActionScore: 94,
    specialHandlingRequired: false,
    recyclingCode: 'GL 70',
    contaminationRisk: 'low',
    carbonSavedKg: 0.25,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
  }
];

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

export const SIMULATED_LOCATIONS: SimulatedLocation[] = [
  {
    id: 'metro-core',
    name: 'Metro Core (Downtown)',
    neighborhood: 'Downtown Civic District',
    radiusDescription: 'Within 2.0 km radius',
    latitude: 37.7749,
    longitude: -122.4194
  },
  {
    id: 'greenfield',
    name: 'Greenfield Eco-District',
    neighborhood: 'Greenfield & East Commons',
    radiusDescription: 'Within 1.5 km radius',
    latitude: 37.7650,
    longitude: -122.4300
  },
  {
    id: 'northside',
    name: 'Northside Suburbs & Riverview',
    neighborhood: 'North Valley & Riverview',
    radiusDescription: 'Within 2.5 km radius',
    latitude: 37.7880,
    longitude: -122.4080
  }
];

export const SAMPLE_RECYCLING_EVENTS: Record<string, RecyclingEvent[]> = {
  'metro-core': [
    {
      id: 'event-metro-1',
      title: 'Citywide Lithium Battery & E-Waste Round-Up',
      tagline: 'Certified free electronic drop-off & safe high-density battery recovery',
      category: 'ewaste',
      categoryLabel: 'E-Waste & Batteries',
      dateStr: 'This Saturday, Sep 12',
      timeStr: '9:00 AM – 2:00 PM',
      daysUntilText: 'This Saturday (3 days away)',
      locationName: 'Civic Center Plaza Pavilion',
      address: '100 Civic Center Drive, Downtown',
      distanceKm: 0.8,
      badge: 'Free Drive-Thru Drop-off',
      urgency: 'high',
      acceptedItems: [
        'Old Smartphones & Tablets',
        'Lithium & Alkaline Batteries',
        'Charging Cables & Bricks',
        'Laptops & Desktop Drives',
        'Small Kitchen Appliances'
      ],
      organizer: 'City Public Works & EPA Clean Circular Initiative',
      guidanceNote: 'Please tape battery terminals with clear tape prior to drop-off to prevent transit short-circuits.',
      specialPerk: '🎁 First 200 participants receive a complimentary countertop kitchen compost caddy.',
      coordinates: { xPercent: 44, yPercent: 46 }
    },
    {
      id: 'event-metro-2',
      title: 'Downtown Textile & Circular Clothing Swap',
      tagline: 'Divert wearable garments and fabrics from local municipal landfills',
      category: 'recyclable',
      categoryLabel: 'Textiles & Circular Apparel',
      dateStr: 'Tomorrow, Sep 10',
      timeStr: '4:00 PM – 7:30 PM',
      daysUntilText: 'Tomorrow (starts 4 PM)',
      locationName: 'Metro Central Library Forecourt',
      address: '350 Market Street, Arts Quarter',
      distanceKm: 1.4,
      badge: 'Community Swap Drive',
      urgency: 'medium',
      acceptedItems: [
        'Clean Wearable Clothing',
        'Linens & Towels',
        'Canvas Backpacks & Bags',
        'Denim & Cotton Fabric Scraps'
      ],
      organizer: 'Metro Zero-Waste Coalition',
      guidanceNote: 'All items must be clean and dry. Unwearable scraps are routed to acoustic insulation shredders.',
      specialPerk: '☕ Free pour-over organic coffee voucher for all contributors.',
      coordinates: { xPercent: 62, yPercent: 40 }
    }
  ],
  'greenfield': [
    {
      id: 'event-greenfield-1',
      title: 'Fall Compost Giveaway & Yard Biomass Drive',
      tagline: 'Return nutrient-rich organic humus to community soil & urban garden beds',
      category: 'organic',
      categoryLabel: 'Organic & Soil',
      dateStr: 'This Sunday, Sep 13',
      timeStr: '8:30 AM – 1:00 PM',
      daysUntilText: 'This Sunday',
      locationName: 'Greenfield Community Garden Hub',
      address: '72 Permaculture Way, Greenfield',
      distanceKm: 0.6,
      badge: 'Free Organic Compost Bags',
      urgency: 'high',
      acceptedItems: [
        'Clean Lawn Clippings',
        'Pruned Tree Branches (<3 ft)',
        'Vegetable & Fruit Pulp',
        'Dry Leaves & Straw',
        'Coffee Grounds'
      ],
      organizer: 'Greenfield Urban Ag Project & Parks Bureau',
      guidanceNote: 'Bring your own 5-gallon buckets or sturdy burlap sacks. Limit 40 lbs aged organic compost per household.',
      specialPerk: '🌿 Free heirloom seed packets (Genovese Basil & Cherry Tomato) for attendees.',
      coordinates: { xPercent: 32, yPercent: 65 }
    },
    {
      id: 'event-greenfield-2',
      title: 'Hard-to-Recycle Plastics (#5 PP & Clean Styrofoam) Drive',
      tagline: 'Mechanical densification for takeout containers and clean white block EPS',
      category: 'recyclable',
      categoryLabel: 'Specialty Polymers',
      dateStr: 'Tuesday, Sep 15',
      timeStr: '11:00 AM – 4:00 PM',
      daysUntilText: 'Next Tuesday',
      locationName: 'EcoTech Hub Loading Dock',
      address: '88 Circular Drive, Greenfield',
      distanceKm: 1.1,
      badge: 'Specialty Reclamation',
      urgency: 'normal',
      acceptedItems: [
        '#5 PP Takeout Containers & Yogurt Tubs',
        'Clean White Block Styrofoam (EPS)',
        'HDPE Snap-on Bottle Caps'
      ],
      organizer: 'Clean Oceans Polymer Recovery Alliance',
      guidanceNote: 'Foam must be clean and snap cleanly. Soft packing peanuts or food-stained trays cannot be accepted.',
      coordinates: { xPercent: 55, yPercent: 60 }
    }
  ],
  'northside': [
    {
      id: 'event-northside-1',
      title: 'Safe Household Hazardous Waste (HHW) Mobile Depot',
      tagline: 'Protect municipal stormwater and watersheds from toxic chemicals and corrosives',
      category: 'hazardous',
      categoryLabel: 'Household Hazardous Waste',
      dateStr: 'This Saturday, Sep 12',
      timeStr: '10:00 AM – 3:00 PM',
      daysUntilText: 'This Saturday',
      locationName: 'Northside Civic Complex Parking Lot',
      address: '1400 Valley Vista Road, Northside',
      distanceKm: 1.2,
      badge: 'Certified Safe Disposal',
      urgency: 'high',
      acceptedItems: [
        'Leftover Latex & Oil House Paints',
        'Used Motor Oil & Transmission Fluid',
        'Fluorescent Tubes & CFLs',
        'Garden Pesticides & Herbicides',
        'Pool Sanitizing Chemicals'
      ],
      organizer: 'County Environmental Health Protection Division',
      guidanceNote: 'Transport containers upright in cardboard boxes inside your vehicle trunk. Maximum 15 gallons per vehicle.',
      specialPerk: '🛡️ Free automotive leak & spill containment mat included.',
      coordinates: { xPercent: 40, yPercent: 30 }
    },
    {
      id: 'event-northside-2',
      title: 'Community Bicycle & Scrap Metal Salvage Day',
      tagline: 'Refurbishing bikes for youth and recycling end-of-life metals',
      category: 'recyclable',
      categoryLabel: 'Metals & Salvage',
      dateStr: 'Saturday, Sep 19',
      timeStr: '9:00 AM – 1:30 PM',
      daysUntilText: 'In 10 days',
      locationName: 'Riverview High School Athletic Lot',
      address: '820 Riverview Expressway, Northside',
      distanceKm: 1.9,
      badge: 'Youth Charity Salvage',
      urgency: 'normal',
      acceptedItems: [
        'Bicycles & Scooters in any condition',
        'Aluminum Ladders & Lawn Chairs',
        'Copper Pipes & Wiring',
        'Stainless Steel Cookware'
      ],
      organizer: 'Northside Community Bike Kitchen',
      guidanceNote: 'Volunteer mechanics repair salvageable bicycles for donation to underserved students for school transit.',
      coordinates: { xPercent: 70, yPercent: 25 }
    }
  ]
};

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

export const COMMUNITY_BENCHMARKS: Record<string, CommunityBenchmark> = {
  'metro-core': {
    districtId: 'metro-core',
    districtName: 'Downtown Metro District',
    averageCarbonSavedKg: 10.4,
    topTenPercentAverageKg: 26.2,
    collectiveTotalKg: 842.5,
    activeRecyclersCount: 148,
    monthlyGoalKg: 1000
  },
  'greenfield': {
    districtId: 'greenfield',
    districtName: 'Greenfield Eco-District',
    averageCarbonSavedKg: 12.8,
    topTenPercentAverageKg: 31.5,
    collectiveTotalKg: 1180.0,
    activeRecyclersCount: 192,
    monthlyGoalKg: 1250
  },
  'northside': {
    districtId: 'northside',
    districtName: 'Northside & Riverview',
    averageCarbonSavedKg: 9.2,
    topTenPercentAverageKg: 23.0,
    collectiveTotalKg: 675.2,
    activeRecyclersCount: 115,
    monthlyGoalKg: 850
  },
  'citywide': {
    districtId: 'citywide',
    districtName: 'Citywide Average',
    averageCarbonSavedKg: 10.8,
    topTenPercentAverageKg: 28.0,
    collectiveTotalKg: 2697.7,
    activeRecyclersCount: 455,
    monthlyGoalKg: 3100
  }
};

export const COMMUNITY_LEADERBOARD_ENTRIES: Record<string, CommunityLeaderboardEntry[]> = {
  'metro-core': [
    {
      id: 'user-1',
      rank: 1,
      name: 'Maya S. & Urban Gardeners',
      avatarText: 'MS',
      avatarBg: 'bg-emerald-600',
      carbonSavedKg: 28.4,
      itemsSorted: 86,
      streakDays: 19,
      badgeTitle: 'Compost Champion',
      district: 'Downtown Metro',
      kudosCount: 42
    },
    {
      id: 'user-2',
      rank: 2,
      name: 'Liam Chen (Zero-Waste Flat)',
      avatarText: 'LC',
      avatarBg: 'bg-teal-600',
      carbonSavedKg: 22.1,
      itemsSorted: 64,
      streakDays: 14,
      badgeTitle: 'Plastic Purifier',
      district: 'Downtown Metro',
      kudosCount: 31
    },
    {
      id: 'user-3',
      rank: 3,
      name: 'GreenTech Studio Collective',
      avatarText: 'GT',
      avatarBg: 'bg-blue-600',
      carbonSavedKg: 19.8,
      itemsSorted: 58,
      streakDays: 11,
      badgeTitle: 'E-Waste Guardian',
      district: 'Downtown Metro',
      kudosCount: 27
    },
    {
      id: 'user-current',
      rank: 4,
      name: 'You (Eco Warrior)',
      avatarText: 'YOU',
      avatarBg: 'bg-emerald-700',
      carbonSavedKg: 14.6, // Will synchronize with user's actual totalCarbonSavedKg
      itemsSorted: 43,
      streakDays: 7,
      badgeTitle: 'Circular Scout',
      district: 'Downtown Metro',
      isCurrentUser: true,
      kudosCount: 19
    },
    {
      id: 'user-5',
      rank: 5,
      name: 'Elena Rostova',
      avatarText: 'ER',
      avatarBg: 'bg-indigo-600',
      carbonSavedKg: 12.3,
      itemsSorted: 38,
      streakDays: 6,
      badgeTitle: 'Glass Recycler',
      district: 'Downtown Metro',
      kudosCount: 14
    },
    {
      id: 'user-6',
      rank: 6,
      name: 'Civic Center Coffee Lab',
      avatarText: 'CC',
      avatarBg: 'bg-amber-600',
      carbonSavedKg: 10.9,
      itemsSorted: 35,
      streakDays: 8,
      badgeTitle: 'Chaff Composter',
      district: 'Downtown Metro',
      kudosCount: 18
    },
    {
      id: 'user-7',
      rank: 7,
      name: 'Marcus & Zoe T.',
      avatarText: 'MZ',
      avatarBg: 'bg-rose-600',
      carbonSavedKg: 8.7,
      itemsSorted: 27,
      streakDays: 4,
      badgeTitle: 'Neighborhood Sorter',
      district: 'Downtown Metro',
      kudosCount: 9
    }
  ],
  'greenfield': [
    {
      id: 'user-g1',
      rank: 1,
      name: 'Permaculture Guild Team',
      avatarText: 'PG',
      avatarBg: 'bg-emerald-600',
      carbonSavedKg: 34.2,
      itemsSorted: 104,
      streakDays: 24,
      badgeTitle: 'Soil Regenerator',
      district: 'Greenfield Eco-District',
      kudosCount: 56
    },
    {
      id: 'user-g2',
      rank: 2,
      name: 'Hannah & Ben Green',
      avatarText: 'HB',
      avatarBg: 'bg-teal-600',
      carbonSavedKg: 26.5,
      itemsSorted: 79,
      streakDays: 17,
      badgeTitle: 'Zero-Waste Household',
      district: 'Greenfield Eco-District',
      kudosCount: 38
    },
    {
      id: 'user-current-g',
      rank: 3,
      name: 'You (Eco Warrior)',
      avatarText: 'YOU',
      avatarBg: 'bg-emerald-700',
      carbonSavedKg: 14.6,
      itemsSorted: 43,
      streakDays: 7,
      badgeTitle: 'Circular Scout',
      district: 'Greenfield Eco-District',
      isCurrentUser: true,
      kudosCount: 22
    },
    {
      id: 'user-g4',
      rank: 4,
      name: 'EcoBakery Co-op',
      avatarText: 'EB',
      avatarBg: 'bg-amber-600',
      carbonSavedKg: 13.7,
      itemsSorted: 46,
      streakDays: 9,
      badgeTitle: 'Flour Sack Upcycler',
      district: 'Greenfield Eco-District',
      kudosCount: 25
    },
    {
      id: 'user-g5',
      rank: 5,
      name: 'Sophia Patel',
      avatarText: 'SP',
      avatarBg: 'bg-indigo-600',
      carbonSavedKg: 11.4,
      itemsSorted: 32,
      streakDays: 5,
      badgeTitle: 'Seed Saver',
      district: 'Greenfield Eco-District',
      kudosCount: 16
    }
  ],
  'northside': [
    {
      id: 'user-n1',
      rank: 1,
      name: 'Riverview Community High Eco-Club',
      avatarText: 'RC',
      avatarBg: 'bg-blue-600',
      carbonSavedKg: 24.8,
      itemsSorted: 82,
      streakDays: 15,
      badgeTitle: 'Youth Climate Leader',
      district: 'Northside & Riverview',
      kudosCount: 44
    },
    {
      id: 'user-current-n',
      rank: 2,
      name: 'You (Eco Warrior)',
      avatarText: 'YOU',
      avatarBg: 'bg-emerald-700',
      carbonSavedKg: 14.6,
      itemsSorted: 43,
      streakDays: 7,
      badgeTitle: 'Circular Scout',
      district: 'Northside & Riverview',
      isCurrentUser: true,
      kudosCount: 26
    },
    {
      id: 'user-n3',
      rank: 3,
      name: 'Valley Bike Kitchen & Scrap Salvage',
      avatarText: 'VB',
      avatarBg: 'bg-amber-600',
      carbonSavedKg: 13.9,
      itemsSorted: 41,
      streakDays: 8,
      badgeTitle: 'Metal Refurbisher',
      district: 'Northside & Riverview',
      kudosCount: 29
    },
    {
      id: 'user-n4',
      rank: 4,
      name: 'Dave & Sandy Miller',
      avatarText: 'DM',
      avatarBg: 'bg-teal-600',
      carbonSavedKg: 9.8,
      itemsSorted: 30,
      streakDays: 5,
      badgeTitle: 'Curbside Champion',
      district: 'Northside & Riverview',
      kudosCount: 12
    }
  ]
};

