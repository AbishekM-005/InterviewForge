import mongoose from "mongoose";

const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const normalizeDifficulty = (difficulty) => {
  const normalized =
    typeof difficulty === "string" ? difficulty.trim().toLowerCase() : "";

  return VALID_DIFFICULTIES.has(normalized) ? normalized : null;
};

export const sanitizeProblemTitle = (problem) => {
  if (typeof problem !== "string") return "";

  return problem
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
};
