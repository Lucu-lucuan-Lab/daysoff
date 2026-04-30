import {
  compareAsc,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  getDay,
  isBefore,
} from "date-fns";

import type { Holiday } from "../data/holidays";

export type RecommendationType =
  | "bridge"
  | "long_weekend"
  | "mega_break"
  | "annual_plan";

export interface LeaveRecommendation {
  type: RecommendationType;
  dates: Date[];
  startDate: Date;
  endDate: Date;
  title: string;
  reason: string;
  benefit: string;
  leaveDaysSpent: number;
  totalDaysOff: number;
  efficiency: number;
  score: number;
}

export interface AnnualLeavePlan {
  type: "annual_plan";
  title: string;
  reason: string;
  dates: Date[];
  recommendations: LeaveRecommendation[];
  leaveDaysSpent: number;
  totalDaysOff: number;
  efficiency: number;
  score: number;
}

export interface RecommendationOptions {
  annualLeaveBudget?: number;
  maxIndividualLeaveDays?: number;
  maxWindowDays?: number;
  limit?: number;
}

export interface RecommendationResult {
  opportunities: LeaveRecommendation[];
  annualPlan: AnnualLeavePlan;
}

const DEFAULT_ANNUAL_LEAVE_BUDGET = 12;
const DEFAULT_MAX_INDIVIDUAL_LEAVE_DAYS = 5;
const DEFAULT_MAX_WINDOW_DAYS = 18;
const DEFAULT_LIMIT = 24;

export function generateRecommendations(
  year: number,
  holidays: Holiday[],
  isSixDayWorkWeek: boolean,
  options: RecommendationOptions = {}
): LeaveRecommendation[] {
  return generateRecommendationResult(
    year,
    holidays,
    isSixDayWorkWeek,
    options
  ).opportunities;
}

export function generateRecommendationResult(
  year: number,
  holidays: Holiday[],
  isSixDayWorkWeek: boolean,
  options: RecommendationOptions = {}
): RecommendationResult {
  const annualLeaveBudget =
    options.annualLeaveBudget ?? DEFAULT_ANNUAL_LEAVE_BUDGET;
  const opportunities = buildOpportunities(year, holidays, isSixDayWorkWeek, {
    maxIndividualLeaveDays:
      options.maxIndividualLeaveDays ?? DEFAULT_MAX_INDIVIDUAL_LEAVE_DAYS,
    maxWindowDays: options.maxWindowDays ?? DEFAULT_MAX_WINDOW_DAYS,
  });

  const annualPlan = buildAnnualPlan(opportunities, annualLeaveBudget);

  return {
    opportunities: opportunities.slice(0, options.limit ?? DEFAULT_LIMIT),
    annualPlan,
  };
}

function buildOpportunities(
  year: number,
  holidays: Holiday[],
  isSixDayWorkWeek: boolean,
  options: Required<Pick<RecommendationOptions, "maxIndividualLeaveDays" | "maxWindowDays">>
) {
  const holidayDates = new Set(
    holidays
      .filter((holiday) => holiday.date.startsWith(String(year)))
      .map((holiday) => holiday.date)
  );
  const allDays = eachDayOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31),
  });
  const candidates = new Map<string, LeaveRecommendation>();

  const isWeekend = (date: Date) => {
    const day = getDay(date);
    return isSixDayWorkWeek ? day === 0 : day === 0 || day === 6;
  };
  const isOffDay = (date: Date) =>
    isWeekend(date) || holidayDates.has(format(date, "yyyy-MM-dd"));

  allDays.forEach((startDate, startIndex) => {
    for (
      let windowDays = 3;
      windowDays <= options.maxWindowDays && startIndex + windowDays <= allDays.length;
      windowDays++
    ) {
      const endDate = allDays[startIndex + windowDays - 1];

      if (!isOffDay(startDate) || !isOffDay(endDate)) {
        continue;
      }

      const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
      const hasOfficialHoliday = intervalDays.some((date) =>
        holidayDates.has(format(date, "yyyy-MM-dd"))
      );
      const leaveDates = intervalDays.filter((date) => !isOffDay(date));

      if (
        !hasOfficialHoliday ||
        leaveDates.length === 0 ||
        leaveDates.length > options.maxIndividualLeaveDays
      ) {
        continue;
      }

      const totalDaysOff = differenceInCalendarDays(endDate, startDate) + 1;
      const efficiency = roundOneDecimal(totalDaysOff / leaveDates.length);
      const type = getRecommendationType(leaveDates.length, totalDaysOff);
      const recommendation = createRecommendation({
        type,
        dates: leaveDates,
        startDate,
        endDate,
        totalDaysOff,
        efficiency,
      });
      const key = leaveDates.map(toDateKey).join("|");
      const existing = candidates.get(key);

      if (!existing || isBetterRecommendation(recommendation, existing)) {
        candidates.set(key, recommendation);
      }
    }
  });

  return Array.from(candidates.values()).sort(sortRecommendations);
}

function createRecommendation({
  type,
  dates,
  startDate,
  endDate,
  totalDaysOff,
  efficiency,
}: {
  type: RecommendationType;
  dates: Date[];
  startDate: Date;
  endDate: Date;
  totalDaysOff: number;
  efficiency: number;
}): LeaveRecommendation {
  const leaveDaysSpent = dates.length;
  const score = scoreRecommendation({
    type,
    totalDaysOff,
    leaveDaysSpent,
    efficiency,
  });
  const dateList = dates.map((date) => format(date, "d MMM")).join(", ");
  const range = `${format(startDate, "d MMM")} - ${format(endDate, "d MMM")}`;

  return {
    type,
    dates,
    startDate,
    endDate,
    title: getRecommendationTitle(type, totalDaysOff),
    reason: `Ambil ${leaveDaysSpent} hari cuti (${dateList}) untuk membuka libur ${range}.`,
    benefit: `Ambil ${leaveDaysSpent} hari cuti untuk mendapatkan ${totalDaysOff} hari libur beruntun.`,
    leaveDaysSpent,
    totalDaysOff,
    efficiency,
    score,
  };
}

function buildAnnualPlan(
  recommendations: LeaveRecommendation[],
  annualLeaveBudget: number
): AnnualLeavePlan {
  const budget = Math.max(0, Math.floor(annualLeaveBudget));
  const candidates = recommendations
    .filter((recommendation) => recommendation.leaveDaysSpent <= budget)
    .sort((a, b) => compareAsc(a.endDate, b.endDate));
  const previousCompatible = candidates.map((candidate, index) => {
    for (let previousIndex = index - 1; previousIndex >= 0; previousIndex--) {
      if (isBefore(candidates[previousIndex].endDate, candidate.startDate)) {
        return previousIndex;
      }
    }

    return -1;
  });
  const memo = new Map<string, LeaveRecommendation[]>();

  const choose = (index: number, remainingBudget: number): LeaveRecommendation[] => {
    if (index < 0 || remainingBudget <= 0) {
      return [];
    }

    const memoKey = `${index}:${remainingBudget}`;
    const memoized = memo.get(memoKey);

    if (memoized) {
      return memoized;
    }

    const skip = choose(index - 1, remainingBudget);
    const current = candidates[index];
    let best = skip;

    if (current.leaveDaysSpent <= remainingBudget) {
      const take = [
        ...choose(
          previousCompatible[index],
          remainingBudget - current.leaveDaysSpent
        ),
        current,
      ];

      if (scorePlan(take) > scorePlan(skip)) {
        best = take;
      }
    }

    memo.set(memoKey, best);
    return best;
  };

  const selected = choose(candidates.length - 1, budget).sort((a, b) =>
    compareAsc(a.startDate, b.startDate)
  );
  const dates = uniqueDates(selected.flatMap((recommendation) => recommendation.dates));
  const leaveDaysSpent = dates.length;
  const totalDaysOff = selected.reduce(
    (sum, recommendation) => sum + recommendation.totalDaysOff,
    0
  );
  const efficiency =
    leaveDaysSpent > 0 ? roundOneDecimal(totalDaysOff / leaveDaysSpent) : 0;
  const score = scorePlan(selected);

  return {
    type: "annual_plan",
    title: "Paket cuti tahunan terbaik",
    reason:
      selected.length > 0
        ? `Memakai ${leaveDaysSpent} dari ${budget} jatah cuti untuk membuka ${totalDaysOff} hari libur beruntun dari ${selected.length} peluang tanpa overlap.`
        : "Tidak ada paket cuti yang cocok dengan budget ini.",
    dates,
    recommendations: selected,
    leaveDaysSpent,
    totalDaysOff,
    efficiency,
    score,
  };
}

function scoreRecommendation({
  type,
  totalDaysOff,
  leaveDaysSpent,
  efficiency,
}: {
  type: RecommendationType;
  totalDaysOff: number;
  leaveDaysSpent: number;
  efficiency: number;
}) {
  const typeBonus = type === "mega_break" ? 30 : type === "long_weekend" ? 12 : 4;

  return totalDaysOff * 100 + efficiency * 18 + typeBonus - leaveDaysSpent * 5;
}

function scorePlan(recommendations: LeaveRecommendation[]) {
  return recommendations.reduce((sum, recommendation) => {
    return sum + recommendation.score;
  }, 0);
}

function sortRecommendations(
  first: LeaveRecommendation,
  second: LeaveRecommendation
) {
  return (
    second.totalDaysOff - first.totalDaysOff ||
    second.efficiency - first.efficiency ||
    first.leaveDaysSpent - second.leaveDaysSpent ||
    compareAsc(first.startDate, second.startDate)
  );
}

function isBetterRecommendation(
  candidate: LeaveRecommendation,
  existing: LeaveRecommendation
) {
  return sortRecommendations(candidate, existing) < 0;
}

function getRecommendationType(
  leaveDaysSpent: number,
  totalDaysOff: number
): Exclude<RecommendationType, "annual_plan"> {
  if (totalDaysOff >= 9) {
    return "mega_break";
  }

  if (leaveDaysSpent === 1) {
    return "bridge";
  }

  return "long_weekend";
}

function getRecommendationTitle(type: RecommendationType, totalDaysOff: number) {
  if (type === "mega_break") {
    return `Mega break ${totalDaysOff} hari`;
  }

  if (type === "long_weekend") {
    return `Long weekend ${totalDaysOff} hari`;
  }

  return `Hari kejepit ${totalDaysOff} hari`;
}

function uniqueDates(dates: Date[]) {
  const seen = new Set<string>();

  return dates
    .filter((date) => {
      const key = toDateKey(date);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort(compareAsc);
}

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}
