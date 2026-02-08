import { BookOpenIcon, LayoutDashboardIcon, SparklesIcon } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router";
import { UserButton } from "@clerk/clerk-react";
const NavBar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  return (
    <nav className="bg-base-100/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        {/* LOGO */}
        <Link
          to="/"
          className="group flex items-center gap-3 hover:scale-105 transition-transform duration-200 "
        >
          <div className="size-10 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
            <SparklesIcon className="size-6 text-white" />
          </div>

          <div className="flex flex-col">
            <span className="font-black text-lg sm:text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono">
              InterviewForge
            </span>
            <span className="text-xs text-base-content/60 font-medium -mt-1">
              Code Together
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 flex-nowrap justify-end overflow-x-auto">
          {/* PROBLEMS PAGE LINK */}
          <Link
            to={"/problems"}
            aria-label="Problems"
            className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${
              isActive("/problems")
                ? "bg-primary text-primary-content "
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
            }`}
          >
            <div className="flex items-center gap-x-2.5">
              <BookOpenIcon className="size-4" />
              <span className="font-medium hidden sm:inline">Problems</span>
            </div>
          </Link>

          <Link
            to={"/dashboard"}
            aria-label="Dashboard"
            className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${
              isActive("/dashboard")
                ? "bg-primary text-primary-content "
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
            }`}
          >
            <div className="flex items-center gap-x-2.5">
              <LayoutDashboardIcon className="size-4" />
              <span className="font-medium hidden sm:inline">Dashboard</span>
            </div>
          </Link>
          <div className="ml-2 sm:ml-4 mt-1 sm:mt-0">
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
