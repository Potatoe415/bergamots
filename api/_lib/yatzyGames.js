import { randomBytes } from "node:crypto";

export const CODE_LENGTH = 3;
export const GAME_TTL_MS = 10800000; // 3h, matches the pre-migration Firebase logic.
export const MAX_CODE_ATTEMPTS = 250;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, CODE_LENGTH);
}

export function randomCode() {
  let code = "";

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }

  return code;
}

export function randomSeatToken() {
  return randomBytes(16).toString("hex");
}

export function isExpired(createdAt) {
  if (!createdAt) {
    return true;
  }

  return Date.now() - new Date(createdAt).getTime() > GAME_TTL_MS;
}

export function seatTokenColumn(role) {
  if (role === "creator") {
    return "creator_token";
  }

  if (role === "joiner") {
    return "joiner_token";
  }

  return null;
}

export async function insertTick(supabase, code, version) {
  await supabase.from("yatzy_game_events").insert({ game_code: code, version });
}
