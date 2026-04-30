"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MapPinned,
  Minus,
  PlaneTakeoff,
  Plus,
  Sparkles,
} from "lucide-react";

import { Holiday } from "@/data/holidays";
import {
  getLocalHolidays,
  HolidaySource,
  mergeHolidaySources,
  normalizeApiHolidays,
  type ApiHoliday,
} from "@/lib/holidays";
import {
  generateRecommendationResult,
  type RecommendationType,
} from "@/lib/recommendations";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const YEARS = [2024, 2025, 2026];
const MONTH_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function Home() {
  const [year, setYear] = useState(2026);
  const [isSixDayWorkWeek, setIsSixDayWorkWeek] = useState(false);
  const [annualLeaveBudget, setAnnualLeaveBudget] = useState(12);
  const [yearHolidays, setYearHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [holidaySource, setHolidaySource] = useState<HolidaySource>("api");

  useEffect(() => {
    const controller = new AbortController();

    const fetchHolidays = async () => {
      setIsLoadingHolidays(true);
      try {
        const response = await fetch(`https://libur.deno.dev/api?year=${year}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Holiday API returned ${response.status}`);
        }

        const data = (await response.json()) as ApiHoliday[];
        const normalizedHolidays = normalizeApiHolidays(data);
        const merged = mergeHolidaySources(normalizedHolidays, year);

        setHolidaySource(merged.source);
        setYearHolidays(merged.holidays);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to fetch holidays:", error);
        setHolidaySource("local");
        setYearHolidays(getLocalHolidays(year));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingHolidays(false);
        }
      }
    };

    fetchHolidays();

    return () => controller.abort();
  }, [year]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const start = startOfMonth(new Date(year, index, 1));
      return eachDayOfInterval({ start, end: endOfMonth(start) });
    });
  }, [year]);

  const holidayMap = useMemo(() => {
    return new Map(yearHolidays.map((holiday) => [holiday.date, holiday]));
  }, [yearHolidays]);

  const recommendationResult = useMemo(() => {
    return generateRecommendationResult(year, yearHolidays, isSixDayWorkWeek, {
      annualLeaveBudget,
      limit: 18,
    });
  }, [year, isSixDayWorkWeek, yearHolidays, annualLeaveBudget]);

  const annualPlan = recommendationResult.annualPlan;

  const recommendedLeaveDays = useMemo(() => {
    const uniqueDates: Date[] = [];

    annualPlan.dates.forEach((date) => {
      if (!uniqueDates.some((uniqueDate) => isSameDay(uniqueDate, date))) {
        uniqueDates.push(date);
      }
    });

    return uniqueDates;
  }, [annualPlan.dates]);

  const totalPublicHolidays = yearHolidays.filter(
    (holiday) => !holiday.isCollectiveLeave
  ).length;
  const totalCollectiveLeave = yearHolidays.length - totalPublicHolidays;
  const leaveEfficiency = annualPlan.efficiency;

  const getIsWeekend = (date: Date) => {
    const day = getDay(date);
    return isSixDayWorkWeek ? day === 0 : day === 0 || day === 6;
  };

  const getDayStyle = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    const holiday = holidayMap.get(dateString);
    const isRecommended = recommendedLeaveDays.some((leaveDay) => isSameDay(leaveDay, date));

    if (isRecommended) {
      return "border-emerald-900 bg-emerald-500 text-emerald-950 shadow-[0_0_0_2px_rgba(16,185,129,0.22)]";
    }

    if (holiday?.isCollectiveLeave) {
      return "border-sky-800 bg-sky-300 text-sky-950";
    }

    if (holiday) {
      return "border-red-950 bg-red-600 text-white";
    }

    if (getIsWeekend(date)) {
      return "border-stone-300 bg-stone-200/80 text-stone-500";
    }

    return "border-stone-300/80 bg-white text-stone-900 hover:border-stone-900";
  };

  const changeYear = (direction: -1 | 1) => {
    const currentIndex = YEARS.indexOf(year);
    const nextYear = YEARS[currentIndex + direction];

    if (nextYear) {
      setYear(nextYear);
    }
  };

  const changeLeaveBudget = (amount: -1 | 1) => {
    setAnnualLeaveBudget((currentBudget) =>
      Math.min(30, Math.max(0, currentBudget + amount))
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3efe5] text-stone-950">
      <div className="pointer-events-none fixed inset-0 opacity-[0.33] bg-[linear-gradient(rgba(40,37,30,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(40,37,30,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative mx-auto flex w-full max-w-380 flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="grid gap-5 border-b-2 border-stone-950 pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,540px)] lg:items-start">
          <div className="space-y-4 lg:pt-5">
            <div className="inline-flex items-center gap-2 border-2 border-stone-950 bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] shadow-[4px_4px_0_#1c1917]">
              <MapPinned className="size-4" />
              Kalender cuti Indonesia
            </div>
            <div className="max-w-3xl">
              <h1 className="font-heading text-[clamp(3rem,5.8vw,5.9rem)] font-black leading-[0.9] tracking-normal">
                Rancang libur panjang tanpa nebak-nebak.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-stone-700 sm:text-lg">
                Pilih tahun kerja, lihat hari libur nasional, cuti bersama, dan tanggal cuti
                paling strategis dalam satu peta tahun yang bisa dipindai cepat.
              </p>
            </div>
          </div>

          <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:self-start xl:grid-cols-3">
            <MetricCard
              icon={<CalendarDays className="size-5" />}
              label="Libur nasional"
              value={totalPublicHolidays}
              tone="red"
            />
            <MetricCard
              icon={<BriefcaseBusiness className="size-5" />}
              label="Cuti bersama"
              value={totalCollectiveLeave}
              tone="blue"
            />
            <MetricCard
              icon={<PlaneTakeoff className="size-5" />}
              label="Cuti disarankan"
              value={recommendedLeaveDays.length}
              tone="green"
            />
          </section>
        </header>

        <section className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <div className="border-2 border-stone-950 bg-stone-950 p-3 text-white shadow-[8px_8px_0_#d6c7a5]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">
                  Tahun
                </span>
                <div className="flex items-center gap-1">
                  <button
                    aria-label="Tahun sebelumnya"
                    disabled={year === YEARS[0]}
                    onClick={() => changeYear(-1)}
                    className="grid size-8 place-items-center border border-white/25 text-white transition hover:bg-white hover:text-stone-950 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    aria-label="Tahun berikutnya"
                    disabled={year === YEARS[YEARS.length - 1]}
                    onClick={() => changeYear(1)}
                    className="grid size-8 place-items-center border border-white/25 text-white transition hover:bg-white hover:text-stone-950 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {YEARS.map((availableYear) => (
                  <button
                    key={availableYear}
                    onClick={() => setYear(availableYear)}
                    className={cn(
                      "h-11 border-2 text-sm font-black transition",
                      year === availableYear
                        ? "border-amber-300 bg-amber-300 text-stone-950 shadow-[3px_3px_0_#fff]"
                        : "border-white/20 bg-white/5 text-white hover:border-white"
                    )}
                  >
                    {availableYear}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-2 border-stone-950 bg-white p-4 shadow-[8px_8px_0_#1c1917]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-500">
                    Pola kerja
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-black">
                    {isSixDayWorkWeek ? "6 hari kerja" : "5 hari kerja"}
                  </h2>
                </div>
                <Switch
                  checked={isSixDayWorkWeek}
                  onCheckedChange={setIsSixDayWorkWeek}
                  className="data-checked:bg-red-600"
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {isSixDayWorkWeek
                  ? "Sabtu dihitung hari kerja. Rekomendasi cuti lebih ketat dan fokus pada Minggu serta libur resmi."
                  : "Sabtu dan Minggu dihitung libur. Cocok untuk kantor dengan jadwal kerja Senin sampai Jumat."}
              </p>
            </div>

            <div className="border-2 border-stone-950 bg-amber-300 p-4 shadow-[8px_8px_0_#1c1917]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-stone-700">
                    Jatah cuti
                  </p>
                  <h2 className="mt-1 font-heading text-4xl font-black">
                    {annualLeaveBudget} hari
                  </h2>
                </div>
                <div className="flex gap-1">
                  <button
                    aria-label="Kurangi jatah cuti"
                    onClick={() => changeLeaveBudget(-1)}
                    className="grid size-9 place-items-center border-2 border-stone-950 bg-white transition hover:bg-stone-950 hover:text-white"
                  >
                    <Minus className="size-4" />
                  </button>
                  <button
                    aria-label="Tambah jatah cuti"
                    onClick={() => changeLeaveBudget(1)}
                    className="grid size-9 place-items-center border-2 border-stone-950 bg-white transition hover:bg-stone-950 hover:text-white"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-stone-700">
                Engine memilih paket tanpa overlap yang paling banyak membuka hari libur
                beruntun.
              </p>
            </div>

            <div className="border-2 border-stone-950 bg-red-600 p-4 text-white shadow-[8px_8px_0_#1c1917]">
              <div className="flex items-center gap-2 text-amber-200">
                <Sparkles className="size-5" />
                <span className="text-xs font-black uppercase tracking-[0.16em]">
                  Paket terbaik
                </span>
              </div>
              {annualPlan.recommendations.length > 0 ? (
                <div className="mt-4">
                  <p className="font-heading text-4xl font-black">
                    {annualPlan.totalDaysOff} hari
                  </p>
                  <p className="mt-1 text-sm font-semibold text-red-50">
                    dari {annualPlan.leaveDaysSpent} hari cuti, tersebar di{" "}
                    {annualPlan.recommendations.length} peluang.
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 bg-white px-3 py-2 text-sm font-black text-stone-950">
                    <Clock3 className="size-4" />
                    Efisiensi {leaveEfficiency}x
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm font-semibold text-red-50">{annualPlan.reason}</p>
              )}
            </div>

            <div className="border-2 border-stone-950 bg-[#e4f2ef] p-4 shadow-[8px_8px_0_#1c1917]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-heading text-2xl font-black">Paket tahunan</h2>
                {isLoadingHolidays ? (
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
                    Tidak ada paket yang cocok untuk budget cuti ini.
                  </p>
                )}
              </div>
            </div>
          </aside>

          <section className="min-w-0 border-2 border-stone-950 bg-[#fbfaf5] p-3 shadow-[10px_10px_0_#1c1917] sm:p-4">
            <div className="mb-4 flex flex-col gap-3 border-b-2 border-stone-950 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Peta tahun {year}
                </p>
                <h2 className="font-heading text-3xl font-black sm:text-4xl">
                  Semua peluang cuti dalam 12 bulan.
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-black w-full items-end justify-end-safe">
                <LegendDot className="bg-red-600" label="Libur nasional" />
                <LegendDot className="bg-sky-300" label="Cuti bersama" />
                <LegendDot className="bg-emerald-500" label="Cuti rekomendasi" />
                <LegendDot className="bg-stone-200" label="Akhir pekan" />
              </div>
            </div>

            <div className="relative">
              {isLoadingHolidays && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-[#fbfaf5]/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3 border-2 border-stone-950 bg-white px-4 py-3 font-black shadow-[5px_5px_0_#1c1917]">
                    <Loader2 className="size-5 animate-spin text-red-600" />
                    Memuat kalender libur...
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {months.map((days, monthIndex) => {
                  const firstDay = getDay(days[0]);
                  const emptyDays = Array.from({
                    length: firstDay === 0 ? 6 : firstDay - 1,
                  });
                  const monthDate = new Date(year, monthIndex, 1);

                  return (
                    <article
                      key={monthIndex}
                      className="calendar-card border-2 border-stone-950 bg-white p-3"
                    >
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
                          const dateString = format(day, "yyyy-MM-dd");
                          const holiday = holidayMap.get(dateString);
                          const isRecommended = recommendedLeaveDays.some((leaveDay) =>
                            isSameDay(leaveDay, day)
                          );

                          return (
                            <div
                              key={dateString}
                              title={
                                holiday
                                  ? holiday.name
                                  : format(day, "eeee, dd MMMM yyyy", { locale: id })
                              }
                              className={cn(
                                "relative flex aspect-square min-h-9 items-center justify-center border text-sm font-black transition-colors",
                                getDayStyle(day)
                              )}
                            >
                              {format(day, "d")}
                              {holiday && (
                                <span className="absolute right-0.5 top-0.5 size-1.5 bg-current" />
                              )}
                              {isRecommended && (
                                <span className="absolute bottom-0.5 h-0.5 w-4 bg-emerald-950" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </section>

        <footer className="flex flex-col gap-2 border-t-2 border-stone-950 py-4 text-xs font-bold text-stone-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Sumber data: {getHolidaySourceLabel(holidaySource)}.
          </span>
          <span>
            Diperbarui untuk tampilan planner strategis, bukan kalender arsip.
          </span>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "red" | "blue" | "green";
}) {
  const toneClasses = {
    red: "bg-red-600 text-white",
    blue: "bg-sky-300 text-sky-950",
    green: "bg-emerald-400 text-emerald-950",
  };

  return (
    <div className="flex min-h-28 items-start gap-3 border-2 border-stone-950 bg-white p-4 shadow-[5px_5px_0_#1c1917] xl:block xl:min-h-36">
      <div
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center border-2 border-stone-950 xl:mb-4 xl:size-11",
          toneClasses[tone]
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">
          {label}
        </p>
        <p className="mt-1 font-heading text-4xl font-black leading-none">{value}</p>
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-stone-950 bg-white px-2 py-1">
      <span className={cn("size-3 border border-stone-950", className)} />
      {label}
    </span>
  );
}

function getRecommendationLabel(type: RecommendationType) {
  if (type === "mega_break") {
    return "Mega break";
  }

  if (type === "long_weekend") {
    return "Long weekend";
  }

  if (type === "annual_plan") {
    return "Paket";
  }

  return "Kejepit";
}

function getHolidaySourceLabel(source: HolidaySource) {
  if (source === "api") {
    return "libur.deno.dev";
  }

  if (source === "mixed") {
    return "libur.deno.dev + snapshot resmi lokal";
  }

  return "snapshot resmi lokal";
}
