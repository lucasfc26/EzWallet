import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isToday,
  isYesterday,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ISODate, Period, PeriodPreset } from "../types";

export const toISO = (date: Date): ISODate => format(date, "yyyy-MM-dd");
export const fromISO = (date: ISODate): Date => parseISO(date);

export const todayISO = (): ISODate => toISO(new Date());

export function formatBR(date: ISODate): string {
  return format(fromISO(date), "dd/MM/yyyy");
}

export function formatShort(date: ISODate): string {
  return format(fromISO(date), "dd MMM", { locale: ptBR });
}

export function formatLongDay(date: ISODate): string {
  return format(fromISO(date), "d 'de' MMMM", { locale: ptBR });
}

export function formatWeekday(date: ISODate): string {
  return format(fromISO(date), "EEEE", { locale: ptBR });
}

export function formatMonthLabel(date: Date): string {
  const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function relativeDayLabel(date: ISODate): string {
  const d = fromISO(date);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  const label = format(d, "EEEE", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function buildPeriod(preset: PeriodPreset, ref = new Date()): Period {
  switch (preset) {
    case "today":
      return { preset, from: toISO(startOfDay(ref)), to: toISO(endOfDay(ref)) };
    case "week":
      return {
        preset,
        from: toISO(startOfWeek(ref, { weekStartsOn: 1 })),
        to: toISO(endOfWeek(ref, { weekStartsOn: 1 })),
      };
    case "year":
      return { preset, from: toISO(startOfYear(ref)), to: toISO(endOfYear(ref)) };
    case "month":
    default:
      return {
        preset: "month",
        from: toISO(startOfMonth(ref)),
        to: toISO(endOfMonth(ref)),
      };
  }
}

export function shiftPeriod(period: Period, direction: 1 | -1): Period {
  const from = fromISO(period.from);
  switch (period.preset) {
    case "today": {
      const next = new Date(from);
      next.setDate(next.getDate() + direction);
      return buildPeriod("today", next);
    }
    case "week": {
      const next = new Date(from);
      next.setDate(next.getDate() + direction * 7);
      return buildPeriod("week", next);
    }
    case "year": {
      const next = new Date(from);
      next.setFullYear(next.getFullYear() + direction);
      return buildPeriod("year", next);
    }
    case "month": {
      const next = new Date(from);
      next.setMonth(next.getMonth() + direction, 1);
      return buildPeriod("month", next);
    }
    default: {
      const days = differenceInCalendarDays(fromISO(period.to), from) + 1;
      const nf = new Date(from);
      nf.setDate(nf.getDate() + direction * days);
      const nt = new Date(fromISO(period.to));
      nt.setDate(nt.getDate() + direction * days);
      return { preset: "custom", from: toISO(nf), to: toISO(nt) };
    }
  }
}

export function periodLabel(period: Period): string {
  const from = fromISO(period.from);
  const to = fromISO(period.to);
  switch (period.preset) {
    case "today":
      return isToday(from)
        ? `Hoje, ${format(from, "d 'de' MMM", { locale: ptBR })}`
        : format(from, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    case "week":
      return `${format(from, "d MMM", { locale: ptBR })} — ${format(to, "d MMM yyyy", { locale: ptBR })}`;
    case "month":
      return formatMonthLabel(from);
    case "year":
      return format(from, "yyyy");
    default:
      return `${formatBR(period.from)} — ${formatBR(period.to)}`;
  }
}

export function isInPeriod(date: ISODate, period: Period): boolean {
  return isWithinInterval(fromISO(date), {
    start: startOfDay(fromISO(period.from)),
    end: endOfDay(fromISO(period.to)),
  });
}

export function periodDays(period: Period): number {
  return differenceInCalendarDays(fromISO(period.to), fromISO(period.from)) + 1;
}

export function periodBuckets(
  period: Period,
): { key: string; label: string; from: ISODate; to: ISODate }[] {
  const from = fromISO(period.from);
  const to = fromISO(period.to);
  const days = periodDays(period);

  if (days <= 45) {
    return eachDayOfInterval({ start: from, end: to }).map((d) => ({
      key: toISO(d),
      label: format(d, days <= 10 ? "dd/MM" : "dd", { locale: ptBR }),
      from: toISO(d),
      to: toISO(d),
    }));
  }

  return eachMonthOfInterval({ start: from, end: to }).map((d) => ({
    key: toISO(d),
    label: format(d, "MMM", { locale: ptBR }),
    from: toISO(startOfMonth(d)),
    to: toISO(endOfMonth(d)),
  }));
}

export function daysUntil(date: ISODate): number {
  return differenceInCalendarDays(fromISO(date), startOfDay(new Date()));
}

export function isOverdue(date: ISODate): boolean {
  return daysUntil(date) < 0;
}

export function dueLabel(date: ISODate): string {
  const diff = daysUntil(date);
  if (diff === 0) return "Vence hoje";
  if (diff === 1) return "Vence amanhã";
  if (diff > 1) return `Em ${diff} dias`;
  if (diff === -1) return "Venceu ontem";
  return `Há ${Math.abs(diff)} dias`;
}
