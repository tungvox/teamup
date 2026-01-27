export type Tier = 
  | 'bronze' 
  | 'silver' 
  | 'gold' 
  | 'platinum' 
  | 'diamond' 
  | 'master' 
  | 'grandmaster' 
  | 'challenger';

export interface TierInfo {
  name: Tier;
  displayName: string;
  minScore: number;
  maxScore: number;
  colors: {
    primary: string;
    secondary: string;
    border: string;
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    text: string;
  };
}

export const TIERS: Record<Tier, TierInfo> = {
  bronze: {
    name: 'bronze',
    displayName: 'Bronze',
    minScore: 0,
    maxScore: 200,
    colors: {
      primary: '#CD7F32',
      secondary: '#8B4513',
      border: '#CD7F32',
      gradientFrom: '#8B4513',
      gradientVia: '#CD7F32',
      gradientTo: '#D4A574',
      text: '#FFF8DC',
    },
  },
  silver: {
    name: 'silver',
    displayName: 'Silver',
    minScore: 200,
    maxScore: 400,
    colors: {
      primary: '#C0C0C0',
      secondary: '#808080',
      border: '#C0C0C0',
      gradientFrom: '#808080',
      gradientVia: '#C0C0C0',
      gradientTo: '#E8E8E8',
      text: '#2C2C2C',
    },
  },
  gold: {
    name: 'gold',
    displayName: 'Gold',
    minScore: 400,
    maxScore: 600,
    colors: {
      primary: '#FFD700',
      secondary: '#FFA500',
      border: '#FFD700',
      gradientFrom: '#FFA500',
      gradientVia: '#FFD700',
      gradientTo: '#FFE55C',
      text: '#1A1A1A',
    },
  },
  platinum: {
    name: 'platinum',
    displayName: 'Platinum',
    minScore: 600,
    maxScore: 800,
    colors: {
      primary: '#E5E4E2',
      secondary: '#BCC6CC',
      border: '#E5E4E2',
      gradientFrom: '#BCC6CC',
      gradientVia: '#E5E4E2',
      gradientTo: '#F5F5F5',
      text: '#1A1A1A',
    },
  },
  diamond: {
    name: 'diamond',
    displayName: 'Diamond',
    minScore: 800,
    maxScore: 1000,
    colors: {
      primary: '#B9F2FF',
      secondary: '#00CED1',
      border: '#B9F2FF',
      gradientFrom: '#00CED1',
      gradientVia: '#B9F2FF',
      gradientTo: '#E0F7FA',
      text: '#003D4D',
    },
  },
  master: {
    name: 'master',
    displayName: 'Master',
    minScore: 1000,
    maxScore: 1200,
    colors: {
      primary: '#9370DB',
      secondary: '#8A2BE2',
      border: '#9370DB',
      gradientFrom: '#8A2BE2',
      gradientVia: '#9370DB',
      gradientTo: '#BA55D3',
      text: '#FFFFFF',
    },
  },
  grandmaster: {
    name: 'grandmaster',
    displayName: 'Grandmaster',
    minScore: 1200,
    maxScore: 1500,
    colors: {
      primary: '#FF6B6B',
      secondary: '#DC143C',
      border: '#FF6B6B',
      gradientFrom: '#DC143C',
      gradientVia: '#FF6B6B',
      gradientTo: '#FF8C94',
      text: '#FFFFFF',
    },
  },
  challenger: {
    name: 'challenger',
    displayName: 'Challenger',
    minScore: 1500,
    maxScore: Infinity,
    colors: {
      primary: '#FFD700',
      secondary: '#FFA500',
      border: '#FFD700',
      gradientFrom: '#1A1A1A',
      gradientVia: '#FFD700',
      gradientTo: '#FFA500',
      text: '#000000',
    },
  },
};

/**
 * Calculate skill score (0-100)
 */
function getSkillScore(skill: string | null | undefined): number {
  if (!skill) return 0;
  switch (skill) {
    case 'newbie':
      return 20;
    case 'intermediate':
      return 50;
    case 'advanced':
      return 80;
    default:
      return 0;
  }
}

/**
 * Calculate satisfaction score (0-100)
 */
function getSatisfactionScore(satisfaction: string | null | undefined): number {
  if (!satisfaction) return 0;
  switch (satisfaction) {
    case 'bad':
      return 20;
    case 'ok':
      return 50;
    case 'great':
      return 80;
    default:
      return 0;
  }
}

/**
 * Calculate matches score (0-100, capped at 100)
 */
function getMatchesScore(matches: number): number {
  // Matches contribute up to 100 points
  // 0 matches = 0 points
  // 50+ matches = 100 points (capped)
  return Math.min(matches * 2, 100);
}

/**
 * Calculate tier score based on skill, satisfaction, and matches
 * Total possible score: 280 (80 + 80 + 100 + 20 bonus for reliability)
 */
export function calculateTierScore(
  skill: string | null | undefined,
  satisfaction: string | null | undefined,
  matches: number,
  reliability: number = 100
): number {
  const skillScore = getSkillScore(skill);
  const satisfactionScore = getSatisfactionScore(satisfaction);
  const matchesScore = getMatchesScore(matches);
  
  // Reliability bonus (0-20 points)
  const reliabilityBonus = (reliability / 100) * 20;
  
  // Total score: 0-280
  const totalScore = skillScore + satisfactionScore + matchesScore + reliabilityBonus;
  
  return Math.round(totalScore);
}

/**
 * Get tier based on score
 */
export function getTierFromScore(score: number): Tier {
  if (score >= TIERS.challenger.minScore) return 'challenger';
  if (score >= TIERS.grandmaster.minScore) return 'grandmaster';
  if (score >= TIERS.master.minScore) return 'master';
  if (score >= TIERS.diamond.minScore) return 'diamond';
  if (score >= TIERS.platinum.minScore) return 'platinum';
  if (score >= TIERS.gold.minScore) return 'gold';
  if (score >= TIERS.silver.minScore) return 'silver';
  return 'bronze';
}

/**
 * Calculate tier from user data
 */
export function calculateTier(
  skill: string | null | undefined,
  satisfaction: string | null | undefined,
  matches: number,
  reliability: number = 100
): Tier {
  const score = calculateTierScore(skill, satisfaction, matches, reliability);
  return getTierFromScore(score);
}

/**
 * Get tier info
 */
export function getTierInfo(tier: Tier): TierInfo {
  return TIERS[tier];
}

/**
 * Get tier progress percentage (0-100)
 */
export function getTierProgress(score: number, tier: Tier): number {
  const tierInfo = TIERS[tier];
  const tierRange = tierInfo.maxScore - tierInfo.minScore;
  const scoreInTier = score - tierInfo.minScore;
  
  if (tierRange === Infinity || tierRange === 0) {
    return tier === 'challenger' ? 100 : 0;
  }
  
  return Math.min(Math.max((scoreInTier / tierRange) * 100, 0), 100);
}
