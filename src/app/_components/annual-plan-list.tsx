import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  AnnualLeavePlan,
  RecommendationType,
} from "@/lib/recommendations";

type AnnualPlanListProps = {
  annualPlan: AnnualLeavePlan;
  isLoading: boolean;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
};

export function AnnualPlanList({ annualPlan, isLoading, selectedIndex, onSelect }: AnnualPlanListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col border-2 border-brand-navy bg-brand-teal-pale p-4 shadow-[8px_8px_0_var(--color-brand-navy)]">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-black text-brand-navy-deep">Rencana tahunan</h2>
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-brand-navy" />
        ) : (
          <CheckCircle2 className="size-5 text-brand-teal-dark" />
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {annualPlan.recommendations.length > 0 ? (
          annualPlan.recommendations.map((recommendation, index) => {
            const isActive = selectedIndex === index;
            return (
              <article
                key={`${recommendation.type}-${index}`}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onClick={() => onSelect(isActive ? null : index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(isActive ? null : index);
                  }
                }}
                className={cn(
                  "cursor-pointer border-2 border-brand-navy bg-white p-3 transition-all select-none",
                  isActive
                    ? "shadow-[0_0_0_3px_var(--color-brand-teal),4px_4px_0_var(--color-brand-navy)] outline-none"
                    : "shadow-[3px_3px_0_var(--color-brand-navy)] hover:shadow-[4px_4px_0_var(--color-brand-navy)]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cn(
                    "px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white transition-colors",
                    isActive ? "bg-brand-teal text-brand-navy-deep" : "bg-brand-navy"
                  )}>
                    {getRecommendationLabel(recommendation.type)}
                  </span>
                  <span className="font-heading text-2xl font-black text-brand-navy-deep">
                    {recommendation.totalDaysOff} hari
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">
                  {recommendation.reason}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {recommendation.dates.map((date) => (
                    <span
                      key={date.toISOString()}
                      className="border border-brand-teal-dark bg-brand-teal-pale px-2 py-1 text-xs font-black text-brand-navy-deep"
                    >
                      {format(date, "dd MMM", { locale: id })}
                    </span>
                  ))}
                </div>
              </article>
            );
          })
        ) : (
          <p className="border-2 border-dashed border-slate-400 bg-white/60 p-3 text-sm font-semibold text-slate-600">
            Belum ada rencana yang cocok dengan jatah cuti ini.
          </p>
        )}
      </div>
    </div>
  );
}

function getRecommendationLabel(type: RecommendationType) {
  if (type === "mega_break") {
    return "Libur besar";
  }

  if (type === "long_weekend") {
    return "Akhir pekan panjang";
  }

  if (type === "annual_plan") {
    return "Rencana";
  }

  return "Hari kejepit";
}
