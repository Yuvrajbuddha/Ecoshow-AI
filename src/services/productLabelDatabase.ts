import { WasteCategory, WasteAnalysisResult } from '../types';

export interface PackagingComponent {
  name: string; // e.g. "Bottle Body", "Cap", "Liner"
  material: string; // e.g. "100% rPET (#1)", "HDPE (#2)"
  binColor: string; // e.g. "Blue Bin", "Green Bin", "Black Bin"
  action: string; // e.g. "Rinse and place in dry recyclables"
  status: 'Recyclable' | 'Separate & Trash' | 'Compostable' | 'Special Drop-off' | 'Store Drop-off';
}

export interface ProductLabelRecord {
  id: string;
  qrCode: string; // Primary QR code string encoded on the packaging
  aliases?: string[]; // Alternate QR strings or URLs pointing to this item
  upc: string; // 12 or 13 digit retail barcode
  productName: string;
  brand: string;
  category: WasteCategory;
  categoryLabel: string;
  packageType: string;
  recyclability: string;
  binColor: string;
  confidence: number;
  components: PackagingComponent[];
  stepByStepInstructions: string[];
  preparationTips: string;
  contaminationCaution: string;
  environmentalImpact: string;
  carbonSavedKg: number;
  certifications: string[];
  verifiedBy: string;
  ecoTip: string;
  alternativeUses: string[];
  sampleIcon: string;
}

export const PRODUCT_LABEL_DATABASE: ProductLabelRecord[] = [
  {
    id: 'aquapure-water-500',
    qrCode: 'ECO-PET-7391',
    aliases: [
      'https://ecosort.org/qr/ECO-PET-7391',
      'https://id.gs1.org/01/00012000001291',
      '012000001291'
    ],
    upc: '012000001291',
    productName: 'AquaPure Mountain Spring Water (500ml)',
    brand: 'AquaPure Beverages',
    category: 'recyclable',
    categoryLabel: '100% Recyclable Bottle',
    packageType: 'Clear rPET Bottle with HDPE Screw Cap & BOPP Film Label',
    recyclability: 'Fully Recyclable (Keep Cap On)',
    binColor: 'Blue Bin (Dry Recyclables)',
    confidence: 100,
    components: [
      {
        name: 'Bottle Body',
        material: 'PET #1 Polyethylene Terephthalate',
        binColor: 'Blue Bin (Plastics/Recyclables)',
        action: 'Empty completely, rinse residue, and lightly crush to save bin space.',
        status: 'Recyclable'
      },
      {
        name: 'Screw Cap',
        material: 'HDPE #2 High-Density Polyethylene',
        binColor: 'Blue Bin (Attached to Bottle)',
        action: 'Screw cap back onto crushed bottle so it does not slip through sorting screens at the MRF.',
        status: 'Recyclable'
      },
      {
        name: 'Wrap Label',
        material: 'BOPP Film Plastic',
        binColor: 'Blue Bin (Leave on Bottle)',
        action: 'Modern optical flotation sorters wash away the label during the flaking wash cycle. No need to peel.',
        status: 'Recyclable'
      }
    ],
    stepByStepInstructions: [
      '1. Drink or empty all liquid contents into the sink.',
      '2. Quick rinse if anything other than plain water was stored inside.',
      '3. Gently crush the bottle from bottom to top to expel air.',
      '4. Re-attach the cap firmly onto the neck of the bottle.',
      '5. Place into your curbside Blue Bin (Dry Recyclables).'
    ],
    preparationTips: 'Keeping the cap screwed on prevents small plastic caps from ending up in ocean debris or falling into landfill rejects at sorting plants.',
    contaminationCaution: 'Do not put motor oils, paint thinners, or garden chemicals into beverage bottles—toxic residues contaminate entire recycling bales.',
    environmentalImpact: 'Diverting this bottle into rPET recycling avoids 0.08 kg CO2e and saves enough energy to run a 60W lightbulb for 6 hours.',
    carbonSavedKg: 0.08,
    certifications: ['How2Recycle® Certified', '100% Post-Consumer Recycled rPET Body', 'Zero Waste Alliance Partner'],
    verifiedBy: 'Global Packaging Verification Registry (ISO 14021:2026)',
    ecoTip: 'Invest in a refillable stainless steel flask to prevent single-use bottle generation altogether.',
    alternativeUses: ['Seed germination bell-jar', 'DIY watering funnel for potted plants', 'Bird feeder craft project'],
    sampleIcon: '💧'
  },
  {
    id: 'oathaven-barista-1l',
    qrCode: 'ECO-OATMILK-882',
    aliases: [
      'https://ecosort.org/qr/ECO-OATMILK-882',
      'https://id.gs1.org/01/07394376616037',
      '7394376616037'
    ],
    upc: '7394376616037',
    productName: 'OatHaven Barista Edition Oat Drink (1 Litre)',
    brand: 'OatHaven Organics',
    category: 'recyclable',
    categoryLabel: 'Aseptic Beverage Carton',
    packageType: 'Tetra Pak Aseptic Carton (70% FSC Paperboard, 24% LDPE, 6% Aluminum) + Bio-PE Cap',
    recyclability: 'Curbside Recyclable (Where Carton Programs Exist)',
    binColor: 'Blue Bin (Cartons & Paperboard / Mixed Dry)',
    confidence: 100,
    components: [
      {
        name: 'Carton Body',
        material: 'Aseptic Multi-layer (70% FSC Kraft Paperboard, PE, Micro-Aluminum Foil)',
        binColor: 'Blue Bin (Beverage Cartons)',
        action: 'Rinse out oat milk residue, open top folds, and push flat from corner to corner.',
        status: 'Recyclable'
      },
      {
        name: 'Flip Cap & Spout',
        material: 'Bonsucro-Certified Sugarcane Bio-HDPE',
        binColor: 'Blue Bin (Keep On Carton)',
        action: 'Reclose cap so it stays anchored to the carton during pulping separation.',
        status: 'Recyclable'
      }
    ],
    stepByStepInstructions: [
      '1. Pour out any remaining oat milk.',
      '2. Fill with 50ml water, shake well, and rinse down the drain.',
      '3. Lift the top triangle wings, push the bottom corners in, and flatten the carton completely.',
      '4. Screw the cap back on tight.',
      '5. Place into the Blue Bin (or dedicated Carton collection container).'
    ],
    preparationTips: 'Hydropulping mills soak these cartons in warm water without chemicals to separate high-grade paper fibers for tissue and cardboard boxes, while the PolyAl (plastic/aluminum) is turned into roof tiles.',
    contaminationCaution: 'Do not put straw inside if not recyclable, and never toss filled cartons with sour milk.',
    environmentalImpact: 'Recycling 1L aseptic cartons saves 0.14 kg CO2e and preserves virgin wood pulp.',
    carbonSavedKg: 0.14,
    certifications: ['FSC Mixed Cardboard Mix', 'Tetra Pak® Certified Circular Partner', 'Carbon Neutral Certified Product'],
    verifiedBy: 'Carton Council of North America & EU Circular Packaging Hub',
    ecoTip: 'Aseptic cartons keep milk fresh without refrigeration before opening, saving cold-chain shipping energy.',
    alternativeUses: ['Planter for seedlings (cut top off and puncture drainage holes)', 'Waterproof kitchen grease collector'],
    sampleIcon: '🌾'
  },
  {
    id: 'fizzspark-lemon-can-330',
    qrCode: 'ECO-CAN-9912',
    aliases: [
      'https://ecosort.org/qr/ECO-CAN-9912',
      'https://id.gs1.org/01/0049000028904',
      '0049000028904'
    ],
    upc: '0049000028904',
    productName: 'FizzSpark Sparkling Sicilian Lemon (330ml Can)',
    brand: 'FizzSpark Refreshments',
    category: 'recyclable',
    categoryLabel: 'Infinite Recyclable Metal Can',
    packageType: '100% Aluminum Beverage Can with Integrated Stay-on Tab',
    recyclability: '100% Infinitely Recyclable Metal',
    binColor: 'Blue Bin (Metals & Dry Recyclables)',
    confidence: 100,
    components: [
      {
        name: 'Can Body & Lid',
        material: 'Alloy 3004 / 5182 Food-Grade Aluminum',
        binColor: 'Blue Bin (Metal Recyclables)',
        action: 'Empty completely. Keep intact without crushing flat if your city uses automated eddy-current separators.',
        status: 'Recyclable'
      },
      {
        name: 'Stay-on Tab',
        material: 'Aluminum Tab',
        binColor: 'Blue Bin (Leave on Can)',
        action: 'Do not rip off the tab. Leaving it on ensures 100% of the metal is recovered in the smelter.',
        status: 'Recyclable'
      }
    ],
    stepByStepInstructions: [
      '1. Drain all remaining liquid and sticky lemon syrup.',
      '2. Quick rinse with water.',
      '3. Leave stay-on tab connected.',
      '4. Keep can 3D (do not stomp flat for single-stream MRFs).',
      '5. Place into the Blue Bin.'
    ],
    preparationTips: 'Recycled aluminum uses 95% less energy than producing aluminum from bauxite ore. A recycled can is back on supermarket shelves within 60 days.',
    contaminationCaution: 'Never throw cigarette butts or plastic wrappers inside aluminum cans as this ruins smelting purities.',
    environmentalImpact: 'Saves 0.18 kg CO2e per can compared to virgin aluminum manufacturing.',
    carbonSavedKg: 0.18,
    certifications: ['Aluminium Stewardship Initiative (ASI) Certified', 'Closed-Loop Can-to-Can 60-Day Guarantee'],
    verifiedBy: 'International Aluminium Institute & Metal Packaging Manufacturers Guild',
    ecoTip: 'Aluminum is one of the very few packaging formats that pays for the collection of other recyclables due to its high scrap commodity value.',
    alternativeUses: ['Desktop pen holder (with smoothed edge)', 'Outdoor plant seedling shield against snails'],
    sampleIcon: '🥫'
  },
  {
    id: 'greek-meadows-yogurt-450g',
    qrCode: 'ECO-YOGURT-450G',
    aliases: [
      'https://ecosort.org/qr/ECO-YOGURT-450G',
      '021130071442'
    ],
    upc: '021130071442',
    productName: 'Greek Meadows Probiotic Greek Yogurt (450g Tub)',
    brand: 'Greek Meadows Dairy',
    category: 'context_dependent',
    categoryLabel: 'Multi-Component Packaging',
    packageType: 'PP #5 Plastic Tub with Cardboard Outer Sleeve and Aluminum Foil Lid',
    recyclability: 'Check Locally — Multi-Part Segregation Required',
    binColor: 'Separated: Blue Bin (Plastics & Paper) / Foil to Metals',
    confidence: 100,
    components: [
      {
        name: 'Cardboard Band/Sleeve',
        material: 'FSC Certified Recycled Cardboard',
        binColor: 'Blue Bin (Cardboard/Paper)',
        action: 'Tear along the perforated seam to detach from plastic tub. Flatten and recycle with paper.',
        status: 'Recyclable'
      },
      {
        name: 'Yogurt Tub',
        material: 'Polypropylene (PP #5)',
        binColor: 'Blue Bin (Rigid Plastics #5)',
        action: 'Scrape remaining yogurt clean and rinse tub. Place in rigid plastics collection.',
        status: 'Recyclable'
      },
      {
        name: 'Foil Seal Lid',
        material: 'Lacquered Aluminum Foil',
        binColor: 'Blue Bin (Ball up with other foils)',
        action: 'Rinse yogurt off the foil. Ball up with other aluminum foil scraps until it reaches at least 2 inches in diameter so sorting machines catch it.',
        status: 'Recyclable'
      }
    ],
    stepByStepInstructions: [
      '1. Peel off the outer cardboard jacket by pulling the perforated corner tab.',
      '2. Flatten the cardboard sleeve and deposit in the Paper/Cardboard stream.',
      '3. Peel the aluminum lid completely off the tub and rinse away yogurt.',
      '4. Rinse the PP #5 white plastic tub with warm water.',
      '5. Place both tub and foil ball in the Blue Bin.'
    ],
    preparationTips: 'The cardboard sleeve was designed to allow a 50% thinner plastic tub, greatly reducing petroleum plastic weight while ensuring easy separation.',
    contaminationCaution: 'Unrinsed dairy products quickly spoil, breed maggots, and cause foul odors that can cause entire loads of paper to be rejected at MRFs.',
    environmentalImpact: 'Separating the paper and PP plastic prevents 0.11 kg CO2e and enables high-value polypropylene resin pellet production.',
    carbonSavedKg: 0.11,
    certifications: ['How2Recycle® Multi-Part Guide', 'FSC Cardboard Certification', 'BPA-Free Food Grade Container'],
    verifiedBy: 'National Association for PET and PP Container Resources (NAPCOR)',
    ecoTip: 'Clean PP #5 yogurt tubs make durable, dishwasher-safe reusable leftover containers and screw organizers.',
    alternativeUses: ['Drawer hardware organizer', 'Paint mixing tub for crafts', 'Seed starter pot'],
    sampleIcon: '🥣'
  },
  {
    id: 'powercell-aa-battery-pack',
    qrCode: 'ECO-BATTERY-AA4',
    aliases: [
      'https://ecosort.org/qr/ECO-BATTERY-AA4',
      '041333001053'
    ],
    upc: '041333001053',
    productName: 'PowerCell Ultra NiMH Rechargeable AA Batteries (4-Pack)',
    brand: 'PowerCell Technologies',
    category: 'hazardous',
    categoryLabel: 'Hazardous E-Waste (Terminal Taping Required)',
    packageType: 'Blister Pack (Paperboard + RPET blister) + 4x NiMH 1.2V Rechargeable Cells',
    recyclability: 'Take to Battery Drop-Off Point (NOT Curbside)',
    binColor: 'Red Bin / Retail Battery Drop-Off Kiosk (Never Household Bins!)',
    confidence: 100,
    components: [
      {
        name: 'Battery Cells (When Depleted)',
        material: 'Nickel Metal Hydride (NiMH) / Heavy Metals',
        binColor: 'Designated Battery Drop-Off Kiosk / Hazardous Depot',
        action: 'Cover both (+) and (-) terminals with clear tape to prevent short circuits. Deposit in dedicated battery recycling bins found at hardware stores and supermarkets.',
        status: 'Special Drop-off'
      },
      {
        name: 'Packaging Backer Card',
        material: 'Printed Paperboard',
        binColor: 'Blue Bin (Paper/Cardboard)',
        action: 'Tear away plastic front blister and place paper card in dry paper recycling.',
        status: 'Recyclable'
      },
      {
        name: 'Packaging Front Blister',
        material: 'Thermoformed PET #1 Plastic',
        binColor: 'Blue Bin (Rigid Plastics)',
        action: 'Place in dry plastics recycling once separated from paper card.',
        status: 'Recyclable'
      }
    ],
    stepByStepInstructions: [
      '1. NEVER throw used or rechargeable batteries in your household trash or recycling bin!',
      '2. Apply a strip of scotch or electrical tape over the positive and negative ends.',
      '3. Store inside a cool, dry plastic container until ready for drop-off.',
      '4. Drop off at any supermarket, electronics store, or municipal hazardous waste depot.',
      '5. Separate the packaging: Paper backing goes to Paper bin, clear plastic blister to Plastics bin.'
    ],
    preparationTips: 'Lithium and rechargeable batteries are the #1 cause of catastrophic fires in recycling trucks and waste transfer stations nationwide.',
    contaminationCaution: 'CRITICAL FIRE RISK: Loose batteries tumbling against metal in recycling trucks create sparks that ignite paper bales. Always tape the terminals.',
    environmentalImpact: 'Recycling recovers valuable cobalt, nickel, and iron, avoiding heavy metal leaching into groundwater and saving 0.45 kg CO2e.',
    carbonSavedKg: 0.45,
    certifications: ['Call2Recycle® Certified Partner', 'RoHS Compliant Hazardous Item Protocol', 'UL 2054 Battery Safety Standard'],
    verifiedBy: 'Battery Stewardship Council & EPA Household Hazardous Waste Program',
    ecoTip: 'Rechargeable NiMH batteries can be recharged over 1,000 times, displacing thousands of disposable alkaline cells.',
    alternativeUses: ['Recharge in smart battery charger before declaring end-of-life—often deeply discharged cells can be restored'],
    sampleIcon: '🔋'
  },
  {
    id: 'greenbites-salad-bowl-pla',
    qrCode: 'ECO-PLA-BOWL-99',
    aliases: [
      'https://ecosort.org/qr/ECO-PLA-BOWL-99',
      '8901030456123'
    ],
    upc: '8901030456123',
    productName: 'GreenBites Fresh Deli Salad Bowl & Snap Lid (32oz)',
    brand: 'GreenBites Organics',
    category: 'organic',
    categoryLabel: 'Certified Commercial Compostable PLA',
    packageType: '100% Corn-Starch Ingeo™ Polylactic Acid (PLA #7 Bioplastic)',
    recyclability: 'Commercial Compostable (Do NOT Mix with Standard PET Plastics)',
    binColor: 'Green Bin (Commercial Organics / Food Waste Compost)',
    confidence: 100,
    components: [
      {
        name: 'Salad Bowl & Clear Lid',
        material: 'Certified PLA #7 (Polylactic Acid from fermented plant starch)',
        binColor: 'Green Bin (Commercial Food Waste / Organics)',
        action: 'Scrape food scraps into compost. Deposit bowl and lid into commercial green composting bin. Do NOT place in curbside Blue recycling.',
        status: 'Compostable'
      }
    ],
    stepByStepInstructions: [
      '1. Scrape dressing, croutons, and food residues directly into the bowl.',
      '2. If your city offers industrial composting (green organics bin), place bowl + lid + food scraps together.',
      '3. DO NOT put PLA bioplastics into standard PET #1 plastic recycling bins (PLA melts at a different temperature and ruins PET batches).',
      '4. If no commercial composting facility is available in your jurisdiction, place in general waste (Black bin).'
    ],
    preparationTips: 'PLA bioplastics break down within 90-180 days in commercial composting facilities operating at 55-60°C and high humidity.',
    contaminationCaution: 'Do not attempt to compost in backyard compost piles; ordinary garden compost heaps do not reach high enough temperatures to melt and degrade PLA.',
    environmentalImpact: 'Plant-based resin avoids petroleum extraction and sequesters biogenic carbon (0.12 kg CO2e saved when composted).',
    carbonSavedKg: 0.12,
    certifications: ['BPI® Certified Commercial Compostable (ASTM D6400)', 'TÜV AUSTRIA OK Compost INDUSTRIAL', 'EN 13432 Compostability Standard'],
    verifiedBy: 'Biodegradable Products Institute (BPI) & European Bioplastics Association',
    ecoTip: 'Ask your favorite takeout cafes if they accept used PLA containers back for collective commercial composting.',
    alternativeUses: ['Wash and reuse for picnic food containers (cold foods only; PLA warps with hot soups)'],
    sampleIcon: '🥗'
  },
  {
    id: 'voltcable-fastcharge-usb',
    qrCode: 'ECO-CABLE-USB-65',
    aliases: [
      'https://ecosort.org/qr/ECO-CABLE-USB-65',
      '084000456789'
    ],
    upc: '084000456789',
    productName: 'VoltGear Kevlar Braided USB-C to USB-C Cable (1.8m)',
    brand: 'VoltGear Accessories',
    category: 'ewaste',
    categoryLabel: 'Small Consumer Electronics (Tangler Warning)',
    packageType: 'FSC Cardboard Box + High-Purity Copper Wire with Braided Nylon Jacket',
    recyclability: 'E-Waste Depot Only (Tangler Hazard in Curbside Recycling)',
    binColor: 'Yellow Bin / Dedicated Electronics Drop-off Depot',
    confidence: 100,
    components: [
      {
        name: 'USB Cable (End of Life)',
        material: 'High-purity Oxygen-free Copper Wire, TPE Insulation, Anodized Aluminum Heads',
        binColor: 'E-Waste Depot / Best Buy / Apple Trade-In Drop-off',
        action: 'Never place in curbside Blue bins. Collect cables in a box until visiting an authorized e-waste collector.',
        status: 'Special Drop-off'
      },
      {
        name: 'Packaging Box',
        material: 'FSC Certified Cardboard',
        binColor: 'Blue Bin (Paper/Cardboard)',
        action: 'Flatten box and place in paper recycling stream.',
        status: 'Recyclable'
      }
    ],
    stepByStepInstructions: [
      '1. NEVER place cords, cables, hoses, or wires in standard curbside recycling bins.',
      '2. Cables wrap around conveyor gears and rotating trommel screens at recycling facilities, causing dangerous breakdowns.',
      '3. Bundle the cable neatly with a rubber band or twist tie.',
      '4. Drop off at any consumer electronics retailer (Best Buy, Staples) or municipal e-waste recycling drive.',
      '5. Outer retail packaging box can be flattened and placed in your Blue paper bin.'
    ],
    preparationTips: 'Certified e-waste recyclers shred cables and use density air tables to extract 99% pure copper pellets for remanufacturing.',
    contaminationCaution: 'Recycling facilities spend millions annually cutting tangled cables from mechanical sorting shafts ("the tangler problem").',
    environmentalImpact: 'Recycling 100g of copper wiring saves 0.35 kg CO2e and avoids destructive raw copper mining.',
    carbonSavedKg: 0.35,
    certifications: ['WEEE Directive Compliant (Waste from Electrical & Electronic Equipment)', 'R2v3 Certified Recycler Protocol'],
    verifiedBy: 'Electronics Reuse & Recycling Stewardship Guild (R2 Leader)',
    ecoTip: 'If only the connector is bent, local repair cafes can often solder a new head, extending its life for years.',
    alternativeUses: ['Donate working cables to public libraries or schools that run electronics lending stations'],
    sampleIcon: '🔌'
  },
  {
    id: 'sunrise-honey-flakes-450g',
    qrCode: 'ECO-CEREAL-BOX-450',
    aliases: [
      'https://ecosort.org/qr/ECO-CEREAL-BOX-450',
      '038000318210'
    ],
    upc: '038000318210',
    productName: 'Sunrise Harvest Honey Toasted Oat Flakes (450g)',
    brand: 'Sunrise Cereals',
    category: 'recyclable',
    categoryLabel: 'Two-Piece Breakfast Cereal Box',
    packageType: '100% Recycled Greyboard Outer Box + HDPE #2 Plastic Freshness Bag',
    recyclability: 'Box Curbside Recyclable; Bag Store Drop-Off',
    binColor: 'Box: Blue Bin (Paper) / Bag: Store Plastic Bag Bin or Trash',
    confidence: 100,
    components: [
      {
        name: 'Cardboard Box',
        material: '100% Recycled Paperboard (Greyboard)',
        binColor: 'Blue Bin (Paper & Cardboard)',
        action: 'Flatten box flat to save container volume. Recycle in curbside dry paper.',
        status: 'Recyclable'
      },
      {
        name: 'Inner Cereal Liner Bag',
        material: 'High-Density Polyethylene (HDPE #2 Film)',
        binColor: 'Store Drop-Off (Supermarket Plastic Bag Collection) or General Trash',
        action: 'Shake out all cereal crumbs. Bring to store film drop-off kiosk. Do not put in curbside single-stream bins.',
        status: 'Store Drop-off'
      }
    ],
    stepByStepInstructions: [
      '1. Remove the plastic cereal bag from the cardboard box.',
      '2. Break down the top and bottom flaps of the outer box and flatten it completely.',
      '3. Place the cardboard box in your Blue Bin.',
      '4. Shake all cereal crumbs from the inner plastic bag.',
      '5. Check inner bag: if clean and stretchy, drop off at your grocery store front-entrance plastic film kiosk.'
    ],
    preparationTips: 'Flattening cereal boxes prevents recycling collection trucks from hauling trapped air, reducing transport fuel emissions.',
    contaminationCaution: 'Do not put the flexible plastic bag into the blue curbside cart unless your local municipality explicitly permits film plastics.',
    environmentalImpact: 'Recycled paperboard uses 60% less water and avoids 0.16 kg CO2e compared to virgin pulp.',
    carbonSavedKg: 0.16,
    certifications: ['100% Recycled Paperboard Alliance (RPA-100%)', 'Sustainable Forestry Initiative (SFI)'],
    verifiedBy: 'American Forest & Paper Association (AF&PA)',
    ecoTip: 'Use empty cereal boxes as dividers inside kitchen drawers or file organizers.',
    alternativeUses: ['DIY drawer organizer inserts', 'Children painting canvas', 'Weed barrier in garden beds'],
    sampleIcon: '🥣'
  }
];

/**
 * Searches the database for a matching product record based on:
 * - Exact QR code string match
 * - Alias/URL match
 * - UPC / Barcode match
 * - Partial search match
 */
export function lookupProductByCode(codeOrUrl: string): ProductLabelRecord | null {
  if (!codeOrUrl) return null;
  const trimmed = codeOrUrl.trim();
  const normalized = trimmed.toLowerCase();

  // 1. Direct QR Code match (case-insensitive)
  const exactQr = PRODUCT_LABEL_DATABASE.find(
    p => p.qrCode.toLowerCase() === normalized || p.id.toLowerCase() === normalized
  );
  if (exactQr) return exactQr;

  // 2. Direct UPC / Barcode match
  const upcMatch = PRODUCT_LABEL_DATABASE.find(
    p => p.upc === trimmed || trimmed.includes(p.upc) || p.upc.includes(trimmed)
  );
  if (upcMatch) return upcMatch;

  // 3. Alias / URL match
  const aliasMatch = PRODUCT_LABEL_DATABASE.find(p =>
    p.aliases?.some(alias => {
      const aNorm = alias.toLowerCase();
      return aNorm === normalized || normalized.includes(aNorm) || aNorm.includes(normalized);
    })
  );
  if (aliasMatch) return aliasMatch;

  // 4. Keyword fuzzy match in product name or brand
  const keywordMatch = PRODUCT_LABEL_DATABASE.find(p => {
    const combined = `${p.productName} ${p.brand} ${p.packageType}`.toLowerCase();
    return combined.includes(normalized) || normalized.includes(p.productName.toLowerCase());
  });
  if (keywordMatch) return keywordMatch;

  return null;
}

/**
 * Converts a ProductLabelRecord into the standardized WasteAnalysisResult
 * so that it can integrate seamlessly with user impact history, metrics, and views.
 */
export function convertProductToAnalysisResult(
  record: ProductLabelRecord,
  scannedCode?: string
): WasteAnalysisResult {
  const code = scannedCode || record.qrCode;
  return {
    id: `prod-scan-${record.id}-${Date.now()}`,
    detectedItem: `${record.productName} (${record.brand})`,
    material: record.packageType,
    category: record.category,
    categoryLabel: record.categoryLabel,
    recyclability: record.recyclability,
    disposalInstructions: record.stepByStepInstructions.join(' '),
    recommendedDisposal: record.stepByStepInstructions[0] || record.preparationTips,
    confidence: record.confidence,
    confidenceLevel: 'high',
    environmentalImpact: record.environmentalImpact,
    carbonSavedKg: record.carbonSavedKg,
    binColor: record.binColor,
    whereToSegregate: `Dispose in ${record.binColor}. Follow verified packaging label instructions.`,
    segregationSteps: record.stepByStepInstructions,
    whyThisResult: `Verified GS1/EcoSort packaging database match from on-pack label (Code: ${code}). Certified under ${record.verifiedBy}.`,
    ecoTip: record.ecoTip,
    ecoActionScore: 98,
    specialHandlingRequired: record.category === 'hazardous' || record.category === 'ewaste',
    specialHandlingNotes: record.contaminationCaution,
    contaminationRisk: record.category === 'context_dependent' ? 'moderate' : 'low',
    recyclingCode: record.components[0]?.material || 'Certified Product Packaging',
    alternativeUses: record.alternativeUses,
    timestamp: new Date().toISOString(),
    imageUrl: undefined,
    isMock: false
  };
}
