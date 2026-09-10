"""
EcoSort AI - Decoupled Domain Knowledge Layer
============================================
Maps predicted visual waste categories to municipal segregation actions,
recyclability statuses, disposal guidelines, and carbon mitigation data.

Decoupling this from the deep learning model ensures that municipal rules,
bin color assignments, and regional sustainability policies can be updated
dynamically without needing expensive model retraining.
"""

from typing import Dict, Any, Optional

WASTE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "plastic": {
        "category": "Plastic",
        "detected_item_default": "Plastic bottle or rigid packaging",
        "bin": "Dry/Recyclable Waste",
        "recyclable": True,
        "disposal_instruction": "Empty and rinse the container to remove food or liquid residue. Flatten bottle and replace screw-cap before placing in the blue recycling bin.",
        "sustainability_tip": "Recycling 1 ton of plastic saves ~5,774 kWh of electricity and prevents 1.5 tons of carbon emissions.",
        "carbon_saved_kg_per_item": 0.085,
        "common_subtypes": ["PET (#1)", "HDPE (#2)", "PP (#5)", "LDPE film"],
        "hazardous_notes": None
    },
    "paper": {
        "category": "Paper",
        "detected_item_default": "Office paper, mail, or newsprint",
        "bin": "Dry Recyclable / Paper Bin",
        "recyclable": True,
        "disposal_instruction": "Ensure paper is clean and dry. Do NOT recycle if contaminated with food grease, pizza oils, or liquid spills.",
        "sustainability_tip": "Recycling one ton of paper saves 17 mature trees, 7,000 gallons of water, and 463 gallons of oil.",
        "carbon_saved_kg_per_item": 0.052,
        "common_subtypes": ["Office stationery", "Newspaper", "Envelopes", "Magazines"],
        "hazardous_notes": None
    },
    "cardboard": {
        "category": "Cardboard",
        "detected_item_default": "Corrugated box or packing carton",
        "bin": "Dry Recyclable / Cardboard Bin",
        "recyclable": True,
        "disposal_instruction": "Flatten boxes completely to conserve bin capacity. Strip off excessive plastic adhesive tape and foam packing inserts.",
        "sustainability_tip": "Corrugated cardboard fibers can be remanufactured and pulped 5 to 7 times into fresh shipping boxes.",
        "carbon_saved_kg_per_item": 0.120,
        "common_subtypes": ["Corrugated cardboard", "Paperboard cereal boxes", "Shipping cartons"],
        "hazardous_notes": None
    },
    "glass": {
        "category": "Glass",
        "detected_item_default": "Glass bottle or food jar",
        "bin": "Glass / Recyclable Bin",
        "recyclable": True,
        "disposal_instruction": "Rinse clean and remove metal lids (recycle lids in metal bin). Deposit gently into glass collection to avoid shattering.",
        "sustainability_tip": "Glass is 100% infinitely recyclable without any loss in clarity, strength, or chemical purity.",
        "carbon_saved_kg_per_item": 0.315,
        "common_subtypes": ["Clear flint glass", "Amber beverage bottles", "Green wine bottles"],
        "hazardous_notes": "Do not mix with pyrex, window panes, or ceramic mugs which have different melting temperatures."
    },
    "metal": {
        "category": "Metal",
        "detected_item_default": "Aluminum beverage can or tin food can",
        "bin": "Dry Recyclable / Metal Bin",
        "recyclable": True,
        "disposal_instruction": "Rinse out residual beverage or sauce. Lightly crush aluminum cans to conserve curbside bin space.",
        "sustainability_tip": "Recycling an aluminum can saves 95% of the energy needed to smelt new aluminum from raw bauxite ore.",
        "carbon_saved_kg_per_item": 0.190,
        "common_subtypes": ["Aluminum cans", "Steel/tin food cans", "Clean foil"],
        "hazardous_notes": None
    },
    "organic": {
        "category": "Organic",
        "detected_item_default": "Food scraps, fruit peels, or vegetable waste",
        "bin": "Wet / Organic Compost Bin",
        "recyclable": False,
        "disposal_instruction": "Deposit directly into your green wet organic bin or home composting unit. Never enclose in non-biodegradable plastic bags.",
        "sustainability_tip": "Composting organic waste diverts biomass from anaerobic landfill decomposition, eliminating potent methane emissions.",
        "carbon_saved_kg_per_item": 0.220,
        "common_subtypes": ["Fruit peels", "Vegetable scraps", "Coffee grounds", "Garden trimmings"],
        "hazardous_notes": None
    },
    "e_waste": {
        "category": "E-Waste",
        "detected_item_default": "Electronic cable, phone component, or circuit board",
        "bin": "Specialized E-Waste Drop-Off Depot",
        "recyclable": True,
        "disposal_instruction": "CRITICAL: Do NOT toss in household trash. Bring to an authorized municipal e-waste recycling depot or retailer take-back kiosk.",
        "sustainability_tip": "One metric ton of circuit boards contains 40 to 800 times more gold than one metric ton of raw mined ore.",
        "carbon_saved_kg_per_item": 0.750,
        "common_subtypes": ["Cables/chargers", "Circuit boards", "Smartphones", "Peripherals"],
        "hazardous_notes": "Contains heavy metals (lead, cadmium, mercury) that leach into aquifers if landfilled."
    },
    "hazardous": {
        "category": "Hazardous",
        "detected_item_default": "Battery, chemical container, or medical sharp",
        "bin": "Hazardous Material Collection Facility",
        "recyclable": False,
        "disposal_instruction": "SAFETY HAZARD: Do NOT put in regular trash or standard recycling bins. Tape battery terminals and transport to an approved hazardous waste drop-off.",
        "sustainability_tip": "Proper battery recovery recovers lithium, cobalt, and nickel while preventing spontaneous landfill friction fires.",
        "carbon_saved_kg_per_item": 0.450,
        "common_subtypes": ["Lithium-ion batteries", "Alkaline batteries", "Aerosol cans", "Solvents", "Sharps"],
        "hazardous_notes": "Fire hazard! Crushed lithium batteries ignite recycling sorting machinery."
    },
    "other": {
        "category": "Other",
        "detected_item_default": "Mixed or composite residual waste",
        "bin": "General Waste / Landfill Residual",
        "recyclable": False,
        "disposal_instruction": "Non-recyclable composite or contaminated material. Place in the black general waste bin for controlled landfill disposal.",
        "sustainability_tip": "Reduce future consumption of single-use composite materials by choosing refillable, durable alternatives.",
        "carbon_saved_kg_per_item": 0.000,
        "common_subtypes": ["Laminated pouches", "Chip packets", "Sanitary waste", "Broken ceramics"],
        "hazardous_notes": None
    }
}


def get_waste_metadata(
    category_key: str,
    confidence: float = 0.0,
    item_description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Retrieves full metadata and instructions for a waste class.
    Handles out-of-distribution or low-confidence fallbacks.
    """
    normalized_key = category_key.lower().replace("-", "_").replace(" ", "_")

    if normalized_key not in WASTE_KNOWLEDGE_BASE:
        normalized_key = "other"

    info = WASTE_KNOWLEDGE_BASE[normalized_key]

    return {
        "detected_item": item_description or info["detected_item_default"],
        "category": info["category"],
        "confidence": round(float(confidence), 1),
        "bin": info["bin"],
        "recyclable": info["recyclable"],
        "disposal_instruction": info["disposal_instruction"],
        "sustainability_tip": info["sustainability_tip"],
        "carbon_saved_kg": info["carbon_saved_kg_per_item"]
    }
