import assert from "node:assert/strict";
import test from "node:test";
import { format } from "date-fns";

import { generateRecommendationResult } from "./recommendations.ts";
import type { Holiday } from "../data/holidays.ts";

const holiday = (date: string, name = "Libur Nasional"): Holiday => ({
  date,
  name,
  isCollectiveLeave: false,
});

test("finds a one-day bridge opportunity for a five-day work week", () => {
  const result = generateRecommendationResult(2026, [holiday("2026-01-01")], false, {
    annualLeaveBudget: 1,
  });

  const bridge = result.opportunities.find((recommendation) => {
    return recommendation.dates.some(
      (date) => format(date, "yyyy-MM-dd") === "2026-01-02"
    );
  });

  assert.ok(bridge);
  assert.equal(bridge.type, "bridge");
  assert.equal(bridge.leaveDaysSpent, 1);
  assert.equal(bridge.totalDaysOff, 4);
  assert.equal(result.annualPlan.leaveDaysSpent, 1);
});

test("uses Saturday as a work day in six-day work week mode", () => {
  const result = generateRecommendationResult(2026, [holiday("2026-01-01")], true, {
    annualLeaveBudget: 1,
  });

  const janSecondOnly = result.annualPlan.dates.some(
    (date) => format(date, "yyyy-MM-dd") === "2026-01-02"
  );

  assert.equal(janSecondOnly, false);
  assert.equal(result.annualPlan.leaveDaysSpent, 0);
});

test("builds an annual plan without overlapping recommendation windows", () => {
  const result = generateRecommendationResult(
    2026,
    [holiday("2026-01-01"), holiday("2026-01-16"), holiday("2026-05-14")],
    false,
    { annualLeaveBudget: 2 }
  );

  assert.ok(result.annualPlan.recommendations.length >= 1);
  assert.ok(result.annualPlan.leaveDaysSpent <= 2);

  result.annualPlan.recommendations.forEach((recommendation, index, recommendations) => {
    const next = recommendations[index + 1];

    if (!next) {
      return;
    }

    assert.ok(recommendation.endDate < next.startDate);
  });
});
