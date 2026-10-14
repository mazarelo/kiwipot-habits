// The habit tracker's data and what is worked out from it. Pure: no page, no Kiwipot, so it is tested on its own.

// A day, as YYYY-MM-DD in the user's time zone
export type Day = string;

export interface Habit {
  id: string;
  name: string;
  // The days it was done
  done: Day[];
  // When it last changed (ms): two devices' copies keep the newer of each habit
  at: number;
}

export interface Habits {
  v: 1;
  habits: Habit[];
  // Deleted habits' ids: a copy from another device doesn't bring them back
  gone: string[];
}

export const MAX_HABITS = 30;
export const MAX_NAME = 60;
// Days kept per habit: about three years
export const MAX_DAYS = 1100;

export const emptyHabits = (): Habits => ({ v: 1, habits: [], gone: [] });

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The block's data as habits: whatever is missing or broken is left out, so a block always opens. */
export const habitsOf = (data: unknown): Habits => {
  if (!isObject(data)) {
    return emptyHabits();
  }
  const habits = Array.isArray(data.habits)
    ? data.habits
        .filter((habit): habit is Record<string, unknown> => isObject(habit) && typeof habit.id === 'string')
        .map((habit) => ({
          id: habit.id as string,
          name: typeof habit.name === 'string' ? habit.name.slice(0, MAX_NAME) : '',
          done: Array.isArray(habit.done)
            ? [...new Set(habit.done.filter((day): day is string => typeof day === 'string' && DAY.test(day)))].sort()
            : [],
          at: typeof habit.at === 'number' ? habit.at : 0,
        }))
    : [];
  const gone = Array.isArray(data.gone) ? data.gone.filter((id): id is string => typeof id === 'string') : [];
  return { v: 1, habits: habits.filter((habit) => !gone.includes(habit.id)), gone };
};

/** A day in the user's time zone, `offset` days from `from` */
export const dayOf = (from: Date, offset = 0): Day => {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/** The `count` days up to today, oldest first */
export const lastDays = (today: Date, count: number): Day[] =>
  Array.from({ length: count }, (_, index) => dayOf(today, index - count + 1));

const newId = (now: number) => `${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const addHabit = (habits: Habits, name: string, now: number): Habits => {
  const trimmed = name.trim().slice(0, MAX_NAME);
  if (!trimmed || habits.habits.length >= MAX_HABITS) {
    return habits;
  }
  return { ...habits, habits: [...habits.habits, { id: newId(now), name: trimmed, done: [], at: now }] };
};

export const renameHabit = (habits: Habits, id: string, name: string, now: number): Habits => {
  const trimmed = name.trim().slice(0, MAX_NAME);
  if (!trimmed) {
    return habits;
  }
  return {
    ...habits,
    habits: habits.habits.map((habit) => (habit.id === id ? { ...habit, name: trimmed, at: now } : habit)),
  };
};

export const deleteHabit = (habits: Habits, id: string): Habits => ({
  ...habits,
  habits: habits.habits.filter((habit) => habit.id !== id),
  gone: [...new Set([...habits.gone, id])],
});

/** Ticks a day, or unticks it */
export const toggleDay = (habits: Habits, id: string, day: Day, now: number): Habits => ({
  ...habits,
  habits: habits.habits.map((habit) => {
    if (habit.id !== id) {
      return habit;
    }
    const done = habit.done.includes(day) ? habit.done.filter((d) => d !== day) : [...habit.done, day].sort();
    return { ...habit, done: done.slice(-MAX_DAYS), at: now };
  }),
});

/**
 * Days in a row up to today. A day not ticked yet today doesn't break it: the streak is the run up to yesterday, until
 * the day is over.
 */
export const streak = (habit: Habit, today: Date): number => {
  const done = new Set(habit.done);
  let offset = done.has(dayOf(today)) ? 0 : -1;
  let count = 0;
  while (done.has(dayOf(today, offset))) {
    count += 1;
    offset -= 1;
  }
  return count;
};

/** The longest run of days in a row, ever */
export const bestStreak = (habit: Habit): number => {
  let best = 0;
  let run = 0;
  let previous: number | undefined;
  for (const day of habit.done) {
    const [year, month, date] = day.split('-').map(Number);
    const time = Date.UTC(year, month - 1, date);
    run = previous !== undefined && time - previous === 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = time;
  }
  return best;
};

/** How many of these days it was done */
export const doneIn = (habit: Habit, days: Day[]): number => days.filter((day) => habit.done.includes(day)).length;

/**
 * Two copies of the habits (this device's, another's): each habit as the copy that changed it last, deleted ones gone
 * from both. Order: this device's, then the other's new ones.
 */
export const mergeHabits = (mine: Habits, theirs: Habits): Habits => {
  const gone = [...new Set([...mine.gone, ...theirs.gone])];
  const byId = new Map(theirs.habits.map((habit) => [habit.id, habit]));
  const merged = mine.habits.map((habit) => {
    const other = byId.get(habit.id);
    byId.delete(habit.id);
    return other && other.at > habit.at ? other : habit;
  });
  return {
    v: 1,
    habits: [...merged, ...byId.values()].filter((habit) => !gone.includes(habit.id)).slice(0, MAX_HABITS),
    gone,
  };
};
