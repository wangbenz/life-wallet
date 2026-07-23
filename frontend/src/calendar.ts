export type CalendarDay = {
  day: number;
  disabled: boolean;
  value: string;
};

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const now = new Date();
  return {
    year: Number.isFinite(year) ? year : now.getFullYear(),
    month: Number.isFinite(month) ? month - 1 : now.getMonth(),
    day: Number.isFinite(day) ? day : 1,
  };
}

export function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getYearPageStart(year: number) {
  return Math.floor(year / 12) * 12;
}

export function getCalendarMonth(year: number, month: number, maximumDate: string) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const days: CalendarDay[] = Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    const value = toIsoDate(year, month, day);
    return { day, value, disabled: value > maximumDate };
  });
  return { firstWeekday, days };
}
