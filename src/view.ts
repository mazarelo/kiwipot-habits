import {
  addHabit,
  bestStreak,
  type Day,
  deleteHabit,
  doneIn,
  type Habit,
  type Habits,
  lastDays,
  MAX_NAME,
  renameHabit,
  streak,
  toggleDay,
} from './habits.ts';
import { fill, type Strings } from './strings.ts';

// The tracker on screen, with Kiwipot's kit (kp- classes): in the note, the last 7 days to tick; on its page, the last
// 30 and how each habit is going. Drawn again after each change.

export interface ViewOptions {
  root: HTMLElement;
  page: boolean;
  // Saves a change (the block's data)
  onChange: (habits: Habits) => void;
  onOpenPage: () => void;
  // Kiwipot's menu and confirmation, where the app has them; the tracker draws its own otherwise
  menu?: (items: { id: string; label: string; danger?: boolean }[], anchor: Element) => Promise<string | null>;
  confirm?: (question: { title: string; message: string; confirm: string; danger: true }) => Promise<boolean>;
  now?: () => Date;
}

export interface View {
  update(habits: Habits): void;
  setOptions(options: { strings: Strings; locale: string; readOnly: boolean }): void;
}

export const STYLES = `
html, body { margin: 0; background: transparent; }
.habits { padding: 2px 0; }
.habits--page { padding: 16px; max-width: 980px; margin: 0 auto; }
.habits__grid { display: grid; gap: 4px 6px; align-items: center; overflow-x: auto; padding-bottom: 2px; }
.habits__day-name { font-size: 11px; font-weight: 600; text-align: center; color: var(--kiwipot-ink-3); text-transform: uppercase; }
.habits__day-name--today { color: var(--kiwipot-accent-text); }
.habits__name { justify-content: flex-start; min-width: 0; overflow: hidden; text-overflow: ellipsis; font-weight: 600; color: var(--kiwipot-ink); }
.habits__name-text { padding: 0 2px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.habits__cell {
  display: grid; place-items: center; width: 32px; height: 32px; margin: 0 auto; padding: 0;
  border: 1.5px solid var(--kiwipot-line-strong); border-radius: 50%; background: none; color: #fff; cursor: pointer;
}
.habits__cell[aria-pressed='true'] { border-color: var(--kiwipot-accent); background: var(--kiwipot-accent); }
.habits__cell--today { border-style: dashed; border-color: var(--kiwipot-accent); }
.habits__cell:disabled { cursor: default; }
.habits__cell:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--kiwipot-surface), 0 0 0 4px var(--kiwipot-accent); }
.habits__streak { white-space: nowrap; }
.habits__stats { font-size: 12px; color: var(--kiwipot-ink-3); }
.habits__cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }
.habits__calendar { display: grid; grid-template-columns: repeat(7, 36px); gap: 6px; justify-content: start; }
.habits__date { font-size: 11px; color: var(--kiwipot-ink-3); }
.habits__form { display: flex; gap: 6px; align-items: center; }
.habits__form .kp-input { flex: 1; min-width: 0; }
@media (pointer: coarse) { .habits__cell { width: 36px; height: 36px; } }
`;

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) => {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
};

const icon = (name: string) => `<span class="kp-icon kp-icon--${name}" aria-hidden="true"></span>`;

const iconButton = (name: string, label: string, onClick: (event: MouseEvent) => void, extra = '') => {
  const button = element('button', `kp-icon-button kp-icon-button--small ${extra}`.trim());
  button.type = 'button';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.innerHTML = icon(name);
  button.addEventListener('click', onClick);
  return button;
};

export const createView = (options: ViewOptions): View => {
  const { root, page } = options;
  const now = options.now ?? (() => new Date());
  let habits: Habits = { v: 1, habits: [], gone: [] };
  let strings: Strings | undefined;
  let locale = 'en';
  let readOnly = false;
  // A habit being named (a new one: 'new'), or one whose delete is being asked here (no app confirmation)
  let editing: string | null = null;
  let asking: string | null = null;

  const change = (next: Habits) => {
    habits = next;
    render();
    options.onChange(next);
  };

  const dayName = (day: Day, style: 'narrow' | 'long') => {
    const [year, month, date] = day.split('-').map(Number);
    const format = style === 'narrow' ? { weekday: 'narrow' as const } : { weekday: 'long' as const, day: 'numeric' as const, month: 'long' as const };
    return new Intl.DateTimeFormat(locale, format).format(new Date(year, month - 1, date));
  };

  // A field to name a habit. Not a <form>: a plugin's frame can't submit forms (its sandbox has no allow-forms), so
  // Save and Enter save it
  const nameForm = (s: Strings, habit?: Habit) => {
    const form = element('div', 'habits__form');
    const input = element('input', 'kp-input');
    input.maxLength = MAX_NAME;
    input.value = habit?.name ?? '';
    input.placeholder = s.placeholder;
    input.setAttribute('aria-label', habit ? s.rename : s.newHabit);
    const close = () => {
      editing = null;
      render();
    };
    const commit = () => {
      editing = null;
      const time = Date.now();
      change(habit ? renameHabit(habits, habit.id, input.value, time) : addHabit(habits, input.value, time));
    };
    const save = element('button', 'kp-button kp-button--primary kp-button--small', s.save);
    save.type = 'button';
    save.addEventListener('click', commit);
    form.append(input, save, iconButton('x', s.cancel, close));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      } else if (event.key === 'Escape') {
        close();
      }
    });
    setTimeout(() => input.focus(), 0);
    return form;
  };

  const remove = async (s: Strings, habit: Habit) => {
    if (options.confirm) {
      const sure = await options
        .confirm({ title: fill(s.deleteQuestion, { habit: habit.name }), message: s.deleteText, confirm: s.delete, danger: true })
        .catch(() => undefined);
      if (sure === undefined) {
        asking = habit.id;
        render();
      } else if (sure) {
        change(deleteHabit(habits, habit.id));
      }
      return;
    }
    asking = habit.id;
    render();
  };

  const openMenu = async (s: Strings, habit: Habit, anchor: Element) => {
    const choice = options.menu
      ? await options
          .menu(
            [
              { id: 'rename', label: s.rename },
              { id: 'delete', label: s.delete, danger: true },
            ],
            anchor
          )
          .catch(() => 'own')
      : 'own';
    if (choice === 'rename') {
      editing = habit.id;
      render();
    } else if (choice === 'delete') {
      void remove(s, habit);
    } else if (choice === 'own') {
      // No menu from the app: the habit's own buttons
      editing = habit.id;
      render();
    }
  };

  const render = () => {
    const s = strings;
    if (!s) {
      return;
    }
    const today = now();
    const days = lastDays(today, page ? 30 : 7);
    const todayKey = days[days.length - 1];
    const wrapper = element('div', `habits kp-stack${page ? ' habits--page' : ''}`);

    const head = element('div', 'kp-inline');
    head.append(element('span', 'kp-section-label', s.title), element('span', 'kp-spacer'));
    if (!page) {
      head.append(iconButton('maximize', s.open, () => options.onOpenPage()));
    }
    wrapper.append(head);

    if (habits.habits.length === 0 && editing !== 'new') {
      const empty = element('div', 'kp-empty');
      empty.innerHTML = icon('check-circle');
      empty.append(element('span', '', s.empty));
      wrapper.append(empty);
    }

    // A habit being renamed, or asked about before it is deleted, instead of its row
    const replaced = (habit: Habit): HTMLElement | null => {
      if (editing === habit.id) {
        return nameForm(s, habit);
      }
      if (asking !== habit.id) {
        return null;
      }
      const question = element('div', 'kp-inline');
      const no = element('button', 'kp-button kp-button--small', s.cancel);
      const yes = element('button', 'kp-button kp-button--danger kp-button--small', s.delete);
      no.type = yes.type = 'button';
      no.addEventListener('click', () => {
        asking = null;
        render();
      });
      yes.addEventListener('click', () => {
        asking = null;
        change(deleteHabit(habits, habit.id));
      });
      question.append(element('span', '', fill(s.deleteQuestion, { habit: habit.name })), no, yes);
      return question;
    };

    const nameOf = (habit: Habit) => {
      if (readOnly) {
        return element('span', 'habits__name-text', habit.name);
      }
      const name = element('button', 'kp-button kp-button--quiet kp-button--small habits__name', habit.name);
      name.type = 'button';
      name.setAttribute('aria-label', fill(s.options, { habit: habit.name }));
      name.addEventListener('click', () => void openMenu(s, habit, name));
      return name;
    };

    const cellOf = (habit: Habit, day: Day, label?: string) => {
      const done = habit.done.includes(day);
      const cell = element('button', `habits__cell${day === todayKey && !done ? ' habits__cell--today' : ''}`);
      cell.type = 'button';
      cell.disabled = readOnly;
      cell.setAttribute('aria-pressed', String(done));
      cell.setAttribute('aria-label', fill(s.toggle, { habit: habit.name, day: dayName(day, 'long') }));
      if (done) {
        cell.innerHTML = icon('check');
      } else if (label) {
        cell.append(element('span', 'habits__date', label));
      }
      cell.addEventListener('click', () => change(toggleDay(habits, habit.id, day, Date.now())));
      return cell;
    };

    const streakOf = (habit: Habit) => {
      const run = streak(habit, today);
      return run > 0 ? element('span', 'kp-badge kp-badge--accent habits__streak', fill(s.streak, { n: run })) : element('span');
    };

    if (habits.habits.length > 0 && !page) {
      // In the note: a row per habit, the last 7 days
      const grid = element('div', 'habits__grid');
      grid.style.gridTemplateColumns = `minmax(120px, 1fr) repeat(${days.length}, 36px) auto`;
      grid.append(element('span'));
      for (const day of days) {
        const name = element('span', `habits__day-name${day === todayKey ? ' habits__day-name--today' : ''}`, dayName(day, 'narrow'));
        name.title = dayName(day, 'long');
        grid.append(name);
      }
      grid.append(element('span'));
      for (const habit of habits.habits) {
        const other = replaced(habit);
        if (other) {
          other.style.gridColumn = '1 / -1';
          grid.append(other);
          continue;
        }
        grid.append(nameOf(habit), ...days.map((day) => cellOf(habit, day)), streakOf(habit));
      }
      wrapper.append(grid);
    }

    if (habits.habits.length > 0 && page) {
      // On its page: a card per habit, its last five weeks as a calendar (Monday first), and how it is going
      const weekday = (today.getDay() + 6) % 7;
      const calendar = lastDays(today, 28 + weekday + 1);
      const month = lastDays(today, 30);
      const cards = element('div', 'habits__cards');
      for (const habit of habits.habits) {
        const card = element('section', 'kp-card kp-stack habits__card');
        const other = replaced(habit);
        if (other) {
          card.append(other);
          cards.append(card);
          continue;
        }
        const head = element('div', 'kp-inline');
        head.append(nameOf(habit), element('span', 'kp-spacer'), streakOf(habit));
        const weeks = element('div', 'habits__calendar');
        // A week from Monday (1 January 2024) to Sunday, for the names of the days
        for (const day of lastDays(new Date(2024, 0, 7), 7)) {
          weeks.append(element('span', 'habits__day-name', dayName(day, 'narrow')));
        }
        for (const day of calendar) {
          weeks.append(cellOf(habit, day, String(Number(day.slice(-2)))));
        }
        card.append(
          head,
          weeks,
          element('span', 'habits__stats', `${fill(s.thisMonth, { n: doneIn(habit, month) })} · ${fill(s.best, { n: bestStreak(habit) })}`)
        );
        cards.append(card);
      }
      wrapper.append(cards);
    }

    if (!readOnly) {
      if (editing === 'new') {
        wrapper.append(nameForm(s));
      } else if (habits.habits.length < 30) {
        const add = element('button', 'kp-button kp-button--quiet kp-button--small');
        add.type = 'button';
        add.innerHTML = icon('plus');
        add.append(s.add);
        add.style.alignSelf = 'flex-start';
        add.addEventListener('click', () => {
          editing = 'new';
          render();
        });
        wrapper.append(add);
      }
    }

    root.replaceChildren(wrapper);
  };

  return {
    update(next) {
      habits = next;
      if (editing && editing !== 'new' && !next.habits.some((habit) => habit.id === editing)) {
        editing = null;
      }
      render();
    },
    setOptions(next) {
      ({ strings, locale, readOnly } = next);
      render();
    },
  };
};
