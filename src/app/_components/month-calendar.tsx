import { format, getDay, getMonth, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import React, { useEffect, useRef } from "react";

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
  highlightedDates: Date[] | null;
};

export function MonthCalendar({
  days,
  monthIndex,
  year,
  holidayMap,
  recommendedLeaveDays,
  isSixDayWorkWeek,
  highlightedDates,
}: MonthCalendarProps) {
  const articleRef = useRef<HTMLElement>(null);

  const hasHighlight =
    highlightedDates !== null &&
    highlightedDates.some((d) => getMonth(d) === monthIndex);

  useEffect(() => {
    if (hasHighlight && articleRef.current) {
      articleRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [hasHighlight]);
  const firstDay = getDay(days[0]);
  const emptyDays = Array.from({
    length: firstDay === 0 ? 6 : firstDay - 1,
  });
  const monthDate = new Date(year, monthIndex, 1);

  return (
    <article ref={articleRef as React.RefObject<HTMLElement>} className={cn(
      "calendar-card border-2 border-brand-navy bg-white p-3 transition-shadow",
      hasHighlight && "ring-4 ring-brand-teal ring-offset-2 shadow-[0_0_0_4px_var(--color-brand-teal)]"
    )}>
      <div className="mb-3 flex items-center justify-between border-b border-slate-300 pb-2">
        <h3 className="font-heading text-2xl font-black capitalize text-brand-navy-deep">
          {format(monthDate, "MMMM", { locale: id })}
        </h3>
        <span className="font-mono text-xs font-black text-slate-400">
          {format(monthDate, "MM")}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
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
            highlightedDates,
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
                <span className="absolute bottom-0.5 h-0.5 w-4 bg-brand-navy-deep" />
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
  highlightedDates,
}: {
  date: Date;
  holidayMap: Map<string, Holiday>;
  recommendedLeaveDays: Date[];
  isSixDayWorkWeek: boolean;
  highlightedDates: Date[] | null;
}) {
  const dateString = format(date, "yyyy-MM-dd");
  const holiday = holidayMap.get(dateString);
  const isRecommended = recommendedLeaveDays.some((leaveDay) =>
    isSameDay(leaveDay, date)
  );
  const isHighlighted =
    highlightedDates !== null &&
    highlightedDates.some((d) => isSameDay(d, date));

  return {
    dateString,
    holiday,
    isRecommended,
    isHighlighted,
    title: holiday ? holiday.name : format(date, "eeee, dd MMMM yyyy", { locale: id }),
    className: getDayStyle({
      date,
      holiday,
      isRecommended,
      isHighlighted,
      isSixDayWorkWeek,
    }),
  };
}

function getDayStyle({
  date,
  holiday,
  isRecommended,
  isHighlighted,
  isSixDayWorkWeek,
}: {
  date: Date;
  holiday?: Holiday;
  isRecommended: boolean;
  isHighlighted: boolean;
  isSixDayWorkWeek: boolean;
}) {
  if (isHighlighted) {
    return "border-amber-500 bg-amber-300 text-amber-950 shadow-[0_0_0_2px_rgba(245,158,11,0.4)] scale-105 z-10 relative";
  }

  if (isRecommended) {
    return "border-brand-teal-dark bg-brand-teal text-brand-navy-deep shadow-[0_0_0_2px_rgba(46,196,182,0.22)]";
  }

  if (holiday?.isCollectiveLeave) {
    return "border-sky-800 bg-sky-300 text-sky-950";
  }

  if (holiday) {
    return "border-red-950 bg-red-600 text-white";
  }

  if (getIsWeekend(date, isSixDayWorkWeek)) {
    return "border-slate-300 bg-slate-200/80 text-slate-500";
  }

  return "border-slate-300/80 bg-white text-slate-900 hover:border-brand-navy";
}

function getIsWeekend(date: Date, isSixDayWorkWeek: boolean) {
  const day = getDay(date);
  return isSixDayWorkWeek ? day === 0 : day === 0 || day === 6;
}
