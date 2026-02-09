import React, { useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar.jsx";
import { Link } from "react-router";
import { PROBLEMS } from "../data/problems.js";
import { ChevronRightIcon, Code2Icon, SearchIcon } from "lucide-react";
import { getDifficultyBadgeClass } from "../lib/utils.js";
import { useActiveSessions } from "../hooks/useSessions.js";
import { getSolvedProblemIds } from "../lib/solvedProblems.js";

const difficultyOptions = ["All", "Easy", "Medium", "Hard"];

const ProblemsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  const allProblems = useMemo(() => Object.values(PROBLEMS), []);
  const { data: activeSessionsData } = useActiveSessions();
  const activeSessions = activeSessionsData?.sessions || [];
  const [solvedProblemIds, setSolvedProblemIds] = useState([]);

  const activeSessionCountByTitle = useMemo(() => {
    return activeSessions.reduce((accumulator, session) => {
      const title = session?.problem;
      if (!title) return accumulator;

      accumulator[title] = (accumulator[title] || 0) + 1;
      return accumulator;
    }, {});
  }, [activeSessions]);

  const filteredProblems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allProblems.filter((problem) => {
      const matchesQuery =
        query.length === 0 ||
        problem.title.toLowerCase().includes(query) ||
        problem.category.toLowerCase().includes(query) ||
        problem.description.text.toLowerCase().includes(query);

      const matchesDifficulty =
        difficultyFilter === "All" || problem.difficulty === difficultyFilter;

      return matchesQuery && matchesDifficulty;
    });
  }, [allProblems, searchQuery, difficultyFilter]);

  useEffect(() => {
    const syncSolved = () => setSolvedProblemIds(getSolvedProblemIds());
    syncSolved();
    window.addEventListener("storage", syncSolved);
    return () => window.removeEventListener("storage", syncSolved);
  }, []);

  const solvedProblemIdSet = useMemo(() => new Set(solvedProblemIds), [solvedProblemIds]);
  const solvedCount = solvedProblemIdSet.size;
  const easyProblemsCount = allProblems.filter(
    (problem) => problem.difficulty === "Easy"
  ).length;
  const mediumProblemsCount = allProblems.filter(
    (problem) => problem.difficulty === "Medium"
  ).length;
  const hardProblemsCount = allProblems.filter(
    (problem) => problem.difficulty === "Hard"
  ).length;

  return (
    <div className="problems-page bg-base-200">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">Practice Problems</h1>
          <p className="text-sm sm:text-base text-base-content/70">
            Sharpen your coding skills with curated problems and live sessions.
          </p>
        </div>

        <div className="card bg-base-100 shadow mb-8">
          <div className="card-body p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <label className="input input-bordered flex items-center gap-2 w-full">
              <SearchIcon className="size-4 text-base-content/50" />
              <input
                type="text"
                className="grow"
                placeholder="Search by title, topic, or keyword..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <select
              className="select select-bordered w-full md:w-44"
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
            >
              {difficultyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredProblems.length > 0 ? (
            filteredProblems.map((problem) => {
              const activeCount = activeSessionCountByTitle[problem.title] || 0;
              const isSolved = solvedProblemIdSet.has(problem.id);

              return (
                <Link
                  key={problem.id}
                  to={`/problem/${problem.id}`}
                  className="card bg-base-100 md:hover:scale-[1.01] transition-transform border border-base-300 md:hover:border-primary/40"
                >
                  <div className="card-body">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="size-10 sm:size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Code2Icon className="size-5 sm:size-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h2 className="text-lg sm:text-xl font-bold">{problem.title}</h2>
                              <span
                                className={`badge ${getDifficultyBadgeClass(problem.difficulty)}`}
                              >
                                {problem.difficulty}
                              </span>
                              {isSolved && (
                                <span className="badge badge-info badge-outline">
                                  Solved
                                </span>
                              )}
                              {activeCount > 0 && (
                                <span className="badge badge-primary badge-outline">
                                  {activeCount} live
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-base-content/60">
                              {problem.category}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm sm:text-base text-base-content/80 mb-2">
                          {problem.description.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-primary">
                        <span className="font-medium">Solve</span>
                        <ChevronRightIcon className="size-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body text-center py-12">
                <p className="text-lg font-semibold">No matching problems found.</p>
                <p className="text-base-content/60">Try adjusting search text or difficulty.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="stats stats-vertical lg:stats-horizontal">
              <div className="stat flex flex-col items-center">
                <div className="stat-title">Solved</div>
                <div className="stat-value text-secondary">
                  {solvedCount}/{allProblems.length}
                </div>
              </div>
              <div className="stat flex flex-col items-center">
                <div className="stat-title">Total Problems</div>
                <div className="stat-value text-primary">{allProblems.length}</div>
              </div>
              <div className="stat flex flex-col items-center">
                <div className="stat-title">Easy</div>
                <div className="stat-value text-success">{easyProblemsCount}</div>
              </div>
              <div className="stat flex flex-col items-center">
                <div className="stat-title">Medium</div>
                <div className="stat-value text-warning">{mediumProblemsCount}</div>
              </div>
              <div className="stat flex flex-col items-center">
                <div className="stat-title">Hard</div>
                <div className="stat-value text-error">{hardProblemsCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemsPage;
