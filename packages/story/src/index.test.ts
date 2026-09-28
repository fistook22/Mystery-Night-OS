import { describe, expect, it } from 'vitest';
import { STORIES, applySkin, getStory, lintStory } from './index.js';

describe('stories', () => {
  it('bundles the Illustrator Heist and it lints clean', () => {
    const s = getStory('illustrator-heist');
    expect(s).toBeDefined();
    expect(lintStory(s!)).toEqual([]);
  });

  it('only returns registered stories (no path lookups)', () => {
    expect(getStory('../package')).toBeUndefined();
    expect(getStory('constructor')).toBeUndefined();
  });

  it('applies skins deeply and leaves unknown placeholders alone', () => {
    const s = STORIES['illustrator-heist']!;
    const skinned = applySkin(s, s.skins.sellable!);
    expect(JSON.stringify(skinned)).not.toContain('{card}');
    expect(skinned.premise).toContain('Noctyra Illustrator');
    expect(applySkin('רמז: {hidingPlace}', {}, { hidingPlace: 'בארון' })).toBe('רמז: בארון');
    expect(applySkin('{nope}', {})).toBe('{nope}');
  });

  it('catches broken references', () => {
    const s = structuredClone(STORIES['illustrator-heist']!);
    s.beats[0]!.release = ['missing_clue'];
    s.solution.culprits = ['nobody'];
    const problems = lintStory(s);
    expect(problems.some((p) => p.includes('missing_clue'))).toBe(true);
    expect(problems.some((p) => p.includes('nobody'))).toBe(true);
  });
});
