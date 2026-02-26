function getTradeKnowledge(category: string): string {
  const normalized = category.toLowerCase().trim();

  if (normalized === "plumbing") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Pipe materials: PEX, copper, PVC, CPVC (specify diameter and length)
- Fixtures: toilets, faucets, water heaters, garbage disposals, shower valves, tub/shower trim, supply stops
- Fittings: elbows, tees, couplings, adapters, shut-off valves, ball valves, unions
- Consumables: solder, flux, Teflon tape, pipe dope, primer, pipe cleaner/sandcloth, silicone caulk
- Fasteners & supports: pipe straps, hangers, pipe supports, blocking
- Code compliance: permits, rough-in inspections, final inspections, backflow preventers, expansion tanks, earthquake straps
</trade_knowledge>`;
  }

  if (normalized === "electrical") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Wire & cable: Romex NM-B (12/2, 14/2, 12/3), THHN, conduit wire (specify gauge and length)
- Conduit: EMT, PVC conduit, flex conduit (specify diameter and length), conduit fittings, connectors, straps
- Devices & fixtures: outlets (15A/20A, GFCI, AFCI), switches (single-pole, 3-way, dimmer), light fixtures, ceiling fan boxes, junction boxes
- Panels & breakers: circuit breakers (specify amperage), sub-panel, main panel components, bus bars, neutral/ground bars
- Consumables: wire nuts, electrical tape, cable staples, pull string, pulling lubricant, anti-oxidant paste
- Code compliance: electrical permit, rough-in inspection, final inspection, arc-fault protection, tamper-resistant devices
</trade_knowledge>`;
  }

  if (normalized === "hvac") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Equipment: furnace, air handler, condenser/heat pump, coil, thermostat (specify tonnage/BTU/SEER rating)
- Ductwork: sheet metal duct (supply/return, specify size), flex duct, duct board, plenum, transitions, boots
- Refrigerant lines: copper line set (liquid and suction, specify diameter and length), line set insulation, line set cover
- Fittings & hardware: duct connectors, takeoffs, dampers, registers, grilles, filter base, duct tape/mastic
- Consumables: refrigerant (specify type and lbs), brazing alloy, nitrogen, pipe insulation, zip ties, sheet metal screws
- Code compliance: mechanical permit, rough-in inspection, startup commissioning, equipment startup checklist
</trade_knowledge>`;
  }

  if (
    normalized === "carpentry" ||
    normalized === "framing" ||
    normalized === "carpentry/framing"
  ) {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Dimensional lumber: 2x4, 2x6, 2x8, 2x10, 2x12, LVL beams (specify species, grade, length)
- Sheet goods: OSB sheathing, plywood (specify thickness), subfloor panels
- Hardware: joist hangers, hurricane ties, post bases, lag bolts, structural screws, nails (specify type and size)
- Trim & finish: baseboard, door/window casing, crown molding, door jambs (specify profile and linear feet)
- Fasteners & consumables: framing nails, construction adhesive, sill seal, shims, blocking
- Code compliance: building permit, framing inspection, structural engineer letter (if applicable)
</trade_knowledge>`;
  }

  if (normalized === "painting") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Paint: interior/exterior primer, finish coats (specify sheen — flat, eggshell, satin, semi-gloss), gallons per coat
- Surface prep materials: spackle, joint compound, sanding mesh/paper (specify grit), TSP cleaner, caulk
- Application tools: roller covers (specify nap), roller frames, brushes (specify size), paint trays, liners
- Masking & protection: painter's tape, drop cloths, plastic sheeting, masking film
- Specialty coatings: stain-blocking primer, mold/mildew resistant paint, exterior elastomeric (as applicable)
- Code compliance: no permit typically required; note VOC compliance if applicable
</trade_knowledge>`;
  }

  if (normalized === "roofing") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Roofing material: shingles (specify type — 3-tab, architectural, impact-resistant; square count), tile, metal panels
- Underlayment: felt paper (15# or 30#), synthetic underlayment, ice & water shield (specify squares)
- Decking: OSB or plywood sheathing (if re-decking, specify thickness and square footage)
- Flashing: step flashing, counter flashing, valley flashing, drip edge (specify metal type and linear feet)
- Ridge & ventilation: ridge cap shingles, ridge vent, box vents, soffit vents
- Fasteners & consumables: roofing nails, roofing staples, plastic cap nails, roofing caulk, roof cement
- Code compliance: roofing permit, final inspection, manufacturer warranty registration
</trade_knowledge>`;
  }

  if (normalized === "flooring") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Flooring material: hardwood (specify species and width), LVP/LVT, laminate, tile (ceramic/porcelain), carpet (specify square yards), sheet vinyl
- Subfloor prep: self-leveling compound, plywood underlayment (specify thickness), cement board, vapor barrier
- Setting materials: thin-set mortar, floor adhesive, trowel notch size, grout (specify type and color)
- Transitions & trim: T-molding, reducer, end cap, stair nose, baseboard/shoe molding (linear feet)
- Fasteners & consumables: flooring staples/cleats, underlayment foam, seam tape, tile spacers, grout sealer
- Code compliance: no permit typically required; note moisture testing or subfloor deflection checks if applicable
</trade_knowledge>`;
  }

  if (
    normalized === "general renovation" ||
    normalized === "general" ||
    normalized === "remodel"
  ) {
    return `<trade_knowledge>
Be COMPREHENSIVE. This is a general renovation — scope may span multiple trades. Include ALL of the following categories as appropriate:

- Demolition: selective demo, haul-away, dumpster rental, dust protection
- Structural: framing lumber, LVL beams, blocking, hardware
- Rough trades: plumbing rough-in, electrical rough-in, HVAC rough-in (itemize by trade as sub-sections)
- Sheathing & insulation: OSB, drywall, batt insulation, rigid foam, vapor barrier
- Finish work: drywall mud/tape, paint, trim, doors, hardware
- Fixtures & appliances: plumbing fixtures, electrical devices/fixtures, HVAC registers
- Code compliance: building permit, trade-specific permits, final inspection, certificate of occupancy
</trade_knowledge>`;
  }

  if (
    normalized === "concrete" ||
    normalized === "masonry" ||
    normalized === "concrete/masonry"
  ) {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Concrete: ready-mix concrete (specify PSI and cubic yards), bagged concrete mix (specify bag weight and count), fiber mesh, rebar (specify diameter and linear feet), wire mesh
- Forms & forming: form lumber, form stakes, form oil, snap ties, wedge bolts
- Masonry units: CMU block (specify size), brick, pavers (specify square footage)
- Mortar & grout: mortar mix, masonry sand, grout, tuck-point mortar
- Reinforcement: rebar, masonry ties, anchor bolts, expansion anchors
- Finishing: concrete sealer, broom finish tools, edger, control joint saw cuts
- Code compliance: building permit, footing/slab inspection, structural plans (if applicable)
</trade_knowledge>`;
  }

  if (normalized === "drywall") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Drywall board: 1/2" or 5/8" Type X drywall, moisture-resistant greenboard, cement board (specify sheet count and square footage)
- Fasteners: drywall screws (specify length), nails, corner bead (metal or vinyl, linear feet)
- Finishing compounds: all-purpose joint compound, setting compound (hot mud), lightweight topping compound
- Tape & mesh: paper tape, fiberglass mesh tape, corner bead tape
- Consumables: sanding mesh/paper (specify grit), primer (drywall/PVA), texture materials (if applicable)
- Tools/equipment: stilts or lift rental (if ceiling work)
- Code compliance: no permit typically required; note fire-rating requirements if applicable
</trade_knowledge>`;
  }

  if (normalized === "siding") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Siding material: LP SmartSide, fiber cement (HardiePlank), vinyl siding, wood siding (specify profile and square footage)
- Sheathing & WRB: house wrap (Tyvek or equivalent), zip system, OSB sheathing (specify square footage)
- Trim & accessories: corner trim, J-channel, starter strip, frieze board, fascia, soffit (linear feet)
- Fasteners: siding nails (specify type — hot-dip galvanized, stainless), screws, hidden fasteners
- Flashing & caulk: window/door flashing tape, sill pan flashing, paintable caulk, sealant
- Code compliance: building permit, weather-resistant barrier inspection (if applicable)
</trade_knowledge>`;
  }

  if (normalized === "landscaping") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Plants & materials: trees (specify caliper), shrubs, perennials, sod (specify square feet), seed, mulch (cubic yards), gravel/rock
- Hardscape: pavers, stepping stones, edging (metal or plastic), retaining wall block (specify square footage)
- Irrigation: drip emitters, spray heads, lateral line (PVC or poly, specify diameter and linear feet), valves, controller
- Soil & amendments: topsoil (cubic yards), compost, soil amendment, fertilizer
- Drainage: French drain pipe (specify diameter and linear feet), drain rock, filter fabric
- Equipment rental: sod cutter, mini-excavator, bobcat (if grading involved)
- Code compliance: grading/drainage permit (if applicable), irrigation backflow preventer
</trade_knowledge>`;
  }

  if (normalized === "fencing") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Posts: wood posts (specify species and size), steel posts, post caps (linear count)
- Fencing material: wood pickets (specify species, size, and linear feet), chain link fabric, vinyl panels, wire mesh
- Rails: top rail, mid rail, bottom rail (specify material and linear feet)
- Hardware: post brackets, fence clips, tension bands, brace bands, carriage bolts, fence staples
- Concrete: post-set concrete (specify bags per post), quick-set concrete mix
- Gates: gate frame, gate hinges, latch hardware, gate wheel (if heavy gate)
- Code compliance: fence permit (if required by municipality), HOA approval (note if applicable)
</trade_knowledge>`;
  }

  if (normalized === "demolition" || normalized === "demo") {
    return `<trade_knowledge>
Be COMPREHENSIVE. Do not omit any materials or labor. Include ALL of the following categories as appropriate:

- Waste removal: dumpster rental (specify size and rental duration), haul-away trips, landfill tipping fees
- Selective demo: hand demo tools, reciprocating saw blades, demo blades, pry bars
- Protection: dust barriers (plastic sheeting, zip wall system), floor protection, negative air pressure machine
- Hazmat: asbestos test kit or abatement (if pre-1980 materials), lead test kit (if pre-1978 paint)
- Structural shoring: temporary wall shoring materials, lally columns (if applicable)
- Recycling: salvage/recycling hauling, material sorting for diversion (if applicable)
- Code compliance: demo permit, asbestos/lead clearance documentation (if applicable)
</trade_knowledge>`;
  }

  // Generic fallback for unknown trade categories
  return `<trade_knowledge>
Be COMPREHENSIVE for this ${category} project. Do not omit any materials or labor. Include ALL of the following categories as appropriate to this trade:

- Primary materials: the core materials specific to ${category} work (specify type, size, and quantity)
- Secondary materials: supporting materials, fasteners, adhesives, consumables, sealants
- Hardware & accessories: brackets, connectors, trim pieces, specialty components
- Equipment rental: any specialized tools or equipment needed for this trade (if applicable)
- Code compliance: applicable permits, inspections, code-required components for ${category} work in a residential setting
</trade_knowledge>`;
}

export function getScopePrompt(tradeCategory: string): string {
  return `<role>
You are an expert residential construction estimator with 20+ years of field experience across all trades. Your job is to decompose a project description into a comprehensive, structured scope of work with detailed line items appropriate to the trade.
</role>

<instructions>
Organize line items into logical sections appropriate for a ${tradeCategory} project. Use 3–6 sections that reflect the natural phases of the work. Common patterns include:

- A "Demo & Prep" or "Site Preparation" section first (if demolition or prep work is needed)
- One or more trade-specific installation or construction phases in the middle
- A "Testing, Inspection & Cleanup" or "Punch List" section last (if applicable)

Name the sections based on what makes sense for the ${tradeCategory} trade — do not use generic section names that don't match the work being done.

For each section:
- Provide all line items with a clear description, quantity, and unit of measure.
- Do NOT include unit costs or pricing — pricing is handled by a separate step.
- Be specific in descriptions: include size, diameter, material type, and grade where relevant.

For each line item, assign a category:
- "material" — physical materials (products, components, consumables, fasteners)
- "labor" — installation work, demolition, testing, cleanup
- "equipment" — tool/equipment rental (specify what equipment)
- "permit" — permits, inspections, code compliance fees
- "other" — anything that doesn't fit the above

Separate material and labor into distinct line items. For example:
- A physical product (pipe, lumber, shingles, wire, paint) → category: material
- Installation or demolition work → category: labor
- A permit or inspection fee → category: permit

For each item, optionally provide a pricing_hint to guide downstream pricing lookup:
- "material" — standalone material, price by unit (e.g., "3/4 copper pipe", "2x4 stud")
- "assembly" — bundled material + labor item, price as installed unit (e.g., "install toilet", "hang door")
- "labor_rate" — trade labor priced by the hour (e.g., "plumbing rough-in labor", "electrician labor")
- "skip" — not priceable in a database, keep AI estimate (e.g., "building permit", "site cleanup")
Use your judgment: most material items should hint "material", most labor items should hint "labor_rate" or "assembly" (if the labor is tied to a specific installation), and permits should hint "skip".

For each section, also provide estimated labor_hours — the total crew-hours needed for that section's work.

Include a confidence score between 0 and 1 reflecting how well-specified the project description is:
- 0.9–1.0: very detailed description with specific products, sizes, and scope clearly defined
- 0.6–0.8: moderate detail, scope is reasonably clear but some assumptions required
- 0.3–0.5: vague description requiring significant inference
- 0.0–0.2: extremely vague, unable to estimate reliably
</instructions>

${getTradeKnowledge(tradeCategory)}

<output_format>
Output must be valid JSON matching the provided schema exactly. Do not wrap in markdown code fences.
</output_format>`;
}

export function buildUserPrompt(context: {
  description: string;
  zipCode: string;
  category: string;
  address: string;
}): string {
  const lines: string[] = [
    `Project Description: ${context.description}`,
    `Trade Category: ${context.category}`,
    `ZIP Code: ${context.zipCode}`,
  ];

  if (context.address) {
    lines.push(`Job Site Address: ${context.address}`);
  }

  lines.push("");
  lines.push(
    "Decompose this project into a comprehensive scope of work with all materials, labor, and code compliance items.",
  );

  return lines.join("\n");
}
