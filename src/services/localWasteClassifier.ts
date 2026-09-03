import { WasteAnalysisResult, WasteCategory } from '../types';
import { SAMPLE_WASTE_ITEMS } from './sampleData';

/**
 * Intelligent on-device waste classification engine.
 * Serves as an immediate zero-latency fallback if:
 * 1. The app is hosted on static hosting (e.g. Vercel static, GitHub Pages) where /api returned 404
 * 2. The device is temporarily offline or network connection dropped
 * 3. Gemini free-tier daily quota was exceeded
 *
 * Provides definitive answers to the two primary user questions:
 * 1. What kind of waste is this?
 * 2. Where should you segregate it? (target bin + step-by-step checklist)
 */
export function classifyWasteLocally(
  imageUrl?: string,
  hint?: string,
  sampleId?: string
): WasteAnalysisResult {
  // If specific sample requested
  if (sampleId && SAMPLE_WASTE_ITEMS[sampleId]) {
    return {
      ...SAMPLE_WASTE_ITEMS[sampleId],
      id: `local-scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      imageUrl: imageUrl || SAMPLE_WASTE_ITEMS[sampleId].imageUrl,
      isMock: true,
    };
  }

  const query = (hint || '').toLowerCase().trim();

  // Keyword rules table
  interface Rule {
    keywords: string[];
    detectedItem: string;
    material: string;
    category: WasteCategory;
    categoryLabel: string;
    recyclability?: string;
    disposalInstructions?: string;
    binColor: string;
    whereToSegregate: string;
    segregationSteps: string[];
    confidence: number;
    recommendedDisposal: string;
    whyThisResult: string;
    ecoTip: string;
    ecoActionScore: number;
    specialHandlingRequired: boolean;
    specialHandlingNotes?: string;
    contaminationRisk?: 'none' | 'low' | 'moderate' | 'high';
    recyclingCode?: string;
    alternativeUses: string[];
    carbonSavedKg: number;
    environmentalImpact?: string;
  }

  const rules: Rule[] = [
    {
      keywords: ['wood', 'timber', 'stick', 'plank', 'board', 'branch', 'sawdust', 'bark'],
      detectedItem: 'Wood / Timber Scrap',
      material: 'Untreated Solid Wood / Plant Biomass',
      category: 'organic',
      categoryLabel: 'Organic / Bulky Wood',
      binColor: 'Green Bin (Compost) or Bulky Timber Drop-Off',
      whereToSegregate: 'Green Bin if small untreated chips or garden mulch; municipal bulky drop-off if large planks or treated lumber.',
      segregationSteps: [
        '1. Inspect wood to ensure it is untreated and free of heavy paints, chemical stains, or plastic veneer',
        '2. Remove any iron nails, screws, brackets, or metal fasteners',
        '3. If clean and raw, chip or shred for garden mulch, tree bedding, or compost bin',
        '4. If painted, chemically treated, or pressure-treated, deliver to municipal bulky waste depot (do not burn or compost treated wood)'
      ],
      confidence: 90,
      recommendedDisposal: 'Untreated wood can be composted, chipped into garden mulch, or repurposed. Painted or treated timber must go to municipal bulky waste collection.',
      whyThisResult: 'Natural solid wood is biodegradable organic matter (cellulose and lignin). Untreated wood breaks down cleanly into rich compost, whereas treated lumber contains preservative salts.',
      ecoTip: 'Repurpose offcut timber for garden plant stakes, DIY shelving, or bird feeders before discarding.',
      ecoActionScore: 88,
      specialHandlingRequired: false,
      contaminationRisk: 'low',
      alternativeUses: ['Garden plant stakes', 'DIY craft and carving projects', 'Compost carbon brown matter'],
      carbonSavedKg: 0.35,
    },
    {
      keywords: ['bottle', 'plastic bottle', 'water bottle', 'soda bottle', 'coke', 'pepsi', 'sprite', 'pet'],
      detectedItem: 'Plastic Beverage Bottle',
      material: 'PET (Polyethylene Terephthalate, Resin #1)',
      category: 'recyclable',
      categoryLabel: 'Dry Recyclable / Plastics',
      binColor: 'Blue Bin (Dry Recyclables)',
      whereToSegregate: 'Blue Bin (Dry Recyclables) after emptying and rinsing.',
      segregationSteps: [
        '1. Empty any residual liquid completely down the drain',
        '2. Rinse inside lightly with cold water to remove sugary residue',
        '3. Crush or flatten the bottle body to save collection volume',
        '4. Re-attach plastic cap securely and place directly into the Blue Bin'
      ],
      confidence: 94,
      recommendedDisposal: 'Curbside dry recycling (Blue Bin). Ensure container is emptied and rinsed.',
      whyThisResult: 'PET #1 plastic is universally accepted in municipal recycling systems and reprocessed into polyester fiber, fleece, and new food-grade bottles.',
      ecoTip: 'Switch to a reusable double-walled insulated stainless steel bottle to avoid single-use plastic waste.',
      ecoActionScore: 92,
      specialHandlingRequired: false,
      contaminationRisk: 'low',
      recyclingCode: 'PET 1',
      alternativeUses: ['Indoor seed starter pot', 'Drip irrigation funnel for house plants'],
      carbonSavedKg: 0.12,
    },
    {
      keywords: ['can', 'tin', 'aluminum', 'soda can', 'beer can', 'coke can', 'pepsi can', 'metal'],
      detectedItem: 'Aluminum Beverage Can',
      material: 'Anodized Aluminum Alloy (#41 ALU)',
      category: 'recyclable',
      categoryLabel: 'Dry Recyclable / Metals',
      binColor: 'Blue Bin (Dry Recyclables)',
      whereToSegregate: 'Blue Bin (Dry Recyclables) for clean metals and cans.',
      segregationSteps: [
        '1. Pour out any remaining soda, beer, or drink',
        '2. Rinse interior briefly with tap water',
        '3. Leave the tab attached to the can',
        '4. Gently crush to conserve bin space, then place in the Blue Bin'
      ],
      confidence: 96,
      recommendedDisposal: 'Place in standard curbside blue recycling bin. Empty and rinse first.',
      whyThisResult: 'Aluminum is infinitely recyclable without degradation. Recycling aluminum saves up to 95% of the energy needed to smelt new aluminum from bauxite ore.',
      ecoTip: 'Crushing cans saves up to 70% collection volume, reducing fuel consumption of waste trucks.',
      ecoActionScore: 95,
      specialHandlingRequired: false,
      contaminationRisk: 'none',
      recyclingCode: 'ALU 41',
      alternativeUses: ['Desktop pencil holder', 'Punched tin candle lantern'],
      carbonSavedKg: 0.22,
    },
    {
      keywords: ['banana', 'apple', 'fruit', 'vegetable', 'peel', 'food', 'rind', 'scraps', 'lettuce', 'tomato'],
      detectedItem: 'Food / Fruit Scrap Biomass',
      material: 'Biodegradable Plant Biomass',
      category: 'organic',
      categoryLabel: 'Organic / Wet Waste',
      binColor: 'Green Bin (Organic / Compost)',
      whereToSegregate: 'Green Bin (Wet Waste / Organic Compost) or home backyard compost pile.',
      segregationSteps: [
        '1. Remove any plastic stickers, ties, or rubber bands from produce',
        '2. Do not use non-compostable plastic bags (use bare bin or certified BPI compostable liner)',
        '3. Deposit directly into your municipal Green Bin or garden compost tumbler'
      ],
      confidence: 96,
      recommendedDisposal: 'Municipal green organic waste bin or home backyard compost system.',
      whyThisResult: 'Plant scraps are rich in organic carbon and nitrogen. Composting returns vital nutrients to soil and prevents methane gas emissions caused by landfill anaerobic decay.',
      ecoTip: 'Keep a small sealable compost caddy on your kitchen counter to make daily sorting effortless.',
      ecoActionScore: 96,
      specialHandlingRequired: false,
      contaminationRisk: 'none',
      alternativeUses: ['Soak peels in water to make natural plant fertilizer', 'Feed into vermicompost worm bin'],
      carbonSavedKg: 0.18,
    },
    {
      keywords: ['battery', 'batteries', 'aa', 'aaa', 'alkaline', 'lithium', 'cell', 'accumulator', 'button cell'],
      detectedItem: 'Used Household Battery',
      material: 'Zinc-Manganese / Lithium Chemistry & Heavy Metals',
      category: 'hazardous',
      categoryLabel: 'Hazardous Waste / Battery Drop-Off',
      binColor: 'Red Bin (Hazardous Collection) or Retail Battery Drop-Box',
      whereToSegregate: 'Dedicated Battery Drop-Off Box at supermarkets, hardware stores, or municipal hazardous waste center. NEVER throw in household trash or recycling.',
      segregationSteps: [
        '1. Inspect battery casing for leakage or white crystalline corrosion',
        '2. Cover both terminals (+ and -) with clear tape to prevent short circuits and thermal runaway',
        '3. Store safely in a non-conductive plastic container until trip',
        '4. Drop into designated battery collection boxes found at most electronics retailers or grocery stores'
      ],
      confidence: 95,
      recommendedDisposal: 'Take to a designated battery recycling collection kiosk or civic hazardous waste depot.',
      whyThisResult: 'Batteries contain reactive chemicals and heavy metals. When placed in curbside bins or compacted in garbage trucks, they cause severe fires and leak heavy metals.',
      ecoTip: 'Switch to low-self-discharge NiMH rechargeable batteries — each rechargeable cell replaces over 500 disposable ones.',
      ecoActionScore: 92,
      specialHandlingRequired: true,
      specialHandlingNotes: '⚠️ High Fire Risk: Tape terminals with clear tape and never place in household curbside bins.',
      contaminationRisk: 'high',
      alternativeUses: ['Test remaining voltage with a multimeter for low-drain remotes before discarding'],
      carbonSavedKg: 0.4,
    },
    {
      keywords: ['charger', 'cable', 'usb', 'wire', 'phone', 'electronics', 'adapter', 'headphones', 'plug', 'cord'],
      detectedItem: 'Electronic Cable / Charger Adapter',
      material: 'Copper Wire, PVC Insulation, Electronic PCB',
      category: 'ewaste',
      categoryLabel: 'E-Waste / Small Electronics',
      binColor: 'Yellow Bin (E-Waste & Electronics)',
      whereToSegregate: 'Yellow Bin / Certified E-Waste Collection Depot or Electronics Retailer Drop-Off Kiosk.',
      segregationSteps: [
        '1. Unplug and bundle cable neatly using a twist tie or rubber band',
        '2. Keep apart from general household waste',
        '3. Deposit into an authorized e-waste drop-off bin at an electronics store or civic collection facility'
      ],
      confidence: 92,
      recommendedDisposal: 'Deliver to an authorized e-waste drop-off bin or municipal electronics collection day.',
      whyThisResult: 'Electronic accessories contain copper, rare earth metals, and flame retardants that cannot be recovered in curbside sorting plants and tangle conveyor sorting belts.',
      ecoTip: 'Organize cables with reusable velcro ties and unplug power bricks when not in use to avoid phantom power loss.',
      ecoActionScore: 90,
      specialHandlingRequired: true,
      specialHandlingNotes: 'E-waste drop-off only. Cables get tangled in standard recycling machinery.',
      contaminationRisk: 'none',
      alternativeUses: ['Keep as a spare in travel bag or donate to local school/maker club'],
      carbonSavedKg: 0.45,
    },
    {
      keywords: ['pizza', 'pizza box', 'grease', 'cardboard', 'oil', 'soiled paper', 'takeout box'],
      detectedItem: 'Food-Contaminated Pizza Box',
      material: 'Grease-Soiled Corrugated Cardboard',
      category: 'context_dependent',
      categoryLabel: 'Context-Dependent / Mixed Stream',
      binColor: 'Separate: Blue Bin (Clean Lid) & Green/Black Bin (Greasy Base)',
      whereToSegregate: 'Tear in half: Clean oil-free lid into Blue Bin (Paper); Greasy bottom into Green Bin (Compost) or Black Bin (Trash).',
      segregationSteps: [
        '1. Remove all leftover crusts, dipping sauce containers, plastic supports, and wax liners',
        '2. Tear the cardboard box in half along the middle seam',
        '3. Deposit the clean, grease-free lid into the Blue Bin (Dry Recyclables)',
        '4. Deposit the oil-soaked bottom into your Green Bin (if city accepts food-soiled paper) or Black Bin (General Trash)'
      ],
      confidence: 88,
      recommendedDisposal: 'Separate the clean top from the soiled bottom. Only clean, oil-free cardboard can be recycled with paper.',
      whyThisResult: 'Grease and food oils cannot be washed out of cardboard fibers during the paper recycling pulping cycle, causing entire batches of paper pulp to fail.',
      ecoTip: 'Always segregate clean and soiled parts to save clean paper fibers without risking batch contamination.',
      ecoActionScore: 82,
      specialHandlingRequired: false,
      contaminationRisk: 'high',
      recyclingCode: 'PAP 20',
      alternativeUses: ['Tear clean sections for fireplace kindling', 'Use clean unprinted cardboard in garden sheet mulching'],
      carbonSavedKg: 0.15,
    },
    {
      keywords: ['glass', 'jar', 'wine', 'beer bottle', 'glass bottle', 'jam jar', 'mason jar'],
      detectedItem: 'Glass Bottle / Food Jar',
      material: 'Container Glass (Soda-Lime Glass)',
      category: 'recyclable',
      categoryLabel: 'Dry Recyclable / Glass',
      binColor: 'Blue Bin (Dry Recyclables) or Dedicated Glass Kiosk',
      whereToSegregate: 'Blue Bin or dedicated municipal glass igloo/kiosk after rinsing.',
      segregationSteps: [
        '1. Empty contents and rinse out food or beverage residues',
        '2. Remove metal lids (metal lids can be recycled separately with dry metals)',
        '3. Do not break or shatter intentionally',
        '4. Deposit into Blue Bin or your neighborhood glass collection drop-off'
      ],
      confidence: 95,
      recommendedDisposal: 'Rinse and place in curbside glass recycling or neighborhood glass bank.',
      whyThisResult: 'Container glass is 100% recyclable infinitely with zero loss in purity or structural strength.',
      ecoTip: 'Glass jars make excellent reusable storage for spices, dry grains, homemade jams, and leftovers.',
      ecoActionScore: 94,
      specialHandlingRequired: false,
      contaminationRisk: 'low',
      recyclingCode: 'GL 70',
      alternativeUses: ['Pantry food storage jar', 'Propagating plant cuttings in water'],
      carbonSavedKg: 0.3,
    },
    {
      keywords: ['paper', 'newspaper', 'magazine', 'office paper', 'envelope', 'book', 'notebook'],
      detectedItem: 'Clean Paper / Print Material',
      material: 'Clean Cellulose Fiber Paper',
      category: 'recyclable',
      categoryLabel: 'Dry Recyclable / Paper',
      binColor: 'Blue Bin (Dry Recyclables / Paper)',
      whereToSegregate: 'Blue Bin (Dry Recyclables). Keep dry and free of food grease.',
      segregationSteps: [
        '1. Ensure paper is dry and free of food, oil, or chemical stains',
        '2. Remove any plastic wrap, plastic windows (if required locally), or metal spiral binders',
        '3. Place flat or stacked in Blue Bin (do not shred unless required for confidentiality)'
      ],
      confidence: 95,
      recommendedDisposal: 'Keep clean and dry, then place in standard curbside paper recycling.',
      whyThisResult: 'High-grade cellulose fibers can be re-pulped 5 to 7 times before the fibers become too short to form paper sheets.',
      ecoTip: 'Opt into paperless billing and digital statements to reduce virgin wood pulp harvesting.',
      ecoActionScore: 92,
      specialHandlingRequired: false,
      contaminationRisk: 'low',
      recyclingCode: 'PAP 22',
      alternativeUses: ['Draft scrap notes', 'Protective wrapping when packing glassware'],
      carbonSavedKg: 0.2,
    }
  ];

  // Try finding matching rule from user hint
  if (query) {
    for (const rule of rules) {
      if (rule.keywords.some(kw => query.includes(kw))) {
        const defaultRecyclability =
          rule.category === 'recyclable'
            ? 'Recyclable (Curbside Collection)'
            : rule.category === 'organic'
            ? '100% Biodegradable & Compostable'
            : rule.category === 'ewaste'
            ? 'Specialized E-Waste Drop-Off'
            : rule.category === 'hazardous'
            ? 'Hazardous Material (Certified Drop-Off Required)'
            : 'Non-Recyclable (General Residual Trash)';

        return {
          id: `local-scan-${Date.now()}`,
          detectedItem: rule.detectedItem,
          material: rule.material,
          category: rule.category,
          categoryLabel: rule.categoryLabel,
          recyclability: rule.recyclability || defaultRecyclability,
          disposalInstructions: rule.disposalInstructions || rule.recommendedDisposal,
          binColor: rule.binColor,
          whereToSegregate: rule.whereToSegregate,
          segregationSteps: rule.segregationSteps,
          confidence: rule.confidence,
          confidenceLevel: 'high',
          environmentalImpact: rule.environmentalImpact || `Diverting this item prevents approximately ${rule.carbonSavedKg || 0.15} kg CO2e greenhouse gas emissions and conserves virgin resources.`,
          recommendedDisposal: rule.recommendedDisposal,
          whyThisResult: rule.whyThisResult,
          ecoTip: rule.ecoTip,
          ecoActionScore: rule.ecoActionScore,
          specialHandlingRequired: rule.specialHandlingRequired,
          specialHandlingNotes: rule.specialHandlingNotes,
          contaminationRisk: rule.contaminationRisk || 'low',
          recyclingCode: rule.recyclingCode,
          alternativeUses: rule.alternativeUses,
          carbonSavedKg: rule.carbonSavedKg,
          timestamp: new Date().toISOString(),
          imageUrl,
          isMock: true,
        };
      }
    }
  }

  // Default intelligent household classification
  return {
    id: `local-scan-${Date.now()}`,
    detectedItem: hint ? `Household Item (${hint})` : 'Household Waste Item',
    material: 'Mixed / Inspection Needed (Plastic, Paper, or Composite)',
    category: 'context_dependent',
    categoryLabel: 'Context-Dependent / Visual Inspection',
    recyclability: 'Inspection Required (Clean rigid plastics/paper recyclable; food-soiled non-recyclable)',
    disposalInstructions: 'Inspect material identification code. Clean, dry containers go into the Blue Bin; composite or food-soiled packaging goes to the Black Bin.',
    binColor: 'Blue Bin (if clean & dry) OR Black Bin (if food-soiled)',
    whereToSegregate: 'Inspect item cleanliness: Place clean, dry paper/plastics/metals in the Blue Bin; place food-soiled or multi-layer packaging in the Black Bin.',
    segregationSteps: [
      '1. Check for material identification symbols (#1 to #7 for plastics, ALU for aluminum, PAP for paper)',
      '2. Empty any liquids and wipe off food grease or organic residue',
      '3. If clean and made of a single recyclable material, deposit into the Blue Bin (Dry Recyclables)',
      '4. If heavily soiled, composite foil-plastic pouch, or wax-coated, deposit into Black Bin (General Trash)'
    ],
    confidence: 82,
    confidenceLevel: 'medium',
    environmentalImpact: 'Sorting items correctly prevents cross-contamination of entire recyclable batches and saves up to 0.15 kg CO2e.',
    recommendedDisposal: 'Inspect resin symbols. Clean single-material items go into dry recycling; composite or food-soiled packaging goes to general waste.',
    whyThisResult: 'Proper segregation depends on the primary material composition and whether the item is free of food contamination.',
    ecoTip: 'When in doubt, check the SPI recycling triangle on the bottom of the container before disposing.',
    ecoActionScore: 80,
    specialHandlingRequired: false,
    contaminationRisk: 'moderate',
    alternativeUses: ['Check for local refill or reuse options before discarding'],
    carbonSavedKg: 0.15,
    timestamp: new Date().toISOString(),
    imageUrl,
    isMock: true,
  };
}
