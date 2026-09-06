import { Team, Practice } from '../types';
import { sortPracticesByDate, getTeamPractices, groupPracticesByMonth } from './practiceFilter';

// Date formatting utilities for mobile display
export const formatDate = (dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
      });
    case 'long':
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    default: // medium
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
  }
};

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
};

// Mobile-optimized date sorting functions
export const sortPracticesForMobile = (practices: Practice[]): Practice[] => {
  return sortPracticesByDate(practices).map(practice => ({
    ...practice,
    _mobileSortKey: new Date(practice.date).getTime(),
  }));
};

// Group practices by date for mobile display
export const groupPracticesByDate = (practices: Practice[]): Record<string, { practices: Practice[]; relativeTime: string; date: string }> => {
  const sortedPractices = sortPracticesForMobile(practices);
  
  return sortedPractices.reduce((groups, practice) => {
    const dateKey = formatDate(practice.date, 'short');
    const relativeTime = formatRelativeTime(practice.date);
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        practices: [],
        relativeTime,
        date: practice.date,
      };
    }
    
    groups[dateKey].practices.push(practice);
    return groups;
  }, {} as Record<string, { practices: Practice[]; relativeTime: string; date: string }>);
};

// Group practices by week for mobile calendar view
export const groupPracticesByWeek = (practices: Practice[]): Record<string, Practice[]> => {
  const sortedPractices = sortPracticesForMobile(practices);
  
  return sortedPractices.reduce((groups, practice) => {
    const date = new Date(practice.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!groups[weekKey]) {
      groups[weekKey] = [];
    }
    
    groups[weekKey].push(practice);
    return groups;
  }, {} as Record<string, Practice[]>);
};

// Group practices by team and then by date
export const groupPracticesByTeamAndDate = (teams: Team[], practices: Practice[]): Record<string, Record<string, Practice[]>> => {
  const result: Record<string, Record<string, Practice[]>> = {};
  
  teams.forEach(team => {
    const teamPractices = getTeamPractices(team, practices);
    const groupedByDate = groupPracticesByDate(teamPractices);
    
    Object.keys(groupedByDate).forEach(dateKey => {
      if (!result[team.id]) {
        result[team.id] = {};
      }
      result[team.id][dateKey] = groupedByDate[dateKey].practices;
    });
  });
  
  return result;
};

// Create mobile-optimized practice sections
export const createMobilePracticeSections = (practices: Practice[]): {
  id: string;
  title: string;
  subtitle?: string;
  data: Practice[];
  type: 'date' | 'team' | 'month';
}[] => {
  const sortedPractices = sortPracticesForMobile(practices);
  const groupedByMonth = groupPracticesByMonth(sortedPractices);
  
  const sections: {
    id: string;
    title: string;
    subtitle?: string;
    data: Practice[];
    type: 'date' | 'team' | 'month';
  }[] = [];
  
  // Add month sections
  Object.keys(groupedByMonth)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .forEach(monthKey => {
      const monthPractices = groupedByMonth[monthKey];
      const monthDate = new Date(monthKey + '-01');
      const monthName = monthDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      sections.push({
        id: `month-${monthKey}`,
        title: monthName,
        data: monthPractices,
        type: 'month',
      });
    });
  
  return sections;
};

// Create team sections with practice counts
export const createMobileTeamSections = (teams: Team[], practices: Practice[]): {
  id: string;
  title: string;
  subtitle: string;
  data: Practice[];
  type: 'team';
  team: Team;
}[] => {
  const teamsWithStats = teams.map(team => ({
    ...team,
    practiceCount: practices.filter(p => p.teamId === team.id).length,
  }));
  
  const sections: {
    id: string;
    title: string;
    subtitle: string;
    data: Practice[];
    type: 'team';
    team: Team;
  }[] = [];
  
  teamsWithStats.forEach(team => {
    const teamPractices = getTeamPractices(team, practices);
    
    sections.push({
      id: `team-${team.id}`,
      title: team.name,
      subtitle: `${team.practiceCount} ${team.practiceCount === 1 ? 'practice' : 'practices'}`,
      data: sortPracticesForMobile(teamPractices),
      type: 'team',
      team,
    });
  });
  
  return sections;
};

// Create chronological sections with date headers
export const createChronologicalPracticeSections = (practices: Practice[]): {
  id: string;
  title: string;
  subtitle?: string;
  data: Practice[];
  type: 'date';
}[] => {
  const groupedByDate = groupPracticesByDate(practices);
  
  const sections: {
    id: string;
    title: string;
    subtitle?: string;
    data: Practice[];
    type: 'date';
  }[] = [];
  
  Object.keys(groupedByDate)
    .sort((a, b) => new Date(groupedByDate[b].date).getTime() - new Date(groupedByDate[a].date).getTime())
    .forEach(dateKey => {
      const dateData = groupedByDate[dateKey];
      const relativeTime = formatRelativeTime(dateData.date);
      
      sections.push({
        id: `date-${dateData.date}`,
        title: formatDate(dateData.date, 'medium'),
        subtitle: relativeTime,
        data: sortPracticesForMobile(dateData.practices),
        type: 'date',
      });
    });
  
  return sections;
};

// Mobile-optimized list grouping for performance
export const createOptimizedPracticeList = (
  practices: Practice[],
  grouping: 'chronological' | 'by-team' | 'by-month' = 'chronological'
): {
  id: string;
  title: string;
  subtitle?: string;
  data: Practice[];
  type: 'date' | 'team' | 'month';
}[] => {
  switch (grouping) {
    case 'by-team':
      return createMobileTeamSections([], practices); // Empty teams array, will use all teams
    case 'by-month':
      return createMobilePracticeSections(practices);
    default:
      return createChronologicalPracticeSections(practices);
  }
};

// Get next upcoming practice
export const getNextUpcomingPractice = (practices: Practice[]): Practice | null => {
  const now = new Date();
  const futurePractices = practices
    .filter(practice => new Date(practice.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return futurePractices[0] || null;
};

// Get recent practices (last 7 days)
export const getRecentPractices = (practices: Practice[]): Practice[] => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  
  return practices
    .filter(practice => new Date(practice.date) >= weekAgo && new Date(practice.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Mobile date comparison utilities
export const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const isToday = (dateString: string): boolean => {
  return isSameDay(dateString, new Date().toISOString().split('T')[0]);
};

export const isTomorrow = (dateString: string): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(dateString, tomorrow.toISOString().split('T')[0]);
};

export const isThisWeek = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return date >= weekStart && date <= weekEnd;
};

export const isThisMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

// Mobile-friendly date range formatting
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isSameDay(startDate, endDate)) {
    return formatDate(startDate, 'medium');
  }
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })}`;
  }
  
  return `${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}`;
};

// Generate mobile calendar view data
export const generateCalendarViewData = (practices: Practice[]): {
  date: string;
  dateLabel: string;
  hasPractices: boolean;
  practiceCount: number;
  maxHeatIndex: number;
}[] => {
  const practiceMap: Record<string, { count: number; maxHeatIndex: number }> = {};
  
  practices.forEach(practice => {
    const dateKey = practice.date;
    if (!practiceMap[dateKey]) {
      practiceMap[dateKey] = { count: 0, maxHeatIndex: 0 };
    }
    
    practiceMap[dateKey].count++;
    const maxHeat = Math.max(...practice.checklists.map(c => c.heatIndex));
    practiceMap[dateKey].maxHeatIndex = Math.max(practiceMap[dateKey].maxHeatIndex, maxHeat);
  });
  
  const calendarData: {
    date: string;
    dateLabel: string;
    hasPractices: boolean;
    practiceCount: number;
    maxHeatIndex: number;
  }[] = [];
  
  // Generate next 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    
    calendarData.push({
      date: dateKey,
      dateLabel: formatDate(dateKey, 'short'),
      hasPractices: !!practiceMap[dateKey],
      practiceCount: practiceMap[dateKey]?.count || 0,
      maxHeatIndex: practiceMap[dateKey]?.maxHeatIndex || 0,
    });
  }
  
  return calendarData;
};