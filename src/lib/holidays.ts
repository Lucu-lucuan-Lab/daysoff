import { holidays as fallbackHolidays, type Holiday } from "../data/holidays.ts";

export type HolidaySource = "api" | "local" | "mixed";

export type ApiHoliday = {
  date?: string;
  name?: string;
};

export function normalizeApiHolidays(items: ApiHoliday[]): Holiday[] {
  return dedupeHolidays(
    items
      .filter((item): item is Required<ApiHoliday> => {
        return Boolean(item.date && item.name);
      })
      .map((item) => ({
        date: item.date,
        name: item.name,
        isCollectiveLeave: item.name.toLowerCase().includes("cuti"),
        source: "api" as const,
      }))
  );
}

export function getLocalHolidays(year: number) {
  return fallbackHolidays.filter((holiday) =>
    holiday.date.startsWith(String(year))
  );
}

export function mergeHolidaySources(apiHolidays: Holiday[], year: number) {
  const localHolidays = getLocalHolidays(year);
  const merged = dedupeHolidays([...apiHolidays, ...localHolidays]);

  return {
    holidays: merged,
    source: getHolidaySource(apiHolidays, localHolidays),
  };
}

function getHolidaySource(apiHolidays: Holiday[], localHolidays: Holiday[]): HolidaySource {
  if (apiHolidays.length === 0) {
    return "local";
  }

  if (localHolidays.length === 0) {
    return "api";
  }

  return "mixed";
}

function dedupeHolidays(holidays: Holiday[]) {
  const byDate = new Map<string, Holiday>();

  holidays.forEach((holiday) => {
    const existing = byDate.get(holiday.date);

    if (!existing || existing.source !== "api") {
      byDate.set(holiday.date, holiday);
    }
  });

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
