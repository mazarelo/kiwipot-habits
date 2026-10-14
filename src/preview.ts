import { dayOf, type Habits, lastDays, streak } from './habits.ts';
import type { Strings } from './strings.ts';

// The block's picture, for public pages and apps without the plugin: each habit and its last 7 days

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

const ROW = 34;
const TOP = 30;
const NAME_WIDTH = 170;
const DOT = 22;
const GAP = 8;

export const preview = (habits: Habits, strings: Strings, today: Date): string => {
  const days = lastDays(today, 7);
  const rows = habits.habits.slice(0, 12);
  const width = NAME_WIDTH + days.length * (DOT + GAP) + 50;
  const height = TOP + Math.max(rows.length, 1) * ROW + 8;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, sans-serif">`,
    `<text x="0" y="18" font-size="12" font-weight="700" fill="#85827b" letter-spacing="0.06em">${escape(strings.title.toUpperCase())}</text>`,
  ];
  rows.forEach((habit, index) => {
    const y = TOP + index * ROW;
    const name = habit.name.length > 22 ? `${habit.name.slice(0, 21)}…` : habit.name;
    parts.push(`<text x="0" y="${y + 16}" font-size="14" font-weight="600" fill="#1f1e1c">${escape(name)}</text>`);
    days.forEach((day, column) => {
      const cx = NAME_WIDTH + column * (DOT + GAP) + DOT / 2;
      const done = habit.done.includes(day);
      parts.push(
        done
          ? `<circle cx="${cx}" cy="${y + 11}" r="${DOT / 2}" fill="#3f7d58"/>`
          : `<circle cx="${cx}" cy="${y + 11}" r="${DOT / 2 - 1}" fill="none" stroke="#cfcbc2" stroke-width="1.5"${day === dayOf(today) ? ' stroke-dasharray="3 3"' : ''}/>`
      );
    });
    const run = streak(habit, today);
    parts.push(`<text x="${width - 40}" y="${y + 16}" font-size="13" font-weight="600" fill="#2f6044">${run > 0 ? run : ''}</text>`);
  });
  parts.push('</svg>');
  return parts.join('');
};
