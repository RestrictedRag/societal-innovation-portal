/**
 * Official Government Grievance & Reporting Portals Directory
 * Purpose: Provide citizens with verified official regulatory reporting portals
 * categorized by municipal and governmental domains.
 */

export interface GovernmentPortalLink {
  id: string;
  category: string;
  departmentName: string;
  portalName: string;
  url: string;
  description: string;
  helpline?: string;
  isNational: boolean;
}

export const GOVERNMENT_PORTALS: GovernmentPortalLink[] = [
  {
    id: 'cpgrams_central',
    category: 'all',
    departmentName: 'Department of Administrative Reforms and Public Grievances (DARPG)',
    portalName: 'CPGRAMS Centralized Public Grievance Redress System',
    url: 'https://pgportal.gov.in',
    description: 'National portal for lodging grievances against any Central Ministries, Departments, or State Government bodies.',
    helpline: '1800-11-4000',
    isNational: true,
  },
  {
    id: 'morth_roads',
    category: 'transport_traffic',
    departmentName: 'Ministry of Road Transport and Highways (MoRTH)',
    portalName: 'NHAI / MoRTH Citizen Grievance Portal',
    url: 'https://morth.nic.in',
    description: 'Official reporting for national highways, road damage, toll disputes, and traffic safety hazards.',
    helpline: '1033 (National Highway Helpline)',
    isNational: true,
  },
  {
    id: 'swachh_bharat',
    category: 'waste_management',
    departmentName: 'Ministry of Housing and Urban Affairs (MoHUA)',
    portalName: 'Swachhata Citizen App & Portal',
    url: 'https://swachhbharaturban.gov.in',
    description: 'Direct municipal reporting for garbage dumping, overflowing dustbins, and unsanitary civic conditions.',
    helpline: '1969',
    isNational: true,
  },
  {
    id: 'jal_jeevan',
    category: 'water_sanitation',
    departmentName: 'Department of Drinking Water and Sanitation (Jal Shakti)',
    portalName: 'Jal Jeevan Mission Citizen Portal',
    url: 'https://jaljeevanmission.gov.in',
    description: 'Official reporting for drinking water supply disruptions, pipeline leaks, and community water quality issues.',
    helpline: '1800-180-1551',
    isNational: true,
  },
  {
    id: 'cpcb_sameer',
    category: 'environment',
    departmentName: 'Central Pollution Control Board (CPCB)',
    portalName: 'SAMEER National Air Quality & Pollution Redressal',
    url: 'https://cpcb.nic.in',
    description: 'Official portal for air pollution monitoring, industrial emission violations, and waste burning complaints.',
    helpline: '011-43102030',
    isNational: true,
  },
  {
    id: 'national_power_portal',
    category: 'clean_energy',
    departmentName: 'Ministry of Power (MoP)',
    portalName: 'National Power Portal & Consumer Grievance System',
    url: 'https://npp.gov.in',
    description: 'Electricity supply issues, hazardous overhead cables, transmission outages, and solar subsidy queries.',
    helpline: '1912 (Electricity Helpline)',
    isNational: true,
  },
  {
    id: 'kisan_portal',
    category: 'agriculture_farming',
    departmentName: 'Ministry of Agriculture & Farmers Welfare',
    portalName: 'Kisan Portal & Farmer Grievance Redressal',
    url: 'https://agricoop.nic.in',
    description: 'Irrigation schemes, crop damage compensation (PMFBY), fertilizer quality, and pest advisories.',
    helpline: '1800-180-1551 (Kisan Call Centre)',
    isNational: true,
  },
  {
    id: 'national_health_portal',
    category: 'healthcare',
    departmentName: 'Ministry of Health and Family Welfare (MoHFW)',
    portalName: 'National Health Portal & ABHA Support',
    url: 'https://www.nhp.gov.in',
    description: 'Reporting public healthcare clinic shortages, medical equipment lack, and epidemic outbreaks.',
    helpline: '1075 / 108',
    isNational: true,
  },
];

export function getGovernmentPortalsByCategory(category: string): GovernmentPortalLink[] {
  if (!category || category === 'all') {
    return GOVERNMENT_PORTALS;
  }
  return GOVERNMENT_PORTALS.filter((p) => p.category === category || p.category === 'all');
}
