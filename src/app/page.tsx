"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";
import { eachDayOfInterval, endOfMonth, isSameDay, startOfMonth } from "date-fns";
import {
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  MapPinned,
  Minus,
  PlaneTakeoff,
  Plus,
} from "lucide-react";

import {
  generateRecommendationResult,
} from "@/lib/recommendations";
import { useYearHolidays } from "@/lib/use-year-holidays";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { AnnualPlanList } from "./_components/annual-plan-list";
import { BestPlanCard } from "./_components/best-plan-card";
import { MonthCalendar } from "./_components/month-calendar";

export default function Home() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [isSixDayWorkWeek, setIsSixDayWorkWeek] = useState(false);
  const [annualLeaveBudget, setAnnualLeaveBudget] = useState(12);
  const {
    holidays: yearHolidays,
    isLoading: isLoadingHolidays,
  } = useYearHolidays(year);

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

  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(null);

  const highlightedDates = useMemo(() => {
    if (selectedPlanIndex === null) return null;
    return annualPlan.recommendations[selectedPlanIndex]?.dates ?? null;
  }, [selectedPlanIndex, annualPlan.recommendations]);

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

  const changeLeaveBudget = (amount: -1 | 1) => {
    setAnnualLeaveBudget((currentBudget) =>
      Math.min(30, Math.max(0, currentBudget + amount))
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#edf2f7] text-slate-950">
      <div className="pointer-events-none fixed inset-0 opacity-[0.25] bg-[linear-gradient(rgba(26,46,68,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(26,46,68,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative mx-auto flex w-full max-w-380 flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="grid gap-5 border-b-2 border-brand-navy pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,540px)] lg:items-start">
          <div className="space-y-4 lg:pt-5">
            <div className="inline-flex items-center gap-2 border-2 border-brand-navy bg-brand-teal px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-brand-navy-deep shadow-[4px_4px_0_var(--color-brand-navy)]">
              <MapPinned className="size-4" />
              Kalender cuti Indonesia
            </div>
            <div className="max-w-3xl">
              <h1 className="font-heading text-[clamp(3rem,5.8vw,5.9rem)] font-black leading-[0.9] tracking-normal text-brand-navy-deep">
                Cari libur panjang tanpa nebak-nebak.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600 sm:text-lg">
                Lihat libur nasional, cuti bersama, akhir pekan, dan
                tanggal cuti paling menguntungkan tahun ini dalam satu peta.
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
              label="Tanggal cuti"
              value={recommendedLeaveDays.length}
              tone="teal"
            />
          </section>
        </header>

        <section className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col gap-4">

            <div className="border-2 border-brand-navy bg-white p-4 shadow-[8px_8px_0_var(--color-brand-navy)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Pola kerja
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-black text-brand-navy-deep">
                    {isSixDayWorkWeek ? "6 hari kerja" : "5 hari kerja"}
                  </h2>
                </div>
                <Switch
                  checked={isSixDayWorkWeek}
                  onCheckedChange={setIsSixDayWorkWeek}
                  className="data-checked:bg-brand-navy"
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {isSixDayWorkWeek
                  ? "Sabtu dihitung hari kerja. Rekomendasi fokus ke Minggu, libur nasional, dan cuti bersama."
                  : "Sabtu dan Minggu dihitung libur. Pas untuk jadwal kerja Senin sampai Jumat."}
              </p>
            </div>

            <div className="border-2 border-brand-navy bg-brand-teal p-4 shadow-[8px_8px_0_var(--color-brand-navy)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-navy-deep">
                    Jatah cuti
                  </p>
                  <h2 className="mt-1 font-heading text-4xl font-black text-brand-navy-deep">
                    {annualLeaveBudget} hari
                  </h2>
                </div>
                <div className="flex gap-1">
                  <button
                    aria-label="Kurangi jatah cuti"
                    onClick={() => changeLeaveBudget(-1)}
                    className="grid size-9 place-items-center border-2 border-brand-navy bg-white transition hover:bg-brand-navy hover:text-white"
                  >
                    <Minus className="size-4" />
                  </button>
                  <button
                    aria-label="Tambah jatah cuti"
                    onClick={() => changeLeaveBudget(1)}
                    className="grid size-9 place-items-center border-2 border-brand-navy bg-white transition hover:bg-brand-navy hover:text-white"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-brand-navy-deep/80">
                Sistem memilih rencana tanpa bentrok yang memberi libur beruntun
                paling panjang.
              </p>
            </div>

            <BestPlanCard
              annualPlan={annualPlan}
              leaveEfficiency={leaveEfficiency}
            />

            <AnnualPlanList
              annualPlan={annualPlan}
              isLoading={isLoadingHolidays}
              selectedIndex={selectedPlanIndex}
              onSelect={setSelectedPlanIndex}
            />
          </aside>

          <section className="min-w-0 border-2 border-brand-navy bg-[#f7f9fc] p-3 shadow-[8px_8px_0_var(--color-brand-navy)] sm:p-4">
            <div className="mb-4 flex flex-col gap-3 border-b-2 border-brand-navy pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="mt-1 mb-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Peta tahun {year}
                </p>
                <h2 className="font-heading text-3xl font-black text-brand-navy-deep sm:text-4xl">
                  Semua peluang libur dalam 12 bulan.
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-black w-full items-end justify-end-safe">
                <LegendDot className="bg-red-600" label="Libur nasional" />
                <LegendDot className="bg-sky-300" label="Cuti bersama" />
                <LegendDot className="bg-brand-teal" label="Tanggal cuti" />
                <LegendDot className="bg-slate-200" label="Akhir pekan" />
              </div>
            </div>

            <div className="relative">
              {isLoadingHolidays && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-[#f7f9fc]/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3 border-2 border-brand-navy bg-white px-4 py-3 font-black shadow-[5px_5px_0_var(--color-brand-navy)]">
                    <Loader2 className="size-5 animate-spin text-brand-teal" />
                    Memuat hari libur...
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3 mt-10">
                {months.map((days, monthIndex) => (
                  <MonthCalendar
                    key={monthIndex}
                    days={days}
                    monthIndex={monthIndex}
                    year={year}
                    holidayMap={holidayMap}
                    recommendedLeaveDays={recommendedLeaveDays}
                    isSixDayWorkWeek={isSixDayWorkWeek}
                    highlightedDates={highlightedDates}
                  />
                ))}
              </div>
            </div>
          </section>
        </section>

        <footer className="mt-6 mb-8 relative">
          <div className="absolute inset-0 translate-x-3 translate-y-3 border-2 border-brand-navy bg-brand-teal" />

          <div className="relative border-2 border-brand-navy bg-white p-6 sm:p-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

            <div className="shrink-0 group">
              <Image src="/text-logo.png" alt="Logo" width={260} height={260} className="h-28 sm:h-36 w-auto object-contain" priority />
            </div>

            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="border-y-2 border-brand-navy py-5 relative">
                <div className="absolute left-0 top-0 w-2 h-full bg-brand-teal hidden lg:block" />
                <p className="font-heading text-xl sm:text-2xl font-black text-brand-navy-deep uppercase tracking-widest leading-snug lg:pl-6">
                  Nggak Usah <br className="hidden lg:block"/>Nebak-Nebak Lagi.
                </p>
                <p className="mt-3 text-sm sm:text-base font-semibold leading-relaxed text-slate-600 max-w-xl mx-auto lg:mx-0 lg:pl-6">
                  Senjata rahasia buat ngakalin jatah cuti. Susun libur panjang impianmu dengan cerdas tanpa pusing melototin tanggal merah satu-satu.
                </p>
              </div>
            </div>
          </div>
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
  tone: "red" | "blue" | "teal";
}) {
  const toneClasses = {
    red: "bg-red-600 text-white",
    blue: "bg-sky-300 text-sky-950",
    teal: "bg-brand-teal text-brand-navy-deep",
  };

  return (
    <div className="flex min-h-28 items-start gap-3 border-2 border-brand-navy bg-white p-4 shadow-[5px_5px_0_var(--color-brand-navy)] xl:block xl:min-h-36">
      <div
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center border-2 border-brand-navy xl:mb-4 xl:size-11",
          toneClasses[tone]
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 font-heading text-4xl font-black leading-none text-brand-navy-deep">{value}</p>
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-brand-navy bg-white px-2 py-1">
      <span className={cn("size-3 border border-brand-navy", className)} />
      {label}
    </span>
  );
}
