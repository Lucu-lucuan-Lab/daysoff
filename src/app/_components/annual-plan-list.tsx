import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Loader2 } from "lucide-react";

import type {
  AnnualLeavePlan,
  RecommendationType,
} from "@/lib/recommendations";

type AnnualPlanListProps = {
  annualPlan: AnnualLeavePlan;
  isLoading: boolean;
};

export function AnnualPlanList({ annualPlan, isLoading }: AnnualPlanListProps) {
  return (
    <div className="border-2 border-stone-950 bg-[#e4f2ef] p-4 shadow-[8px_8px_0_#1c1917]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-black">Rencana tahunan</h2>
        {isLoading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <CheckCircle2 className="size-5 text-emerald-700" />
        )}
      </div>
      <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
        {annualPlan.recommendations.length > 0 ? (
          annualPlan.recommendations.map((recommendation, index) => (
            <article
              key={`${recommendation.type}-${index}`}
              className="border-2 border-stone-950 bg-white p-3 shadow-[3px_3px_0_#1c1917]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="bg-stone-950 px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                  {getRecommendationLabel(recommendation.type)}
                </span>
                <span className="font-heading text-2xl font-black text-red-700">
                  {recommendation.totalDaysOff}h
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-5 text-stone-700">
                {recommendation.reason}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recommendation.dates.map((date) => (
                  <span
                    key={date.toISOString()}
                    className="border border-emerald-900 bg-emerald-200 px-2 py-1 text-xs font-black text-emerald-950"
                  >
                    {format(date, "dd MMM", { locale: id })}
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="border-2 border-dashed border-stone-400 bg-white/60 p-3 text-sm font-semibold text-stone-600">
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
