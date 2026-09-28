import { describe, expect, it } from 'vitest';
import { simulateParty } from './simulate.js';

describe('full party simulation', () => {
  it.each([6, 7, 9])('plays The Illustrator Heist end to end with %i players', async (players) => {
    const r = await simulateParty({ players });
    expect(r.leaks).toEqual([]);
    expect(r.finaleReached).toBe(true);
    expect(r.cast).toEqual(expect.arrayContaining(['eitan', 'noa', 'yoni', 'gal', 'maya', 'rotem']));
    expect(r.cluesFound).toBe(r.cluesTotal);
    expect(r.culpritsNamedBy).toBeGreaterThan(0);
    expect(r.log.join('\n')).toContain('right number → cert_lookup');
    expect(r.log.join('\n')).toContain('the game clock reads 80 min');
  });
});
