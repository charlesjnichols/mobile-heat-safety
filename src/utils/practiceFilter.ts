import { Team, Practice } from '../types';
import { getHeatRisk, HEAT_THRESHOLDS } from './heatIndex';

// Type definitions for risk levels
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

// Helper function to determine heat index risk level
export function getHeatIndexRiskLevel(heatIndex: number): RiskLevel {
  return getHeatRisk(heatIndex);
}

// Helper function to get heat index color
export function getHeatIndexColor(heatIndex: number): string {
  const riskLevel = getHeatIndexRiskLevel(heatIndex);
  switch (riskLevel) {
    case 'LOW': return HEAT_THRESHOLDS.LOW.color;
    case 'MODERATE': return HEAT_THRESHOLDS.MODERATE.color;
    case 'HIGH': return HEAT_THRESHOLDS.HIGH.color;
    case 'EXTREME': return HEAT_THRESHOLDS.EXTREME.color;
  }
}

// Filter practices by team
export function filterPracticesByTeam(practices: Practice[], teamId: string | null): Practice[] {
  if (!teamId) return practices;
  return practices.filter(practice => practice.teamId === teamId);
}

// Sort practices by date (most recent first)
export function sortPracticesByDate(practices: Practice[]): Practice[] {
  return [...practices].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Sort practices by date (oldest first)
export function sortPracticesByDateAscending(practices: Practice[]): Practice[] {
  return [...practices].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// Filter practices by date range (parses once; end-of-range inclusive at day granularity)
export function filterPracticesByDateRange(
  practices: Practice[], 
  startDate: string, 
  endDate: string
): Practice[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return practices.filter(practice => {
    const practiceDate = new Date(practice.date);
    return practiceDate >= start && practiceDate <= end;
  });
}

// Search practices by location or coach
export function searchPractices(
  practices: Practice[], 
  query: string
): Practice[] {
  if (!query.trim()) return practices;
  
  const lowercaseQuery = query.toLowerCase();
  return practices.filter(practice =>
    practice.location.toLowerCase().includes(lowercaseQuery) ||
    (practice.headCoach?.toLowerCase().includes(lowercaseQuery) ?? false)
  );
}

// Get practices for a specific team
export function getTeamPractices(team: Team, practices: Practice[]): Practice[] {
  return practices.filter(practice => practice.teamId === team.id);
}

// Get teams with practice counts
export function getTeamsWithPracticeCounts(teams: Team[], practices: Practice[]): (Team & { practiceCount: number })[] {
  return teams.map(team => ({
    ...team,
    practiceCount: practices.filter(p => p.teamId === team.id).length,
  }));
}

// Get team practice count
export function getTeamPracticeCount(team: Team, practices: Practice[]): number {
  return practices.filter(practice => practice.teamId === team.id).length;
}

// Get team's maximum heat index
export function getTeamMaxHeatIndex(team: Team, practices: Practice[]): number {
  const teamPractices = getTeamPractices(team, practices);
  const allHeatIndices = teamPractices.flatMap(practice => 
    practice.checklists.map(checklist => checklist.heatIndex)
  );
  if (allHeatIndices.length === 0) return 0;
  
  return Math.max(...allHeatIndices);
}

// Get team's average heat index
export function getTeamAverageHeatIndex(team: Team, practices: Practice[]): number {
  const teamPractices = getTeamPractices(team, practices);
  const allHeatIndices = teamPractices.flatMap(practice => 
    practice.checklists.map(checklist => checklist.heatIndex)
  );
  
  if (allHeatIndices.length === 0) return 0;
  
  const sum = allHeatIndices.reduce((acc, heatIndex) => acc + heatIndex, 0);
  return sum / allHeatIndices.length;
}

// Get team's total checklist count
export function getTeamTotalChecklists(team: Team, practices: Practice[]): number {
  const teamPractices = getTeamPractices(team, practices);
  return teamPractices.reduce((total, practice) => 
    total + practice.checklists.length, 0
  );
}

// Get practice risk level
export function getPracticeRiskLevel(practice: Practice): RiskLevel {
  if (practice.checklists.length === 0) return 'LOW';
  
  const maxHeatIndex = Math.max(...practice.checklists.map(c => c.heatIndex));
  return getHeatIndexRiskLevel(maxHeatIndex);
}

// Get practice risk color
export function getPracticeRiskColor(practice: Practice): string {
  if (practice.checklists.length === 0) return HEAT_THRESHOLDS.LOW.color;
  
  const maxHeatIndex = Math.max(...practice.checklists.map(c => c.heatIndex));
  return getHeatIndexColor(maxHeatIndex);
}

// Get practice max heat index
export function getPracticeMaxHeatIndex(practice: Practice): number {
  if (practice.checklists.length === 0) return 0;
  return Math.max(...practice.checklists.map(c => c.heatIndex));
}

// Get practice checklist count
export function getPracticeChecklistCount(practice: Practice): number {
  return practice.checklists.length;
}

// Convert an HH:MM time to numeric minutes for reliable chronological comparison.
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':');
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
};

// Get practice's earliest checklist time
export function getPracticeEarliestTime(practice: Practice): string {
  if (practice.checklists.length === 0) return '';
  return practice.checklists
    .map(c => c.time)
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
    .shift() || '';
}

// Get practice's latest checklist time
export function getPracticeLatestTime(practice: Practice): string {
  if (practice.checklists.length === 0) return '';
  return practice.checklists
    .map(c => c.time)
    .sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
    .pop() || '';
}

// Filter practices by risk level
export function filterPracticesByRiskLevel(
  practices: Practice[], 
  riskLevel: RiskLevel
): Practice[] {
  return practices.filter(practice => {
    const practiceRisk = getPracticeRiskLevel(practice);
    return practiceRisk === riskLevel;
  });
}

// Group practices by month
export function groupPracticesByMonth(practices: Practice[]): Record<string, Practice[]> {
  return practices.reduce((groups, practice) => {
    const date = new Date(practice.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    
    groups[monthKey].push(practice);
    return groups;
  }, {} as Record<string, Practice[]>);
}

// Get practices for the current month
export function getCurrentMonthPractices(practices: Practice[]): Practice[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return practices.filter(practice => {
    const practiceDate = new Date(practice.date);
    return practiceDate.getMonth() === currentMonth && 
           practiceDate.getFullYear() === currentYear;
  });
}

// Get practices for the current week. Week start day is configurable (0 = Sunday, 1 = Monday).
export function getCurrentWeekPractices(practices: Practice[], weekStart: number = 0): Practice[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayDiff = (now.getDay() - weekStart + 7) % 7;
  startOfWeek.setDate(now.getDate() - dayDiff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return practices.filter(practice => {
    const practiceDate = new Date(practice.date);
    return practiceDate >= startOfWeek && practiceDate <= endOfWeek;
  });
}

// Get upcoming practices
export function getUpcomingPractices(practices: Practice[], days: number = 7): Practice[] {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + days);
  
  return practices
    .filter(practice => new Date(practice.date) > now)
    .filter(practice => new Date(practice.date) <= futureDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Get past practices
export function getPastPractices(practices: Practice[]): Practice[] {
  const now = new Date();
  return practices
    .filter(practice => new Date(practice.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get high risk practices
export function getHighRiskPractices(practices: Practice[]): Practice[] {
  return practices.filter(practice => {
    const riskLevel = getPracticeRiskLevel(practice);
    return riskLevel === 'HIGH' || riskLevel === 'EXTREME';
  });
}

// Get practices with checklists
export function getPracticesWithChecklists(practices: Practice[]): Practice[] {
  return practices.filter(practice => practice.checklists.length > 0);
}

// Get practices without checklists
export function getPracticesWithoutChecklists(practices: Practice[]): Practice[] {
  return practices.filter(practice => practice.checklists.length === 0);
}

// Advanced filtering function
export function filterPractices(
  practices: Practice[],
  filters: {
    teamId?: string | null;
    riskLevel?: RiskLevel | null;
    searchQuery?: string;
    startDate?: string;
    endDate?: string;
    hasChecklists?: boolean;
  }
): Practice[] {
  let filteredPractices = [...practices];

  // Filter by team
  if (filters.teamId) {
    filteredPractices = filterPracticesByTeam(filteredPractices, filters.teamId);
  }

  // Filter by risk level
  if (filters.riskLevel) {
    filteredPractices = filterPracticesByRiskLevel(filteredPractices, filters.riskLevel);
  }

  // Filter by search query
  if (filters.searchQuery) {
    filteredPractices = searchPractices(filteredPractices, filters.searchQuery);
  }

  // Filter by date range
  if (filters.startDate && filters.endDate) {
    filteredPractices = filterPracticesByDateRange(
      filteredPractices, 
      filters.startDate, 
      filters.endDate
    );
  }

  // Filter by checklist presence
  if (filters.hasChecklists !== undefined) {
    if (filters.hasChecklists) {
      filteredPractices = getPracticesWithChecklists(filteredPractices);
    } else {
      filteredPractices = getPracticesWithoutChecklists(filteredPractices);
    }
  }

  // Sort by date (most recent first)
  filteredPractices = sortPracticesByDate(filteredPractices);

  return filteredPractices;
}

// Get practice statistics
export function getPracticeStats(practices: Practice[]) {
  const totalPractices = practices.length;
  const practicesWithChecklists = getPracticesWithChecklists(practices).length;
  const highRiskPractices = getHighRiskPractices(practices).length;
  
  const allHeatIndices = practices.flatMap(practice => 
    practice.checklists.map(checklist => checklist.heatIndex)
  );
  
  const averageHeatIndex = allHeatIndices.length > 0 
    ? allHeatIndices.reduce((sum, heatIndex) => sum + heatIndex, 0) / allHeatIndices.length
    : 0;
  
  const maxHeatIndex = allHeatIndices.length > 0 
    ? Math.max(...allHeatIndices)
    : 0;

  return {
    total: totalPractices,
    withChecklists: practicesWithChecklists,
    highRisk: highRiskPractices,
    averageHeatIndex,
    maxHeatIndex,
    totalChecklists: allHeatIndices.length,
  };
}

// Get team statistics
export function getTeamStats(team: Team, practices: Practice[]) {
  const teamPractices = getTeamPractices(team, practices);
  const stats = getPracticeStats(teamPractices);
  
  return {
    team,
    ...stats,
  };
}