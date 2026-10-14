import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addHabit,
  bestStreak,
  dayOf,
  deleteHabit,
  doneIn,
  emptyHabits,
  habitsOf,
  lastDays,
  mergeHabits,
  renameHabit,
  streak,
  toggleDay,
} from '../src/habits.ts';

// Wednesday 14 October 2026, in the evening
const TODAY = new Date(2026, 9, 14, 20);

describe('habits', () => {
  it('reads any block data, keeping what is sound', () => {
    assert.deepEqual(habitsOf(null), emptyHabits());
    assert.deepEqual(
      habitsOf({ habits: [{ id: 'a', name: 'Read', done: ['2026-10-14', 'nope', '2026-10-13', '2026-10-14'] }, 5] }),
      { v: 1, habits: [{ id: 'a', name: 'Read', done: ['2026-10-13', '2026-10-14'], at: 0 }], gone: [] }
    );
    assert.deepEqual(habitsOf({ habits: [{ id: 'a', name: 'Read' }], gone: ['a'] }).habits, []);
  });

  it('counts days in the local calendar', () => {
    assert.equal(dayOf(TODAY), '2026-10-14');
    assert.equal(dayOf(new Date(2026, 0, 1), -1), '2025-12-31');
    assert.deepEqual(lastDays(TODAY, 3), ['2026-10-12', '2026-10-13', '2026-10-14']);
  });

  it('adds, renames, ticks and deletes habits', () => {
    let habits = addHabit(emptyHabits(), '  Read 20 minutes ', 1);
    assert.equal(habits.habits[0].name, 'Read 20 minutes');
    assert.equal(addHabit(habits, '   ', 2), habits);
    const { id } = habits.habits[0];

    habits = toggleDay(habits, id, '2026-10-14', 3);
    habits = toggleDay(habits, id, '2026-10-13', 4);
    assert.deepEqual(habits.habits[0].done, ['2026-10-13', '2026-10-14']);
    habits = toggleDay(habits, id, '2026-10-14', 5);
    assert.deepEqual(habits.habits[0].done, ['2026-10-13']);

    habits = renameHabit(habits, id, 'Read', 6);
    assert.equal(habits.habits[0].name, 'Read');
    habits = deleteHabit(habits, id);
    assert.deepEqual(habits.habits, []);
    assert.deepEqual(habits.gone, [id]);
  });

  it("counts a streak up to today, and doesn't break it before today is over", () => {
    const habit = { id: 'a', name: 'Run', done: ['2026-10-11', '2026-10-12', '2026-10-13'], at: 0 };
    assert.equal(streak(habit, TODAY), 3);
    assert.equal(streak({ ...habit, done: [...habit.done, '2026-10-14'] }, TODAY), 4);
    assert.equal(streak({ ...habit, done: ['2026-10-10', '2026-10-12'] }, TODAY), 0);
    assert.equal(bestStreak({ ...habit, done: ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-05'] }), 3);
    assert.equal(doneIn(habit, lastDays(TODAY, 7)), 3);
  });

  it("merges another device's copy: the newer of each habit, deletions kept", () => {
    const mine = {
      v: 1 as const,
      habits: [
        { id: 'a', name: 'Read', done: ['2026-10-14'], at: 10 },
        { id: 'b', name: 'Run', done: [], at: 10 },
      ],
      gone: [],
    };
    const theirs = {
      v: 1 as const,
      habits: [
        { id: 'a', name: 'Read', done: ['2026-10-13'], at: 5 },
        { id: 'b', name: 'Run 5 km', done: ['2026-10-14'], at: 20 },
        { id: 'c', name: 'Stretch', done: [], at: 15 },
        { id: 'd', name: 'Gone', done: [], at: 1 },
      ],
      gone: ['d'],
    };
    const merged = mergeHabits(mine, theirs);
    assert.deepEqual(
      merged.habits.map((habit) => [habit.id, habit.name, habit.done]),
      [
        ['a', 'Read', ['2026-10-14']],
        ['b', 'Run 5 km', ['2026-10-14']],
        ['c', 'Stretch', []],
      ]
    );
    assert.deepEqual(mergeHabits(deleteHabit(mine, 'a'), theirs).habits.map((habit) => habit.id), ['b', 'c']);
  });
});
