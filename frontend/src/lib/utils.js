export const getDifficultyBadgeClass = (difficulty) => {
  const normalized =
    typeof difficulty === "string" ? difficulty.toLowerCase() : "";

  switch (normalized) {
    case "easy":
      return "badge-success";
    case "medium":
      return "badge-warning";
    case "hard":
      return "badge-error";
    default:
      return "badge-ghost";
  }
};

export const normalizeCategoryText = (value) => {
  if (typeof value !== "string") return "";

  return value.replace(/•/g, "|").replace(/\s+/g, " ").trim();
};

export const normalizeConstraintText = (value) => {
  if (typeof value !== "string") return "";

  return value
    .replace(/10\?/g, "10^9")
    .replace(/\b105\b/g, "10^5")
    .replace(/\b104\b/g, "10^4")
    .replace(/(\S)\s=\s(.+?)\s=\s(\S+)/g, "$1 <= $2 <= $3")
    .replace(/\s+/g, " ")
    .trim();
};
