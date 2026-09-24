export const WEEK_DAYS = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
] as const;

export type DayKey = (typeof WEEK_DAYS)[number]["key"];

export type DayHours = {
  open: boolean;
  from: string;
  to: string;
};

export type SpecialDay = {
  id: string;
  date: string;
  name: string;
  open: boolean;
  from: string;
  to: string;
};

export type HoursSettings = {
  showHoursOnStore: boolean;
  autoCloseOutsideHours: boolean;
  pauseNewOrders: boolean;
};

export type MerchantHoursState = {
  weekly: Record<DayKey, DayHours>;
  special: SpecialDay[];
  holidays: SpecialDay[];
  settings: HoursSettings;
};

export const TIME_OPTIONS = Array.from({ length: 37 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

export function defaultWeekly(): Record<DayKey, DayHours> {
  return {
    mon: { open: true, from: "09:00", to: "23:00" },
    tue: { open: true, from: "09:00", to: "23:00" },
    wed: { open: true, from: "09:00", to: "23:00" },
    thu: { open: true, from: "09:00", to: "23:00" },
    fri: { open: true, from: "09:00", to: "00:00" },
    sat: { open: true, from: "09:00", to: "00:00" },
    sun: { open: true, from: "10:00", to: "22:00" },
  };
}

export function defaultHolidays(year = new Date().getFullYear()): SpecialDay[] {
  return [
    { id: "rest", date: `${year}-08-16`, name: "Día de la Restauración", open: false, from: "09:00", to: "22:00" },
    { id: "eve", date: `${year}-12-24`, name: "Nochebuena", open: true, from: "09:00", to: "18:00" },
    { id: "xmas", date: `${year}-12-25`, name: "Navidad", open: true, from: "10:00", to: "18:00" },
    { id: "ny", date: `${year + 1}-01-01`, name: "Año Nuevo", open: true, from: "12:00", to: "22:00" },
  ];
}

export function defaultHoursState(): MerchantHoursState {
  return {
    weekly: defaultWeekly(),
    special: [],
    holidays: defaultHolidays(),
    settings: {
      showHoursOnStore: true,
      autoCloseOutsideHours: true,
      pauseNewOrders: false,
    },
  };
}

export function formatTime12(value: string) {
  const [hourRaw, minute] = value.split(":");
  const hour = Number(hourRaw);
  if (hour === 0) return `12:${minute} a. m.`;
  if (hour === 12) return `12:${minute} p. m.`;
  if (hour > 12) return `${hour - 12}:${minute} p. m.`;
  return `${hour}:${minute} a. m.`;
}

export function dayKeyFromDate(date = new Date()): DayKey {
  return WEEK_DAYS[(date.getDay() + 6) % 7].key;
}

function toMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (hour === 0 && minute === 0) return 24 * 60;
  return hour * 60 + minute;
}

export function isWithinRange(from: string, to: string, date = new Date()) {
  const now = date.getHours() * 60 + date.getMinutes();
  const start = toMinutes(from);
  const end = toMinutes(to);
  if (end <= start) return now >= start || now < end;
  return now >= start && now < end;
}

export function parseOpenHours(raw: unknown): MerchantHoursState {
  const fallback = defaultHoursState();
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Partial<MerchantHoursState> & Record<string, unknown>;

  if (data.weekly && typeof data.weekly === "object") {
    return {
      weekly: { ...fallback.weekly, ...data.weekly },
      special: Array.isArray(data.special) ? data.special : [],
      holidays: Array.isArray(data.holidays) && data.holidays.length > 0 ? data.holidays : fallback.holidays,
      settings: { ...fallback.settings, ...(data.settings ?? {}) },
    };
  }

  const weekly = defaultWeekly();
  for (const day of WEEK_DAYS) {
    const value = data[day.key];
    if (Array.isArray(value) && typeof value[0] === "string") {
      const [from, to] = String(value[0]).split("-");
      weekly[day.key] = { open: true, from: from ?? "09:00", to: to ?? "23:00" };
    }
  }
  return { ...fallback, weekly };
}
