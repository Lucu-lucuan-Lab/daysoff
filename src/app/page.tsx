"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isSameDay,
  isWeekend as isFnsWeekend,
  getDay,
  parseISO
} from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, CheckCircle2, AlertTriangle, Briefcase, Settings2, Info, Loader2 } from 'lucide-react';
import { Holiday } from '@/data/holidays';
import { generateRecommendations, LeaveRecommendation } from '@/lib/recommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Home() {
  const [year, setYear] = useState(2026);
  const [isSixDayWorkWeek, setIsSixDayWorkWeek] = useState(false);
  const [yearHolidays, setYearHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      setIsLoadingHolidays(true);
      try {
        const response = await fetch(`https://libur.deno.dev/api?year=${year}`);
        const data = await response.json();

        // Transform data from API to our Holiday structure
        const formattedHolidays: Holiday[] = data.map((item: any) => ({
          date: item.date,
          name: item.name,
          // Infer Cuti Bersama based on the name
          isCollectiveLeave: item.name.toLowerCase().includes('cuti')
        }));

        setYearHolidays(formattedHolidays);
      } catch (error) {
        console.error("Failed to fetch holidays:", error);
      } finally {
        setIsLoadingHolidays(false);
      }
    };

    fetchHolidays();
  }, [year]);

  // Generate days for the entire year
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const start = startOfMonth(new Date(year, i, 1));
      const end = endOfMonth(start);
      return eachDayOfInterval({ start, end });
    });
  }, [year]);

  const recommendations = useMemo(() => {
    return generateRecommendations(year, yearHolidays, isSixDayWorkWeek);
  }, [year, isSixDayWorkWeek, yearHolidays]);

  // Derived statistics
  const totalHolidays = yearHolidays.filter(h => !h.isCollectiveLeave).length;
  const totalCutiBersama = yearHolidays.filter(h => h.isCollectiveLeave).length;

  const recommendedLeaveDays = useMemo(() => {
    const allDates = recommendations.flatMap(r => r.dates);
    // Deduplicate
    const uniqueDates: Date[] = [];
    allDates.forEach(date => {
      if (!uniqueDates.some(ud => isSameDay(ud, date))) {
        uniqueDates.push(date);
      }
    });
    return uniqueDates;
  }, [recommendations]);

  const totalDaysOffAchieved = useMemo(() => {
    // Total weekends + holidays + cuti bersama + recommended leave days
    // that are continuous blocks, but simple calc:
    // If you take all recommended leave days, you get the max benefit.
    // Let's sum the unique days off in the year if you take these leaves.
    let count = 0;
    const allDays = eachDayOfInterval({ start: new Date(year, 0, 1), end: new Date(year, 11, 31) });

    allDays.forEach(day => {
      const isWeekend = isSixDayWorkWeek ? getDay(day) === 0 : (getDay(day) === 0 || getDay(day) === 6);
      const isHoliday = yearHolidays.some(h => h.date === format(day, 'yyyy-MM-dd'));
      const isRecommended = recommendedLeaveDays.some(rd => isSameDay(rd, day));

      if (isWeekend || isHoliday || isRecommended) {
        count++;
      }
    });
    return count;
  }, [year, isSixDayWorkWeek, yearHolidays, recommendedLeaveDays]);

  const getDayClass = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = yearHolidays.find(h => h.date === dateStr);

    if (holiday) {
      return holiday.isCollectiveLeave ? 'bg-blue-500 text-white font-bold' : 'bg-red-500 text-white font-bold';
    }

    const isRecommended = recommendedLeaveDays.some(rd => isSameDay(rd, date));
    if (isRecommended) {
      return 'bg-green-500 text-white font-bold animate-pulse';
    }

    const isWeekend = isSixDayWorkWeek ? getDay(date) === 0 : (getDay(date) === 0 || getDay(date) === 6);
    if (isWeekend) {
      return 'bg-gray-200 text-gray-500';
    }

    return 'hover:bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-3 sm:p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2 md:gap-3">
              <Calendar className="w-7 h-7 md:w-8 md:h-8 text-indigo-600" />
              IndoHoliday Optimizer
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">Maximize your holidays with smart leave recommendations.</p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-2 md:gap-4 bg-gray-50 p-1.5 md:p-2 rounded-lg border border-gray-200 overflow-x-auto">
            <button
              onClick={() => setYear(2024)}
              className={cn("flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-all text-sm md:text-base", year === 2024 ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-900")}
            >
              2024
            </button>
            <button
              onClick={() => setYear(2025)}
              className={cn("flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-all text-sm md:text-base", year === 2025 ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-900")}
            >
              2025
            </button>
            <button
              onClick={() => setYear(2026)}
              className={cn("flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-all text-sm md:text-base", year === 2026 ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-900")}
            >
              2026
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar Dashboard */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-gray-500" />
                  Work Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">6-Day Work Week</label>
                    <p className="text-xs text-gray-500">Only Sunday is off</p>
                  </div>
                  <Switch
                    checked={isSixDayWorkWeek}
                    onCheckedChange={setIsSixDayWorkWeek}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                  Leave Statistics
                </CardTitle>
                <CardDescription>Based on taking all recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Total Days Off Achieved</span>
                  <span className="text-2xl font-bold text-indigo-600">{totalDaysOffAchieved}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <span className="text-sm font-medium text-green-700">Leave Days Spent</span>
                  <span className="text-2xl font-bold text-green-600">{recommendedLeaveDays.length}</span>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Public Holidays</span>
                    <span className="font-semibold">{totalHolidays} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Cuti Bersama</span>
                    <span className="font-semibold">{totalCutiBersama} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200 bg-indigo-50 border-indigo-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-indigo-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {recommendations.length === 0 ? (
                    <p className="text-sm text-indigo-600">No smart leave recommendations found for this configuration.</p>
                  ) : (
                    recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={rec.type === 'bridge' ? 'secondary' : 'default'} className={rec.type === 'mega_break' ? 'bg-indigo-600' : ''}>
                            {rec.type === 'bridge' ? 'Bridge Day' : 'Mega Break'}
                          </Badge>
                          <span className="text-xs font-bold text-gray-500">
                            +{rec.totalDaysOff} days off
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 font-medium">{rec.benefit}</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.dates.map((d, i) => (
                            <span key={i} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-semibold">
                              {format(d, 'dd MMM', { locale: id })}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4 flex items-start gap-3">
                 <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                 <p className="text-xs text-gray-500 leading-relaxed">
                   <strong>Bridge Day (Kejepit):</strong> A single working day between a holiday and a weekend.<br/><br/>
                   <strong>Mega Break:</strong> A strategic block of leave (2-4 days) that unlocks 9+ continuous days off by bridging multiple holidays and weekends.
                 </p>
              </CardContent>
            </Card>
          </div>

          {/* Calendar View */}
          <div className="lg:col-span-3 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 md:gap-6 mb-4 md:mb-6 flex-wrap text-xs md:text-sm font-medium">
              <div className="flex items-center gap-1.5 md:gap-2"><span className="w-3 h-3 md:w-4 md:h-4 rounded-md bg-red-500"></span> Public Holiday</div>
              <div className="flex items-center gap-1.5 md:gap-2"><span className="w-3 h-3 md:w-4 md:h-4 rounded-md bg-blue-500"></span> Cuti Bersama</div>
              <div className="flex items-center gap-1.5 md:gap-2"><span className="w-3 h-3 md:w-4 md:h-4 rounded-md bg-green-500 animate-pulse"></span> Recommended Leave</div>
              <div className="flex items-center gap-1.5 md:gap-2"><span className="w-3 h-3 md:w-4 md:h-4 rounded-md bg-gray-200"></span> Weekend</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative">
              {isLoadingHolidays && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                  <div className="flex flex-col items-center text-indigo-600">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="font-medium text-sm">Loading Holidays...</span>
                  </div>
                </div>
              )}
              {months.map((days, monthIndex) => {
                const monthName = format(new Date(year, monthIndex, 1), 'MMMM', { locale: id });
                // Get empty days for grid alignment
                const firstDay = getDay(days[0]);
                const emptyDays = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 });

                return (
                  <div key={monthIndex} className="border border-gray-100 rounded-xl p-3 md:p-4 bg-gray-50/50">
                    <h3 className="text-center font-bold text-gray-800 mb-3 md:mb-4 capitalize text-lg md:text-base">{monthName}</h3>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 font-semibold text-gray-500">
                      <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div className={!isSixDayWorkWeek ? "text-gray-400" : ""}>Sa</div><div className="text-gray-400">Su</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                      {emptyDays.map((_, i) => (
                        <div key={`empty-${i}`} className="h-10 md:h-8" />
                      ))}
                      {days.map((day, dayIndex) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const holiday = yearHolidays.find(h => h.date === dateStr);

                        return (
                          <div
                            key={dayIndex}
                            title={holiday ? holiday.name : format(day, 'dd MMM yyyy')}
                            className={cn(
                              "h-10 md:h-8 flex items-center justify-center rounded-md text-sm cursor-default transition-colors",
                              getDayClass(day)
                            )}
                          >
                            {format(day, 'd')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
