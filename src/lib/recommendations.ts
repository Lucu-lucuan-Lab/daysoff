import { Holiday } from '@/data/holidays';
import { 
  addDays, 
  subDays, 
  isWeekend as isDateWeekend, 
  format, 
  parseISO,
  isSameDay,
  getDay,
  eachDayOfInterval,
  differenceInDays
} from 'date-fns';

export interface LeaveRecommendation {
  type: 'bridge' | 'mega_break';
  dates: Date[]; // The dates suggested to take leave
  benefit: string;
  totalDaysOff: number;
}

export function generateRecommendations(
  year: number,
  holidays: Holiday[],
  isSixDayWorkWeek: boolean
): LeaveRecommendation[] {
  const recommendations: LeaveRecommendation[] = [];
  const yearHolidays = holidays.filter(h => h.date.startsWith(year.toString()));
  
  // Helper to check if a date is a weekend based on work week type
  const isWeekend = (date: Date) => {
    const day = getDay(date);
    if (isSixDayWorkWeek) {
      return day === 0; // Only Sunday is weekend
    }
    return day === 0 || day === 6; // Saturday and Sunday
  };

  const isHoliday = (date: Date) => {
    return yearHolidays.some(h => h.date === format(date, 'yyyy-MM-dd'));
  };

  const isOffDay = (date: Date) => isWeekend(date) || isHoliday(date);

  // 1. Find Bridge Days (Kejepit)
  // A single working day between two off days
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      // If the current date is not an off day
      if (!isOffDay(date)) {
        const prevDay = subDays(date, 1);
        const nextDay = addDays(date, 1);
        
        if (isOffDay(prevDay) && isOffDay(nextDay)) {
          // This is a bridge day
          // Calculate total continuous days off if this leave is taken
          let startOff = prevDay;
          while (isOffDay(subDays(startOff, 1))) startOff = subDays(startOff, 1);
          
          let endOff = nextDay;
          while (isOffDay(addDays(endOff, 1))) endOff = addDays(endOff, 1);
          
          const totalDaysOff = differenceInDays(endOff, startOff) + 1;
          
          recommendations.push({
            type: 'bridge',
            dates: [date],
            benefit: `Take 1 day off to get ${totalDaysOff} continuous days off.`,
            totalDaysOff
          });
        }
      }
    }
  }

  // 2. Find Full Black (Mega Break) Strategy
  // Look for periods where taking 2-4 days off yields 9+ days off
  // We can scan through the year
  const allDaysInYear = eachDayOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31)
  });

  let currentBlock: Date[] = [];
  let currentLeaveRequired: Date[] = [];
  
  // A simple sliding window approach or clustering
  // Let's iterate through each day, and try to build a block of 9+ days
  for (let i = 0; i < allDaysInYear.length; i++) {
    const startDate = allDaysInYear[i];
    
    // Only start looking if the start date is an off day to maximize efficiency
    if (isOffDay(startDate)) {
      let tempDate = startDate;
      let tempLeaveRequired: Date[] = [];
      let continuousDays = 0;
      
      // Look ahead up to 16 days
      while (continuousDays < 16 && tempDate.getFullYear() === year) {
        if (!isOffDay(tempDate)) {
          tempLeaveRequired.push(tempDate);
        }
        
        continuousDays++;
        
        // If we found a block of 9+ days and required leave is <= 4 days
        if (continuousDays >= 9 && tempLeaveRequired.length > 0 && tempLeaveRequired.length <= 4) {
          // Check if this ends on an off day
          if (isOffDay(tempDate)) {
             // We found a mega break
             const existing = recommendations.find(r => 
               r.type === 'mega_break' && 
               r.dates.length === tempLeaveRequired.length &&
               r.dates.every((d, idx) => isSameDay(d, tempLeaveRequired[idx]))
             );
             
             if (!existing) {
               recommendations.push({
                 type: 'mega_break',
                 dates: [...tempLeaveRequired],
                 benefit: `Take ${tempLeaveRequired.length} days off to get ${continuousDays} continuous days off (Mega Break!).`,
                 totalDaysOff: continuousDays
               });
             }
          }
        }
        
        // Stop if we require too many leave days
        if (tempLeaveRequired.length > 4) {
          break;
        }
        
        tempDate = addDays(tempDate, 1);
      }
    }
  }

  return recommendations;
}
