/**
 * Unified AI Matching & Recommendation Engine
 * Computes semantic, skill-based, and domain affinity scores between civic problems/projects
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

export interface MatchResult {
  score: number; // 0 to 100
  matchTier: 'HIGH' | 'MEDIUM' | 'GENERAL';
  reasons: string[];
}

// Domain keywords dictionary for heuristic skill/domain intersection
const DOMAIN_SKILL_MAP: Record<string, string[]> = {
  urban_infrastructure: ['civil', 'iot', 'gis', 'traffic', 'autocad', 'sensor', 'structural', 'robotics'],
  water_management: ['hydrology', 'sensor', 'iot', 'filtration', 'environmental', 'fluid', 'embedded', 'microcontroller'],
  clean_energy: ['solar', 'battery', 'electrical', 'power', 'grid', 'inverter', 'renewable', 'iot', 'ev'],
  waste_management: ['computer vision', 'ai', 'segregation', 'mechanical', 'automation', 'environmental', 'circular economy'],
  healthcare: ['biomedical', 'telemedicine', 'ai', 'data science', 'mobile app', 'bluetooth', 'sensor', 'diagnostics'],
  education: ['web', 'react', 'nextjs', 'mobile app', 'edtech', 'gamification', 'cloud', 'ai tutor'],
  agriculture: ['agritech', 'iot', 'drone', 'computer vision', 'weather', 'soil sensor', 'lora', 'satellite'],
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
