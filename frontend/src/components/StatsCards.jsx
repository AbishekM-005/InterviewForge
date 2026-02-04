import React from "react";
import { TrophyIcon, UsersIcon } from "lucide-react";

const StatsCards = ({ activeSessionsCount, recentSessionsCount }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* ACTIVE COUNT */}
      <div className="card bg-base-100 border-2 border-primary/20 hover:border-primary/40">
        <div className="card-body p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <UsersIcon className="w-7 h-7 text-primary" />
            </div>
            <div className="relative badge badge-primary">
              <div className="absolute left-1 size-2 bg-error rounded-xl border border-base-100 ml-1 animate-blink" />
              <span className="ml-3">Live</span>
            </div>
          </div>

          <div className="text-3xl sm:text-4xl font-black mb-1">
            {activeSessionsCount}
          </div>
          <div className="text-sm opacity-60">Active Session</div>
        </div>
      </div>

      {/* RECENT COUNT */}
      <div className="card bg-base-100 border-2 border-secondary/20 hover:border-secondary/40">
        <div className="card-body p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-secondary/10 rounded-2xl">
              <TrophyIcon className="w-7 h-7  text-secondary" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black mb-1">
            {recentSessionsCount}
          </div>
          <div className="text-sm opacity-60">Total Sessions</div>
        </div>
      </div>
    </div>
  );
};
export default StatsCards;
