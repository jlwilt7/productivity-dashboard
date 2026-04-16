import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

export const DATE_FORMAT = 'YYYY-MM-DD';

export const todayISO = (): string => dayjs().format(DATE_FORMAT);

export const formatDate = (d: string | Date): string =>
  dayjs(d).format(DATE_FORMAT);

export const formatPretty = (d: string | Date): string =>
  dayjs(d).format('MMM D, YYYY');

export const startOfWeekISO = (d: string | Date = new Date()): string =>
  dayjs(d).startOf('isoWeek').format(DATE_FORMAT);

export const endOfWeekISO = (d: string | Date = new Date()): string =>
  dayjs(d).endOf('isoWeek').format(DATE_FORMAT);

export const startOfMonthISO = (d: string | Date = new Date()): string =>
  dayjs(d).startOf('month').format(DATE_FORMAT);

export const endOfMonthISO = (d: string | Date = new Date()): string =>
  dayjs(d).endOf('month').format(DATE_FORMAT);

export const daysInRange = (start: string, end: string): string[] => {
  const out: string[] = [];
  let cur = dayjs(start);
  const last = dayjs(end);
  while (cur.isBefore(last) || cur.isSame(last, 'day')) {
    out.push(cur.format(DATE_FORMAT));
    cur = cur.add(1, 'day');
  }
  return out;
};

export const lastNDays = (n: number): string[] => {
  const end = dayjs();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(end.subtract(i, 'day').format(DATE_FORMAT));
  }
  return out;
};

export const weekLabel = (d: string | Date = new Date()): string => {
  const start = dayjs(d).startOf('isoWeek');
  const end = dayjs(d).endOf('isoWeek');
  return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`;
};

export const monthLabel = (d: string | Date = new Date()): string =>
  dayjs(d).format('MMMM YYYY');

export const isSameWeek = (a: string, b: string): boolean =>
  dayjs(a).isoWeek() === dayjs(b).isoWeek() &&
  dayjs(a).year() === dayjs(b).year();

export const isSameMonth = (a: string, b: string): boolean =>
  dayjs(a).month() === dayjs(b).month() && dayjs(a).year() === dayjs(b).year();
