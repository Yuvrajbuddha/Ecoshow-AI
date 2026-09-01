export interface WasteKnowledgeDoc {
  id: string;
  topic: string;
  category: string;
  keywords: string[];
  summary: string;
  detailedGuidance: string;
  precautions: string;
  municipalVariationNote: string;
}

export const WASTE_KNOWLEDGE_BASE: WasteKnowledgeDoc[] = [
  {
    id: 'kb-pet-plastic',
    topic: 'PET Plastic (Resin Code 1)',
    category: 'recyclable',
    keywords: ['plastic bottle', 'water bottle', 'soda bottle', 'pet', 'polyethylene terephthalate', 'beverage bottle'],
    summary: 'Clear or tinted rigid bottles commonly used for beverages. Highly recyclable in curbside programs.',
    detailedGuidance: 'Empty all liquids, rinse out any residues, and crush to save bin space. Bottle caps can usually be screwed back on in modern automated MRFs (Material Recovery Facilities).',
    precautions: 'Do not include chemical or motor oil bottles even if marked #1, as toxic residues contaminate recycling batches.',
    municipalVariationNote: 'Some municipalities require caps removed; check local municipal sorting standards.'
  },
  {
    id: 'kb-aluminum-cans',
    topic: 'Aluminum Cans & Foil',
    category: 'recyclable',
    keywords: ['aluminum can', 'soda can', 'beer can', 'tin can', 'beverage can', 'foil'],
    summary: 'Infinitely recyclable metal requiring 95% less energy to recycle than primary smelting.',
    detailedGuidance: 'Rinse cans to remove sticky beverage residue. Clean aluminum foil balled up to at least 2 inches in diameter is recyclable.',
    precautions: 'Do not crush cans flat if your city uses optical sorters, as flat cans may misclassify as paper on single-stream conveyor belts.',
    municipalVariationNote: 'Widely accepted globally in virtually all dry recyclable streams.'
  },
  {
    id: 'kb-banana-peels-organic',
    topic: 'Fruit & Vegetable Scraps (Banana Peels, Rinds)',
    category: 'organic',
    keywords: ['banana peel', 'apple core', 'orange peel', 'fruit scrap', 'vegetable peelings', 'compost', 'food waste'],
    summary: 'Rich in potassium and nitrogen; biodegradable organic matter that creates methane when landfilled.',
    detailedGuidance: 'Place in municipal green compost bin or backyard composting pile. Excellent for soil amendment and moisture retention.',
    precautions: 'Remove any synthetic produce barcode stickers or plastic ties before composting.',
    municipalVariationNote: 'In areas without organic collection, consider vermicomposting or bokashi fermentation.'
  },
  {
    id: 'kb-pizza-box-grease',
    topic: 'Pizza Boxes & Food-Contaminated Cardboard',
    category: 'context_dependent',
    keywords: ['pizza box', 'greasy cardboard', 'food box', 'oil soaked paper', 'takeout container'],
    summary: 'Cardboard soaked with food grease cannot be recycled with clean paper because oils weaken fiber bonding.',
    detailedGuidance: 'Tear off the clean cardboard lid and recycle it in dry cardboard. The greasy bottom half should be placed in the organic/food waste compost bin or general trash.',
    precautions: 'Never place grease-saturated paper into clean paper recycling, as it spoils entire paper pulp vats.',
    municipalVariationNote: 'Many green bin municipal programs accept food-soiled paper and greasy pizza boxes directly for industrial composting.'
  },
  {
    id: 'kb-lithium-batteries',
    topic: 'Household & Rechargeable Batteries (Lithium-ion, Alkaline)',
    category: 'ewaste',
    keywords: ['battery', 'used battery', 'lithium battery', 'aa battery', 'aaa battery', 'powerbank', 'accumulator'],
    summary: 'Contains toxic heavy metals and reactive chemicals. Poses extreme fire risks in standard recycling trucks.',
    detailedGuidance: 'Never throw in household bins. Tape terminals with non-conductive clear tape and deposit at authorized e-waste drop-off bins or electronics retailers.',
    precautions: 'Damaged, swollen, or punctured lithium batteries must be placed in sand or fire-safe containers immediately.',
    municipalVariationNote: 'Special drop-off mandatory in nearly all jurisdictions.'
  },
  {
    id: 'kb-mobile-chargers-cables',
    topic: 'Mobile Phone Chargers & Small Electronics',
    category: 'ewaste',
    keywords: ['mobile charger', 'phone charger', 'charging cable', 'usb cable', 'adapter', 'power cord', 'headphones'],
    summary: 'Contains copper wiring, transformer coils, and engineered plastics that can be safely harvested at e-waste facilities.',
    detailedGuidance: 'Collect in an e-waste storage box until you can visit a designated municipal e-waste depot or retailer collection box.',
    precautions: 'Cables get tangled in standard recycling facility machinery ("tanglers"), causing costly plant shutdowns.',
    municipalVariationNote: 'Drop-off only; never place in single-stream blue bins.'
  },
  {
    id: 'kb-glass-bottles-jars',
    topic: 'Glass Bottles and Food Jars',
    category: 'recyclable',
    keywords: ['glass bottle', 'glass jar', 'wine bottle', 'jam jar', 'mason jar'],
    summary: '100% recyclable infinitely without degradation in purity or quality.',
    detailedGuidance: 'Rinse out food remains. Metal lids can often be recycled separately with scrap metals.',
    precautions: 'Do NOT mix with drinking glasses, Pyrex, ceramics, window panes, or mirrors, which melt at higher temperatures and ruin batches.',
    municipalVariationNote: 'Some cities collect glass in a separate bin or drop-off depot to prevent broken glass shards in paper.'
  },
  {
    id: 'kb-aerosol-paint-hazardous',
    topic: 'Aerosol Spray Cans & Chemical Containers',
    category: 'hazardous',
    keywords: ['aerosol can', 'spray paint', 'paint can', 'pesticide', 'solvent', 'varnish', 'hazardous waste'],
    summary: 'Pressurized containers with chemical contents classified as Hazardous Household Waste (HHW).',
    detailedGuidance: 'Take to a designated Hazardous Household Waste collection depot. If completely empty and unpressurized, some facilities accept steel aerosol cans.',
    precautions: 'Do not puncture, burn, or compact spray cans. Keep away from heat sources.',
    municipalVariationNote: 'Strictly prohibited in general waste and standard recyclables.'
  }
];

export function retrieveRagContext(query: string): WasteKnowledgeDoc[] {
  const normalized = query.toLowerCase();
  const scored = WASTE_KNOWLEDGE_BASE.map(doc => {
    let score = 0;
    if (normalized.includes(doc.topic.toLowerCase())) score += 10;
    if (normalized.includes(doc.category.toLowerCase())) score += 4;
    for (const kw of doc.keywords) {
      if (normalized.includes(kw)) score += 5;
    }
    return { doc, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.doc);
}
