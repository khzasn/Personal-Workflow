/**
 * src/features/tasks/recurrence/generator.ts
 * Algoritma murni untuk menghasilkan tanggal-tanggal kejadian (occurrence dates)
 * dalam rolling window (default 30-60 hari). Idempotent dan aman terhadap zona waktu.
 */

import {
  addDays,
  addMonths,
  addWeeks,
  format,
  getDay,
  getDaysInMonth,
  isAfter,
  isBefore,
  parseISO,
  setDate,
} from "date-fns";
import type { RecurrenceRule } from "@/types";

interface GenerateOccurrencesOptions {
  rule: RecurrenceRule;
  startsOn: string; // YYYY-MM-DD
  endsOn?: string | null; // YYYY-MM-DD
  windowDays?: number; // default 60 hari
  fromDate?: string; // default startsOn
}

/**
 * Konversi getDay() date-fns (0=Minggu, 1=Senin, ..., 6=Sabtu)
 * ke standar ISO 1-7 (1=Senin, ..., 7=Minggu)
 */
function toIsoWeekday(dayIdx: number): number {
  return dayIdx === 0 ? 7 : dayIdx;
}

/**
 * Menghasilkan array tanggal (format YYYY-MM-DD) yang memenuhi aturan perulangan.
 */
export function generateOccurrenceDates({
  rule,
  startsOn,
  endsOn,
  windowDays = 60,
  fromDate,
}: GenerateOccurrencesOptions): string[] {
  if (rule.frequency === "none") {
    return [startsOn];
  }

  const startDate = parseISO(startsOn);
  const effectiveFromDate = fromDate ? parseISO(fromDate) : startDate;
  const windowEndDate = addDays(effectiveFromDate, windowDays);
  const seriesEndDate = endsOn || rule.endsOn ? parseISO(endsOn || rule.endsOn!) : null;

  // Batas akhir perulangan adalah yang paling awal antara batas window atau batas seri
  const cutoffDate = seriesEndDate && isBefore(seriesEndDate, windowEndDate)
    ? seriesEndDate
    : windowEndDate;

  const dates: string[] = [];
  const interval = Math.max(1, rule.interval || 1);

  if (rule.frequency === "daily") {
    let current = startDate;
    while (!isAfter(current, cutoffDate)) {
      if (!isBefore(current, effectiveFromDate)) {
        dates.push(format(current, "yyyy-MM-dd"));
      }
      current = addDays(current, interval);
    }
  } else if (rule.frequency === "weekday") {
    // Senin s/d Jumat saja (1-5)
    let current = startDate;
    while (!isAfter(current, cutoffDate)) {
      const isoDay = toIsoWeekday(getDay(current));
      if (isoDay >= 1 && isoDay <= 5) {
        if (!isBefore(current, effectiveFromDate)) {
          dates.push(format(current, "yyyy-MM-dd"));
        }
      }
      current = addDays(current, 1);
    }
  } else if (rule.frequency === "weekly") {
    // Hari tertentu dalam seminggu, berulang setiap 'interval' minggu
    const selectedDays = rule.weekdays && rule.weekdays.length > 0
      ? rule.weekdays
      : [toIsoWeekday(getDay(startDate))];

    let weekCursor = startDate;
    while (!isAfter(weekCursor, cutoffDate)) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const candidate = addDays(weekCursor, dayOffset);
        if (isAfter(candidate, cutoffDate)) break;
        if (isBefore(candidate, startDate)) continue;

        const candidateIsoDay = toIsoWeekday(getDay(candidate));
        if (selectedDays.includes(candidateIsoDay)) {
          if (!isBefore(candidate, effectiveFromDate)) {
            dates.push(format(candidate, "yyyy-MM-dd"));
          }
        }
      }
      weekCursor = addWeeks(weekCursor, interval);
    }
  } else if (rule.frequency === "monthly") {
    // Tanggal yang sama setiap bulan (clamp aman jika tanggal melebihi jumlah hari dalam bulan)
    const targetDayNumber = startDate.getDate();
    let monthCursor = startDate;

    while (!isAfter(monthCursor, cutoffDate)) {
      const daysInCurrentMonth = getDaysInMonth(monthCursor);
      const clampedDay = Math.min(targetDayNumber, daysInCurrentMonth);
      const candidate = setDate(monthCursor, clampedDay);

      if (!isAfter(candidate, cutoffDate) && !isBefore(candidate, startDate)) {
        if (!isBefore(candidate, effectiveFromDate)) {
          dates.push(format(candidate, "yyyy-MM-dd"));
        }
      }
      monthCursor = addMonths(monthCursor, interval);
    }
  } else if (rule.frequency === "custom") {
    // Custom: Bisa daily interval atau weekly dengan target weekdays
    if (rule.weekdays && rule.weekdays.length > 0) {
      let weekCursor = startDate;
      while (!isAfter(weekCursor, cutoffDate)) {
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const candidate = addDays(weekCursor, dayOffset);
          if (isAfter(candidate, cutoffDate)) break;
          if (isBefore(candidate, startDate)) continue;

          const candidateIsoDay = toIsoWeekday(getDay(candidate));
          if (rule.weekdays.includes(candidateIsoDay)) {
            if (!isBefore(candidate, effectiveFromDate)) {
              dates.push(format(candidate, "yyyy-MM-dd"));
            }
          }
        }
        weekCursor = addWeeks(weekCursor, interval);
      }
    } else {
      let current = startDate;
      while (!isAfter(current, cutoffDate)) {
        if (!isBefore(current, effectiveFromDate)) {
          dates.push(format(current, "yyyy-MM-dd"));
        }
        current = addDays(current, interval);
      }
    }
  }

  // Hilangkan duplikasi dan urutkan tanggal
  return Array.from(new Set(dates)).sort();
}
