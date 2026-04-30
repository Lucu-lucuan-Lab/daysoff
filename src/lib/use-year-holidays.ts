"use client";

import { useEffect, useState } from "react";

import type { Holiday } from "@/data/holidays";
import type { HolidaySource } from "@/lib/holidays";
import { loadYearHolidays } from "@/lib/load-year-holidays";

export function useYearHolidays(year: number): {
  holidays: Holiday[];
  source: HolidaySource;
  isLoading: boolean;
} {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [source, setSource] = useState<HolidaySource>("api");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadHolidays = async () => {
      setIsLoading(true);

      try {
        const result = await loadYearHolidays(year, {
          signal: controller.signal,
        });

        setSource(result.source);
        setHolidays(result.holidays);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch holidays:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadHolidays();

    return () => controller.abort();
  }, [year]);

  return { holidays, source, isLoading };
}
