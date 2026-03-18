import type { GameType, IGameEngine } from "@/types";
import { ClassicEngine } from "./classic";
import { FiveReelEngine } from "./five-reel";
import { CascadeEngine } from "./cascade";
import { MegawaysEngine } from "./megaways";

const engines: Record<GameType, IGameEngine> = {
  classic: new ClassicEngine(),
  "five-reel": new FiveReelEngine(),
  cascade: new CascadeEngine(),
  megaways: new MegawaysEngine(),
};

export function getEngine(gameType: GameType): IGameEngine {
  return engines[gameType];
}

export function getAllEngines(): IGameEngine[] {
  return Object.values(engines);
}

export { ClassicEngine } from "./classic";
export { FiveReelEngine } from "./five-reel";
export { CascadeEngine } from "./cascade";
export { MegawaysEngine } from "./megaways";
