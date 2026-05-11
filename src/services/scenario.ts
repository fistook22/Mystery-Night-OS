import fs from "fs";
import path from "path";
import type { Scenario } from "../types";

const scenariosDir = path.join(process.cwd(), "scenarios");

export function loadScenario(id: string): Scenario {
  const filePath = path.join(scenariosDir, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Scenario not found: ${id}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Scenario;
}

export function listScenarios(): Array<{ id: string; title: string; genre: string; minPlayers: number; maxPlayers: number }> {
  if (!fs.existsSync(scenariosDir)) return [];
  return fs
    .readdirSync(scenariosDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const s = JSON.parse(fs.readFileSync(path.join(scenariosDir, f), "utf-8")) as Scenario;
      return { id: s.id, title: s.title, genre: s.genre, minPlayers: s.minPlayers, maxPlayers: s.maxPlayers };
    });
}
