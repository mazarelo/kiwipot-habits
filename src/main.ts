import { emptyHabits, type Habits, habitsOf, mergeHabits } from './habits.ts';
import { connect } from './kiwipot-plugin-sdk.ts';
import { preview } from './preview.ts';
import { stringsFor } from './strings.ts';
import { createView, STYLES } from './view.ts';

// The habit tracker: habits to tick each day, in one block of a note, run in Kiwipot's sandbox. Its data is the
// block's; its picture, for public pages, is each habit and its last 7 days.
const start = async () => {
  const kiwipot = await connect<Habits & Record<string, unknown>>();
  const style = document.createElement('style');
  style.textContent = STYLES;
  document.head.append(style);
  document.body.classList.add('kp-root');

  const { view, locale, readOnly } = kiwipot.ui.current;
  let habits = habitsOf(kiwipot.block.getData());
  const strings = () => stringsFor(kiwipot.ui.current.locale);
  const root = document.createElement('div');
  document.body.append(root);

  // Saved as it changes; the picture goes along when it changed
  let lastPicture = '';
  const save = (next: Habits) => {
    habits = next;
    const picture = preview(next, strings(), new Date());
    const changed = picture !== lastPicture;
    lastPicture = picture;
    kiwipot.block
      .setData(next as Habits & Record<string, unknown>, changed ? { preview: picture } : {})
      .catch((error: unknown) => console.error('The habits were not saved:', error));
  };

  const hasMenus = kiwipot.ui.supports('ui.menu') && kiwipot.ui.supports('ui.confirm');
  const screen = createView({
    root,
    page: view === 'page',
    onChange: save,
    onOpenPage: () => void kiwipot.ui.openPage().catch(() => undefined),
    menu: hasMenus ? (items, anchor) => kiwipot.ui.menu(items, { anchor }) : undefined,
    confirm: hasMenus ? (question) => kiwipot.ui.confirm(question) : undefined,
  });
  screen.setOptions({ strings: strings(), locale, readOnly });
  screen.update(habits);

  // Another device, or the block's other view, changed it: both are kept, the newer of each habit
  kiwipot.block.onChange((data) => {
    habits = mergeHabits(habits, habitsOf(data));
    screen.update(habits);
  });
  kiwipot.ui.onChange((ui) => screen.setOptions({ strings: stringsFor(ui.locale), locale: ui.locale, readOnly: ui.readOnly }));
  kiwipot.ui.autoResize();

  // A new block starts with its picture, so a public page shows something
  if (habits.habits.length === 0 && !readOnly && Object.keys(kiwipot.block.getData()).length === 0) {
    save(emptyHabits());
  }
};

void start();
