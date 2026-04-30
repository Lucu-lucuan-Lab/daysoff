import type { Holiday } from "../data/holidays.ts";
import {
  getLocalHolidays,
  mergeHolidaySources,
  normalizeApiHolidays,
  type ApiHoliday,
  type HolidaySource,
} from "./holidays.ts";

export type HolidayFetcher = (
  input: string,
  init?: RequestInit
) => Promise<Response>;

export interface LoadYearHolidaysResult {
  holidays: Holiday[];
  source: HolidaySource;
}

export async function loadYearHolidays(
  year: number,
  options: {
    signal?: AbortSignal;
    fetcher?: HolidayFetcher;
  } = {}
): Promise<LoadYearHolidaysResult> {
  const fetcher = options.fetcher ?? fetch;

  try {
    const response = await fetcher(`https://libur.deno.dev/api?year=${year}`, {
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`Holiday API returned ${response.status}`);
    }

    const data = (await response.json()) as ApiHoliday[];
    const normalizedHolidays = normalizeApiHolidays(data);

    return mergeHolidaySources(normalizedHolidays, year);
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    return {
      holidays: getLocalHolidays(year),
      source: "local",
    };
  }
}
