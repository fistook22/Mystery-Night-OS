import { Story } from './schema.js';
import { illustratorHeist } from './stories/illustrator-heist.js';

export * from './schema.js';

/** Checks cross-references a schema can't express. Returns human-readable problems. */
export function lintStory(story: Story): string[] {
  const problems: string[] = [];
  const clueIds = new Set(story.clues.map((c) => c.id));
  const charIds = new Set(story.characters.map((c) => c.id));
  const npcIds = new Set(story.npcs.map((n) => n.id));
  const toolIds = new Set(story.tools.map((t) => t.id));
  const need = (ok: boolean, msg: string) => ok || problems.push(msg);

  const checkRule = (where: string, r: Story['clues'][number]['unlock']) => {
    if (r.type === 'after') need(clueIds.has(r.clue), `${where}: unknown clue "${r.clue}" in after-rule`);
    if (r.type === 'npc') need(npcIds.has(r.npc), `${where}: unknown npc "${r.npc}"`);
    if (r.type === 'answer') need(toolIds.has(r.tool), `${where}: unknown tool "${r.tool}"`);
  };

  const released = new Set(story.beats.flatMap((b) => b.release));
  for (const c of story.clues) {
    checkRule(`clue ${c.id}`, c.unlock);
    if (c.audience !== 'all')
      for (const a of c.audience) need(charIds.has(a), `clue ${c.id}: unknown audience "${a}"`);
    for (const p of c.pointsTo) need(charIds.has(p), `clue ${c.id}: pointsTo unknown character "${p}"`);
    if (c.unlock.type === 'manual')
      need(released.has(c.id), `clue ${c.id}: manual unlock but no beat releases it`);
  }
  for (const b of story.beats) {
    for (const r of b.release) need(clueIds.has(r), `beat ${b.id}: releases unknown clue "${r}"`);
    for (const n of b.openContacts) need(npcIds.has(n), `beat ${b.id}: opens unknown npc "${n}"`);
    if (b.tv?.scene === 'clue')
      need(clueIds.has(b.tv.clue), `beat ${b.id}: tv shows unknown clue "${b.tv.clue}"`);
  }
  const times = story.beats.map((b) => b.atMin);
  need(
    times.every((t, i) => i === 0 || t >= times[i - 1]!),
    'beats must be sorted by atMin',
  );
  need(story.beats.filter((b) => b.finale).length === 1, 'exactly one beat must start the finale');
  need(
    story.beats.some((b) => b.openVote),
    'some beat must open the vote',
  );

  for (const p of story.feed) {
    need(charIds.has(p.author), `post ${p.id}: unknown author "${p.author}"`);
    if (p.deletedClue) need(clueIds.has(p.deletedClue), `post ${p.id}: unknown clue "${p.deletedClue}"`);
    checkRule(`post ${p.id}`, p.unlock);
  }
  for (const l of story.stream.chat)
    if (l.clue) need(clueIds.has(l.clue), `stream line ${l.t}: unknown clue "${l.clue}"`);
  for (const d of story.dms) {
    if (d.clue) need(clueIds.has(d.clue), `dm ${d.id}: unknown clue "${d.clue}"`);
    checkRule(`dm ${d.id}`, d.unlock);
  }
  for (const m of story.missions)
    need(charIds.has(m.character), `mission ${m.id}: unknown character "${m.character}"`);

  for (const c of story.solution.culprits) {
    need(charIds.has(c), `solution: unknown culprit "${c}"`);
    need(
      story.clues.some((k) => k.pointsTo.includes(c)),
      `solution: no clue points to culprit "${c}"`,
    );
  }
  const core = story.characters.filter((c) => c.core).length;
  need(core <= story.minPlayers, `story needs ${core} core characters but minPlayers is ${story.minPlayers}`);
  need(
    story.characters.length >= story.maxPlayers,
    `only ${story.characters.length} characters for ${story.maxPlayers} players`,
  );

  // Skins: every skin defines the same keys, and every {placeholder} in the story exists.
  const skins = Object.values(story.skins);
  const keys = new Set(skins.flatMap((s) => Object.keys(s)));
  need(!!story.skins[story.defaultSkin], `defaultSkin "${story.defaultSkin}" is not defined`);
  for (const [name, s] of Object.entries(story.skins))
    for (const k of keys) need(k in s, `skin ${name}: missing "${k}"`);
  const used = new Set([...JSON.stringify(story).matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1]!));
  for (const u of used) need(keys.has(u) || u === 'hidingPlace', `unknown placeholder {${u}}`);

  return problems;
}

/** Replace {placeholders} from the skin in every string of a value (deep). */
export function applySkin<T>(value: T, skin: Record<string, string>, extra: Record<string, string> = {}): T {
  const vars = { ...skin, ...extra };
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return v.replace(/\{([a-zA-Z]+)\}/g, (m, k: string) => vars[k] ?? m);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object')
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as T;
}

function load(raw: unknown): Story {
  const story = Story.parse(raw);
  const problems = lintStory(story);
  if (problems.length) throw new Error(`Story "${story.id}" is invalid:\n  ${problems.join('\n  ')}`);
  return story;
}

export const STORIES: Record<string, Story> = Object.fromEntries(
  [illustratorHeist].map((raw) => {
    const s = load(raw);
    return [s.id, s];
  }),
);

export function getStory(id: string): Story | undefined {
  return Object.hasOwn(STORIES, id) ? STORIES[id] : undefined;
}
