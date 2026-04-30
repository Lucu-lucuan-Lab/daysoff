import { format, getDay, isSameDay } from "date-fns";
import { id } from "date-fns/locale";

import type { Holiday } from "@/data/holidays";
import { cn } from "@/lib/utils";

const MONTH_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

type MonthCalendarProps = {
  days: Date[];
  monthIndex: number;
  year: number;
  holidayMap: Map<string, Holiday>;
  recommendedLeaveDays: Date[];
  isSixDayWorkWeek: boolean;
};

export function MonthCalendar({
  days,
  monthIndex,
  year,
  holidayMap,
  recommendedLeaveDays,
  isSixDayWorkWeek,
}: MonthCalendarProps) {
  const firstDay = getDay(days[0]);
  const emptyDays = Array.from({
    length: firstDay === 0 ? 6 : firstDay - 1,
  });
  const monthDate = new Date(year, monthIndex, 1);

  return (
    <article className="calendar-card border-2 border-stone-950 bg-white p-3">
      <div className="mb-3 flex items-center justify-between border-b border-stone-300 pb-2">
        <h3 className="font-heading text-2xl font-black capitalize">
          {format(monthDate, "MMMM", { locale: id })}
        </h3>
        <span className="font-mono text-xs font-black text-stone-500">
          {format(monthDate, "MM")}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.08em] text-stone-500">
        {MONTH_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const dayView = getCalendarDayView({
            date: day,
            holidayMap,
            recommendedLeaveDays,
            isSixDayWorkWeek,
          });

          return (
            <div
              key={dayView.dateString}
              title={dayView.title}
              className={cn(
                "relative flex aspect-square min-h-9 items-center justify-center border text-sm font-black transition-colors",
                dayView.className
              )}
            >
              {format(day, "d")}
              {dayView.holiday && (
                <span className="absolute right-0.5 top-0.5 size-1.5 bg-current" />
              )}
              {dayView.isRecommended && (
                <span className="absolute bottom-0.5 h-0.5 w-4 bg-emerald-950" />
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function getCalendarDayView({
  date,
  holidayMap,
  recommendedLeaveDays,
  isSixDayWorkWeek,
}: {
  date: Date;
  holidayMap: Map<string, Holiday>;
  recommendedLeaveDays: Date[];
  isSixDayWorkWeek: boolean;
}) {
  const dateString = format(date, "yyyy-MM-dd");
  const holiday = holidayMap.get(dateString);
  const isRecommended = recommendedLeaveDays.some((leaveDay) =>
    isSameDay(leaveDay, date)
  );

  return {
    dateString,
    holiday,
    isRecommended,
    title: holiday ? holiday.name : format(date, "eeee, dd MMMM yyyy", { locale: id }),
    className: getDayStyle({
      date,
      holiday,
      isRecommended,
      isSixDayWorkWeek,
    }),
  };
}

function getDayStyle({
  date,
  holiday,
  isRecommended,
  isSixDayWorkWeek,
}: {
  date: Date;
  holiday?: Holiday;
  isRecommended: boolean;
  isSixDayWorkWeek: boolean;
}) {
  if (isRecommended) {
    return "border-emerald-900 bg-emerald-500 text-emerald-950 shadow-[0_0_0_2px_rgba(16,185,129,0.22)]";
  }

  if (holiday?.isCollectiveLeave) {
    return "border-sky-800 bg-sky-300 text-sky-950";
  }

  if (holiday) {
    return "border-red-950 bg-red-600 text-white";
  }

  if (getIsWeekend(date, isSixDayWorkWeek)) {
    return "border-stone-300 bg-stone-200/80 text-stone-500";
  }

  return "border-stone-300/80 bg-white text-stone-900 hover:border-stone-900";
}

function getIsWeekend(date: Date, isSixDayWorkWeek: boolean) {
  const day = getDay(date);
  return isSixDayWorkWeek ? day === 0 : day === 0 || day === 6;
}
