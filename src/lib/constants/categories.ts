/**
 * Extensible Category & Problem Type Architecture for CivicNexus
 */

export interface ProblemTypeDefinition {
  id: string;
  label: string;
  description: string;
  iconName: string;
  badgeColor: string;
}

export interface SubcategoryDefinition {
  id: string;
  label: string;
  description: string;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  domain: string;
  description: string;
  iconName: string;
  subcategories: SubcategoryDefinition[];
}

export const PROBLEM_TYPES: ProblemTypeDefinition[] = [
  {
    id: 'INFRASTRUCTURE',
    label: 'Public Infrastructure Failure',
    description: 'Damaged roads, bridges, water pipelines, streetlights, or civic structures.',
    iconName: 'Building2',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'SAFETY_HAZARD',
    label: 'Public Safety Hazard',
    description: 'Dangerous road intersections, exposed wires, structural decay, or fire risks.',
    iconName: 'AlertTriangle',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'SERVICE_DISRUPTION',
    label: 'Municipal Service Disruption',
    description: 'Interrupted water supply, persistent power cuts, delayed waste collection.',
    iconName: 'ZapOff',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'ENVIRONMENT',
    label: 'Environmental & Ecological Issue',
    description: 'Industrial effluent runoff, air pollution hotspots, lake contamination.',
    iconName: 'Trees',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'SANITATION',
    label: 'Sanitation & Waste Crisis',
    description: 'Garbage dumping, blocked open drains, untreated sewage overflows.',
    iconName: 'Trash2',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    id: 'RESOURCE_SHORTAGE',
    label: 'Community Resource Shortage',
    description: 'Lack of drinking water access, medical clinic supplies, or school facilities.',
    iconName: 'Droplets',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'ACCESSIBILITY',
    label: 'Universal Accessibility Issue',
    description: 'Missing ramps, broken tactile paths, inaccessible public transport for disabled citizens.',
    iconName: 'Accessibility',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'OTHER',
    label: 'Other Civic & Societal Concern',
    description: 'Any systemic problem requiring engineering innovation or civic attention.',
    iconName: 'HelpCircle',
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
  },
];

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'transport_traffic',
    label: 'Transport & Traffic',
    domain: 'urban_infrastructure',
    description: 'Road conditions, transit networks, traffic congestion, and pedestrian safety.',
    iconName: 'Car',
    subcategories: [
      { id: 'road_damage', label: 'Potholes & Road Damage', description: 'Cracked pavement, sinkholes, unpaved stretches.' },
      { id: 'traffic_signals', label: 'Traffic Signals & Signage', description: 'Malfunctioning lights, missing zebra crossings.' },
      { id: 'public_transit', label: 'Public Transit Bottlenecks', description: 'Bus stop conditions, transit delays, overcrowding.' },
      { id: 'parking_congestion', label: 'Parking & Encroachment', description: 'Illegal roadside parking blocking thoroughfares.' },
      { id: 'pedestrian_safety', label: 'Pedestrian Pathways & Footpaths', description: 'Broken sidewalks, missing overbridges.' },
    ],
  },
  {
    id: 'water_sanitation',
    label: 'Water & Sanitation',
    domain: 'water_management',
    description: 'Drinking water distribution, drainage systems, water quality, and sewage.',
    iconName: 'Droplet',
    subcategories: [
      { id: 'water_supply_leak', label: 'Pipeline Leakage & Low Pressure', description: 'Broken mains, irregular water delivery.' },
      { id: 'water_contamination', label: 'Water Contamination & Quality', description: 'Discolored, turbid, or foul-smelling tap water.' },
      { id: 'drainage_overflow', label: 'Drainage & Stormwater Overflow', description: 'Waterlogging during monsoons, blocked culverts.' },
      { id: 'sewage_backflow', label: 'Sewage Backflow & Open Manholes', description: 'Hazardous uncovered drains, untreated sewage.' },
    ],
  },
  {
    id: 'waste_management',
    label: 'Waste Management',
    domain: 'waste_management',
    description: 'Garbage disposal, recycling logistics, landfill containment, and hazardous waste.',
    iconName: 'Trash',
    subcategories: [
      { id: 'garbage_accumulation', label: 'Illegal Garbage Dumping', description: 'Piles of uncollected residential or market waste.' },
      { id: 'hazardous_waste', label: 'Industrial & Bio-Hazardous Waste', description: 'Chemical runoff, untreated medical waste.' },
      { id: 'plastic_litter', label: 'Plastic Litter & Micro-pollutants', description: 'Plastic choking natural waterways and drains.' },
      { id: 'collection_delay', label: 'Irregular Door-to-Door Collection', description: 'Municipal collection trucks missing scheduled routes.' },
    ],
  },
  {
    id: 'agriculture_farming',
    label: 'Agriculture & Food Systems',
    domain: 'agriculture',
    description: 'Irrigation canals, crop disease monitoring, cold storage, and soil health.',
    iconName: 'Wheat',
    subcategories: [
      { id: 'irrigation_canal', label: 'Irrigation Canal & Feeder Failure', description: 'Silted channels, broken sluice gates, water shortages.' },
      { id: 'crop_pest_disease', label: 'Regional Crop Pest Outbreak', description: 'Locusts, fungal blight affecting local farmlands.' },
      { id: 'cold_storage_loss', label: 'Harvest Spoilage & Storage Lack', description: 'Lack of accessible solar cooling for perishable crops.' },
      { id: 'soil_salinity', label: 'Soil Salinity & Fertilizer Degradation', description: 'Degraded agricultural soil requiring intervention.' },
    ],
  },
  {
    id: 'clean_energy',
    label: 'Electricity & Clean Energy',
    domain: 'clean_energy',
    description: 'Power grid reliability, voltage stability, streetlights, and solar adoption.',
    iconName: 'Zap',
    subcategories: [
      { id: 'frequent_blackouts', label: 'Frequent Outages & Voltage Fluctuations', description: 'Transformer overload, electrical surges damaging appliances.' },
      { id: 'streetlight_failure', label: 'Dark Stretches & Streetlight Failure', description: 'Non-functional streetlights creating safety hazards.' },
      { id: 'overhead_wire_danger', label: 'Hanging / Exposed High-Tension Cables', description: 'Unsafe live wires dangling near public walkways.' },
      { id: 'microgrid_demand', label: 'Off-Grid Renewable Energy Need', description: 'Rural areas needing solar mini-grids or storage solutions.' },
    ],
  },
  {
    id: 'healthcare',
    label: 'Public Health & Healthcare',
    domain: 'healthcare',
    description: 'Primary health centers, disease vector monitoring, emergency accessibility.',
    iconName: 'HeartPulse',
    subcategories: [
      { id: 'clinic_shortage', label: 'Primary Clinic Staff / Equipment Lack', description: 'Lack of diagnostic kits, cold-chain refrigeration.' },
      { id: 'vector_disease', label: 'Mosquito Breeding & Vector Outbreak', description: 'Stagnant pools causing malaria/dengue flare-ups.' },
      { id: 'ambulance_access', label: 'Emergency Vehicle Inaccessibility', description: 'Narrow or broken lanes preventing ambulance entry.' },
    ],
  },
  {
    id: 'education',
    label: 'Education & Digital Access',
    domain: 'education',
    description: 'Government school infrastructure, digital connectivity, STEM lab access.',
    iconName: 'GraduationCap',
    subcategories: [
      { id: 'school_infrastructure', label: 'School Building Safety & Sanitation', description: 'Leaking roofs, lack of functional pupil toilets.' },
      { id: 'digital_divide', label: 'Internet & Computer Lab Deprivation', description: 'Rural schools lacking digital learning resources.' },
      { id: 'accessibility_learning', label: 'Special Needs Learning Support', description: 'Lack of assistive technology for disabled students.' },
    ],
  },
  {
    id: 'disaster_safety',
    label: 'Disaster Management & Public Safety',
    domain: 'disaster_management',
    description: 'Flood preparedness, landslide protection, structural fire vulnerability.',
    iconName: 'ShieldAlert',
    subcategories: [
      { id: 'flood_vulnerability', label: 'Monsoon Flooding & Inundation', description: 'Low-lying settlements lacking flood barriers.' },
      { id: 'landslide_erosion', label: 'Hill Slope Erosion & Rockfall Hazard', description: 'Unreinforced slopes threatening road and housing safety.' },
      { id: 'fire_hazard', label: 'Dense Settlement Fire Vulnerability', description: 'Lack of fire hydrants and emergency escape passages.' },
    ],
  },
  {
    id: 'governance',
    label: 'Civic Governance & Municipal Services',
    domain: 'governance',
    description: 'Public records, billing discrepancies, transparency, licensing bottlenecks.',
    iconName: 'Landmark',
    subcategories: [
      { id: 'billing_discrepancy', label: 'Water / Power Billing Anomalies', description: 'Faulty automated metering affecting local colonies.' },
      { id: 'civic_transparency', label: 'Public Project Delay & Stagnation', description: 'Unfinished municipal works abandoned mid-way.' },
      { id: 'community_registry', label: 'Digital Grievance Tracking Failure', description: 'Unresponsive local administrative channels.' },
    ],
  },
  {
    id: 'accessibility',
    label: 'Universal Accessibility & Inclusion',
    domain: 'urban_infrastructure',
    description: 'Accessibility for persons with disabilities, elderly citizens, and children.',
    iconName: 'Accessibility',
    subcategories: [
      { id: 'wheelchair_inaccessible', label: 'Missing Wheelchair Ramps at Public Hubs', description: 'Hospitals, bus depots without ramp access.' },
      { id: 'tactile_path_broken', label: 'Broken Tactile Paths for the Visually Impaired', description: 'Missing guiding tiles on public walkways.' },
      { id: 'public_restroom_access', label: 'Inaccessible Public Restrooms', description: 'Absence of barrier-free restrooms in civic centers.' },
    ],
  },
];

export function getCategoryById(id: string): CategoryDefinition | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getDomainForCategory(categoryId: string): string {
  const cat = getCategoryById(categoryId);
  return cat ? cat.domain : 'urban_infrastructure';
}
