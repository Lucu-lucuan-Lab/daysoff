import { Clock3, Sparkles } from "lucide-react";

import type { AnnualLeavePlan } from "@/lib/recommendations";

type BestPlanCardProps = {
  annualPlan: AnnualLeavePlan;
  leaveEfficiency: number;
};

export function BestPlanCard({
  annualPlan,
  leaveEfficiency,
}: BestPlanCardProps) {
  return (
    <div className="border-2 border-stone-950 bg-red-600 p-4 text-white shadow-[8px_8px_0_#1c1917]">
      <div className="flex items-center gap-2 text-amber-200">
        <Sparkles className="size-5" />
        <span className="text-xs font-black uppercase tracking-[0.16em]">
          Rencana terbaik
        </span>
      </div>
      {annualPlan.recommendations.length > 0 ? (
        <div className="mt-4">
          <p className="font-heading text-4xl font-black">
            {annualPlan.totalDaysOff} hari
          </p>
          <p className="mt-1 text-sm font-semibold text-red-50">
            pakai {annualPlan.leaveDaysSpent} hari cuti dari{" "}
            {annualPlan.recommendations.length} peluang.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 bg-white px-3 py-2 text-sm font-black text-stone-950">
            <Clock3 className="size-4" />
            Efisiensi {leaveEfficiency}x
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm font-semibold text-red-50">
          {annualPlan.reason}
        </p>
      )}
    </div>
  );
}
