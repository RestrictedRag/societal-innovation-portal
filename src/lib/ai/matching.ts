/**
 * Unified AI Matching & Recommendation Engine
 * Computes semantic, skill-based, domain affinity, and industry-need scores between civic problems/projects
 * and student/faculty/corporate profiles, generating clear "Why this project?" explainability badges.
 */

export interface MatchProfile {
  role?: string;
  department?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  expertise?: string[] | null;
  preferredProjectType?: string | null;
}

export interface CompanyMatchProfile {
  companyName?: string | null;
  industry?: string | null;
  sector?: string | null;
  areasOfExpertise?: string[] | null;
  technologies?: string[] | null;
  csrInterests?: string[] | null;
  innovationInterests?: string[] | null;
  preferredDomains?: string[] | null;
  pilotLocations?: string[] | null;
  industryNeeds?: Array<{
    title: string;
    description: string;
    domain?: string | null;
    technology?: string[] | null;
  }>;
}

export interface TargetProject {
  id: string;
  title: string;
  description: string;
  domain: string | null;
  secondaryTags?: string[] | null;
  projectType?: string | null;
  trlLevel?: number | null;
  hasIndustryOffers?: boolean;
}

export interface TargetProblem {
  id: string;
  title: string;
  description: string;
  domain: string | null;
  category?: string | null;
  subcategory?: string | null;
  location?: string | null;
}

export interface MatchResult {
  score: number; // 0 to 100
  matchTier: 'HIGH' | 'MEDIUM' | 'GENERAL';
  reasons: string[];
}

// Domain keywords dictionary for heuristic skill/domain intersection
const DOMAIN_SKILL_MAP: Record<string, string[]> = {
  urban_infrastructure: ['civil', 'iot', 'gis', 'traffic', 'autocad', 'sensor', 'structural', 'robotics', 'smart city', 'roads'],
  water_management: ['hydrology', 'sensor', 'iot', 'filtration', 'environmental', 'fluid', 'embedded', 'microcontroller', 'water leakage', 'pipeline'],
  clean_energy: ['solar', 'battery', 'electrical', 'power', 'grid', 'inverter', 'renewable', 'iot', 'ev', 'microgrid'],
  waste_management: ['computer vision', 'ai', 'segregation', 'mechanical', 'automation', 'environmental', 'circular economy', 'recycling'],
  healthcare: ['biomedical', 'telemedicine', 'ai', 'data science', 'mobile app', 'bluetooth', 'sensor', 'diagnostics', 'health'],
  education: ['web', 'react', 'nextjs', 'mobile app', 'edtech', 'gamification', 'cloud', 'ai tutor'],
  agriculture: ['agritech', 'iot', 'drone', 'computer vision', 'weather', 'soil sensor', 'lora', 'satellite', 'irrigation'],
  disaster_management: ['alert', 'gis', 'satellite', 'flood model', 'drone', 'mesh network', 'emergency', 'sensors'],
  governance: ['blockchain', 'web', 'database', 'transparency', 'full stack', 'security', 'analytics'],
  financial_inclusion: ['fintech', 'upi', 'security', 'mobile payment', 'microfinance', 'cryptography', 'ledger'],
};

export function calculateProjectMatch(project: TargetProject, profile?: MatchProfile | null): MatchResult {
  if (!profile) {
    return {
      score: 50,
      matchTier: 'GENERAL',
      reasons: ['Regional civic challenge open for research teams'],
    };
  }

  let score = 40; // Base score
  const reasons: string[] = [];

  const projectDomain = (project.domain || '').toLowerCase();
  const projectText = `${project.title} ${project.description}`.toLowerCase();

  // 1. Department Alignment Check
  if (profile.department) {
    const dept = profile.department.toLowerCase();
    const isDeptRelevant =
      (dept.includes('computer') || dept.includes('it') || dept.includes('software')) &&
      (projectText.includes('software') || projectText.includes('ai') || projectText.includes('app') || projectText.includes('data') || projectDomain === 'education' || projectDomain === 'governance');

    const isHardwareRelevant =
      (dept.includes('electrical') || dept.includes('electronics') || dept.includes('iot')) &&
      (projectDomain === 'clean_energy' || projectText.includes('sensor') || projectText.includes('iot') || projectText.includes('power'));

    const isCivilRelevant =
      (dept.includes('civil') || dept.includes('environmental')) &&
      (projectDomain === 'urban_infrastructure' || projectDomain === 'water_management' || projectDomain === 'waste_management');

    const isAgriRelevant =
      dept.includes('agri') && projectDomain === 'agriculture';

    if (isDeptRelevant || isHardwareRelevant || isCivilRelevant || isAgriRelevant) {
      score += 25;
      reasons.push(`Department Focus: ${profile.department}`);
    }
  }

  // 2. Technical Skills Matching
  const userSkills = [...(profile.skills || []), ...(profile.expertise || [])].map((s) => s.toLowerCase());
  const domainSkills = DOMAIN_SKILL_MAP[projectDomain] || [];

  const matchedSkills = userSkills.filter(
    (skill) => domainSkills.some((ds) => ds.includes(skill) || skill.includes(ds)) || projectText.includes(skill),
  );

  if (matchedSkills.length > 0) {
    score += Math.min(matchedSkills.length * 10, 25);
    const topSkills = matchedSkills.slice(0, 2).map((s) => s.charAt(0).toUpperCase() + s.slice(1));
    reasons.push(`Skill Match: ${topSkills.join(', ')}`);
  }

  // 3. Research Interests Matching
  const userInterests = (profile.interests || []).map((i) => i.toLowerCase());
  const matchedInterests = userInterests.filter(
    (interest) => projectText.includes(interest) || projectDomain.includes(interest),
  );

  if (matchedInterests.length > 0) {
    score += 15;
    reasons.push(`Matches Your Interest: ${matchedInterests[0]}`);
  }

  // 4. Preferred Project Type Alignment
  if (profile.preferredProjectType && project.projectType) {
    if (profile.preferredProjectType === project.projectType) {
      score += 10;
      reasons.push(
        project.projectType === 'RESEARCH' ? 'Academic Research Project' : 'Practical Problem-Solving Project',
      );
    }
  }

  // 5. Industry Pilot Readiness
  if (project.hasIndustryOffers) {
    score += 5;
    reasons.push('Eligible for Industry Pilot Support');
  }

  // Cap score between 10 and 99
  const finalScore = Math.min(Math.max(score, 20), 98);

  let matchTier: 'HIGH' | 'MEDIUM' | 'GENERAL' = 'GENERAL';
  if (finalScore >= 75) {
    matchTier = 'HIGH';
  } else if (finalScore >= 55) {
    matchTier = 'MEDIUM';
  }

  if (reasons.length === 0) {
    reasons.push('Open for Multidisciplinary Innovation');
  }

  return {
    score: finalScore,
    matchTier,
    reasons: reasons.slice(0, 3),
  };
}

/**
 * Company-Facing Project Match Calculator
 * Matches university project against corporate capabilities, industry challenges, technologies, and CSR focus.
 */
export function calculateCompanyProjectMatch(
  project: TargetProject,
  companyProfile?: CompanyMatchProfile | null,
): MatchResult {
  if (!companyProfile) {
    return {
      score: 55,
      matchTier: 'GENERAL',
      reasons: ['Accredited university initiative open for industry collaboration'],
    };
  }

  let score = 42; // Base score
  const reasons: string[] = [];

  const projectDomain = (project.domain || '').toLowerCase();
  const projectText = `${project.title} ${project.description}`.toLowerCase();

  // 1. Industry Domain & Preferred Civic Domain match
  const preferredDomains = (companyProfile.preferredDomains || []).map((d) => d.toLowerCase());
  const csrInterests = (companyProfile.csrInterests || []).map((c) => c.toLowerCase());
  const companyIndustry = (companyProfile.industry || '').toLowerCase();

  const isDomainMatch =
    preferredDomains.some((d) => d.includes(projectDomain) || projectDomain.includes(d)) ||
    companyIndustry.includes(projectDomain) ||
    projectDomain.includes(companyIndustry);

  if (isDomainMatch) {
    score += 24;
    const formattedDomain = projectDomain.replace(/_/g, ' ');
    reasons.push(`${formattedDomain.charAt(0).toUpperCase() + formattedDomain.slice(1)} domain alignment`);
  }

  // 2. Technologies & Expertise Match
  const companyTech = [
    ...(companyProfile.technologies || []),
    ...(companyProfile.areasOfExpertise || []),
    ...(companyProfile.innovationInterests || []),
  ].map((t) => t.toLowerCase());

  const matchedTech: string[] = [];
  for (const tech of companyTech) {
    if (projectText.includes(tech) || (DOMAIN_SKILL_MAP[projectDomain] || []).includes(tech)) {
      matchedTech.push(tech);
    }
  }

  if (matchedTech.length > 0) {
    score += Math.min(matchedTech.length * 9, 22);
    const topTech = matchedTech.slice(0, 2).map((t) => t.toUpperCase());
    reasons.push(`${topTech.join(' & ')} technical synergy`);
  }

  // 3. Published Industry Needs Cross-Match
  if (companyProfile.industryNeeds && companyProfile.industryNeeds.length > 0) {
    const matchingNeed = companyProfile.industryNeeds.find((need) => {
      const needDomain = (need.domain || '').toLowerCase();
      const needText = `${need.title} ${need.description}`.toLowerCase();
      return (
        (needDomain && needDomain === projectDomain) ||
        (need.technology || []).some((tech) => projectText.includes(tech.toLowerCase())) ||
        needText.split(/\s+/).some((w) => w.length > 4 && projectText.includes(w))
      );
    });

    if (matchingNeed) {
      score += 20;
      reasons.push(`Directly solves your challenge: "${matchingNeed.title.slice(0, 32)}..."`);
    }
  }

  // 4. CSR Focus Alignment
  const matchedCsr = csrInterests.find((csr) => projectText.includes(csr) || projectDomain.includes(csr));
  if (matchedCsr) {
    score += 10;
    reasons.push(`CSR Priority: ${matchedCsr.charAt(0).toUpperCase() + matchedCsr.slice(1)}`);
  }

  // 5. TRL / Pilot Readiness Boost
  const trl = project.trlLevel || 1;
  if (trl >= 5) {
    score += 8;
    reasons.push(`Field-Tested (TRL ${trl}) — Ready for Enterprise Pilot`);
  } else if (trl >= 3) {
    score += 4;
    reasons.push(`Validated Proof-of-Concept (TRL ${trl})`);
  }

  const finalScore = Math.min(Math.max(score, 25), 98);

  let matchTier: 'HIGH' | 'MEDIUM' | 'GENERAL' = 'GENERAL';
  if (finalScore >= 75) {
    matchTier = 'HIGH';
  } else if (finalScore >= 55) {
    matchTier = 'MEDIUM';
  }

  if (reasons.length === 0) {
    reasons.push('High social impact innovation candidate');
  }

  return {
    score: finalScore,
    matchTier,
    reasons: reasons.slice(0, 3),
  };
}

/**
 * Company-Facing Citizen Problem Match Calculator
 */
export function calculateCompanyProblemMatch(
  problem: TargetProblem,
  companyProfile?: CompanyMatchProfile | null,
): MatchResult {
  if (!companyProfile) {
    return {
      score: 50,
      matchTier: 'GENERAL',
      reasons: ['Regional civic bottleneck awaiting public-private intervention'],
    };
  }

  let score = 40;
  const reasons: string[] = [];

  const domain = (problem.domain || '').toLowerCase();
  const text = `${problem.title} ${problem.description} ${problem.category || ''}`.toLowerCase();

  const preferredDomains = (companyProfile.preferredDomains || []).map((d) => d.toLowerCase());
  const companyTech = [...(companyProfile.technologies || []), ...(companyProfile.areasOfExpertise || [])].map((t) =>
    t.toLowerCase(),
  );

  if (preferredDomains.includes(domain)) {
    score += 28;
    reasons.push(`Domain focus: ${domain.replace(/_/g, ' ')}`);
  }

  const matchedTech = companyTech.filter((t) => text.includes(t) || (DOMAIN_SKILL_MAP[domain] || []).includes(t));
  if (matchedTech.length > 0) {
    score += Math.min(matchedTech.length * 10, 20);
    reasons.push(`Opportunity for ${matchedTech[0].toUpperCase()} solutions`);
  }

  if (companyProfile.pilotLocations && companyProfile.pilotLocations.length > 0) {
    const matchedLoc = companyProfile.pilotLocations.find(
      (loc) => text.includes(loc.toLowerCase()) || (problem.location || '').toLowerCase().includes(loc.toLowerCase()),
    );
    if (matchedLoc) {
      score += 15;
      reasons.push(`Located near your designated pilot testbed (${matchedLoc})`);
    }
  }

  const finalScore = Math.min(Math.max(score, 20), 96);
  let matchTier: 'HIGH' | 'MEDIUM' | 'GENERAL' = 'GENERAL';
  if (finalScore >= 70) {
    matchTier = 'HIGH';
  } else if (finalScore >= 50) {
    matchTier = 'MEDIUM';
  }

  if (reasons.length === 0) {
    reasons.push('Open community challenge suitable for CSR partnership');
  }

  return {
    score: finalScore,
    matchTier,
    reasons: reasons.slice(0, 3),
  };
}
