const STORAGE_KEY = "interviewforge.solvedProblems";

export const getSolvedProblemIds = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const markProblemSolved = (problemId) => {
  if (typeof window === "undefined" || !problemId) return;
  try {
    const current = new Set(getSolvedProblemIds());
    current.add(problemId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]));
  } catch {
    // ignore storage failures
  }
};
